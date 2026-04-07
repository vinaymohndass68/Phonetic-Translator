import React, { useState, useCallback } from 'react';
import { Language, TranslationResult } from './types';
import { generatePhoneticTranslations } from './services/geminiService';
import LanguageSelector from './components/LanguageSelector';
import ResultCard from './components/ResultCard';
import { LoadingSpinner, CopyIcon, CheckIcon } from './components/icons';
import { PLACEHOLDER_TEXT } from './constants';

const App: React.FC = () => {
  const [inputText, setInputText] = useState<string>('');
  const [inputLanguage, setInputLanguage] = useState<Language>(Language.HINDI);
  const [results, setResults] = useState<TranslationResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isInputCopied, setIsInputCopied] = useState<boolean>(false);
  const [isInputShaking, setIsInputShaking] = useState<boolean>(false);

  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    if (!inputText.trim()) {
      setError('Please enter a sentence.');
      setIsInputShaking(true);
      setTimeout(() => setIsInputShaking(false), 500); // Reset after animation duration
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults([]);

    try {
      const translations = await generatePhoneticTranslations(inputText, inputLanguage);
      setResults(translations);
    } catch (err) {
        if (err instanceof Error) {
            setError(err.message);
        } else {
            setError('An unexpected error occurred.');
        }
    } finally {
      setIsLoading(false);
    }
  }, [inputText, inputLanguage]);

  const handleCopyInput = useCallback(() => {
    if (!inputText.trim()) return;
    navigator.clipboard.writeText(inputText);
    setIsInputCopied(true);
    setTimeout(() => setIsInputCopied(false), 2000);
  }, [inputText]);


  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-500 to-teal-400">
            Phonetic Translator
          </h1>
          <p className="mt-2 text-lg text-gray-400">
            Find sentences in other languages that sound like yours.
          </p>
        </header>

        <main>
          <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl shadow-2xl border border-gray-700">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="input-sentence" className="block text-sm font-medium text-gray-300 mb-1">
                  Your Sentence
                </label>
                <div className="relative">
                  <textarea
                    id="input-sentence"
                    rows={3}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={PLACEHOLDER_TEXT[inputLanguage]}
                    className={`w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-white p-2 pr-12 resize-none transition-all ${isInputShaking ? 'shake-animation' : ''}`}
                  />
                   <button
                    type="button"
                    onClick={handleCopyInput}
                    disabled={!inputText.trim()}
                    className="absolute top-2 right-2 p-2 rounded-full text-gray-400 hover:bg-gray-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-700 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                    aria-label="Copy input sentence"
                  >
                    {isInputCopied ? <CheckIcon className="w-5 h-5 text-green-400" /> : <CopyIcon className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="input-language" className="block text-sm font-medium text-gray-300 mb-1">
                  Source Language
                </label>
                <LanguageSelector
                  id="input-language"
                  selectedLanguage={inputLanguage}
                  onLanguageChange={setInputLanguage}
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center gap-2 px-4 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner />
                    <span>Deeply Analyzing Phonetics...</span>
                  </>
                ) : (
                  'Generate Phonetic Magic'
                )}
              </button>
            </form>
          </div>

          {error && (
            <div className="mt-6 p-4 bg-red-900/50 border border-red-700 text-red-300 rounded-lg text-center">
              <p><strong>Error:</strong> {error}</p>
            </div>
          )}

          {results.length > 0 && (
            <div className="mt-8">
              <h2 className="text-2xl font-bold mb-4 text-center text-gray-300">Results</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.map((result) => (
                  <ResultCard key={result.language} result={result} />
                ))}
              </div>
            </div>
          )}
        </main>

        <footer className="text-center mt-12 text-gray-500 text-sm">
          <p>Powered by Gemini 3.0 Pro Preview</p>
        </footer>
      </div>
    </div>
  );
};

export default App;