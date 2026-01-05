import { ParsedIntent } from "../intents/types";
import { findMatchingElements } from "../intents/elementMatcher";
import { GuidleStep } from "../protocol/messages";

export interface PlanResult {
  steps: GuidleStep[];
  intent: ParsedIntent;
  matchedSelectors: string[];
  description: string;
}

export function planSteps(intent: ParsedIntent, appId?: string): PlanResult {
  const { selectors, description, confidence } = findMatchingElements(intent.target, appId);
  
  const steps: GuidleStep[] = [];
  
  // Add highlight steps for each selector (SDK will try them in order)
  steps.push({
    type: "HIGHLIGHT",
    selectors,
    description,
    intent: intent.type,
    confidence
  });
  
  // For navigation intents, add a prompt to click
  if (intent.type === "NAVIGATE" || intent.type === "INTERACT") {
    steps.push({
      type: "PROMPT",
      message: `Click to ${intent.type === "NAVIGATE" ? "go to" : ""} ${description.toLowerCase()}`,
      action: "click"
    });
  }
  
  // For explain intents, add tooltip
  if (intent.type === "EXPLAIN") {
    steps.push({
      type: "TOOLTIP",
      message: `This is the ${description.toLowerCase()}`,
      position: "auto"
    });
  }
  
  return {
    steps,
    intent,
    matchedSelectors: selectors,
    description
  };
}
