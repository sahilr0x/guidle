// Intent types for Guidle guidance system

export type IntentType = 
  | "NAVIGATE"      // Navigate to a page/section
  | "LOCATE"        // Find and highlight element(s)
  | "INTERACT"      // Click, type, etc.
  | "EXPLAIN"       // Show tooltip/explanation
  | "UNKNOWN";

export interface ParsedIntent {
  type: IntentType;
  target: string;           // What the user wants to find/do
  action?: string;          // Specific action (click, type, etc.)
  confidence: number;       // 0-1 confidence score
  rawQuery: string;         // Original user query
}

// Element mapping - maps semantic names to CSS selectors
export interface ElementMapping {
  patterns: string[];       // Keywords/phrases that match this element
  selectors: string[];      // CSS selectors to highlight
  description: string;      // Human-readable description
  category: string;         // Category (settings, profile, navigation, etc.)
}

// Application schema - describes the UI structure
export interface AppSchema {
  appId: string;
  elements: ElementMapping[];
}