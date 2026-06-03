import type {
  ButtonHTMLAttributes,
  MutableRefObject,
  ReactNode,
} from "react";

export type Theme = "light" | "dark";

export interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  isDark: boolean;
}

export interface ShahadaStep {
  id: number;
  arabic: string;
  phonetic: string;
  promptLine: string;
  keywords: string[];
  /** Extra phrases after stripForCompare; helps when STT mis-hears (e.g. الله الله vs إلا الله) */
  compactHints?: string[];
}

export interface SpeechRecognitionHook {
  transcript: string;
  isListening: boolean;
  hasSupport: boolean;
  error: string | null;

  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
}

export type AudioVisualizerHook = {
  volume: number;
  volumeRef: MutableRefObject<number>;
  startVisualizer: () => Promise<void>;
  stopVisualizer: () => void;
  resumeAudioContext: () => Promise<void>;
  suspendVisualizer: () => Promise<void>;
  resumeVisualizer: () => Promise<void>;
};

export type OrbVisualMode =
  | "idle"
  | "listening"
  | "speaking"
  | "engaged"
  | "error";

export interface VisualizerOrbProps {
  mode: OrbVisualMode;
  volumeRef?: MutableRefObject<number>;
}

export type ButtonVariant =
  | "start"
  | "stop"
  | "certificate"
  | "learnMore";

export interface ButtonProps
  extends Pick<
    ButtonHTMLAttributes<HTMLButtonElement>,
    "disabled" | "type"
  > {
  variant: ButtonVariant;
  onClick?: () => void; 
  children: ReactNode;
}

export interface HeaderProps {
  className?: string;
}