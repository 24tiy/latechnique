import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        black: '#1b1b1b',
        white: '#fff',
        accent: '#4c96f7',
        haze: '#f5f5f5',
        altitude: '#6366f1',
        sunflare: '#f59e0b',
        ember: '#ef4444',
        aurora: '#8b5cf6',
        dust: '#a3a3a3',
        soil: '#78716c',
        teal: '#14b8a6',
        canopy: '#10b981',
      },
      maxWidth: {
        'page': '1600px',
        'content': '1150px',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(.22, 1, .36, 1)',
      },
      transitionDuration: {
        'fast': '0.3s',
        'medium': '0.6s',
        'slow': '0.85s',
      },
      animation: {
        'spin-slow': 'spin 10s linear infinite',
        'pulse-slow': 'pulse 6s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
};

export default config;
