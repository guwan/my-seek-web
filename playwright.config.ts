import {defineConfig, devices} from '@playwright/test';

export default defineConfig({
    testDir: './e2e',
    fullyParallel: true,
    retries: 0,
    reporter: 'list',
    use: {
        baseURL: 'http://127.0.0.1:5173',
        trace: 'retain-on-failure',
        // 环境已有旧版 Chromium 时可显式指定，避免重复下载
        launchOptions: process.env.PLAYWRIGHT_CHROMIUM_PATH
            ? {executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH}
            : {},
    },
    projects: [
        {name: 'chromium', use: {...devices['Desktop Chrome']}},
    ],
    webServer: {
        command: 'pnpm build && pnpm exec vite preview --host 127.0.0.1 --port 5173',
        url: 'http://127.0.0.1:5173',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
    },
});
