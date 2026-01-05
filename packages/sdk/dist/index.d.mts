interface GuidleConfig {
    serverUrl: string;
    appId?: string;
    theme?: GuidleTheme;
    position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
    hotkey?: string;
    voiceEnabled?: boolean;
    onReady?: () => void;
    onError?: (error: Error) => void;
}
interface GuidleTheme {
    primaryColor?: string;
    backgroundColor?: string;
    textColor?: string;
    overlayColor?: string;
    highlightColor?: string;
    borderRadius?: string;
    fontFamily?: string;
}
interface ElementMapping {
    patterns: string[];
    selectors: string[];
    description: string;
    category: string;
}
interface AppSchema {
    appId: string;
    elements: ElementMapping[];
}
interface HighlightStep {
    type: "HIGHLIGHT";
    selectors: string[];
    description: string;
    intent: string;
    confidence: number;
}
interface PromptStep {
    type: "PROMPT";
    message: string;
    action: "click" | "type" | "scroll";
}
interface TooltipStep {
    type: "TOOLTIP";
    message: string;
    position: "top" | "bottom" | "left" | "right" | "auto";
}
interface WaitStep {
    type: "WAIT";
    duration?: number;
    forSelector?: string;
}
interface DoneStep {
    type: "DONE";
    success: boolean;
    message?: string;
}
type GuidleStep = HighlightStep | PromptStep | TooltipStep | WaitStep | DoneStep;
interface WSStepMessage {
    type: "STEP";
    step: GuidleStep;
    stepIndex: number;
    totalSteps: number;
}
interface WSErrorMessage {
    type: "ERROR";
    message: string;
    code: string;
}
interface WSDoneMessage {
    type: "DONE";
    success: boolean;
    message?: string;
}
type WSServerMessage = WSStepMessage | WSErrorMessage | WSDoneMessage;

declare class Guidle {
    private config;
    private connection;
    private overlay;
    private widget;
    private isInitialized;
    constructor(config: GuidleConfig);
    init(): Promise<void>;
    private handleServerMessage;
    private executeStep;
    query(text: string): void;
    registerSchema(schema: any): void;
    open(): void;
    close(): void;
    clearHighlights(): void;
    destroy(): void;
}

export { type AppSchema, type DoneStep, type ElementMapping, Guidle, type GuidleConfig, type GuidleStep, type GuidleTheme, type HighlightStep, type PromptStep, type TooltipStep, type WSDoneMessage, type WSErrorMessage, type WSServerMessage, type WSStepMessage, type WaitStep, Guidle as default };
