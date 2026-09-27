import { defineConfig, devices } from '@playwright/test';

const android = devices['Pixel 5'];
const at = (width, height, colorScheme) => ({ ...android, viewport: { width, height }, colorScheme });

export default defineConfig({
  testDir: 'tests/e2e',
  outputDir: 'test-results',
  use: { baseURL: 'http://127.0.0.1:5173/acp-study/', trace: 'retain-on-failure' },
  webServer: {
    command: 'node scripts/serve.mjs',
    url: 'http://127.0.0.1:5173/acp-study/',
    reuseExistingServer: true,
  },
  projects: [
    { name: 'android-320-light', use: at(320, 640, 'light') },
    { name: 'android-360-light', use: at(360, 740, 'light') },
    { name: 'android-360-dark', use: at(360, 740, 'dark') },
    { name: 'android-412-dark', use: at(412, 915, 'dark') },
  ],
});
