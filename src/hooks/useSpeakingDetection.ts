import { useEffect, useRef, useState } from "react";

const SPEAKING_ON = 40;
const SPEAKING_OFF = 30;

/**
 * Hysteresis-based speaking detection from mic volume.
 */
export const useSpeakingDetection = (
  volume: number,
  isRecording: boolean,
): boolean => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const smoothRef = useRef(0);
  const speakingRef = useRef(false);

  useEffect(() => {
    smoothRef.current = smoothRef.current * 0.8 + volume * 0.2;
  }, [volume]);

  useEffect(() => {
    if (!isRecording) {
      speakingRef.current = false;
      setIsSpeaking(false);
      return;
    }

    const currentVolume = smoothRef.current;

    if (!speakingRef.current && currentVolume >= SPEAKING_ON) {
      speakingRef.current = true;
      setIsSpeaking(true);
      return;
    }

    if (speakingRef.current && currentVolume <= SPEAKING_OFF) {
      speakingRef.current = false;
      setIsSpeaking(false);
    }
  }, [volume, isRecording]);

  return isSpeaking;
};
