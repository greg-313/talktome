import { useState } from 'react';
import { Copy, Loader2 } from 'lucide-react';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const GEMINI_MODEL = 'gemini-2.5-flash-preview-09-2025';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

function App() {
  const [rawText, setRawText] = useState('');
  const [polishedText, setPolishedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCopySuccess, setShowCopySuccess] = useState(false);

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const fetchWithRetry = async (url, options, maxRetries = 3, baseDelay = 1000) => {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch(url, options);
        
        if (response.ok) {
          return response;
        }
        
        // Don't retry on client errors (4xx)
        if (response.status >= 400 && response.status < 500) {
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        
        // Retry on server errors (5xx) or network errors
        if (attempt < maxRetries - 1) {
          const delay = baseDelay * Math.pow(2, attempt);
          await sleep(delay);
          continue;
        }
        
        throw new Error(`Request failed after ${maxRetries} attempts: ${response.status} ${response.statusText}`);
      } catch (err) {
        if (attempt < maxRetries - 1) {
          const delay = baseDelay * Math.pow(2, attempt);
          await sleep(delay);
          continue;
        }
        throw err;
      }
    }
  };

  const handlePolish = async () => {
    if (!rawText.trim()) return;

    setIsLoading(true);
    setError('');
    setPolishedText('');

    try {
      const response = await fetchWithRetry(
        GEMINI_API_URL,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              role: 'user',
              parts: [{ text: rawText }]
            }],
            systemInstruction: {
              parts: [{ text: 'You are a world-class professional copy editor and writing assistant. Your task is to take the provided raw, unpolished text, which was likely dictated, and refine it into professional, clear, and grammatically perfect prose. Do not add any commentary or explain the changes; only return the polished text itself.' }]
            }
          }),
        }
      );

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message || 'API returned an error');
      }

      const polished = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      if (!polished) {
        throw new Error('No text was generated. Please try again.');
      }

      setPolishedText(polished);
    } catch (err) {
      setError(err.message || 'An error occurred while polishing your text. Please try again.');
      console.error('Error polishing text:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!polishedText.trim()) return;

    try {
      await navigator.clipboard.writeText(polishedText);
      setShowCopySuccess(true);
      setTimeout(() => setShowCopySuccess(false), 2000);
    } catch (err) {
      setError('Failed to copy to clipboard. Please try again.');
      console.error('Error copying to clipboard:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">AI Writing Polish Assistant</h1>
          <p className="text-gray-400">Transform raw dictation into polished prose</p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column - Input */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-2xl border border-gray-700/50 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Raw Dictation Input</h2>
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste your raw, dictated text here..."
              className="w-full min-h-[400px] p-4 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y font-sans"
            />
            <div className="mt-4 flex justify-center">
              <button
                onClick={handlePolish}
                disabled={!rawText.trim() || isLoading}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg shadow-lg transition-all duration-200 flex items-center gap-2 min-w-[200px] justify-center"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Polishing...</span>
                  </>
                ) : (
                  <>
                    <span>⚡️</span>
                    <span>Polish with AI</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column - Output */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-2xl border border-gray-700/50 p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Polished Final Draft</h2>
              <button
                onClick={copyToClipboard}
                disabled={!polishedText.trim()}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 text-white rounded-lg transition-colors duration-200 flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                <span>Copy</span>
              </button>
            </div>
            <div className="flex-1 min-h-[400px] p-4 bg-gray-900/50 border border-gray-700 rounded-lg text-white overflow-y-auto whitespace-pre-wrap font-sans">
              {polishedText || (
                <span className="text-gray-500 italic">
                  Your polished text will appear here...
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-6 p-4 bg-red-900/30 border border-red-700/50 rounded-lg text-red-200">
            <p className="font-semibold">Error:</p>
            <p>{error}</p>
          </div>
        )}

        {/* Copy Success Toast */}
        {showCopySuccess && (
          <div className="fixed bottom-8 right-8 bg-green-600 text-white px-6 py-3 rounded-lg shadow-xl flex items-center gap-2 z-50 transition-all duration-300 ease-in-out">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-semibold">Copied to clipboard!</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

