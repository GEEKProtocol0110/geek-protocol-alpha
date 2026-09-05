/**
 * Cel-shading palettes for the roster.
 *
 * The brand bans gradients, so volume is built the way toon-shaded game art
 * builds it: a small ramp of flat tones per material with one consistent light
 * direction (upper-left), a hard specular shape where the light lands, and a
 * rim light along the shadow edge to lift the figure off the background.
 *
 * Five shell slots, dark to light:
 *   deep  — occlusion, the darkest crevices
 *   dark  — the shadow side
 *   base  — the shell's local colour
 *   light — the lit side
 *   spec  — the hard highlight
 */

export interface SpritePalette {
  deep: string;
  dark: string;
  base: string;
  light: string;
  spec: string;
  glass: string;
  glassLight: string;
  glow: string;
  plate: string;
  plateDark: string;
  plateSpec: string;
  accent: string;
  outline: string;
}

/** GIGA — matches the rendered mascot: navy shell, cyan brain dome, pink trim. */
export const GIGA_PALETTE: SpritePalette = {
  deep: "#10132A", dark: "#1B2140", base: "#2A3157", light: "#3E4878", spec: "#5D6AA6",
  glass: "#00E5D6", glassLight: "#8CFFF4", glow: "#00E5D6",
  plate: "#E9EDF7", plateDark: "#A3ACC4", plateSpec: "#FFFFFF",
  accent: "#FF3FA4", outline: "#05050B",
};

export const NOVA_PALETTE: SpritePalette = {
  deep: "#2A0F26", dark: "#42193A", base: "#5E2451", light: "#82376E", spec: "#AE5394",
  glass: "#FF3FA4", glassLight: "#FFA6D5", glow: "#FF3FA4",
  plate: "#F6E7F1", plateDark: "#C39FB6", plateSpec: "#FFFFFF",
  accent: "#00E5D6", outline: "#05050B",
};

export const TITAN_PALETTE: SpritePalette = {
  deep: "#161233", dark: "#241E4D", base: "#342C6B", light: "#4B4093", spec: "#6F5FC4",
  glass: "#7B5CFA", glassLight: "#C1B2FF", glow: "#7B5CFA",
  plate: "#E6E4F4", plateDark: "#A29DC6", plateSpec: "#FFFFFF",
  accent: "#FFC93C", outline: "#05050B",
};

export const VEX_PALETTE: SpritePalette = {
  deep: "#1E1809", dark: "#332A11", base: "#4A3D1B", light: "#6B5828", spec: "#9A7F3B",
  glass: "#FFC93C", glassLight: "#FFE9A8", glow: "#FFC93C",
  plate: "#F4EFDD", plateDark: "#BCB392", plateSpec: "#FFFFFF",
  accent: "#FF4767", outline: "#05050B",
};

/** Boss palettes — heavier, colder, with hostile optics. */
export const BOSS_PALETTES: Record<string, SpritePalette> = {
  "training-drone": {
    deep: "#161A22", dark: "#242A36", base: "#39404F", light: "#525B6D", spec: "#78839A",
    glass: "#8A8F9C", glassLight: "#C6CBD6", glow: "#FF4767",
    plate: "#DDE2EA", plateDark: "#98A0AE", plateSpec: "#FFFFFF",
    accent: "#FF4767", outline: "#05050B",
  },
  "void-raider": {
    deep: "#062018", dark: "#0C3327", base: "#134838", light: "#1C6650", spec: "#2C8F70",
    glass: "#24DD84", glassLight: "#9BF3C7", glow: "#24DD84",
    plate: "#DDF2E7", plateDark: "#8FB9A4", plateSpec: "#FFFFFF",
    accent: "#FF4767", outline: "#05050B",
  },
  "nebula-hunter": {
    deep: "#161233", dark: "#241E4D", base: "#342C6B", light: "#4B4093", spec: "#6F5FC4",
    glass: "#7B5CFA", glassLight: "#C1B2FF", glow: "#7B5CFA",
    plate: "#E6E4F4", plateDark: "#A29DC6", plateSpec: "#FFFFFF",
    accent: "#FF4767", outline: "#05050B",
  },
  "titan-commander": {
    deep: "#2E0A22", dark: "#4A1236", base: "#6B1B4D", light: "#93286B", spec: "#C43C90",
    glass: "#FF3FA4", glassLight: "#FFA6D5", glow: "#FF3FA4",
    plate: "#F6E7F1", plateDark: "#C39FB6", plateSpec: "#FFFFFF",
    accent: "#FFC93C", outline: "#05050B",
  },
  "void-king": {
    deep: "#2B0710", dark: "#460D1C", base: "#66142A", light: "#8F1E3C", spec: "#C42D57",
    glass: "#FF4767", glassLight: "#FFB0BE", glow: "#FF4767",
    plate: "#F6E3E7", plateDark: "#C09AA3", plateSpec: "#FFFFFF",
    accent: "#FFC93C", outline: "#05050B",
  },
};
