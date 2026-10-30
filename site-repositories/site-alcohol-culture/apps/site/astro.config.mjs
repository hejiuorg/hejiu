import { defineConfig } from 'astro/config';
import { hejiu } from '@hejiu/build-tools/astro';

export default defineConfig({
  site: 'https://culture.hejiu.org',
  base: '/',
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [hejiu({ siteKey: 'culture' })],
  devToolbar: { enabled: false },
});
