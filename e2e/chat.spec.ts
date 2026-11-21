import {expect, test, type Page} from '@playwright/test';

const ok = (data: unknown) => ({
    success: true,
    code: 200,
    msg: null,
    data,
    timestamp: Math.floor(Date.now() / 1000),
});

async function mockChatApis(page: Page) {
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
        if (path === '/api/ai/chat/history') {
            return route.fulfill({json: ok([])});
        }
        if (path === '/api/ai/chat/item/list') {
            return route.fulfill({json: ok([])});
        }
        if (path === '/api/ai/models' && method === 'GET') {
            return route.fulfill({json: ok([])});
        }
        if (path === '/api/ai/chat/stream' && method === 'POST') {
            const lines = [
                'MYSEEK_FRAME:{"type":"meta","performed":false,"engine":"","sources":[]}',
                'MYSEEK_FRAME:{"type":"content","text":"你好，这是"}',
                'MYSEEK_FRAME:{"type":"content","text":"流式回答。"}',
                'MYSEEK_FRAME:{"type":"done"}',
            ].join('\n') + '\n';
            return route.fulfill({
                status: 200,
                headers: {'content-type': 'text/plain; charset=utf-8'},
                body: lines,
            });
        }
        return route.fulfill({json: ok(null)});
    });
}

test('发送消息后流式渲染内容并恢复发送按钮', async ({page}) => {
    await mockChatApis(page);

    await page.goto('/');
    const input = page.getByLabel('消息输入框');
    await expect(input).toBeVisible();
    await input.fill('你好');

    await input.press('Enter');

    // 流式内容渲染完成（用户输入与 AI 回复都在页面上）
    await expect(page.getByText('流式回答。', {exact: false})).toBeVisible({timeout: 5000});
    // 关键回归：收到 done 后发送按钮恢复，不再停留在“停止生成”
    await expect(page.getByTitle('发送')).toBeVisible({timeout: 5000});
    await expect(page.getByTitle('停止生成')).toHaveCount(0);
});

test('空消息不能发送', async ({page}) => {
    await mockChatApis(page);
    await page.goto('/');

    const sendButton = page.getByTitle('发送');
    await expect(sendButton).toBeDisabled();
});
