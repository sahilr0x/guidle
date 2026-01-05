import { GuidleConfig, GuidleTheme } from "./types";

const DEFAULT_THEME: Required<GuidleTheme> = {
  primaryColor: "#3B82F6",
  backgroundColor: "#FFFFFF",
  textColor: "#1F2937",
  overlayColor: "rgba(0, 0, 0, 0.5)",
  highlightColor: "#3B82F6",
  borderRadius: "12px",
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
};

export class ChatWidget {
  private container: HTMLElement | null = null;
  private isOpen = false;
  private config: GuidleConfig;
  private theme: Required<GuidleTheme>;
  private onQuery: ((text: string) => void) | null = null;
  private inputElement: HTMLInputElement | null = null;
  private messagesContainer: HTMLElement | null = null;

  constructor(config: GuidleConfig) {
    this.config = config;
    this.theme = { ...DEFAULT_THEME, ...config.theme };
  }

  render(parent: HTMLElement) {
    this.injectStyles();
    
    this.container = document.createElement("div");
    this.container.className = "guidle-widget";
    this.container.innerHTML = this.getWidgetHTML();
    parent.appendChild(this.container);

    this.setupEventListeners();
    this.messagesContainer = this.container.querySelector(".guidle-messages");
    this.inputElement = this.container.querySelector(".guidle-input");
  }

