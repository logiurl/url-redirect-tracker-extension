# 🔍 URL Redirect Tracker

A powerful Chrome extension that tracks all URL redirects and navigation events in real-time, including script-based redirects, server redirects, and history state changes.

## ✨ Features

- **Real-time Tracking**: Monitor all URL changes as they happen
- **Comprehensive Coverage**: Tracks:
  - Server-side redirects (301, 302, etc.)
  - JavaScript-based navigation (pushState, replaceState)
  - Fragment/hash changes
  - All navigation events
- **Live Popup**: Stays open during redirects to show logs in real-time
- **Export Options**: 
  - Copy logs to clipboard
  - Export as JSON file
- **Filter Logs**: Search through logs by URL or event type
- **Session Timer**: Track how long you've been monitoring
- **Beautiful UI**: Modern, gradient-based design with smooth animations

## 📦 Installation

### Load Unpacked Extension (Developer Mode)

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right corner)
3. Click **Load unpacked**
4. Select the folder containing this extension (`c:\Users\beapr\Downloads\codes\mytume\ss`)
5. The extension icon will appear in your toolbar

## 🚀 Usage

1. **Enable Tracking**: Click the extension icon and toggle the switch to ON
2. **Browse**: Navigate to any website - the extension will track all redirects
3. **View Logs**: The popup shows real-time logs of all URL changes
4. **Filter**: Use the search box to filter logs by URL or event type
5. **Export**: 
   - Click **Copy** to copy all logs to clipboard
   - Click **Export JSON** to download logs as a JSON file
6. **Clear**: Click **Clear** to remove all logs

## 📊 Log Types

The extension tracks different types of navigation events:

- **Navigation Start**: Initial navigation request
- **Navigation Committed**: Navigation has been committed
- **Server Redirect**: HTTP redirect (301, 302, 307, 308)
- **History State Updated (Script)**: JavaScript pushState/replaceState
- **Fragment Updated**: Hash/fragment changes
- **Request Completed**: Final request completion

## 🎨 Color Coding

Logs are color-coded for easy identification:
- 🟦 **Blue**: Navigation events
- 🟧 **Orange**: Server redirects
- 🟪 **Purple**: Script-based changes
- 🟩 **Green**: Completed requests

## 🔧 Technical Details

### Files Structure

```
├── manifest.json       # Extension configuration
├── background.js       # Service worker for tracking
├── popup.html         # Popup interface
├── popup.css          # Styling
├── popup.js           # Popup logic
├── icon16.png         # 16x16 icon
├── icon48.png         # 48x48 icon
└── icon128.png        # 128x128 icon
```

### Permissions Used

- `webNavigation`: Track navigation events
- `webRequest`: Monitor HTTP requests and redirects
- `tabs`: Access tab information
- `storage`: Persist tracking state and logs
- `activeTab`: Access current tab
- `<all_urls>`: Track redirects on all websites

## 💡 Tips

- The popup stays open during redirects, so you can watch the logs update in real-time
- Logs are limited to 1000 entries to prevent memory issues
- Session timer shows how long tracking has been active
- Badge shows "ON" when tracking is enabled
- Logs are automatically cleared when tracking is disabled

## 🐛 Troubleshooting

**Extension not tracking?**
- Make sure the toggle is ON (green)
- Check that the badge shows "ON"
- Reload the extension from `chrome://extensions/`

**Popup closes during redirect?**
- This extension is specifically designed to keep the popup open during redirects
- If it closes, try reloading the extension

**Too many logs?**
- Use the filter to narrow down results
- Clear logs periodically
- Disable tracking when not needed

## 📝 License

Free to use and modify.

## 🙏 Credits

Created with ❤️ for tracking web redirects and understanding navigation flows.
