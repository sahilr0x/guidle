
export type Intent = "LOCATE" | "UPDATE"



export interface ParsedIntent {
    intent:Intent;
    entity: string;
}