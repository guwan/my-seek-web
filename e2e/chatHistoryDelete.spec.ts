import {expect, test, type Page} from '@playwright/test';

type ChatItem = {id: string; title: string; createAt: string};

const ok = (data: unknown) => ({
    success: true,
    code: 200,
    msg: null,
    data,
    timestamp: Math.floor(Date.now() / 1000),
});

const initialItems: ChatItem[] = [
    {id: 'conv-a', title: '会话 A', createAt: '2026-11-21T10:00:00Z'},
    {id: 'conv-b', title: '会话 B', createAt: '2026-11-21T09:00:00Z'},
];

async function mockApis(page: Page, items: {current: ChatItem[]}) {
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
        if (path === '/api/ai/chat/item/list' && method === 'GET') {
            return route.fulfill({json: ok(items.current)});
        }
        if (path === '/api/ai/chat/item' && method === 'DELETE') {
            items.current = [];
            return route.fulfill({json: ok(null)});
        }
        if (path.startsWith('/api/ai/chat/item/') && method === 'DELETE') {
            const id = decodeURIComponent(path.split('/').pop() || '');
            items.current = items.current.filter(item => item.id !== id);
            return route.fulfill({json: ok(null)});
        }
        if (path === '/api/ai/chat/history') {
            return route.fulfill({json: ok([])});
        }
        if (path === '/api/ai/models') {
            return route.fulfill({json: ok([])});
        }
        return route.fulfill({json: ok(null)});
    });
}

test.beforeEach(async ({page}) => {
    page.on('dialog', dialog => dialog.accept());
});

test('可以单独删除一条历史会话', async ({page}) => {
    const items = {current: [...initialItems]};
    await mockApis(page, items);

    const deleteRequests: string[] = [];
    page.on('request', request => {
        if (request.method() === 'DELETE' && request.url().includes('/api/ai/chat/item/')) {
            deleteRequests.push(new URL(request.url()).pathname);
        }
    });

    await page.goto('/');
    await expect(page.getByText('会话 A')).toBeVisible();

    const row = page.locator('[data-sidebar="menu-item"]').filter({hasText: '会话 A'});
    await row.hover();
    await row.getByTitle('删除会话').click();

    await expect(deleteRequests).toContain('/api/ai/chat/item/conv-a');
    await expect(page.getByText('会话 A')).toHaveCount(0);
    await expect(page.getByText('会话 B')).toBeVisible();
});

test('可以一次删除全部历史会话', async ({page}) => {
    const items = {current: [...initialItems]};
    await mockApis(page, items);

    let clearCalled = false;
    page.on('request', request => {
        if (request.method() === 'DELETE'
            && new URL(request.url()).pathname === '/api/ai/chat/item') {
            clearCalled = true;
        }
    });

    await page.goto('/');
    await expect(page.getByText('会话 A')).toBeVisible();

    await page.getByTitle('删除全部会话').click();

    await expect.poll(() => clearCalled).toBe(true);
    await expect(page.getByText('会话 A')).toHaveCount(0);
    await expect(page.getByText('会话 B')).toHaveCount(0);
    await expect(page.getByText('还没有会话，开始一次对话吧')).toBeVisible();
});
