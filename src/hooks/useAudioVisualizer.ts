import { useCallback, useRef, useState } from "react";

import type { AudioVisualizerHook } from "../types";

const isMobile =
  typeof navigator !== "undefined" &&
  /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

/** How often to push volume into React state (speaking detection only) */
const VOLUME_STATE_INTERVAL_MS = isMobile ? 120 : 80;

const useAudioVisualizer = (): AudioVisualizerHook => {
  const animationRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const volumeRef = useRef(0);
  const lastStatePushRef = useRef(0);

  const [volume, setVolume] = useState(0);

  const stopVisualizer = useCallback(() => {
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    sourceRef.current?.disconnect();
    sourceRef.current = null;
    analyserRef.current = null;

    if (
      audioContextRef.current &&
      audioContextRef.current.state !== "closed"
    ) {
      void audioContextRef.current.close();
    }

    audioContextRef.current = null;

    streamRef.current?.getTracks().forEach((track) => {
      track.stop();
    });

    streamRef.current = null;
    volumeRef.current = 0;
    setVolume(0);
  }, []);

  const startVisualizer = useCallback(async () => {
    stopVisualizer();

    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error(
        "Microphone access requires HTTPS and a supported mobile browser.",
      );
    }

    let stream: MediaStream;

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          channelCount: 1,
        },
      });
    } catch (first) {
      const firstName =
        first instanceof DOMException ? first.name : "";

      if (
        firstName === "OverconstrainedError" ||
        firstName === "ConstraintNotSatisfiedError"
      ) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
          });
        } catch (error) {
          const name =
            error instanceof DOMException ? error.name : "";

          if (name === "NotAllowedError") {
            throw new Error(
              "Microphone permission was blocked. Allow microphone access and try again.",
            );
          }

          if (name === "NotFoundError") {
            throw new Error(
              "No microphone was found on this device.",
            );
          }

          throw new Error(
            "The microphone could not be started on this device.",
          );
        }
      } else {
        const name = firstName;

        if (name === "NotAllowedError") {
          throw new Error(
            "Microphone permission was blocked. Allow microphone access and try again.",
          );
        }

        if (name === "NotFoundError") {
          throw new Error(
            "No microphone was found on this device.",
          );
        }

        throw new Error(
          "The microphone could not be started on this device.",
        );
      }
    }

    streamRef.current = stream;

    const audioContext = new AudioContext({
      latencyHint: isMobile ? "balanced" : "interactive",
    });

    audioContextRef.current = audioContext;

    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }

    const analyser = audioContext.createAnalyser();
    analyser.fftSize = isMobile ? 128 : 256;
    analyser.smoothingTimeConstant = isMobile ? 0.75 : 0.65;

    analyserRef.current = analyser;

    const source = audioContext.createMediaStreamSource(stream);
    sourceRef.current = source;
    source.connect(analyser);

    const bufferLength = analyser.fftSize;
    const dataArray = new Uint8Array(bufferLength);

    const tick = () => {
      animationRef.current = requestAnimationFrame(tick);

      analyser.getByteTimeDomainData(dataArray);

      let sumSquares = 0;

      for (const sample of dataArray) {
        const centered = sample - 128;
        sumSquares += centered * centered;
      }

      const rms = Math.sqrt(sumSquares / bufferLength);
      const scaled = Math.min(255, Math.floor(rms * 5.5 * 255));

      volumeRef.current = scaled;

      const now = performance.now();
      if (now - lastStatePushRef.current >= VOLUME_STATE_INTERVAL_MS) {
        lastStatePushRef.current = now;
        setVolume(scaled);
      }
    };

    tick();
  }, [stopVisualizer]);

  const resumeAudioContext = useCallback(async () => {
    const ctx = audioContextRef.current;

    if (ctx && ctx.state === "suspended") {
      await ctx.resume();
    }
  }, []);

  const suspendVisualizer = useCallback(async () => {
    streamRef.current?.getTracks().forEach((track) => {
      track.enabled = false;
    });

    const ctx = audioContextRef.current;
    if (ctx?.state === "running") await ctx.suspend();
  }, []);

  const resumeVisualizer = useCallback(async () => {
    streamRef.current?.getTracks().forEach((track) => {
      track.enabled = true;
    });

    const ctx = audioContextRef.current;
    if (ctx?.state === "suspended") await ctx.resume();
  }, []);

  return {
    volume,
    volumeRef,
    startVisualizer,
    stopVisualizer,
    resumeAudioContext,
    suspendVisualizer,
    resumeVisualizer,
  };
};

export default useAudioVisualizer;
