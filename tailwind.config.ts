import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "#121212", // Firebase dark background
        foreground: "#FFFFFF", // Firebase dark foreground
        card: {
          DEFAULT: "#1E1E1E", // Using Firebase dark secondary as card
          foreground: "#FFFFFF", // Firebase dark foreground
        },
        popover: {
          DEFAULT: "#1E1E1E", // Using Firebase dark secondary
          foreground: "#FFFFFF", // Firebase dark foreground
        },
        primary: {
          DEFAULT: "#F57C00", // Firebase dark primary base color
          foreground: "#FFFFFF", // Firebase dark foreground
        },
        secondary: {
          DEFAULT: "#1E1E1E", // Firebase dark secondary
          foreground: "#FFFFFF", // Firebase dark foreground
        },
        muted: {
          DEFAULT: "#2C2C2C", // Slightly lighter than background
          foreground: "#A1A1A1", // Muted text for dark mode
        },
        accent: {
          DEFAULT: "#FF8A65", // Firebase accent
          foreground: "#121212", // Dark background for contrast
        },
        destructive: {
          DEFAULT: "#E53935", // Firebase destructive
          foreground: "#FFFFFF", // White text on destructive
        },
        border: "#333333", // Darker border for dark theme
        input: "#2C2C2C", // Darker input for dark theme
        ring: "#F57C00", // Using Firebase primary for ring focus
        chart: {
          "1": "#F57C00", // Primary orange
          "2": "#FFB300", // Secondary orange
          "3": "#FF8A65", // Accent
          "4": "#FFCA28", // Lighter orange
          "5": "#E53935", // Destructive red
        },
        sidebar: {
          DEFAULT: "#1A1A1A", // Slightly darker than main background
          foreground: "#FFFFFF", // Firebase dark foreground
          primary: "#F57C00", // Firebase dark primary
          "primary-foreground": "#FFFFFF", // White text on primary
          accent: "#FF8A65", // Firebase accent
          "accent-foreground": "#121212", // Dark text on accent
          border: "#333333", // Dark border
          ring: "#F57C00", // Firebase primary for focus
        },
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      // Add CSS variables for gradient support
      backgroundImage: {
        "primary-gradient": "linear-gradient(90deg, #F57C00 0%, #FFB300 100%)",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;