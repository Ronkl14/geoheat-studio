export const palettes = {
  plasma: {
    label: 'Plasma',
    colors: { 0.2: '#0d0887', 0.4: '#7e03a8', 0.6: '#cc4778', 0.8: '#f89540', 1: '#f0f921' },
  },
  ocean: {
    label: 'Ocean',
    colors: { 0.2: '#02275d', 0.4: '#1266b0', 0.6: '#00a3e0', 0.8: '#48d9da', 1: '#fff' },
  },
  fire: {
    label: 'Fire',
    colors: { 0.2: '#45150c', 0.4: '#9c210b', 0.6: '#ff6b00', 0.8: '#ffc14d', 1: '#fff5b0' },
  },
  emerald: {
    label: 'Emerald',
    colors: { 0.2: '#09392b', 0.4: '#177b54', 0.6: '#30b574', 0.8: '#8af29e', 1: '#f3ffba' },
  },
} as const;
export type PaletteName = keyof typeof palettes;
