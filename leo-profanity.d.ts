// leo-profanity.d.ts
declare module "leo-profanity" {
    /**
     * Loads the default profanity dictionary, or a custom one if provided.
     */
    export function loadDictionary(dictionary?: string[]): void;
  
    /**
     * Checks the given text for profanity.
     * @param text The text to check.
     * @returns True if the text contains profanity.
     */
    export function check(text: string): boolean;
  
    /**
     * Cleans the given text by replacing profane words with asterisks.
     * @param text The text to clean.
     * @returns The cleaned text.
     */
    export function clean(text: string): string;
  }