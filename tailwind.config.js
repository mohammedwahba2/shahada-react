/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",

  theme: {
    extend: {
      colors: {
        ink: "#1B1C1E",
        white: "#F7F7F7",
      },
    },
  },

  plugins: [],
};