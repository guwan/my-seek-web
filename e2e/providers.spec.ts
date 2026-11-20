import {expect, test, type Page} from '@playwright/test';

const ok = (data: unknown) => ({
    success: true,
    code: 200,
    msg: null,
    data,
    timestamp: Math.floor(Date.now() / 1000),
});

const ollamaProvider = {
    name: 'ollama',
    displayName: 'Ollama 本地模型',
    baseUrl: 'http://localhost:11434',
    models: ['deepseek-r1:8b'],
    enabled: true,
    builtIn: true,
};

const customProvider = {
    id: 'p1',
    name: 'deepseek',
    displayName: 'DeepSeek 官方',
    baseUrl: 'https://api.deepseek.com/v1',
    models: ['deepseek-chat'],
    enabled: true,
    builtIn: false,
    apiKeyMasked: 'sk-1****cdef',
    apiKeyConfigured: true,
};

const ollamaConfig = {
    baseUrl: 'http://localhost:11434',
    defaultChatModel: 'deepseek-r1:8b',
    embeddingModel: 'nomic-embed-text',
    pullModelStrategy: 'NEVER',
    configured: false,
};

async function mockApis(page: Page) {
    const captured: {ollamaUpdate?: any; ollamaTest?: any; providerUpdate?: any} = {};

    await page.addInitScript(() => {
        localStorage.setItem('proman_user_token', 'e2e-token');
    });

    await page.route('**/api/**', async route => {
        const request = route.request();
        const path = new URL(request.url()).pathname;
        const method = request.method();

        if (path === '/api/user/currentUser') {
            return route.fulfill({json: ok({id: 1, username: 'admin', access: 'admin'})});
        }
        if (path === '/api/ai/chat/item/list' || path === '/api/ai/models') {
            return route.fulfill({json: ok([])});
        }
        if (path === '/api/ai/providers' && method === 'GET') {
            return route.fulfill({json: ok([ollamaProvider, customProvider])});
        }
        if (path === '/api/ai/ollama/config' && method === 'GET') {
            return route.fulfill({json: ok(ollamaConfig)});
        }
        if (path === '/api/ai/ollama/config' && method === 'PUT') {
            captured.ollamaUpdate = request.postDataJSON();
            return route.fulfill({json: ok({...ollamaConfig, ...captured.ollamaUpdate, configured: true})});
        }
        if (path === '/api/ai/ollama/test') {
            captured.ollamaTest = request.postDataJSON();
            return route.fulfill({json: ok(['deepseek-r1:8b', 'qwen3:8b'])});
        }
        if (path === '/api/ai/providers/p1' && method === 'PUT') {
            captured.providerUpdate = request.postDataJSON();
            return route.fulfill({json: ok(customProvider)});
        }
        if (path === '/api/ai/providers/test') {
            return route.fulfill({json: ok(null)});
        }
        return route.fulfill({json: ok(null)});
    });

    return captured;
}

test('Ollama 配置可编辑、测试并选择在线模型', async ({page}) => {
    const captured = await mockApis(page);

    await page.goto('/providers');
    await expect(page.getByRole('heading', {name: 'Ollama 本地模型配置'})).toBeVisible();
    await expect(page.getByText('http://localhost:11434').first()).toBeVisible();

    await page.getByRole('button', {name: '编辑配置'}).click();
    await page.getByPlaceholder('http://localhost:11434').fill('http://127.0.0.1:11435');
    await page.getByRole('button', {name: '测试并列出模型'}).click();

    await expect(page.getByRole('button', {name: 'qwen3:8b'})).toBeVisible();
    expect(captured.ollamaTest?.baseUrl).toBe('http://127.0.0.1:11435');

    await page.getByRole('button', {name: 'qwen3:8b'}).click();
    await page.getByRole('button', {name: '保存配置'}).click();

    expect(captured.ollamaUpdate?.baseUrl).toBe('http://127.0.0.1:11435');
    expect(captured.ollamaUpdate?.defaultChatModel).toBe('qwen3:8b');
});

test('编辑第三方接口时提交 id 以避免同名冲突', async ({page}) => {
    const captured = await mockApis(page);

    await page.goto('/providers');
    await page.getByTitle('编辑').click();
    await page.getByPlaceholder('DeepSeek 官方').fill('DeepSeek 新名称');
    await page.getByRole('button', {name: '保存', exact: true}).click();

    expect(captured.providerUpdate?.id).toBe('p1');
    expect(captured.providerUpdate?.displayName).toBe('DeepSeek 新名称');
});
