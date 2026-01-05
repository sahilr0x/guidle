import OpenAI from "openai";

// Lazy initialization of OpenAI client
let openai: OpenAI | null = null;

function getOpenAI(): OpenAI | null {
  if (openai) return openai;
  
  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey) {
    openai = new OpenAI({ apiKey });
    console.log("[Vision] OpenAI client initialized");
  }
  return openai;
}

export interface DetectedElement {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  confidence: number;
  action?: string;
}

export interface VisionAnalysisResult {
  elements: DetectedElement[];
  explanation: string;
  success: boolean;
}

const SYSTEM_PROMPT = `You are a UI analysis assistant. When given a screenshot and a user query, identify UI elements that match the user's intent.

For each matching element, provide:
- Bounding box coordinates (x, y, width, height) as percentages of the image (0-100)
- A label describing the element
- Confidence score (0-1)
- Suggested action (click, type, scroll)

IMPORTANT: Return coordinates as percentages of the image dimensions, not pixels.

Respond ONLY with valid JSON in this format:
{
  "elements": [
    {
      "x": 85,
      "y": 5,
      "width": 10,
      "height": 8,
      "label": "Settings gear icon in top navigation",
      "confidence": 0.95,
      "action": "click"
    }
  ],
  "explanation": "Found the settings icon in the top-right navigation bar",
  "success": true
}

If no matching elements are found:
{
  "elements": [],
  "explanation": "Could not find any elements matching 'settings' on this page",
  "success": false
}`;

export async function analyzeScreenshot(
  screenshotBase64: string,
  userQuery: string
): Promise<VisionAnalysisResult> {
  const client = getOpenAI();
  
  if (!client) {
    console.warn("[Vision] OpenAI not configured - OPENAI_API_KEY not set");
    return {
      elements: [],
      explanation: "Vision not available - API key not configured. Create a .env file with OPENAI_API_KEY=your-key",
      success: false
    };
  }

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `User wants to: "${userQuery}"\n\nFind all UI elements that would help the user accomplish this. Return bounding boxes as percentage coordinates.`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/png;base64,${screenshotBase64}`,
                detail: "high"
              }
            }
          ]
        }
      ],
      max_tokens: 1000,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return {
        elements: [],
        explanation: "No response from vision model",
        success: false
      };
    }

    const result = JSON.parse(content) as VisionAnalysisResult;
    console.log(`[Vision] Found ${result.elements.length} elements for query: "${userQuery}"`);
    
    return result;
  } catch (error) {
    console.error("[Vision] Error analyzing screenshot:", error);
    return {
      elements: [],
      explanation: `Vision analysis failed: ${error}`,
      success: false
    };
  }
}

// Alternative: Use Claude Vision if preferred
export async function analyzeWithClaude(
  screenshotBase64: string,
  userQuery: string
): Promise<VisionAnalysisResult> {
  // Implementation for Anthropic Claude Vision
  // Similar approach but using Anthropic SDK
  throw new Error("Claude Vision not implemented - use OpenAI for now");
}
