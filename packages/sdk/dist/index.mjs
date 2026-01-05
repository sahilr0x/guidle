// src/connection.ts
var GuidleConnection = class {
  constructor(config) {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.messageHandlers = [];
    this.config = config;
  }
  connect() {
    return new Promise((resolve, reject) => {
      try {
        const wsUrl = this.config.serverUrl.replace(/^http/, "ws");
        this.ws = new WebSocket(wsUrl);
        this.ws.onopen = () => {
          console.log("[Guidle] Connected to server");
          this.reconnectAttempts = 0;
          resolve();
        };
        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.messageHandlers.forEach((handler) => handler(message));
          } catch (e) {
            console.error("[Guidle] Failed to parse message:", e);
          }
        };
        this.ws.onerror = (error) => {
          console.error("[Guidle] WebSocket error:", error);
          this.config.onError?.(new Error("WebSocket connection error"));
        };
        this.ws.onclose = () => {
          console.log("[Guidle] Connection closed");
          this.attemptReconnect();
        };
      } catch (error) {
        reject(error);
      }
    });
  }
  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1e3 * Math.pow(2, this.reconnectAttempts), 1e4);
      console.log(`[Guidle] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
      setTimeout(() => this.connect(), delay);
    }
  }
  sendQuery(text) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: "QUERY",
        text,
        appId: this.config.appId
      }));
    } else {
      console.warn("[Guidle] Cannot send query - not connected");
    }
  }
  registerSchema(schema) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: "REGISTER_SCHEMA",
        schema
      }));
    }
  }
  onMessage(handler) {
    this.messageHandlers.push(handler);
    return () => {
      const index = this.messageHandlers.indexOf(handler);
      if (index > -1) this.messageHandlers.splice(index, 1);
    };
  }
  disconnect() {
    this.maxReconnectAttempts = 0;
    this.ws?.close();
    this.ws = null;
  }
  get isConnected() {
    return this.ws?.readyState === WebSocket.OPEN;
  }
};

// src/overlay.ts
var DEFAULT_THEME = {
  primaryColor: "#3B82F6",
  backgroundColor: "#FFFFFF",
  textColor: "#1F2937",
  overlayColor: "rgba(0, 0, 0, 0.5)",
  highlightColor: "#3B82F6",
  borderRadius: "12px",
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
};
var OverlayManager = class {
  constructor(theme) {
    this.overlayContainer = null;
    this.highlightElements = [];
    this.tooltipElement = null;
    this.currentHighlightedElement = null;
    this.theme = { ...DEFAULT_THEME, ...theme };
    this.injectStyles();
  }
  injectStyles() {
    if (document.getElementById("guidle-styles")) return;
    const styles = document.createElement("style");
    styles.id = "guidle-styles";
    styles.textContent = `
      .guidle-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: ${this.theme.overlayColor};
        z-index: 99998;
        pointer-events: none;
        transition: opacity 0.3s ease;
      }

      .guidle-highlight {
        position: absolute;
        border: 3px solid ${this.theme.highlightColor};
        border-radius: 8px;
        box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.3), 0 0 20px rgba(59, 130, 246, 0.4);
        z-index: 99999;
        pointer-events: none;
        animation: guidle-pulse 2s ease-in-out infinite;
        transition: all 0.3s ease;
      }

      .guidle-highlight::before {
        content: '';
        position: absolute;
        top: -8px;
        left: -8px;
        right: -8px;
        bottom: -8px;
        border: 2px dashed ${this.theme.highlightColor};
        border-radius: 12px;
        opacity: 0.5;
        animation: guidle-dash 1s linear infinite;
      }

      @keyframes guidle-pulse {
        0%, 100% { 
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.3), 0 0 20px rgba(59, 130, 246, 0.4);
        }
        50% { 
          box-shadow: 0 0 0 8px rgba(59, 130, 246, 0.2), 0 0 30px rgba(59, 130, 246, 0.5);
        }
      }

      @keyframes guidle-dash {
        to {
          stroke-dashoffset: -20;
        }
      }

      .guidle-tooltip {
        position: absolute;
        background: ${this.theme.backgroundColor};
        color: ${this.theme.textColor};
        padding: 12px 16px;
        border-radius: ${this.theme.borderRadius};
        font-family: ${this.theme.fontFamily};
        font-size: 14px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        z-index: 100000;
        max-width: 300px;
        animation: guidle-fadeIn 0.3s ease;
      }

      .guidle-tooltip::before {
        content: '';
        position: absolute;
        width: 12px;
        height: 12px;
        background: ${this.theme.backgroundColor};
        transform: rotate(45deg);
      }

      .guidle-tooltip.top::before {
        bottom: -6px;
        left: 50%;
        margin-left: -6px;
      }

      .guidle-tooltip.bottom::before {
        top: -6px;
        left: 50%;
        margin-left: -6px;
      }

      .guidle-tooltip-title {
        font-weight: 600;
        margin-bottom: 4px;
        color: ${this.theme.primaryColor};
      }

      .guidle-tooltip-desc {
        color: ${this.theme.textColor};
        opacity: 0.8;
        line-height: 1.4;
      }

      .guidle-prompt {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 8px;
        padding-top: 8px;
        border-top: 1px solid rgba(0, 0, 0, 0.1);
        font-size: 12px;
        color: ${this.theme.primaryColor};
      }

      .guidle-prompt-icon {
        width: 16px;
        height: 16px;
      }

      @keyframes guidle-fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .guidle-spotlight {
        position: absolute;
        z-index: 99999;
        pointer-events: auto;
        background: transparent;
      }
    `;
    document.head.appendChild(styles);
  }
  highlight(step) {
    this.clearHighlights();
    this.overlayContainer = document.createElement("div");
    this.overlayContainer.className = "guidle-overlay";
    document.body.appendChild(this.overlayContainer);
    let element = null;
    for (const selector of step.selectors) {
      try {
        if (selector.includes(":contains(")) {
          element = this.findElementWithText(selector);
        } else {
          element = document.querySelector(selector);
        }
        if (element) {
          console.log(`[Guidle] Found element with selector: ${selector}`);
          break;
        }
      } catch (e) {
        continue;
      }
    }
    if (!element) {
      console.warn(`[Guidle] No element found for selectors:`, step.selectors);
      this.clearHighlights();
      return null;
    }
    this.currentHighlightedElement = element;
    const rect = element.getBoundingClientRect();
    const highlight = document.createElement("div");
    highlight.className = "guidle-highlight";
    highlight.style.cssText = `
      top: ${rect.top + window.scrollY - 4}px;
      left: ${rect.left + window.scrollX - 4}px;
      width: ${rect.width + 8}px;
      height: ${rect.height + 8}px;
    `;
    document.body.appendChild(highlight);
    this.highlightElements.push(highlight);
    const spotlight = document.createElement("div");
    spotlight.className = "guidle-spotlight";
    spotlight.style.cssText = `
      top: ${rect.top + window.scrollY}px;
      left: ${rect.left + window.scrollX}px;
      width: ${rect.width}px;
      height: ${rect.height}px;
    `;
    document.body.appendChild(spotlight);
    this.highlightElements.push(spotlight);
    element.scrollIntoView({ behavior: "smooth", block: "center" });
    return element;
  }
  findElementWithText(selector) {
    const match = selector.match(/(.+):contains\(['"](.+)['"]\)/);
    if (!match) return null;
    const [, baseSelector, text] = match;
    const elements = document.querySelectorAll(baseSelector || "*");
    for (const el of elements) {
      if (el.textContent?.toLowerCase().includes(text.toLowerCase())) {
        return el;
      }
    }
    return null;
  }
  showTooltip(step, targetElement) {
    this.hideTooltip();
    const element = targetElement || this.currentHighlightedElement;
    if (!element) return;
    const rect = element.getBoundingClientRect();
    const tooltip = document.createElement("div");
    tooltip.className = "guidle-tooltip";
    const isPrompt = step.type === "PROMPT";
    const position = isPrompt ? "bottom" : step.position;
    tooltip.innerHTML = `
      <div class="guidle-tooltip-title">${isPrompt ? "Next Step" : "Info"}</div>
      <div class="guidle-tooltip-desc">${step.message}</div>
      ${isPrompt ? `
        <div class="guidle-prompt">
          <svg class="guidle-prompt-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          Click to continue
        </div>
      ` : ""}
    `;
    let top, left;
    const tooltipWidth = 280;
    const tooltipHeight = 100;
    const padding = 16;
    if (position === "top" || position === "auto" && rect.bottom + tooltipHeight > window.innerHeight) {
      tooltip.classList.add("top");
      top = rect.top + window.scrollY - tooltipHeight - padding;
      left = rect.left + window.scrollX + rect.width / 2 - tooltipWidth / 2;
    } else {
      tooltip.classList.add("bottom");
      top = rect.bottom + window.scrollY + padding;
      left = rect.left + window.scrollX + rect.width / 2 - tooltipWidth / 2;
    }
    left = Math.max(padding, Math.min(left, window.innerWidth - tooltipWidth - padding));
    tooltip.style.cssText += `
      top: ${top}px;
      left: ${left}px;
      width: ${tooltipWidth}px;
    `;
    document.body.appendChild(tooltip);
    this.tooltipElement = tooltip;
  }
  hideTooltip() {
    this.tooltipElement?.remove();
    this.tooltipElement = null;
  }
  clearHighlights() {
    this.overlayContainer?.remove();
    this.overlayContainer = null;
    this.highlightElements.forEach((el) => el.remove());
    this.highlightElements = [];
    this.hideTooltip();
    this.currentHighlightedElement = null;
  }
  updateTheme(theme) {
    this.theme = { ...this.theme, ...theme };
    document.getElementById("guidle-styles")?.remove();
    this.injectStyles();
  }
};

// src/widget.ts
var DEFAULT_THEME2 = {
  primaryColor: "#3B82F6",
  backgroundColor: "#FFFFFF",
  textColor: "#1F2937",
  overlayColor: "rgba(0, 0, 0, 0.5)",
  highlightColor: "#3B82F6",
  borderRadius: "12px",
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
};
var ChatWidget = class {
  constructor(config) {
    this.container = null;
    this.isOpen = false;
    this.onQuery = null;
    this.inputElement = null;
    this.messagesContainer = null;
    this.config = config;
    this.theme = { ...DEFAULT_THEME2, ...config.theme };
  }
  render(parent) {
    this.injectStyles();
    this.container = document.createElement("div");
    this.container.className = "guidle-widget";
    this.container.innerHTML = this.getWidgetHTML();
    parent.appendChild(this.container);
    this.setupEventListeners();
    this.messagesContainer = this.container.querySelector(".guidle-messages");
    this.inputElement = this.container.querySelector(".guidle-input");
  }
  injectStyles() {
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
  getWidgetHTML() {
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
            \u{1F44B} Hi! I can help you find anything in this app. Try saying "Go to settings" or "Where is my profile?"
          </div>
        </div>

        <div class="guidle-suggestions">
          <div class="guidle-suggestions-title">Quick actions</div>
          <span class="guidle-suggestion" data-query="Go to settings">\u2699\uFE0F Settings</span>
          <span class="guidle-suggestion" data-query="Show my profile">\u{1F464} Profile</span>
          <span class="guidle-suggestion" data-query="Open notifications">\u{1F514} Notifications</span>
          <span class="guidle-suggestion" data-query="Find help">\u2753 Help</span>
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
  setupEventListeners() {
    if (!this.container) return;
    const fab = this.container.querySelector(".guidle-fab");
    fab?.addEventListener("click", () => this.toggle());
    const sendBtn = this.container.querySelector(".guidle-send-btn");
    sendBtn?.addEventListener("click", () => this.sendMessage());
    const input = this.container.querySelector(".guidle-input");
    input?.addEventListener("keypress", (e) => {
      if (e.key === "Enter") this.sendMessage();
    });
    const suggestions = this.container.querySelectorAll(".guidle-suggestion");
    suggestions.forEach((suggestion) => {
      suggestion.addEventListener("click", () => {
        const query = suggestion.getAttribute("data-query");
        if (query) {
          this.sendQuery(query);
        }
      });
    });
    const voiceBtn = this.container.querySelector(".guidle-voice-btn");
    if (voiceBtn && this.config.voiceEnabled) {
      this.setupVoiceRecognition(voiceBtn);
    }
    if (this.config.hotkey) {
      document.addEventListener("keydown", (e) => {
        if (e.key === this.config.hotkey && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          this.toggle();
        }
      });
    }
  }
  setupVoiceRecognition(button) {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      button.style.display = "none";
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
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
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      this.sendQuery(transcript);
    };
    recognition.onerror = (event) => {
      console.error("[Guidle] Voice recognition error:", event.error);
      isRecording = false;
      button.classList.remove("recording");
    };
  }
  sendMessage() {
    const input = this.container?.querySelector(".guidle-input");
    const text = input?.value.trim();
    if (!text) return;
    this.sendQuery(text);
    input.value = "";
  }
  sendQuery(text) {
    this.addMessage(text, "user");
    this.onQuery?.(text);
  }
  addMessage(text, type) {
    if (!this.messagesContainer) return;
    const message = document.createElement("div");
    message.className = `guidle-message ${type}`;
    message.textContent = text;
    this.messagesContainer.appendChild(message);
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }
  setOnQuery(callback) {
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
};

// src/guidle.ts
var Guidle = class {
  constructor(config) {
    this.isInitialized = false;
    this.config = {
      position: "bottom-right",
      voiceEnabled: true,
      ...config
    };
    this.connection = new GuidleConnection(this.config);
    this.overlay = new OverlayManager(this.config.theme);
    this.widget = new ChatWidget(this.config);
  }
  async init() {
    if (this.isInitialized) return;
    await this.connection.connect();
    this.connection.onMessage((message) => this.handleServerMessage(message));
    this.widget.render(document.body);
    this.widget.setOnQuery((text) => this.query(text));
    this.isInitialized = true;
    this.config.onReady?.();
    console.log("[Guidle] Initialized successfully");
  }
  handleServerMessage(message) {
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
  executeStep(step) {
    switch (step.type) {
      case "HIGHLIGHT":
        const element = this.overlay.highlight(step);
        if (element) {
          this.widget.addMessage(`Found: ${step.description}`, "assistant");
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
        break;
      case "DONE":
        if (!step.success) {
          this.overlay.clearHighlights();
        }
        break;
    }
  }
  query(text) {
    this.overlay.clearHighlights();
    this.connection.sendQuery(text);
  }
  registerSchema(schema) {
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
};

// src/index.ts
var GuidleElement = class extends HTMLElement {
  constructor() {
    super(...arguments);
    this.guidle = null;
  }
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
    if (this.guidle) {
      this.guidle.destroy();
      this.init();
    }
  }
  async init() {
    const config = {
      serverUrl: this.getAttribute("server") || "ws://localhost:3000",
      appId: this.getAttribute("app-id") || void 0,
      position: this.getAttribute("position") || "bottom-right",
      voiceEnabled: this.getAttribute("voice") !== "false",
      hotkey: this.getAttribute("hotkey") || void 0
    };
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
  query(text) {
    this.guidle?.query(text);
  }
  open() {
    this.guidle?.open();
  }
  close() {
    this.guidle?.close();
  }
  registerSchema(schema) {
    this.guidle?.registerSchema(schema);
  }
};
if (typeof window !== "undefined" && typeof customElements !== "undefined") {
  if (!customElements.get("guidle-widget")) {
    customElements.define("guidle-widget", GuidleElement);
  }
  if (!customElements.get("guidle")) {
    customElements.define("guidle", class extends GuidleElement {
    });
  }
}
var index_default = Guidle;
export {
  Guidle,
  index_default as default
};
