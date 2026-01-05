import { GuidleConfig, GuidleStep, HighlightStep, WSServerMessage } from "./types";
import { GuidleConnection } from "./connection";
import { OverlayManager } from "./overlay";
import { ChatWidget } from "./widget";

export class Guidle {
  private config: GuidleConfig;
  private connection: GuidleConnection;
  private overlay: OverlayManager;
  private widget: ChatWidget;
  private isInitialized = false;

  constructor(config: GuidleConfig) {
    this.config = {
      position: "bottom-right",
      voiceEnabled: true,
      ...config
    };
    
    this.connection = new GuidleConnection(this.config);
    this.overlay = new OverlayManager(this.config.theme);
    this.widget = new ChatWidget(this.config);
  }

  async init(): Promise<void> {
    if (this.isInitialized) return;

    // Connect to server
    await this.connection.connect();

    // Set up message handler
    this.connection.onMessage((message) => this.handleServerMessage(message));

    // Render widget
    this.widget.render(document.body);
    this.widget.setOnQuery((text) => this.query(text));

    this.isInitialized = true;
    this.config.onReady?.();
    
    console.log("[Guidle] Initialized successfully");
  }

  private handleServerMessage(message: WSServerMessage) {
    switch (message.type) {
      case "STEP":
        this.executeStep(message.step);
        break;
        
      case "DONE":
        if (message.success && message.message) {
          this.widget.addMessage(message.message, "assistant");
        }
        break;
        
      case "ERROR":
        this.widget.addMessage(`Error: ${message.message}`, "system");
        this.overlay.clearHighlights();
        break;
    }
  }

  private executeStep(step: GuidleStep) {
    switch (step.type) {
      case "HIGHLIGHT":
        const element = this.overlay.highlight(step as HighlightStep);
        if (element) {
          this.widget.addMessage(`Found: ${step.description}`, "assistant");
          
          // Add click listener to dismiss on interaction
          const handleClick = () => {
            this.overlay.clearHighlights();
            element.removeEventListener("click", handleClick);
          };
          element.addEventListener("click", handleClick);
        } else {
          this.widget.addMessage(
            `Couldn't find ${step.description}. It might not be visible on this page.`,
            "assistant"
          );
        }
        break;
        
      case "PROMPT":
        this.overlay.showTooltip(step);
        break;
        
      case "TOOLTIP":
        this.overlay.showTooltip(step);
        break;
        
      case "WAIT":
        // Handle wait step if needed
        break;
        
      case "DONE":
        if (!step.success) {
          this.overlay.clearHighlights();
        }
        break;
    }
  }

  query(text: string) {
    this.overlay.clearHighlights();
    this.connection.sendQuery(text);
  }

  registerSchema(schema: any) {
    this.connection.registerSchema(schema);
  }

  open() {
    this.widget.open();
  }

  close() {
    this.widget.close();
  }

  clearHighlights() {
    this.overlay.clearHighlights();
  }

  destroy() {
    this.connection.disconnect();
    this.widget.destroy();
    this.overlay.clearHighlights();
    this.isInitialized = false;
  }
}

// Export types
export * from "./types";
