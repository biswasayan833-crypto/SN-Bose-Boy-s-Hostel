import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { setupTestEnvironment, teardownTestEnvironment } from './testHelper.js';
import Message from '../models/Message.js';

describe('Task 4: Message Reactions Suite', () => {
  let ctx;
  let testMessage;
  let thirdYearMessage;

  before(async () => {
    ctx = await setupTestEnvironment();

    // Create a message in Global Room by student2
    testMessage = await Message.create({
      room: ctx.globalRoom._id,
      sender: ctx.student2._id,
      content: 'Anyone heading to the physics lab tomorrow morning?',
    });

    // Create a message in 3rd Year Room by student3
    thirdYearMessage = await Message.create({
      room: ctx.thirdYearRoom._id,
      sender: ctx.student3._id,
      content: 'Third year project submission deadline is extended.',
    });
  });

  after(async () => {
    await teardownTestEnvironment();
  });

  it('1. Adds a valid reaction to a message in an authorized room', async () => {
    const res = await fetch(`${ctx.baseUrl}/api/messages/${testMessage._id}/reactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ctx.student2Token}`,
      },
      body: JSON.stringify({ type: 'like' }),
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.message.reactionCounts.like, 1);
    assert.strictEqual(body.data.message.reactions.length, 1);
    assert.strictEqual(body.data.message.reactions[0].type, 'like');
  });

  it('2. Rejects invalid reaction types (e.g. random text, custom emojis)', async () => {
    const res = await fetch(`${ctx.baseUrl}/api/messages/${testMessage._id}/reactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ctx.student2Token}`,
      },
      body: JSON.stringify({ type: 'invalid_reaction' }),
    });

    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.match(body.message, /Invalid reaction type/);
  });

  it('3. Prevents duplicate reaction of the same type from the same user', async () => {
    // student2 already reacted with 'like', trying to add 'like' again
    const res = await fetch(`${ctx.baseUrl}/api/messages/${testMessage._id}/reactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ctx.student2Token}`,
      },
      body: JSON.stringify({ type: 'like' }),
    });

    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.match(body.message, /already reacted/);
  });

  it('4. Allows a second user to add their own reaction', async () => {
    const res = await fetch(`${ctx.baseUrl}/api/messages/${testMessage._id}/reactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ctx.student3Token}`,
      },
      body: JSON.stringify({ type: 'fire' }),
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.data.message.reactionCounts.fire, 1);
    assert.strictEqual(body.data.message.reactionCounts.like, 1);
  });

  it('5. Successfully removes an existing reaction (toggle off)', async () => {
    const res = await fetch(`${ctx.baseUrl}/api/messages/${testMessage._id}/reactions/like`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${ctx.student2Token}`,
      },
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.data.message.reactionCounts.like, 0);
  });

  it('6. Rejects removing a reaction that the user never added', async () => {
    const res = await fetch(`${ctx.baseUrl}/api/messages/${testMessage._id}/reactions/laugh`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${ctx.student2Token}`,
      },
    });

    assert.strictEqual(res.status, 404);
  });

  it('7. Rejects reaction attempts on messages in unauthorized rooms (year check)', async () => {
    // student2 is 2nd Year; attempting to react to thirdYearMessage in 3rd Year Room
    const res = await fetch(`${ctx.baseUrl}/api/messages/${thirdYearMessage._id}/reactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ctx.student2Token}`,
      },
      body: JSON.stringify({ type: 'love' }),
    });

    assert.strictEqual(res.status, 403);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.match(body.message, /Access denied/);
  });
});
