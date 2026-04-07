import React, { useState, useCallback, useRef } from 'react';
import { TranslationResult } from '../types';
import { generateSpeech, generatePronunciationGuide } from '../services/geminiService';
import { CopyIcon, CheckIcon, PlayIcon, SpeakerWaveIcon, LoadingSpinner, SpeechBubbleIcon } from './icons';

// Audio decoding utilities for raw PCM data from Gemini API
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  // The raw data is 16-bit PCM, so we need to interpret it as Int16Array
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      // Normalize the 16-bit signed integer to a float between -1.0 and 1.0
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}


type AudioState = 'idle' | 'loading' | 'playing';

interface ResultCardProps {
  result: TranslationResult;
}

const ResultCard: React.FC<ResultCardProps> = ({ result }) => {
  const [isCopied, setIsCopied] = useState(false);
  const [audioState, setAudioState] = useState<AudioState>('idle');
  const [audioError, setAudioError] = useState<string | null>(null);

  const [isGuideVisible, setIsGuideVisible] = useState(false);
  const [guideText, setGuideText] = useState<string | null>(null);
  const [guideState, setGuideState] = useState<'idle' | 'loading' | 'error'>('idle');
  const [guideError, setGuideError] = useState<string | null>(null);

  const [guideAudioState, setGuideAudioState] = useState<AudioState>('idle');
  const [guideAudioError, setGuideAudioError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const guideAudioSourceRef = useRef<AudioBufferSourceNode | null>(null);


  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(result.sentence);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  }, [result.sentence]);

  const handlePlayAudio = useCallback(async () => {
    if (audioState === 'loading' || audioState === 'playing') {
      return;
    }
    setAudioState('loading');
    setAudioError(null);

    // Stop guide audio if it's playing
    if (guideAudioSourceRef.current) {
        guideAudioSourceRef.current.stop();
        guideAudioSourceRef.current = null;
    }
    setGuideAudioState('idle');


    try {
      if (!audioContextRef.current) {
        // Gemini TTS returns audio at a 24kHz sample rate
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      const audioContext = audioContextRef.current;

      const base64Audio = await generateSpeech(result.sentence);
      const audioBytes = decode(base64Audio);
      
      // Gemini TTS returns mono audio (1 channel)
      const audioBuffer = await decodeAudioData(audioBytes, audioContext, 24000, 1);
      
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      
      source.onended = () => {
        setAudioState('idle');
        audioSourceRef.current = null;
      };

      source.start();
      audioSourceRef.current = source;
      setAudioState('playing');

    } catch (err) {
      console.error("Failed to play audio:", err);
      if (err instanceof Error) {
        setAudioError(err.message);
      } else {
        setAudioError("An unknown error occurred.");
      }
      setAudioState('idle');
    }
  }, [result.sentence, audioState]);

  const handleToggleGuide = useCallback(async () => {
    if (isGuideVisible) {
      setIsGuideVisible(false);
      return;
    }

    setIsGuideVisible(true);
    if (guideText === null) {
      setGuideState('loading');
      setGuideError(null);
      try {
        const guide = await generatePronunciationGuide(result.sentence, result.language);
        setGuideText(guide);
        setGuideState('idle');
      } catch (err) {
        console.error("Failed to fetch pronunciation guide:", err);
        if (err instanceof Error) {
            setGuideError(err.message);
        } else {
            setGuideError("An unknown error occurred.");
        }
        setGuideState('error');
      }
    }
  }, [isGuideVisible, guideText, result.sentence, result.language]);
  
  const handlePlayGuideAudio = useCallback(async () => {
    if (guideAudioState !== 'idle' || !guideText) {
      return;
    }
    setGuideAudioState('loading');
    setGuideAudioError(null);

    // Stop main audio if it's playing
    if (audioSourceRef.current) {
        audioSourceRef.current.stop();
        audioSourceRef.current = null;
    }
    setAudioState('idle');

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      const audioContext = audioContextRef.current;
      
      const speechPrompt = `Say this pronunciation guide slowly and clearly, emphasizing each syllable: "${guideText}"`;

      const base64Audio = await generateSpeech(speechPrompt);
      const audioBytes = decode(base64Audio);
      const audioBuffer = await decodeAudioData(audioBytes, audioContext, 24000, 1);
      
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      
      source.onended = () => {
        setGuideAudioState('idle');
        guideAudioSourceRef.current = null;
      };

      source.start();
      guideAudioSourceRef.current = source;
      setGuideAudioState('playing');

    } catch (err) {
      console.error("Failed to play guide audio:", err);
      if (err instanceof Error) {
        setGuideAudioError(err.message);
      } else {
        setGuideAudioError("An unknown error occurred.");
      }
      setGuideAudioState('idle');
    }
  }, [guideText, guideAudioState]);


  const renderAudioButtonIcon = () => {
    switch (audioState) {
      case 'loading':
        return <LoadingSpinner />;
      case 'playing':
        return <SpeakerWaveIcon className="w-5 h-5" />;
      case 'idle':
      default:
        return <PlayIcon className="w-5 h-5" />;
    }
  };

  const renderGuideAudioButtonIcon = () => {
    switch (guideAudioState) {
      case 'loading':
        return <LoadingSpinner />;
      case 'playing':
        return <SpeakerWaveIcon className="w-5 h-5" />;
      case 'idle':
      default:
        return <PlayIcon className="w-5 h-5" />;
    }
  };

  return (
    <div className="bg-gray-800/70 backdrop-blur-sm rounded-lg shadow-lg border border-gray-700 p-4 flex flex-col justify-between h-full transition-all hover:border-indigo-500/50 hover:shadow-indigo-500/10">
      <div>
        <h3 className="text-lg font-bold text-indigo-400">{result.language}</h3>
        <p className="mt-2 text-gray-300 text-lg break-words">{result.sentence}</p>
        {audioError && <p className="mt-2 text-xs text-red-400">Audio Error: {audioError}</p>}
        {isGuideVisible && (
            <div className="mt-3 pt-3 border-t border-gray-700/50">
                {guideState === 'loading' && (
                    <div className="flex items-center justify-center p-2 text-gray-400 text-sm gap-2">
                        <LoadingSpinner />
                        <span>Generating guide...</span>
                    </div>
                )}
                {guideState === 'error' && (
                    <p className="text-xs text-red-400 p-2">Error fetching guide: {guideError}</p>
                )}
                {guideState === 'idle' && guideText && (
                    <div className="p-2 bg-gray-900/50 rounded-md">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-indigo-300 italic font-mono tracking-wide">{guideText}</p>
                            <button
                                onClick={handlePlayGuideAudio}
                                disabled={guideAudioState !== 'idle'}
                                className="p-2 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-wait"
                                aria-label="Play pronunciation guide"
                            >
                                {renderGuideAudioButtonIcon()}
                            </button>
                        </div>
                        {guideAudioError && <p className="mt-1 text-xs text-red-400">Audio Error: {guideAudioError}</p>}
                    </div>
                )}
            </div>
        )}
      </div>
      <div className="mt-4 pt-4 border-t border-gray-700 flex justify-end items-center gap-2">
         <button
            onClick={handleToggleGuide}
            className="p-2 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500"
            aria-label="Show pronunciation guide"
            aria-expanded={isGuideVisible}
         >
            {guideState === 'loading' ? <LoadingSpinner /> : <SpeechBubbleIcon className="w-5 h-5" />}
         </button>
         <button
            onClick={handlePlayAudio}
            disabled={audioState === 'loading'}
            className="p-2 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-wait"
            aria-label={`Play sentence for ${result.language}`}
         >
            {renderAudioButtonIcon()}
         </button>
        <button
          onClick={handleCopy}
          className="p-2 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500"
          aria-label="Copy sentence"
        >
          {isCopied ? <CheckIcon className="w-5 h-5 text-green-400" /> : <CopyIcon className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
};

export default ResultCard;