// Main entry point for @guidle/sdk
export { Guidle } from "./guidle";
export * from "./types";

// Custom element for easy embedding
import { Guidle } from "./guidle";
import { GuidleConfig } from "./types";

// Define custom element for <guidle> tag usage
class GuidleElement extends HTMLElement {
  private guidle: Guidle | null = null;

  static get observedAttributes() {
    return ["server", "app-id", "position", "voice", "hotkey", "theme"];
  }

  connectedCallback() {
    this.init();
  }

  disconnectedCallback() {
    this.guidle?.destroy();
  }

  attributeChangedCallback() {
    // Reinitialize if attributes change
    if (this.guidle) {
      this.guidle.destroy();
      this.init();
    }
  }

  private async init() {
    const config: GuidleConfig = {
      serverUrl: this.getAttribute("server") || "ws://localhost:3000",
      appId: this.getAttribute("app-id") || undefined,
      position: (this.getAttribute("position") as GuidleConfig["position"]) || "bottom-right",
      voiceEnabled: this.getAttribute("voice") !== "false",
      hotkey: this.getAttribute("hotkey") || undefined,
    };

    // Parse theme from attribute if provided
    const themeAttr = this.getAttribute("theme");
    if (themeAttr) {
      try {
        config.theme = JSON.parse(themeAttr);
      } catch (e) {
        console.warn("[Guidle] Invalid theme attribute JSON");
      }
    }

    this.guidle = new Guidle(config);
    
    try {
      await this.guidle.init();
      this.dispatchEvent(new CustomEvent("ready"));
    } catch (error) {
      console.error("[Guidle] Failed to initialize:", error);
      this.dispatchEvent(new CustomEvent("error", { detail: error }));
    }
  }

  // Public API methods accessible from the element
  query(text: string) {
    this.guidle?.query(text);
  }

  open() {
    this.guidle?.open();
  }

  close() {
    this.guidle?.close();
  }

  registerSchema(schema: any) {
    this.guidle?.registerSchema(schema);
  }
}

// Register custom element if in browser environment
if (typeof window !== "undefined" && typeof customElements !== "undefined") {
  if (!customElements.get("guidle-widget")) {
    customElements.define("guidle-widget", GuidleElement);
  }
  
  // Also register as <guidle> for simpler usage
  if (!customElements.get("guidle")) {
    customElements.define("guidle", class extends GuidleElement {});
  }
}

// Default export for simple import
export default Guidle;
