/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ridge: {
          ink: "#061017",
          panel: "#0d1722",
          panelSoft: "#111f2d",
          border: "#223448",
          cyan: "#53d6ff",
          mint: "#70f0c8",
          amber: "#f4c76b",
          red: "#ff6b7a"
        }
      },
      boxShadow: {
        glow: "0 0 40px rgba(83, 214, 255, 0.12)"
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "SFMono-Regular", "Consolas", "monospace"]
      }
    }
  },
  plugins: []
};
