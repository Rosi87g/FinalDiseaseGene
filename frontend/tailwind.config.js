/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          dark: "#030712",
          card: "#0f172a",
          cardLight: "#1e293b",
          primary: "#6366f1",
          secondary: "#06b6d4",
          accent: "#ec4899",
          success: "#10b981",
          warning: "#f59e0b",
          danger: "#ef4444",
          info: "#3b82f6",
        },
      },
      fontFamily: {
<<<<<<< HEAD
        sans: ["'Inter'", "sans-serif"],
        serif: ["'Inter'", "sans-serif"],
        display: ["'Inter'", "sans-serif"],
        mono: ["'Inter'", "sans-serif"],
=======
        sans: ["Inter", "sans-serif"],
        display: ["Outfit", "sans-serif"],
>>>>>>> aea26ac9ac182b5cb8785740858bc039e7ec4962
      },
    },
  },
  plugins: [],
};