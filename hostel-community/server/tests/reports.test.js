import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { setupTestEnvironment, teardownTestEnvironment } from './testHelper.js';
import Message from '../models/Message.js';

describe('Task 4: Message Reports Suite', () => {
  let ctx;
  let globalMessage;
  let thirdYearMessage;

  before(async () => {
    ctx = await setupTestEnvironment();

    globalMessage = await Message.create({
      room: ctx.globalRoom._id,
      sender: ctx.student3._id,
      content: 'Inappropriate advertisement or spam message.',
    });

    thirdYearMessage = await Message.create({
      room: ctx.thirdYearRoom._id,
      sender: ctx.student3._id,
      content: 'Third year exclusive note.',
    });
  });

  after(async () => {
    await teardownTestEnvironment();
  });

  it('1. Rejects unauthenticated report submission (401 Unauthorized)', async () => {
    const res = await fetch(`${ctx.baseUrl}/api/messages/${globalMessage._id}/report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason: 'spam' }),
    });

    assert.strictEqual(res.status, 401);
  });

  it('2. Rejects invalid report reason (400 Bad Request)', async () => {
    const res = await fetch(`${ctx.baseUrl}/api/messages/${globalMessage._id}/report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ctx.student2Token}`,
      },
      body: JSON.stringify({ reason: 'not_a_valid_reason' }),
    });

    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.match(body.message, /Invalid report reason/);
  });

  it('3. Rejects reporting on nonexistent message (404 Not Found)', async () => {
    const fakeId = '507f1f77bcf86cd799439011';
    const res = await fetch(`${ctx.baseUrl}/api/messages/${fakeId}/report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ctx.student2Token}`,
      },
      body: JSON.stringify({ reason: 'spam' }),
    });

    assert.strictEqual(res.status, 404);
  });

  it('4. Rejects reporting message in a room user has no access to (403 Forbidden)', async () => {
    // student2 (2nd year) trying to report a message in 3rd year room
    const res = await fetch(`${ctx.baseUrl}/api/messages/${thirdYearMessage._id}/report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ctx.student2Token}`,
      },
      body: JSON.stringify({ reason: 'harassment' }),
    });

    assert.strictEqual(res.status, 403);
    const body = await res.json();
    assert.match(body.message, /Access denied/);
  });

  it('5. Successfully reports an inappropriate message with valid reason (201 Created)', async () => {
    const res = await fetch(`${ctx.baseUrl}/api/messages/${globalMessage._id}/report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ctx.student2Token}`,
      },
      body: JSON.stringify({ reason: 'spam', notes: 'Repeated promotional message.' }),
    });

    assert.strictEqual(res.status, 201);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.report.reason, 'spam');
    assert.strictEqual(body.data.report.status, 'pending');
  });

  it('6. Prevents duplicate report from the same student for the same message', async () => {
    // student2 tries to report globalMessage again
    const res = await fetch(`${ctx.baseUrl}/api/messages/${globalMessage._id}/report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ctx.student2Token}`,
      },
      body: JSON.stringify({ reason: 'spam' }),
    });

    assert.strictEqual(res.status, 409);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.match(body.message, /already reported/);
  });
});
