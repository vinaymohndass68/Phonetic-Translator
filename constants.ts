import { Language } from './types';

export const LANGUAGES: Language[] = [
  Language.ENGLISH,
  Language.HINDI,
  Language.TAMIL,
  Language.TELUGU,
];

export const PLACEHOLDER_TEXT: Record<Language, string> = {
  [Language.ENGLISH]: "e.g., All is well",
  [Language.HINDI]: "e.g., दरवाज़ा खोल दे",
  [Language.TAMIL]: "e.g., தம்பி இங்கே வா",
  [Language.TELUGU]: "e.g., ఇక్కడ రండి",
};

export const LANGUAGE_EXAMPLES: Record<Language, string[]> = {
    [Language.ENGLISH]: [
        '"All is well" can sound like "ஆல் இஸ் வெல்" in Tamil.',
        '"My knee, howdy!" can sound like "मैने खाई" in Hindi.',
        '"I won\'t hurt you" can sound like "I want to hug you."',
    ],
    [Language.HINDI]: [
        '"दरवाज़ा खोल दे" can sound like "There was a cold day" in English.',
        '"एक गरम चाय की प्याली हो" can sound like "A grey rum child keep ya lying low" in English.',
        '"आमिर खान" can sound like "Ah, mere con" in English.'
    ],
    [Language.TAMIL]: [
        '"தம்பி இங்கே வா" (Thambi inge vaa) can sound like "Thumb, key, wire" in English.',
        '"நான் வரேன்" (Naan varēn) can sound like "None were in" in English.',
        '"அம்மா இங்கே வா" (Amma inge vaa) can sound like "Come on, in gay bar" in English.'
    ],
    [Language.TELUGU]: [
        '"ఇక్కడ రండి" (Ikkada randi) can sound like "A cutter and tea" in English.',
        '"నేను వస్తున్నాను" (Nenu vastunnanu) can sound like "Nay, new was to nano" in English.',
        '"నీ పేరు ఏమిటి?" (Nee peru emiti?) can sound like "Knee pear, aim it, tea?" in English.'
    ]
};
