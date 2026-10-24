/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        grotesk: ["var(--sp-font-sans)"],
        display: ["var(--sp-font-display)"],
      },
      colors: {
        // 与 site.css 同一套品牌色；RGB 通道写法支持 text-primary/70 等透明度
        primary: "rgb(var(--c-primary) / <alpha-value>)",
        accent: "rgb(var(--c-accent) / <alpha-value>)",
        background: "rgb(var(--c-background) / <alpha-value>)",
        dark: "rgb(var(--c-primary) / <alpha-value>)",
        danger: "rgb(var(--c-danger) / <alpha-value>)",
      },
      boxShadow: {
        // 与 site.css 的 --sp-shadow-sm / --sp-shadow 一致
        offset: "4px 4px 0 rgb(var(--c-primary))",
        "offset-lg": "7px 7px 0 rgb(var(--c-primary))",
      },
    },
  },
  plugins: [],
};
