import { parseIntent } from "../intents/parseIntent";
import { planSteps } from "../planner/planSteps";
import { registerAppSchema } from "../intents/elementMatcher";
import { WSClientMessage, WSServerMessage } from "../protocol/messages";
import { analyzeScreenshot } from "../vision/analyzeScreenshot";

export function handleSession(ws: any) {
  console.log("[Guidle] New session connected");

  ws.on("message", async (data: Buffer) => {
    try {
      const message = JSON.parse(data.toString());
      
      switch (message.type) {
        case "QUERY":
          handleQuery(ws, message.text, message.appId);
          break;
        
        case "VISION_QUERY":
          // New: Vision-based query with screenshot
          await handleVisionQuery(ws, message.text, message.screenshot, message.viewport);
          break;
          
        case "REGISTER_SCHEMA":
          registerAppSchema(message.schema);
          sendMessage(ws, { type: "DONE", success: true, message: "Schema registered" });
          break;
          
        case "FEEDBACK":
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
  
  const intent = parseIntent(text);
  console.log(`[Guidle] Parsed intent:`, intent);
  
  const { steps, description } = planSteps(intent, appId);
  console.log(`[Guidle] Planned ${steps.length} steps for: ${description}`);
  
  steps.forEach((step, index) => {
    sendMessage(ws, {
      type: "STEP",
      step,
      stepIndex: index,
      totalSteps: steps.length
    });
  });
  
  sendMessage(ws, { 
    type: "DONE", 
    success: true, 
    message: `Found ${description}` 
  });
}

async function handleVisionQuery(
  ws: any, 
  text: string, 
  screenshot: string, 
  viewport: { width: number; height: number }
) {
  console.log(`[Guidle] Vision query: "${text}"`);
  
  if (!screenshot) {
    sendMessage(ws, { type: "ERROR", message: "No screenshot provided", code: "NO_SCREENSHOT" });
    return;
  }

  if (!process.env.OPENAI_API_KEY) {
    console.warn("[Guidle] OPENAI_API_KEY not set, falling back to selector-based matching");
    handleQuery(ws, text);
    return;
  }

  try {
    const result = await analyzeScreenshot(screenshot, text);
    
    if (result.success && result.elements.length > 0) {
      // Send vision-based highlight step
      sendMessage(ws, {
        type: "STEP",
        step: {
          type: "VISION_HIGHLIGHT",
          elements: result.elements.map(el => ({
            // Convert percentages to actual pixels
            x: (el.x / 100) * viewport.width,
            y: (el.y / 100) * viewport.height,
            width: (el.width / 100) * viewport.width,
            height: (el.height / 100) * viewport.height,
            label: el.label,
            confidence: el.confidence,
            action: el.action
          })),
          explanation: result.explanation
        },
        stepIndex: 0,
        totalSteps: 1
      });
      
      sendMessage(ws, { 
        type: "DONE", 
        success: true, 
        message: result.explanation 
      });
    } else {
      // Fall back to selector-based matching
      console.log("[Guidle] Vision found nothing, falling back to selectors");
      handleQuery(ws, text);
    }
  } catch (error) {
    console.error("[Guidle] Vision analysis error:", error);
    // Fall back to selector-based matching
    handleQuery(ws, text);
  }
}

function sendMessage(ws: any, message: WSServerMessage | any) {
  ws.send(JSON.stringify(message));
}
