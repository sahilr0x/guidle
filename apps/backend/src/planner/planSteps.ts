import { ParsedIntent } from "../intents/types";

export function planSteps(intent: ParsedIntent) {
  if (intent.entity === "name") {
    return [
      { type: "HIGHLIGHT", selector: "#settings-btn" },
      { type: "WAIT" },
      { type: "HIGHLIGHT", selector: "#profile-btn" },
      { type: "WAIT" },
      { type: "HIGHLIGHT", selector: "#name-input" }
    ];
  }
  return [];
}