  private injectStyles() {
    if (document.getElementById("guidle-widget-styles")) return;

    const styles = document.createElement("style");
    styles.id = "guidle-widget-styles";
    styles.textContent = `
      .guidle-widget {
        position: fixed;
        ${this.config.position?.includes("bottom") ? "bottom: 24px" : "top: 24px"};
        ${this.config.position?.includes("left") ? "left: 24px" : "right: 24px"};
        z-index: 99990;
        font-family: ${this.theme.fontFamily};
      }

      .guidle-fab {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: ${this.theme.primaryColor};
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 20px rgba(59, 130, 246, 0.4);
        transition: all 0.3s ease;
      }

      .guidle-fab:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 30px rgba(59, 130, 246, 0.5);
      }

      .guidle-fab svg {
        width: 28px;
        height: 28px;
        fill: white;
      }

      .guidle-panel {
        position: absolute;
        ${this.config.position?.includes("bottom") ? "bottom: 80px" : "top: 80px"};
        ${this.config.position?.includes("left") ? "left: 0" : "right: 0"};
        width: 380px;
        max-height: 500px;
        background: ${this.theme.backgroundColor};
        border-radius: ${this.theme.borderRadius};
        box-shadow: 0 10px 50px rgba(0, 0, 0, 0.2);
        display: none;
        flex-direction: column;
        overflow: hidden;
        animation: guidle-slideUp 0.3s ease;
      }

      .guidle-panel.open {
        display: flex;
      }

      @keyframes guidle-slideUp {
        from { 
          opacity: 0;
          transform: translateY(20px);
        }
        to { 
          opacity: 1;
          transform: translateY(0);
        }
      }

      .guidle-header {
        padding: 20px;
        background: linear-gradient(135deg, ${this.theme.primaryColor}, #1D4ED8);
        color: white;
      }

      .guidle-header-title {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 4px;
      }

      .guidle-header-title svg {
        width: 24px;
        height: 24px;
      }

      .guidle-header h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
      }

      .guidle-header p {
        margin: 0;
        font-size: 13px;
        opacity: 0.9;
      }

      .guidle-messages {
        flex: 1;
        padding: 16px;
        overflow-y: auto;
        min-height: 200px;
        max-height: 300px;
      }

      .guidle-message {
        margin-bottom: 12px;
        padding: 12px 16px;
        border-radius: 12px;
        font-size: 14px;
        line-height: 1.4;
        animation: guidle-fadeIn 0.3s ease;
      }

      .guidle-message.assistant {
        background: #F3F4F6;
        color: ${this.theme.textColor};
        border-bottom-left-radius: 4px;
      }

      .guidle-message.user {
        background: ${this.theme.primaryColor};
        color: white;
        margin-left: 40px;
        border-bottom-right-radius: 4px;
      }

      .guidle-message.system {
        background: #FEF3C7;
        color: #92400E;
        font-size: 13px;
        text-align: center;
      }

      .guidle-suggestions {
        padding: 12px 16px;
        border-top: 1px solid #E5E7EB;
      }

      .guidle-suggestions-title {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: #9CA3AF;
        margin-bottom: 8px;
      }

      .guidle-suggestion {
        display: inline-block;
        padding: 8px 12px;
        margin: 4px;
        background: #F3F4F6;
        border-radius: 20px;
        font-size: 13px;
        cursor: pointer;
        transition: all 0.2s ease;
        border: 1px solid transparent;
      }

      .guidle-suggestion:hover {
        background: ${this.theme.primaryColor}10;
        border-color: ${this.theme.primaryColor};
        color: ${this.theme.primaryColor};
      }

      .guidle-input-container {
        padding: 16px;
        border-top: 1px solid #E5E7EB;
        display: flex;
        gap: 8px;
      }

      .guidle-input {
        flex: 1;
        padding: 12px 16px;
        border: 2px solid #E5E7EB;
        border-radius: 24px;
        font-size: 14px;
        outline: none;
        transition: border-color 0.2s ease;
        font-family: ${this.theme.fontFamily};
      }

      .guidle-input:focus {
        border-color: ${this.theme.primaryColor};
      }

      .guidle-input::placeholder {
        color: #9CA3AF;
      }

      .guidle-send-btn {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: ${this.theme.primaryColor};
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      }

      .guidle-send-btn:hover {
        background: #2563EB;
        transform: scale(1.05);
      }

      .guidle-send-btn:disabled {
        background: #D1D5DB;
        cursor: not-allowed;
        transform: none;
      }

      .guidle-send-btn svg {
        width: 20px;
        height: 20px;
        fill: white;
      }

      .guidle-voice-btn {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: #F3F4F6;
        border: 2px solid #E5E7EB;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      }

      .guidle-voice-btn:hover {
        border-color: ${this.theme.primaryColor};
        background: ${this.theme.primaryColor}10;
      }

      .guidle-voice-btn.recording {
        background: #FEE2E2;
        border-color: #EF4444;
        animation: guidle-pulse-red 1s ease-in-out infinite;
      }

      .guidle-voice-btn svg {
        width: 20px;
        height: 20px;
        fill: #6B7280;
      }

      .guidle-voice-btn.recording svg {
        fill: #EF4444;
      }

      @keyframes guidle-pulse-red {
        0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
        50% { box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
      }

      @keyframes guidle-fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `;
    document.head.appendChild(styles);
  }

  private getWidgetHTML(): string {
    return `
      <button class="guidle-fab" aria-label="Open Guidle assistant">
        <svg viewBox="0 0 24 24">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"/>
          <path d="M12 15c.83 0 1.5-.67 1.5-1.5h-3c0 .83.67 1.5 1.5 1.5zm0-9c-1.66 0-3 1.34-3 3v3h6V9c0-1.66-1.34-3-3-3z"/>
        </svg>
      </button>
      
      <div class="guidle-panel">
        <div class="guidle-header">
          <div class="guidle-header-title">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>
            </svg>
            <h3>Guidle</h3>
          </div>
          <p>Ask me to help you navigate this app</p>
        </div>
        
        <div class="guidle-messages">
          <div class="guidle-message assistant">
            👋 Hi! I can help you find anything in this app. Try saying "Go to settings" or "Where is my profile?"
          </div>
        </div>

        <div class="guidle-suggestions">
          <div class="guidle-suggestions-title">Quick actions</div>
          <span class="guidle-suggestion" data-query="Go to settings">⚙️ Settings</span>
          <span class="guidle-suggestion" data-query="Show my profile">👤 Profile</span>
          <span class="guidle-suggestion" data-query="Open notifications">🔔 Notifications</span>
          <span class="guidle-suggestion" data-query="Find help">❓ Help</span>
        </div>
        
        <div class="guidle-input-container">
          ${this.config.voiceEnabled ? `
            <button class="guidle-voice-btn" aria-label="Voice input">
              <svg viewBox="0 0 24 24">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z"/>
              </svg>
            </button>
          ` : ""}
          <input type="text" class="guidle-input" placeholder="Ask anything... (e.g., 'go to settings')">
          <button class="guidle-send-btn" aria-label="Send">
            <svg viewBox="0 0 24 24">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </button>
        </div>
      </div>
    `;
  }

