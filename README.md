# AI Writing Polish Assistant

A modern React application that transforms raw, dictated text into polished, professional prose using Google's Gemini AI.

## Features

- 🎨 Modern dark-mode, Mac-inspired UI
- ⚡️ Instant text polishing with Gemini AI
- 📋 One-click copy to clipboard
- 🔄 Automatic retry with exponential backoff
- 📱 Fully responsive design

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

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   
   Navigate to the URL shown in the terminal (usually `http://localhost:5173`)

## Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Project Structure

```
talktome/
├── App.jsx          # Main React component
├── main.jsx         # React entry point
├── index.html       # HTML template
├── index.css        # Tailwind CSS imports
├── vite.config.js   # Vite configuration
├── tailwind.config.js # Tailwind CSS configuration
├── postcss.config.js  # PostCSS configuration
├── package.json     # Dependencies
└── .env             # Environment variables (create this)
```

## Usage

1. Paste your raw, dictated text into the left panel
2. Click "⚡️ Polish with AI" to transform the text
3. Review the polished version in the right panel
4. Click "Copy" to copy the polished text to your clipboard

## Technologies Used

- **React** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **Google Gemini API** - AI text generation

## License

MIT

