/**
 * Palette system — color models per lighting condition
 */

export const palette = {
  colors: {
    deepVoid: '#0a0b10',
    darkCharcoal: '#161822',
    pureWhite: '#f8fafc',
    cyanGlow: '#00f0ff',
    crimsonFlare: '#ff2a5f',
    amberLight: '#ffb800',
    glitchGreen: '#39ff14',
    voidGray: '#1e1f2e'
  },
  
  lighting: {
    day: {
      bg: '#0a0b10',
      surface: '#161822',
      accent: '#00f0ff',
      hazard: '#ff2a5f',
      text: '#f8fafc',
      muted: '#8a8fa8'
    },
    night: {
      bg: '#05060a',
      surface: '#0e1018',
      accent: '#00d4e8',
      hazard: '#e01a4f',
      text: '#e8ecf4',
      muted: '#6a6f88'
    },
    alert: {
      bg: '#1a0005',
      surface: '#2a0a10',
      accent: '#ff2a5f',
      hazard: '#ff0033',
      text: '#ffccd5',
      muted: '#884455'
    },
    glitch: {
      bg: '#0a0b10',
      surface: '#161822',
      accent: '#39ff14',
      hazard: '#ff2a5f',
      text: '#d4ffe8',
      muted: '#6a8877'
    }
  },
  
  character: {
    cipher: {
      skin: '#f8fafc',
      hair: '#181920',
      hoodie: '#181920',
      outline: '#f8fafc',
      eyes: '#0a0b10',
      mouth: '#0a0b10',
      weaver: '#00f0ff'
    },
    echo: {
      skin: '#f8fafc',
      hair: '#181920',
      windbreaker: '#161822',
      glasses: '#f8fafc',
      lens: '#ffffff',
      glassesGlow: '#00f0ff',
      outline: '#f8fafc',
      collar: '#00f0ff'
    },
    voxel: {
      primary: '#00f0ff',
      secondary: '#ff2a5f',
      tertiary: '#39ff14',
      opacity: 0.6
    },
    silhouette: {
      body: '#000000',
      eye: '#ff2a5f',
      absorption: 1.0
    }
  },
  
  ui: {
    terminal: {
      bg: '#05060a',
      border: '#00f0ff',
      text: '#00f0ff',
      highlight: '#39ff14',
      warning: '#ff2a5f'
    },
    hud: {
      bg: 'rgba(10,11,16,0.85)',
      border: '#00f0ff',
      text: '#f8fafc',
      accent: '#00f0ff',
      dim: '#6a6f88'
    }
  },
  
  effects: {
    bloom: { threshold: 0.85, intensity: 1.8, radius: 24 },
    chromaticAberration: { enabled: true, offset: 2.5, intensity: 0.15 },
    crt: {
      scanlineOpacity: 0.18,
      scanlineCount: 1080,
      phosphorGlow: 0.08,
      vignette: 0.45,
      noise: 0.03
    }
  },
  
  getLighting: (mode = 'day') => palette.lighting[mode] || palette.lighting.day,
  getCharacter: (name) => palette.character[name] || palette.character.cipher,
  getUI: (type = 'terminal') => palette.ui[type] || palette.ui.terminal
};

export default palette;