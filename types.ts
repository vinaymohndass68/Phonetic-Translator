
export enum Language {
  ENGLISH = "English",
  HINDI = "Hindi",
  TAMIL = "Tamil",
  TELUGU = "Telugu",
}

export interface TranslationResult {
  language: string;
  sentence: string;
}
