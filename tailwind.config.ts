import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(217, 91%, 35%)", // Navy blue dari logo
          foreground: "hsl(0, 0%, 100%)",
        },
        secondary: {
          DEFAULT: "hsl(217, 91%, 60%)", // Sky blue dari logo
          foreground: "hsl(0, 0%, 100%)",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(217, 91%, 60%)", // Blue accent
          foreground: "hsl(0, 0%, 100%)",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(217, 91%, 35%)", // Navy untuk sidebar
          foreground: "hsl(0, 0%, 100%)",
          primary: "hsl(217, 91%, 60%)",
          "primary-foreground": "hsl(0, 0%, 100%)",
          accent: "hsl(217, 91%, 45%)",
          "accent-foreground": "hsl(0, 0%, 100%)",
          border: "hsl(217, 91%, 30%)",
          ring: "hsl(217, 91%, 60%)",
        },
      },
      // ... sisanya tetap sama
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;