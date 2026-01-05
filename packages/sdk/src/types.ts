// Type definitions for Guidle SDK

export interface GuidleConfig {
  serverUrl: string;
  appId?: string;
  theme?: GuidleTheme;
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  hotkey?: string;
  voiceEnabled?: boolean;
  onReady?: () => void;
  onError?: (error: Error) => void;
}

export interface GuidleTheme {
  primaryColor?: string;
  backgroundColor?: string;
  textColor?: string;
  overlayColor?: string;
  highlightColor?: string;
  borderRadius?: string;
  fontFamily?: string;
}

export interface ElementMapping {
  patterns: string[];
  selectors: string[];
  description: string;
  category: string;
}

export interface AppSchema {
  appId: string;
  elements: ElementMapping[];
}

// Message types from server
export interface HighlightStep {
  type: "HIGHLIGHT";
  selectors: string[];
  description: string;
  intent: string;
  confidence: number;
}

export interface PromptStep {
  type: "PROMPT";
  message: string;
  action: "click" | "type" | "scroll";
}

export interface TooltipStep {
  type: "TOOLTIP";
  message: string;
  position: "top" | "bottom" | "left" | "right" | "auto";
}

export interface WaitStep {
  type: "WAIT";
  duration?: number;
  forSelector?: string;
}

export interface DoneStep {
  type: "DONE";
  success: boolean;
  message?: string;
}

export type GuidleStep = HighlightStep | PromptStep | TooltipStep | WaitStep | DoneStep;

export interface WSStepMessage {
  type: "STEP";
  step: GuidleStep;
  stepIndex: number;
  totalSteps: number;
}

export interface WSErrorMessage {
  type: "ERROR";
  message: string;
  code: string;
}

export interface WSDoneMessage {
  type: "DONE";
  success: boolean;
  message?: string;
}

export type WSServerMessage = WSStepMessage | WSErrorMessage | WSDoneMessage;
