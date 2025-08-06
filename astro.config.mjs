import { defineConfig } from 'astro/config';
import tailwind from "@astrojs/tailwind";
import netlify from "@astrojs/netlify";

// https://astro.build/config
export default defineConfig({
  site: "https://your-site-name.netlify.app", // Update this with your actual Netlify URL
  integrations: [tailwind()],
  output: 'server',
  adapter: netlify(),
});