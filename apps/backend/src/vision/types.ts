// Vision-based element detection types

export interface BoundingBox {
  x: number;      // X position (percentage 0-100)
  y: number;      // Y position (percentage 0-100)
  width: number;  // Width (percentage 0-100)
  height: number; // Height (percentage 0-100)
}

export interface DetectedElement extends BoundingBox {
  label: string;
  confidence: number;
  action?: "click" | "type" | "scroll" | "hover";
  elementType?: "button" | "link" | "input" | "icon" | "menu" | "tab" | "other";
}

export interface ScreenshotRequest {
  screenshot: string;  // Base64 encoded PNG
  query: string;       // User's natural language query
  viewport: {
    width: number;
    height: number;
  };
}

export interface VisionResponse {
  elements: DetectedElement[];
  explanation: string;
  success: boolean;
  processingTime?: number;
}
