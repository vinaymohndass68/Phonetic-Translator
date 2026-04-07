import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Language, TranslationResult } from '../types';
import { LANGUAGES } from '../constants';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export async function generatePhoneticTranslations(
  inputText: string,
  inputLanguage: Language
): Promise<TranslationResult[]> {
  const targetLanguages = LANGUAGES.filter(lang => lang !== inputLanguage);

  // Using gemini-3-pro-preview to leverage thinking capabilities for complex creative mapping
  const model = "gemini-3-pro-preview";

  const systemInstruction = `You are the world's leading expert in "Soramimi" (misheard lyrics), cross-lingual phonetics, and "Mondegreens".

**Mission:**
Transform a Source Sentence into a Target Language sentence that sounds **phonetically identical** (or as close as physically possible) to the source audio, even if the meaning changes completely.

**The Golden Rules of Phonetic Translation:**
1.  **Sound Over Sense:** The target sentence does NOT need to mean the same thing. In fact, it usually won't. It just needs to *sound* the same.
2.  **Grammar is Mandatory:** The target sentence must be grammatically valid in the target language. It can be nonsensical, surreal, or poetic (e.g., "Colorless green ideas sleep furiously"), but it must follow grammatical rules.
3.  **Rhythm & Stress:** Match the syllable count, stress patterns, and intonation of the source.
4.  **Vowel Precision:** Vowels are the soul of the sound. Match them perfectly.

**Your Process (Use your Thinking Space):**
1.  **Transcribe:** Internally transcribe the source sentence into detailed phonetics/IPA.
2.  **Segment:** Break the sounds into syllabic chunks.
3.  **Brainstorm:** For each chunk, find words in the target language that match the sound.
4.  **Connect:** Weave these words into a syntactically valid sentence.
5.  **Iterate:** Generate at least 5 variations internally and pick the single one that sounds most like the original audio when spoken quickly.

**Examples of High-Quality Matches:**
- Source (Hindi): "दरवाज़ा खोल दे" (Dar-waa-zaa khol day) -> Target (English): "There was a cold day."
- Source (Tamil): "தம்பி இங்கே வா" (Thum-bi in-gay vaa) -> Target (English): "Thumb, key, in gray bar."
- Source (English): "Money can't buy happiness" -> Target (Hindi): "मन ही कांत, भाई, है पिये नशा" (Man hi kant, bhai, hai piye nasha).

For the given input, generate the absolute best phonetic match for each target language.`;
  
  const prompt = `Perform this task for the following input:
Source Language: ${inputLanguage}
Source Sentence: "${inputText}"
Target Languages: ${targetLanguages.join(', ')}

Provide the output strictly in the specified JSON format.`;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        role: "user",
        parts: [{ text: prompt }]
      },
      config: {
        systemInstruction: systemInstruction,
        // Increased thinking budget to 16k to allow for deep phonetic exploration and iteration
        thinkingConfig: { thinkingBudget: 16384 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            translations: {
              type: Type.ARRAY,
              description: "An array of phonetic translations.",
              items: {
                type: Type.OBJECT,
                properties: {
                  language: {
                    type: Type.STRING,
                    description: "The target language.",
                  },
                  sentence: {
                    type: Type.STRING,
                    description: "The phonetically similar sentence in the target language.",
                  },
                },
                required: ["language", "sentence"],
              },
            },
          },
          required: ["translations"],
        },
      },
    });

    const jsonString = response.text;
    const parsedResponse = JSON.parse(jsonString);

    if (parsedResponse && parsedResponse.translations) {
      return parsedResponse.translations as TranslationResult[];
    } else {
      throw new Error("Invalid response format from API.");
    }
  } catch (error) {
    console.error("Error generating phonetic translations:", error);
    if (error instanceof Error) {
        return Promise.reject(new Error(`Failed to get phonetic translations: ${error.message}`));
    }
    return Promise.reject(new Error("An unknown error occurred while fetching translations."));
  }
}

export async function generateSpeech(text: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' }, // A neutral, clear voice
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      throw new Error("No audio data received from API.");
    }
    return base64Audio;
  } catch (error) {
    console.error("Error generating speech:", error);
    if (error instanceof Error) {
        return Promise.reject(new Error(`Failed to generate speech: ${error.message}`));
    }
    return Promise.reject(new Error("An unknown error occurred while generating speech."));
  }
}

export async function generatePronunciationGuide(
  sentence: string,
  language: string,
): Promise<string> {
  const model = "gemini-2.5-flash"; // Flash is sufficient for this simple task
  const prompt = `You are a language pronunciation coach. 
For the following sentence in ${language}, create a simple, intuitive phonetic guide for an English speaker.
Break it down into syllables using hyphens. Do not use IPA (International Phonetic Alphabet). Instead, use common English letter sounds that are easy to read and understand.

Example Input:
Sentence: "தம்பி இங்கே வா"
Language: Tamil
Example Output:
Thum-bi in-gay vaa

Example Input:
Sentence: "दरवाज़ा खोल दे"
Language: Hindi
Example Output:
Duh-r-vaa-zaa khol day

Your task:
Sentence: "${sentence}"
Language: ${language}

Provide ONLY the phonetic guide text as a single line of text. Do not include any other explanations, headings, or markdown.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: { role: 'user', parts: [{ text: prompt }] },
    });
    return response.text.trim();
  } catch (error) {
    console.error("Error generating pronunciation guide:", error);
    if (error instanceof Error) {
        return Promise.reject(new Error(`Failed to get pronunciation guide: ${error.message}`));
    }
    return Promise.reject(new Error("An unknown error occurred while fetching pronunciation guide."));
  }
}