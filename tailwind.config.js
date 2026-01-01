module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#10B981", // NutriPlus Green
        secondary: "#374151",
        'nutri-light': '#F0FDF4',
        'nutri-dark': '#064E3B',
      }
    },
  },
  plugins: [],
}
