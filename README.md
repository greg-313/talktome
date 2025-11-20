# TalkToMe - AI Writing Polish Assistant

A modern Electron desktop application that transforms your spoken words into polished, professional prose using Google's Gemini AI. Speak naturally, and the app types directly into any application where your cursor is active.

## Features

- 🎤 **Voice Input**: Real-time speech-to-text transcription using Web Speech API
- ⌨️ **Direct Typing**: Types text directly into any application (email, messages, documents, etc.)
- ✨ **AI Polishing**: Automatically refines your dictated text into professional prose
- 🎨 **Modern UI**: Dark-mode, Mac-inspired interface
- ⌨️ **Global Shortcut**: Press `Cmd+Shift+T` (Mac) or `Ctrl+Shift+T` (Windows/Linux) to toggle the window
- 📋 **Auto-copy/Type**: Automatically types or copies transcribed text
- 🔄 **Auto-polish**: Optional automatic AI polishing when you stop speaking

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- A Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))

## Setup Instructions

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up your Gemini API key:**
   
   Create a `.env` file in the root directory:
   ```bash
   cp .env.example .env
   ```
   
   Then edit `.env` and add your API key:
   ```
   VITE_GEMINI_API_KEY=your_actual_api_key_here
   ```

3. **Development Mode:**
   
   Run the app in development mode:
   ```bash
   npm run electron:dev
   ```
   
   This will:
   - Start the Vite dev server
   - Launch the Electron app
   - Open DevTools for debugging

4. **Production Build:**
   
   Build the app for your platform:
   ```bash
   npm run electron:build
   ```
   
   The built application will be in the `dist-electron` directory.

## Usage

### Basic Workflow

1. **Start the app** - The app runs in the background
2. **Click the microphone** - Start speaking
3. **Your words appear** - Real-time transcription
4. **Text is typed automatically** - Goes directly into the active application where your cursor is
5. **Stop speaking** - Click the stop button (square icon)
6. **Optional: Polish** - Click "Polish with AI" to refine the text

### Global Shortcut

- **Mac**: `Cmd+Shift+T`
- **Windows/Linux**: `Ctrl+Shift+T`

Press this shortcut from anywhere to show/hide the TalkToMe window.

### Settings

- **Auto-type**: Automatically types transcribed text into the active application
- **Type directly**: Toggle between typing directly or copying to clipboard
- **Auto-polish**: Automatically polish text when you stop speaking

## How It Works

1. **Speech Recognition**: Uses the Web Speech API to convert your voice to text in real-time
2. **Text Injection**: Uses RobotJS to simulate keyboard input, typing directly into any application
3. **AI Polishing**: Sends transcribed text to Google's Gemini API for professional refinement

## Permissions

On first launch, you may need to grant:
- **Microphone access** - For voice input
- **Accessibility permissions** (macOS) - For typing into other applications
- **Input monitoring** (macOS) - May be required for keyboard simulation

## Project Structure

```
talktome/
├── electron/
│   ├── main.js       # Electron main process
│   └── preload.js    # Preload script for IPC
├── App.jsx           # Main React component
├── main.jsx          # React entry point
├── index.html        # HTML template
├── vite.config.js    # Vite configuration
└── package.json      # Dependencies and scripts
```

## Building for Distribution

The app uses `electron-builder` to create distributable packages:

- **macOS**: Creates a `.dmg` file
- **Windows**: Creates an `.exe` installer
- **Linux**: Creates an `AppImage`

Run `npm run electron:build` to build for your current platform.

## Technologies Used

- **Electron** - Desktop app framework
- **React** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **RobotJS** - Keyboard simulation
- **Web Speech API** - Speech recognition
- **Google Gemini API** - AI text generation

## Troubleshooting

### Text not typing into applications

- **macOS**: Grant Accessibility permissions in System Settings > Privacy & Security > Accessibility
- **Windows**: Run as Administrator if needed
- Check that the target application accepts keyboard input

### Microphone not working

- Grant microphone permissions in your system settings
- Check that your microphone is connected and working
- Try refreshing the app

### Speech recognition errors

- Use Chrome/Edge for best compatibility
- Ensure you have an internet connection (Web Speech API may require it)
- Check browser console for detailed error messages

## License

MIT
