declare module "expo-font" {
  export type FontSource = unknown;

  export function useFonts(_map: Record<string, FontSource>): [boolean, Error | null];
  export function loadAsync(_fontMap: Record<string, FontSource> | string, _source?: FontSource): Promise<void>;
  export function isLoaded(_fontFamily: string): boolean;
  export function renderToImageAsync(
    _glyphs: string,
    _options?: Record<string, unknown>,
  ): Promise<string>;
}