  private setupEventListeners() {
    if (!this.container) return;

    // Toggle panel
    const fab = this.container.querySelector(".guidle-fab");
    fab?.addEventListener("click", () => this.toggle());

    // Send button
    const sendBtn = this.container.querySelector(".guidle-send-btn");
    sendBtn?.addEventListener("click", () => this.sendMessage());

    // Input enter key
    const input = this.container.querySelector(".guidle-input") as HTMLInputElement;
    input?.addEventListener("keypress", (e) => {
      if (e.key === "Enter") this.sendMessage();
    });

    // Suggestions
    const suggestions = this.container.querySelectorAll(".guidle-suggestion");
    suggestions.forEach((suggestion) => {
      suggestion.addEventListener("click", () => {
        const query = suggestion.getAttribute("data-query");
        if (query) {
          this.sendQuery(query);
        }
      });
    });

    // Voice button
    const voiceBtn = this.container.querySelector(".guidle-voice-btn");
    if (voiceBtn && this.config.voiceEnabled) {
      this.setupVoiceRecognition(voiceBtn as HTMLButtonElement);
    }

    // Keyboard shortcut
    if (this.config.hotkey) {
      document.addEventListener("keydown", (e) => {
        if (e.key === this.config.hotkey && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          this.toggle();
        }
      });
    }
  }

  private setupVoiceRecognition(button: HTMLButtonElement) {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      button.style.display = "none";
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    let isRecording = false;

    button.addEventListener("click", () => {
      if (isRecording) {
        recognition.stop();
      } else {
        recognition.start();
      }
    });

    recognition.onstart = () => {
      isRecording = true;
      button.classList.add("recording");
    };

    recognition.onend = () => {
      isRecording = false;
      button.classList.remove("recording");
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      this.sendQuery(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error("[Guidle] Voice recognition error:", event.error);
      isRecording = false;
      button.classList.remove("recording");
    };
  }

  private sendMessage() {
    const input = this.container?.querySelector(".guidle-input") as HTMLInputElement;
    const text = input?.value.trim();
    if (!text) return;

    this.sendQuery(text);
    input.value = "";
  }

  private sendQuery(text: string) {
    this.addMessage(text, "user");
    this.onQuery?.(text);
  }

  addMessage(text: string, type: "user" | "assistant" | "system") {
    if (!this.messagesContainer) return;

    const message = document.createElement("div");
    message.className = `guidle-message ${type}`;
    message.textContent = text;
    this.messagesContainer.appendChild(message);
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }

  setOnQuery(callback: (text: string) => void) {
    this.onQuery = callback;
  }

  toggle() {
    this.isOpen = !this.isOpen;
    const panel = this.container?.querySelector(".guidle-panel");
    panel?.classList.toggle("open", this.isOpen);
    
    if (this.isOpen) {
      this.inputElement?.focus();
    }
  }

  open() {
    this.isOpen = true;
    const panel = this.container?.querySelector(".guidle-panel");
    panel?.classList.add("open");
    this.inputElement?.focus();
  }

  close() {
    this.isOpen = false;
    const panel = this.container?.querySelector(".guidle-panel");
    panel?.classList.remove("open");
  }

  destroy() {
    this.container?.remove();
    document.getElementById("guidle-widget-styles")?.remove();
  }
}
