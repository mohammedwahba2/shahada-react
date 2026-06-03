// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import useAudioVisualizer from "./useAudioVisualizer";

// ─── Browser API mocks ────────────────────────────────────────────────────────

const mockTrack = {
  stop: vi.fn(),
  enabled: true,
};

const mockStream = {
  getTracks: vi.fn(() => [mockTrack]),
};

const mockAnalyser = {
  fftSize: 256,
  smoothingTimeConstant: 0,
  getByteTimeDomainData: vi.fn((arr: Uint8Array) => arr.fill(128)), // silence
  connect: vi.fn(),
};

const mockSource = {
  connect: vi.fn(),
  disconnect: vi.fn(),
};

const mockAudioContext = {
  state: "running" as AudioContextState,
  createAnalyser: vi.fn(() => mockAnalyser),
  createMediaStreamSource: vi.fn(() => mockSource),
  resume: vi.fn().mockResolvedValue(undefined),
  suspend: vi.fn().mockResolvedValue(undefined),
  close: vi.fn().mockResolvedValue(undefined),
};

beforeEach(() => {
  vi.stubGlobal("requestAnimationFrame", vi.fn(() => 0));
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
  vi.stubGlobal("performance", { now: vi.fn(() => 0) });

  Object.defineProperty(navigator, "mediaDevices", {
    writable: true,
    configurable: true,
    value: {
      getUserMedia: vi.fn().mockResolvedValue(mockStream),
    },
  });

  vi.stubGlobal("AudioContext", vi.fn(() => mockAudioContext));
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("useAudioVisualizer", () => {
  it("returns volume = 0 before starting", () => {
    const { result } = renderHook(() => useAudioVisualizer());
    expect(result.current.volume).toBe(0);
  });

  it("requests microphone and sets up AudioContext on startVisualizer", async () => {
    const { result } = renderHook(() => useAudioVisualizer());

    await act(async () => {
      await result.current.startVisualizer();
    });

    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledOnce();
    expect(mockAudioContext.createAnalyser).toHaveBeenCalledOnce();
    expect(mockAudioContext.createMediaStreamSource).toHaveBeenCalledWith(mockStream);
    expect(mockSource.connect).toHaveBeenCalledWith(mockAnalyser);
  });

  it("stops tracks and closes AudioContext on stopVisualizer", async () => {
    const { result } = renderHook(() => useAudioVisualizer());

    await act(async () => {
      await result.current.startVisualizer();
    });

    act(() => result.current.stopVisualizer());

    expect(mockTrack.stop).toHaveBeenCalled();
    expect(mockAudioContext.close).toHaveBeenCalled();
    expect(result.current.volume).toBe(0);
  });

  it("suspends AudioContext and disables tracks on suspendVisualizer", async () => {
    const { result } = renderHook(() => useAudioVisualizer());

    await act(async () => {
      await result.current.startVisualizer();
    });

    await act(async () => {
      await result.current.suspendVisualizer();
    });

    expect(mockTrack.enabled).toBe(false);
    expect(mockAudioContext.suspend).toHaveBeenCalled();
  });

  it("resumes AudioContext and re-enables tracks on resumeVisualizer", async () => {
    const { result } = renderHook(() => useAudioVisualizer());

    await act(async () => {
      await result.current.startVisualizer();
    });

    // suspend first
    await act(async () => {
      await result.current.suspendVisualizer();
    });

    // mark context as suspended
    mockAudioContext.state = "suspended";

    await act(async () => {
      await result.current.resumeVisualizer();
    });

    expect(mockTrack.enabled).toBe(true);
    expect(mockAudioContext.resume).toHaveBeenCalled();
  });

  it("throws a friendly error when getUserMedia is not available", async () => {
    Object.defineProperty(navigator, "mediaDevices", {
      writable: true,
      configurable: true,
      value: {},
    });

    const { result } = renderHook(() => useAudioVisualizer());

    await expect(
      act(async () => {
        await result.current.startVisualizer();
      }),
    ).rejects.toThrow("Microphone access requires HTTPS");
  });

  it("throws a friendly error when mic permission is denied", async () => {
    const notAllowed = new DOMException("Permission denied", "NotAllowedError");

    Object.defineProperty(navigator, "mediaDevices", {
      writable: true,
      configurable: true,
      value: {
        getUserMedia: vi.fn().mockRejectedValue(notAllowed),
      },
    });

    const { result } = renderHook(() => useAudioVisualizer());

    await expect(
      act(async () => {
        await result.current.startVisualizer();
      }),
    ).rejects.toThrow("Microphone permission was blocked");
  });

  it("exposes volumeRef that reflects current volume without re-render", async () => {
    const { result } = renderHook(() => useAudioVisualizer());

    await act(async () => {
      await result.current.startVisualizer();
    });

    // volumeRef is a ref — should be a number
    expect(typeof result.current.volumeRef.current).toBe("number");
  });
});