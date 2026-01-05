import { GuidleTheme, HighlightStep, TooltipStep, PromptStep } from "./types";

const DEFAULT_THEME: Required<GuidleTheme> = {
  primaryColor: "#3B82F6",
  backgroundColor: "#FFFFFF",
  textColor: "#1F2937",
  overlayColor: "rgba(0, 0, 0, 0.5)",
  highlightColor: "#3B82F6",
  borderRadius: "12px",
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
};

export class OverlayManager {
  private theme: Required<GuidleTheme>;
  private overlayContainer: HTMLElement | null = null;
  private highlightElements: HTMLElement[] = [];
  private tooltipElement: HTMLElement | null = null;
  private currentHighlightedElement: Element | null = null;

  constructor(theme?: GuidleTheme) {
    this.theme = { ...DEFAULT_THEME, ...theme };
    this.injectStyles();
  }

  private injectStyles() {
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

  highlight(step: HighlightStep): Element | null {
    this.clearHighlights();
    
    // Create overlay
    this.overlayContainer = document.createElement("div");
    this.overlayContainer.className = "guidle-overlay";
    document.body.appendChild(this.overlayContainer);

    // Try each selector until we find a match
    let element: Element | null = null;
    for (const selector of step.selectors) {
      try {
        // Handle :contains pseudo-selector (not native CSS)
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
        // Invalid selector, try next
        continue;
      }
    }

    if (!element) {
      console.warn(`[Guidle] No element found for selectors:`, step.selectors);
      this.clearHighlights();
      return null;
    }

    this.currentHighlightedElement = element;
    
    // Create highlight box
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

    // Create spotlight (clickable area)
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

    // Scroll element into view
    element.scrollIntoView({ behavior: "smooth", block: "center" });

    return element;
  }

  private findElementWithText(selector: string): Element | null {
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

  showTooltip(step: TooltipStep | PromptStep, targetElement?: Element | null) {
    this.hideTooltip();
    
    const element = targetElement || this.currentHighlightedElement;
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const tooltip = document.createElement("div");
    tooltip.className = "guidle-tooltip";
    
    const isPrompt = step.type === "PROMPT";
    const position = isPrompt ? "bottom" : (step as TooltipStep).position;
    
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

    // Position tooltip
    let top: number, left: number;
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

    // Keep within viewport
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

  updateTheme(theme: Partial<GuidleTheme>) {
    this.theme = { ...this.theme, ...theme };
    // Re-inject styles with new theme
    document.getElementById("guidle-styles")?.remove();
    this.injectStyles();
  }
}
