import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#e8f5f1",
          100: "#c5e6dc",
          200: "#9ad4c4",
          300: "#6abba5",
          400: "#3d9a82",
          500: "#145D4F",
          600: "#114d42",
          700: "#0e3f36",
          800: "#0b322b",
          900: "#08251f",
        },
        accent: {
          400: "#2dd4bf",
          500: "#14b8a6",
          600: "#0d9488",
        },
      },
      fontFamily: {
        sans: ["var(--font-dm-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
