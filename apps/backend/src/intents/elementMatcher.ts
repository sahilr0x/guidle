import { AppSchema, ElementMapping } from "./types";

// Default element mappings for common UI patterns
const DEFAULT_MAPPINGS: ElementMapping[] = [
  {
    patterns: ["settings", "setting", "preferences", "config", "configuration", "options"],
    selectors: [
      "[data-guidle='settings']",
      "#settings",
      "#settings-btn",
      "[aria-label*='settings' i]",
      "[aria-label*='Settings' i]",
      "a[href*='settings']",
      "button:has(svg[class*='gear'])",
      "[class*='settings']",
      "[class*='Settings']"
    ],
    description: "Settings and preferences",
    category: "settings"
  },
  {
    patterns: ["profile", "account", "my account", "user", "my profile"],
    selectors: [
      "[data-guidle='profile']",
      "#profile",
      "#profile-btn",
      "[aria-label*='profile' i]",
      "[aria-label*='account' i]",
      "a[href*='profile']",
      "a[href*='account']",
      "[class*='profile']",
      "[class*='avatar']"
    ],
    description: "User profile and account",
    category: "profile"
  },
  {
    patterns: ["home", "dashboard", "main", "start"],
    selectors: [
      "[data-guidle='home']",
      "#home",
      "a[href='/']",
      "a[href='/home']",
      "a[href='/dashboard']",
      "[aria-label*='home' i]",
      "[class*='home']",
      "[class*='dashboard']"
    ],
    description: "Home or dashboard",
    category: "navigation"
  },
  {
    patterns: ["menu", "navigation", "nav", "sidebar"],
    selectors: [
      "[data-guidle='menu']",
      "#menu",
      "nav",
      "[role='navigation']",
      "[class*='sidebar']",
      "[class*='nav']",
      "[aria-label*='menu' i]"
    ],
    description: "Navigation menu",
    category: "navigation"
  },
  {
    patterns: ["search", "find", "lookup"],
    selectors: [
      "[data-guidle='search']",
      "#search",
      "input[type='search']",
      "[aria-label*='search' i]",
      "[placeholder*='search' i]",
      "[class*='search']"
    ],
    description: "Search functionality",
    category: "search"
  },
  {
    patterns: ["notifications", "alerts", "bell", "inbox"],
    selectors: [
      "[data-guidle='notifications']",
      "#notifications",
      "[aria-label*='notification' i]",
      "[class*='notification']",
      "[class*='bell']",
      "[class*='inbox']"
    ],
    description: "Notifications",
    category: "notifications"
  },
  {
    patterns: ["help", "support", "faq", "documentation", "docs"],
    selectors: [
      "[data-guidle='help']",
      "#help",
      "[aria-label*='help' i]",
      "a[href*='help']",
      "a[href*='support']",
      "a[href*='docs']",
      "[class*='help']"
    ],
    description: "Help and support",
    category: "help"
  },
  {
    patterns: ["logout", "log out", "sign out", "signout", "exit"],
    selectors: [
      "[data-guidle='logout']",
      "#logout",
      "[aria-label*='logout' i]",
      "[aria-label*='sign out' i]",
      "a[href*='logout']",
      "button:contains('Logout')",
      "[class*='logout']"
    ],
    description: "Logout",
    category: "auth"
  },
  {
    patterns: ["login", "log in", "sign in", "signin"],
    selectors: [
      "[data-guidle='login']",
      "#login",
      "[aria-label*='login' i]",
      "[aria-label*='sign in' i]",
      "a[href*='login']",
      "[class*='login']"
    ],
    description: "Login",
    category: "auth"
  },
  {
    patterns: ["name", "full name", "display name", "username"],
    selectors: [
      "[data-guidle='name']",
      "#name",
      "#name-input",
      "input[name='name']",
      "input[name='fullName']",
      "input[name='displayName']",
      "input[placeholder*='name' i]"
    ],
    description: "Name input field",
    category: "form"
  },
  {
    patterns: ["email", "email address"],
    selectors: [
      "[data-guidle='email']",
      "#email",
      "input[type='email']",
      "input[name='email']",
      "input[placeholder*='email' i]"
    ],
    description: "Email input field",
    category: "form"
  },
  {
    patterns: ["password", "passcode"],
    selectors: [
      "[data-guidle='password']",
      "#password",
      "input[type='password']",
      "input[name='password']"
    ],
    description: "Password field",
    category: "form"
  },
  {
    patterns: ["submit", "save", "confirm", "done", "apply"],
    selectors: [
      "[data-guidle='submit']",
      "button[type='submit']",
      "input[type='submit']",
      "button:contains('Save')",
      "button:contains('Submit')",
      "button:contains('Confirm')",
      "[class*='submit']",
      "[class*='save']"
    ],
    description: "Submit/Save button",
    category: "action"
  },
  {
    patterns: ["cancel", "close", "dismiss", "back"],
    selectors: [
      "[data-guidle='cancel']",
      "button:contains('Cancel')",
      "button:contains('Close')",
      "[aria-label*='close' i]",
      "[class*='close']",
      "[class*='cancel']"
    ],
    description: "Cancel/Close button",
    category: "action"
  }
];

// In-memory storage for app schemas (in production, use a database)
const appSchemas: Map<string, AppSchema> = new Map();

export function registerAppSchema(schema: AppSchema): void {
  appSchemas.set(schema.appId, schema);
}

export function getAppSchema(appId: string): AppSchema | undefined {
  return appSchemas.get(appId);
}

export function findMatchingElements(
  target: string, 
  appId?: string
): { selectors: string[]; description: string; confidence: number } {
  const targetLower = target.toLowerCase().trim();
  
  // First check app-specific schema if available
  if (appId) {
    const appSchema = appSchemas.get(appId);
    if (appSchema) {
      for (const mapping of appSchema.elements) {
        for (const pattern of mapping.patterns) {
          if (targetLower.includes(pattern) || pattern.includes(targetLower)) {
            return {
              selectors: mapping.selectors,
              description: mapping.description,
              confidence: 0.9
            };
          }
        }
      }
    }
  }
  
  // Fall back to default mappings
  let bestMatch: ElementMapping | null = null;
  let bestScore = 0;
  
  for (const mapping of DEFAULT_MAPPINGS) {
    for (const pattern of mapping.patterns) {
      // Exact match
      if (targetLower === pattern) {
        return {
          selectors: mapping.selectors,
          description: mapping.description,
          confidence: 1.0
        };
      }
      
      // Partial match scoring
      if (targetLower.includes(pattern)) {
        const score = pattern.length / targetLower.length;
        if (score > bestScore) {
          bestScore = score;
          bestMatch = mapping;
        }
      } else if (pattern.includes(targetLower)) {
        const score = targetLower.length / pattern.length;
        if (score > bestScore) {
          bestScore = score;
          bestMatch = mapping;
        }
      }
    }
  }
  
  if (bestMatch && bestScore > 0.3) {
    return {
      selectors: bestMatch.selectors,
      description: bestMatch.description,
      confidence: bestScore
    };
  }
  
  // No match found - return generic selector based on target
  return {
    selectors: [
      `[data-guidle='${targetLower}']`,
      `#${targetLower}`,
      `[aria-label*='${target}' i]`,
      `[class*='${targetLower}']`,
      `button:contains('${target}')`,
      `a:contains('${target}')`
    ],
    description: `Element matching "${target}"`,
    confidence: 0.3
  };
}
