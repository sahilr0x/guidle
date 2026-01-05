import { ParsedIntent, IntentType } from "./types";

// Keywords that indicate navigation intent
const NAVIGATE_KEYWORDS = [
  "go to", "navigate to", "open", "take me to", "show me", "find", 
  "where is", "how do i get to", "i want to go to"
];

// Keywords that indicate interaction intent
const INTERACT_KEYWORDS = [
  "click", "press", "tap", "select", "choose", "toggle", "enable", "disable"
];

// Keywords that indicate explanation intent
const EXPLAIN_KEYWORDS = [
  "what is", "explain", "help me understand", "what does", "how does"
];

function detectIntentType(text: string): IntentType {
  const lower = text.toLowerCase();
  
  for (const keyword of NAVIGATE_KEYWORDS) {
    if (lower.includes(keyword)) return "NAVIGATE";
  }
  
  for (const keyword of INTERACT_KEYWORDS) {
    if (lower.includes(keyword)) return "INTERACT";
  }
  
  for (const keyword of EXPLAIN_KEYWORDS) {
    if (lower.includes(keyword)) return "EXPLAIN";
  }
  
  // Default to LOCATE for simple queries like "settings", "profile"
  return "LOCATE";
}

function extractTarget(text: string, intentType: IntentType): string {
  const lower = text.toLowerCase();
  
  // Remove intent keywords to get the target
  let target = lower;
  
  const allKeywords = [...NAVIGATE_KEYWORDS, ...INTERACT_KEYWORDS, ...EXPLAIN_KEYWORDS];
  for (const keyword of allKeywords) {
    target = target.replace(keyword, "").trim();
  }
  
  // Remove common filler words
  target = target
    .replace(/^the\s+/i, "")
    .replace(/\s+button$/i, "")
    .replace(/\s+page$/i, "")
    .replace(/\s+section$/i, "")
    .replace(/\s+menu$/i, "")
    .trim();
  
  return target || text;
}

function calculateConfidence(text: string, intentType: IntentType): number {
  const lower = text.toLowerCase();
  let confidence = 0.5; // Base confidence
  
  // Higher confidence if clear intent keyword is present
  const allKeywords = [...NAVIGATE_KEYWORDS, ...INTERACT_KEYWORDS, ...EXPLAIN_KEYWORDS];
  for (const keyword of allKeywords) {
    if (lower.includes(keyword)) {
      confidence += 0.3;
      break;
    }
  }
  
  // Higher confidence for shorter, clearer queries
  if (text.split(" ").length <= 5) {
    confidence += 0.1;
  }
  
  return Math.min(confidence, 1);
}

export function parseIntent(text: string): ParsedIntent {
  const intentType = detectIntentType(text);
  const target = extractTarget(text, intentType);
  const confidence = calculateConfidence(text, intentType);
  
  return {
    type: intentType,
    target,
    confidence,
    rawQuery: text
  };
}
