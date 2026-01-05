# Guidle

AI-powered UI guidance overlay that helps users navigate applications with natural language commands.

## Features

- 🎯 **Natural Language Navigation** - Say "go to settings" and it highlights all settings buttons
- 🔊 **Voice Support** - Built-in speech recognition for voice commands
- 🎨 **Beautiful Overlay** - Smooth animations and pulsing highlights
- 📦 **Easy Integration** - Just add `<guidle>` tag to your app
- 🔌 **Custom Schemas** - Define your own element mappings
- ⌨️ **Keyboard Shortcuts** - Quick access with hotkeys

## Project Structure

```
guidle/
├── apps/
│   ├── backend/          # WebSocket server for intent processing
│   │   └── src/
│   │       ├── intents/  # Intent parsing & element matching
│   │       ├── planner/  # Step planning for guidance
│   │       ├── protocol/ # WebSocket message types
│   │       └── ws/       # WebSocket session handling
│   └── demo-app/         # Demo application
├── packages/
│   └── sdk/              # @guidle/sdk - Client SDK
│       └── src/
│           ├── connection.ts  # WebSocket connection
│           ├── overlay.ts     # Highlight overlay
│           ├── widget.ts      # Chat widget UI
│           └── guidle.ts      # Main Guidle class
└── package.json          # Monorepo workspace config
```

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Start the Backend

```bash
cd apps/backend
npm run dev
```

### 3. Start the Demo App

```bash
cd apps/demo-app
npm run dev
```

### 4. Open the Demo

Visit `http://localhost:5173` and try saying:
- "Go to settings"
- "Show my profile"
- "Where are notifications?"

## SDK Usage

### Using the Custom Element (Recommended)

```html
<guidle 
  server="ws://localhost:3000" 
  app-id="my-app"
  position="bottom-right"
  voice="true"
  hotkey="k"
></guidle>
```

### Using JavaScript

```javascript
import { Guidle } from '@guidle/sdk';

const guidle = new Guidle({
  serverUrl: 'ws://localhost:3000',
  appId: 'my-app',
  position: 'bottom-right',
  voiceEnabled: true,
  hotkey: 'k',
  theme: {
    primaryColor: '#3B82F6',
    highlightColor: '#3B82F6'
  }
});

await guidle.init();
```

## Custom Element Attributes

| Attribute | Description | Default |
|-----------|-------------|---------|
| `server` | WebSocket server URL | `ws://localhost:3000` |
| `app-id` | Unique app identifier | - |
| `position` | Widget position (`bottom-right`, `bottom-left`, `top-right`, `top-left`) | `bottom-right` |
| `voice` | Enable voice input | `true` |
| `hotkey` | Keyboard shortcut key (with Cmd/Ctrl) | - |
| `theme` | JSON theme configuration | - |

## Custom Element Mappings

Mark your elements with `data-guidle` attributes for better matching:

```html
<button data-guidle="settings">Settings</button>
<a href="/profile" data-guidle="profile">Profile</a>
```

Or register a custom schema:

```javascript
const guidleElement = document.querySelector('guidle');
guidleElement.registerSchema({
  appId: 'my-app',
  elements: [
    {
      patterns: ['settings', 'preferences', 'config'],
      selectors: ['#my-settings-btn', '.settings-icon'],
      description: 'App Settings',
      category: 'settings'
    }
  ]
});
```

## Supported Commands

The system understands various natural language patterns:

- **Navigation**: "go to", "navigate to", "open", "take me to", "show me"
- **Location**: "find", "where is", "how do i get to"
- **Interaction**: "click", "press", "tap", "select"
- **Explanation**: "what is", "explain", "help me understand"

## Built-in Element Mappings

The SDK includes default mappings for common UI patterns:

- Settings / Preferences
- Profile / Account
- Home / Dashboard
- Navigation / Menu
- Search
- Notifications
- Help / Support
- Login / Logout
- Form fields (name, email, password)
- Action buttons (save, cancel, submit)

## License

MIT
