export type WSMessage = 
    | { type: "HIGHLIGHT"; selector: string }
    | { type: "WAIT" }
    | { type: "DONE" }