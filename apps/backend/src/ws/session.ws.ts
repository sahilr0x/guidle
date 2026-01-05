import { parseIntent } from "../intents/parseIntent";
import { planSteps } from "../planner/planSteps";
import { registerAppSchema } from "../intents/elementMatcher";
import { WSClientMessage, WSServerMessage } from "../protocol/messages";

export function handleSession(ws: any) {
  console.log("[Guidle] New session connected");

  ws.on("message", (data: Buffer) => {
    try {
      const message: WSClientMessage = JSON.parse(data.toString());
      
      switch (message.type) {
        case "QUERY":
          handleQuery(ws, message.text, message.appId);
          break;
          
        case "REGISTER_SCHEMA":
          registerAppSchema(message.schema);
          sendMessage(ws, { type: "DONE", success: true, message: "Schema registered" });
          break;
          
        case "FEEDBACK":
          // Store feedback for improving matching (future enhancement)
          console.log(`[Guidle] Feedback received: step=${message.stepId}, success=${message.success}`);
          break;
          
        default:
          sendMessage(ws, { type: "ERROR", message: "Unknown message type", code: "UNKNOWN_TYPE" });
      }
    } catch (error) {
      console.error("[Guidle] Error processing message:", error);
      sendMessage(ws, { type: "ERROR", message: "Invalid message format", code: "PARSE_ERROR" });
    }
  });

  ws.on("close", () => {
    console.log("[Guidle] Session disconnected");
  });
}

function handleQuery(ws: any, text: string, appId?: string) {
  console.log(`[Guidle] Query: "${text}" (appId: ${appId || "default"})`);
  
  // Parse the user's intent
  const intent = parseIntent(text);
  console.log(`[Guidle] Parsed intent:`, intent);
  
  // Plan the steps to guide the user
  const { steps, description } = planSteps(intent, appId);
  console.log(`[Guidle] Planned ${steps.length} steps for: ${description}`);
  
  // Send each step to the client
  steps.forEach((step, index) => {
    sendMessage(ws, {
      type: "STEP",
      step,
      stepIndex: index,
      totalSteps: steps.length
    });
  });
  
  // Send completion message
  sendMessage(ws, { 
    type: "DONE", 
    success: true, 
    message: `Found ${description}` 
  });
}

function sendMessage(ws: any, message: WSServerMessage) {
  ws.send(JSON.stringify(message));
}
