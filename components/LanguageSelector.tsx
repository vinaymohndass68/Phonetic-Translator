import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Language } from '../types';
import { LANGUAGES, LANGUAGE_EXAMPLES } from '../constants';
import { InfoIcon, ChevronDownIcon } from './icons';

const InfoTooltip: React.FC<{ language: Language; isVisible: boolean }> = ({ language, isVisible }) => {
    if (!isVisible) return null;

    return (
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 w-64 z-20 p-3 bg-gray-900 border border-gray-600 rounded-lg shadow-xl text-sm text-gray-300 pointer-events-none">
            <h4 className="font-bold text-white mb-2">{language} Examples:</h4>
            <ul className="list-disc list-inside space-y-1">
                {LANGUAGE_EXAMPLES[language].map((example, index) => (
                    <li key={index} className="text-xs">{example}</li>
                ))}
            </ul>
        </div>
    );
};

const LanguageOption: React.FC<{ 
    language: Language; 
    onClick: () => void;
}> = ({ language, onClick }) => {
    const [isTooltipVisible, setIsTooltipVisible] = useState(false);
    const timeoutRef = useRef<number | null>(null);

    const handleMouseEnter = useCallback(() => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
        setIsTooltipVisible(true);
    }, []);

    const handleMouseLeave = useCallback(() => {
        timeoutRef.current = window.setTimeout(() => {
            setIsTooltipVisible(false);
        }, 200);
    }, []);

    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    return (
        <li className="relative group text-gray-200" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
             <button
                onClick={onClick}
                className="flex items-center justify-between w-full px-4 py-2 text-left hover:bg-indigo-600 rounded-md focus:outline-none focus:bg-indigo-600"
                role="option"
            >
                <span>{language}</span>
                <div className="p-1 text-gray-400 group-hover:text-white">
                    <InfoIcon className="w-5 h-5" />
                </div>
            </button>
            <InfoTooltip language={language} isVisible={isTooltipVisible} />
        </li>
    );
};

interface LanguageSelectorProps {
  selectedLanguage: Language;
  onLanguageChange: (language: Language) => void;
  id: string;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ selectedLanguage, onLanguageChange, id }) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const handleLanguageSelect = (language: Language) => {
        onLanguageChange(language);
        setIsOpen(false);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <div ref={wrapperRef} className="relative">
            <button
                type="button"
                id={id}
                onClick={() => setIsOpen(!isOpen)}
                className="w-full pl-3 pr-10 py-2 text-base bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-white flex items-center justify-between"
                aria-haspopup="listbox"
                aria-expanded={isOpen}
            >
                <span>{selectedLanguage}</span>
                <span className="pointer-events-none inset-y-0 right-0 flex items-center">
                    <ChevronDownIcon className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </span>
            </button>

            {isOpen && (
                 <div className="absolute z-10 mt-1 w-full bg-gray-800 border border-gray-600 shadow-lg rounded-md p-1 animate-fade-in-down">
                    <ul role="listbox" aria-labelledby={id}>
                        {LANGUAGES.map((lang) => (
                           <LanguageOption 
                                key={lang} 
                                language={lang} 
                                onClick={() => handleLanguageSelect(lang)} 
                           />
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default LanguageSelector;
