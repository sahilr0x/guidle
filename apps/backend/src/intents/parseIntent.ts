import { ParsedIntent } from "./types";

export async function parseIntent(text: string): Promise<ParsedIntent> {
  if (text.toLowerCase().includes("name")) {
    return { intent: "UPDATE", entity: "name" };
  }
  return { intent: "LOCATE", entity: "unknown" };
}
