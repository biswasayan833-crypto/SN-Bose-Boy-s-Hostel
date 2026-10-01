import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { setupTestEnvironment, teardownTestEnvironment } from './testHelper.js';

describe('Task 1-3 Regression Suite', () => {
  let ctx;

  before(async () => {
    ctx = await setupTestEnvironment();
  });

  after(async () => {
    await teardownTestEnvironment();
  });

  it('1. GET /api/health responds with 200 OK and health status', async () => {
    const res = await fetch(`${ctx.baseUrl}/api/health`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.status, 'healthy');
    assert.strictEqual(body.data.database.status, 'connected');
  });


  it('2. POST /api/auth/register creates a new student with anonymous identity', async () => {
    const res = await fetch(`${ctx.baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'New Hostel Resident',
        email: 'newresident@snbose.edu',
        password: 'Password123!',
        year: '2nd Year',
      }),
    });

    assert.strictEqual(res.status, 201);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(body.data.token);
    assert.ok(body.data.user.anonymousName);
    assert.ok(body.data.user.anonymousAvatar);
    assert.strictEqual(body.data.user.year, '2nd Year');
  });

  it('3. POST /api/auth/login authenticates student and returns JWT', async () => {
    const res = await fetch(`${ctx.baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: ctx.student2.email,
        password: 'Password123!',
      }),

    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(body.data.token);
    assert.strictEqual(body.data.user.anonymousName, ctx.student2.anonymousName);
  });

  it('4. GET /api/rooms returns ONLY authorized rooms for 2nd Year student', async () => {
    const res = await fetch(`${ctx.baseUrl}/api/rooms`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${ctx.student2Token}`,
      },
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    const slugs = body.data.rooms.map((r) => r.slug);
    assert.ok(slugs.includes('global-room'));
    assert.ok(slugs.includes('2nd-year'));
    assert.strictEqual(slugs.includes('3rd-year'), false, '2nd year student must not see 3rd year room');
    assert.strictEqual(slugs.includes('4th-year'), false, '2nd year student must not see 4th year room');
  });

  it('5. POST /api/rooms/:roomId/messages posts message and GET retrieves history', async () => {
    // Post message
    const postRes = await fetch(`${ctx.baseUrl}/api/rooms/${ctx.globalRoom._id}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ctx.student2Token}`,
      },
      body: JSON.stringify({
        content: 'Hello everyone in Prof. S.N. Bose Boys Hostel!',
      }),
    });

    assert.strictEqual(postRes.status, 201);
    const postBody = await postRes.json();
    assert.strictEqual(postBody.success, true);
    assert.strictEqual(postBody.data.message.content, 'Hello everyone in Prof. S.N. Bose Boys Hostel!');
    assert.strictEqual(postBody.data.message.sender.anonymousName, ctx.student2.anonymousName);

    // Retrieve history
    const getRes = await fetch(`${ctx.baseUrl}/api/rooms/${ctx.globalRoom._id}/messages`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${ctx.student2Token}`,
      },
    });

    assert.strictEqual(getRes.status, 200);
    const getBody = await getRes.json();
    assert.ok(getBody.data.messages.length >= 1);
    const found = getBody.data.messages.find(
      (m) => m.content === 'Hello everyone in Prof. S.N. Bose Boys Hostel!'
    );
    assert.ok(found);
  });
});
