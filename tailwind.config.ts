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
        background: "#FFFFFF",
        foreground: "#212121",
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#212121",
        },
        popover: {
          DEFAULT: "#FFFFFF",
          foreground: "#212121",
        },
        primary: {
          DEFAULT: "#FFA000", // base of the gradient
          foreground: "#212121",
        },
        secondary: {
          DEFAULT: "#F5F5F5",
          foreground: "#212121",
        },
        muted: {
          DEFAULT: "#F5F5F5",
          foreground: "#212121",
        },
        accent: {
          DEFAULT: "#FF8A65",
          foreground: "#212121",
        },
        destructive: {
          DEFAULT: "#E53935",
          foreground: "#FFFFFF",
        },
        border: "#F5F5F5",
        input: "#F5F5F5",
        ring: "#FFA000",
        chart: {
          "1": "#FFA000",
          "2": "#FFCA28",
          "3": "#FF8A65",
          "4": "#F5F5F5",
          "5": "#E53935",
        },
        sidebar: {
          DEFAULT: "#FFFFFF",
          foreground: "#212121",
          primary: "#FFA000",
          "primary-foreground": "#212121",
          accent: "#FF8A65",
          "accent-foreground": "#212121",
          border: "#F5F5F5",
          ring: "#FFA000",
        },
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/typography"),
  ],
} satisfies Config;
