# Time Tracker

A beautiful Chrome extension that tracks your time spent across all websites. Built with React, TypeScript, and Tailwind CSS.

<img width="1861" height="958" alt="image" src="https://github.com/user-attachments/assets/ad3c1a00-2b6b-4094-870e-80953db9feb1" />


## Features

- *Real-time Tracking** - Automatically tracks time spent on every website
- **Daily Focus Score** - See your total active time at a glance
- **Visual Analytics** - Beautiful charts showing your browsing distribution
- **Dark Mode** - Easy on the eyes with a stunning dark theme
- **Lightweight** - Minimal resource usage with event-driven architecture
- **Privacy First** - All data stored locally, never sent to any server

## Installation

### From Source (Development)

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/time-tracker-extension.git
   cd time-tracker-extension
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Build the extension:

   ```bash
   npm run build
   ```

4. Load in Chrome:
   - Open `chrome://extensions`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder

### From Chrome Web Store

Coming soon!

## Usage

1. **Popup Widget** - Click the extension icon to see your daily focus score and top sites
2. **Full Dashboard** - Click "Full Dashboard" for detailed analytics with charts
3. **Time Ranges** - View data for Today, Week, Month, or All Time

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Vite** - Build tool
- **Recharts** - Data visualization
- **Lucide React** - Icons

## Development

```bash
# Start development server (for testing popup/dashboard in browser)
npm run dev

# Run linting
npm run lint

# Build for production
npm run build
```

## How It Works

The extension uses Chrome's Manifest V3 with a service worker that:

1. **Listens for events** - Tab switches, navigation, window focus changes
2. **Stores state in `chrome.storage`** - Persists across service worker restarts
3. **Calculates time on each event** - `duration = now - startTime`
4. **Aggregates by domain** - Groups time by website hostname

## Privacy

- All data is stored locally in your browser using `chrome.storage.local`
- No data is ever sent to external servers
- No analytics or tracking of any kind

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT License - see [LICENSE](LICENSE) for details.
