// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import useSpeechRecognition from "./useSpeechRecognition";

// ─── Minimal SpeechRecognition mock ───────────────────────────────────────────

class MockRecognition {
  lang = "";
  interimResults = false;
  continuous = false;
  maxAlternatives = 1;

  onresult: ((e: SpeechRecognitionEvent) => void) | null = null;
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null = null;
  onend: (() => void) | null = null;

  start = vi.fn();
  stop = vi.fn();
  abort = vi.fn();
}

let mockInstance: MockRecognition;

beforeEach(() => {
  mockInstance = new MockRecognition();

  const Ctor = vi.fn(() => mockInstance);

  Object.defineProperty(window, "SpeechRecognition", {
    writable: true,
    configurable: true,
    value: Ctor,
  });

  // Clear webkitSpeechRecognition so ctorRef always picks SpeechRecognition
  Object.defineProperty(window, "webkitSpeechRecognition", {
    writable: true,
    configurable: true,
    value: undefined,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});


describe("useSpeechRecognition", () => {
  it("reports hasSupport = true when SpeechRecognition is available", () => {
    const { result } = renderHook(() => useSpeechRecognition());
    expect(result.current.hasSupport).toBe(true);
  });

  it("reports hasSupport = false when SpeechRecognition is unavailable", () => {
    Object.defineProperty(window, "SpeechRecognition", {
      writable: true,
      configurable: true,
      value: undefined,
    });

    const { result } = renderHook(() => useSpeechRecognition());
    expect(result.current.hasSupport).toBe(false);
  });

  it("starts listening and sets isListening = true", async () => {
    vi.useFakeTimers();

    const { result } = renderHook(() => useSpeechRecognition());

    act(() => {
      result.current.startListening();
    });

    await act(async () => {
      vi.runAllTimers();
    });

    expect(mockInstance.start).toHaveBeenCalledOnce();
    expect(result.current.isListening).toBe(true);

    vi.useRealTimers();
  });

  it("stops listening and sets isListening = false", async () => {
    vi.useFakeTimers();

    const { result } = renderHook(() => useSpeechRecognition());

    act(() => result.current.startListening());
    await act(async () => { vi.runAllTimers(); });

    act(() => result.current.stopListening());

    expect(mockInstance.abort).toHaveBeenCalled();
    expect(result.current.isListening).toBe(false);

    vi.useRealTimers();
  });

  it("accumulates final transcript results", async () => {
    vi.useFakeTimers();

    const { result } = renderHook(() => useSpeechRecognition());

    act(() => result.current.startListening());
    await act(async () => { vi.runAllTimers(); });

    // Simulate a final speech result
    act(() => {
      const fakeEvent = {
        resultIndex: 0,
        results: {
          length: 1,
          item: () => ({
            isFinal: true,
            item: () => ({ transcript: "أشهد أن لا إله" }),
          }),
        },
      } as unknown as SpeechRecognitionEvent;

      mockInstance.onresult?.(fakeEvent);
    });

    expect(result.current.transcript).toBe("أشهد أن لا إله");

    vi.useRealTimers();
  });

  it("resets transcript and clears accumulated text", async () => {
    vi.useFakeTimers();

    const { result } = renderHook(() => useSpeechRecognition());

    act(() => result.current.startListening());
    await act(async () => { vi.runAllTimers(); });

    act(() => {
      const fakeEvent = {
        resultIndex: 0,
        results: {
          length: 1,
          item: () => ({
            isFinal: true,
            item: () => ({ transcript: "أشهد" }),
          }),
        },
      } as unknown as SpeechRecognitionEvent;

      mockInstance.onresult?.(fakeEvent);
    });

    expect(result.current.transcript).toBe("أشهد");

    act(() => result.current.resetTranscript());

    expect(result.current.transcript).toBe("");
  });

  it("sets error message on not-allowed mic error", async () => {
    vi.useFakeTimers();

    const { result } = renderHook(() => useSpeechRecognition());

    act(() => result.current.startListening());
    await act(async () => { vi.runAllTimers(); });

    act(() => {
      mockInstance.onerror?.({
        error: "not-allowed",
      } as SpeechRecognitionErrorEvent);
    });

    expect(result.current.error).toBe("Mic permission denied");
    expect(result.current.isListening).toBe(false);

    vi.useRealTimers();
  });

  it("sets error message on network error", async () => {
    vi.useFakeTimers();

    const { result } = renderHook(() => useSpeechRecognition());

    act(() => result.current.startListening());
    await act(async () => { vi.runAllTimers(); });

    act(() => {
      mockInstance.onerror?.({
        error: "network",
      } as SpeechRecognitionErrorEvent);
    });

    expect(result.current.error).toBe("Internet connection lost");

    vi.useRealTimers();
  });

  it("ignores aborted and no-speech errors silently", async () => {
    vi.useFakeTimers();

    const { result } = renderHook(() => useSpeechRecognition());

    act(() => result.current.startListening());
    await act(async () => { vi.runAllTimers(); });

    act(() => {
      mockInstance.onerror?.({ error: "aborted" } as SpeechRecognitionErrorEvent);
      mockInstance.onerror?.({ error: "no-speech" } as SpeechRecognitionErrorEvent);
    });

    expect(result.current.error).toBeNull();

    vi.useRealTimers();
  });

  it("sets isListening = false when recognition ends", async () => {
    vi.useFakeTimers();

    const { result } = renderHook(() => useSpeechRecognition());

    act(() => result.current.startListening());
    await act(async () => { vi.runAllTimers(); });

    expect(result.current.isListening).toBe(true);

    act(() => mockInstance.onend?.());

    expect(result.current.isListening).toBe(false);

    vi.useRealTimers();
  });
});