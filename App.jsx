import { useState, useEffect, useRef } from 'react';
import { Copy, Loader2, Mic, Square } from 'lucide-react';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const GEMINI_MODEL = 'gemini-2.5-flash-preview-09-2025';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

function App() {
  const [rawText, setRawText] = useState('');
  const [displayText, setDisplayText] = useState('');
  const [polishedText, setPolishedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState('');
  const [showCopySuccess, setShowCopySuccess] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef(null);
  const rawTextRef = useRef('');

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setIsSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setError('');
      };

      recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          setRawText(prev => {
            const newText = prev + finalTranscript;
            rawTextRef.current = newText;
            setDisplayText(newText);
            return newText;
          });
        }
        
        // Update display with interim results in real-time
        if (interimTranscript) {
          setDisplayText(rawTextRef.current + finalTranscript + interimTranscript);
        } else if (finalTranscript) {
          setDisplayText(rawTextRef.current + finalTranscript);
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'no-speech') {
          setError('No speech detected. Please try again.');
        } else if (event.error === 'audio-capture') {
          setError('No microphone found. Please check your microphone settings.');
        } else if (event.error === 'not-allowed') {
          setError('Microphone permission denied. Please allow microphone access.');
        } else {
          setError(`Speech recognition error: ${event.error}`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        // Ensure displayText matches rawText when stopped
        setDisplayText(rawText);
      };

      recognitionRef.current = recognition;
    } else {
      setIsSupported(false);
      setError('Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Sync displayText with rawText when not listening and update ref
  useEffect(() => {
    rawTextRef.current = rawText;
    if (!isListening) {
      setDisplayText(rawText);
    }
  }, [rawText, isListening]);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error('Error starting recognition:', err);
        setError('Could not start voice recognition. Please try again.');
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

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

    // Stop listening if active
    if (isListening) {
      stopListening();
    }

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
          <p className="text-gray-400">Speak your thoughts, get polished prose</p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column - Voice Input */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-2xl border border-gray-700/50 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Speak Your Thoughts</h2>
            
            {/* Microphone Button */}
            <div className="flex justify-center mb-4">
              {!isListening ? (
                <button
                  onClick={startListening}
                  disabled={!isSupported || isLoading}
                  className="w-20 h-20 rounded-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white shadow-lg transition-all duration-200 flex items-center justify-center group"
                >
                  <Mic className="w-8 h-8" />
                  <span className="absolute -bottom-8 text-xs text-gray-400 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                    Click to start
                  </span>
                </button>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <button
                    onClick={stopListening}
                    className="w-20 h-20 rounded-full bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg animate-pulse flex items-center justify-center"
                  >
                    <Square className="w-6 h-6" />
                  </button>
                  <p className="text-red-400 text-sm font-semibold animate-pulse">Listening...</p>
                </div>
              )}
            </div>

            {/* Transcription Display */}
            <textarea
              value={displayText}
              onChange={(e) => {
                setRawText(e.target.value);
                setDisplayText(e.target.value);
              }}
              placeholder={isListening ? "Speak now... Your words will appear here..." : "Click the microphone to start speaking, or type here..."}
              className="w-full min-h-[300px] p-4 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y font-sans"
              readOnly={isListening}
            />
            
            {/* Action Buttons */}
            <div className="mt-4 flex gap-3 justify-center">
              <button
                onClick={handlePolish}
                disabled={!rawText.trim() || isLoading || isListening}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg shadow-lg transition-all duration-200 flex items-center gap-2 min-w-[180px] justify-center"
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
              {rawText && (
                <button
                  onClick={() => {
                    setRawText('');
                    setDisplayText('');
                  }}
                  disabled={isListening || isLoading}
                  className="px-4 py-3 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors duration-200"
                >
                  Clear
                </button>
              )}
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

