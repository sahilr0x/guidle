import { IntentType } from "../intents/types";

// Steps that the SDK will execute
export type GuidleStep = 
  | HighlightStep
  | PromptStep
  | TooltipStep
  | WaitStep
  | DoneStep;

export interface HighlightStep {
  type: "HIGHLIGHT";
  selectors: string[];      // CSS selectors to try (in order of priority)
  description: string;      // What this element is
  intent: IntentType;       // The detected intent
  confidence: number;       // How confident we are
}

export interface PromptStep {
  type: "PROMPT";
  message: string;          // Message to show user
  action: "click" | "type" | "scroll";
}

export interface TooltipStep {
  type: "TOOLTIP";
  message: string;
  position: "top" | "bottom" | "left" | "right" | "auto";
}

export interface WaitStep {
  type: "WAIT";
  duration?: number;        // ms to wait
  forSelector?: string;     // Wait for element to appear
}

export interface DoneStep {
  type: "DONE";
  success: boolean;
  message?: string;
}

// WebSocket message types
export type WSClientMessage = 
  | { type: "QUERY"; text: string; appId?: string }
  | { type: "REGISTER_SCHEMA"; schema: any }
  | { type: "FEEDBACK"; stepId: string; success: boolean };

export type WSServerMessage = 
  | { type: "STEP"; step: GuidleStep; stepIndex: number; totalSteps: number }
  | { type: "ERROR"; message: string; code: string }
  | { type: "DONE"; success: boolean; message?: string };