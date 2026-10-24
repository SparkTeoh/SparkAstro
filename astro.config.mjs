import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://sparkliang.com',
  output: 'static',
  integrations: [
    // global.css 自带 @tailwind 指令，关闭自动注入避免 base 样式重复
    tailwind({ applyBaseStyles: false }),
    react(),
    sitemap(),
  ],
});
