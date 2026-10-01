import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { setupTestEnvironment, teardownTestEnvironment } from './testHelper.js';
import Message from '../models/Message.js';

describe('Task 4: Message Deletion Suite', () => {
  let ctx;
  let student2Message;
  let student3Message;

  before(async () => {
    ctx = await setupTestEnvironment();

    student2Message = await Message.create({
      room: ctx.globalRoom._id,
      sender: ctx.student2._id,
      content: 'Original secret note from Student 2 that should disappear when deleted.',
    });

    student3Message = await Message.create({
      room: ctx.globalRoom._id,
      sender: ctx.student3._id,
      content: 'Student 3 message in global room.',
    });
  });

  after(async () => {
    await teardownTestEnvironment();
  });

  it('1. Rejects deletion attempt by a non-owner student (403 Forbidden)', async () => {
    // student3 attempts to delete student2's message
    const res = await fetch(`${ctx.baseUrl}/api/messages/${student2Message._id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${ctx.student3Token}`,
      },
    });

    assert.strictEqual(res.status, 403);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.match(body.message, /only delete your own messages/);
  });

  it('2. Allows a student to soft-delete their own message', async () => {
    const res = await fetch(`${ctx.baseUrl}/api/messages/${student2Message._id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${ctx.student2Token}`,
      },
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.message.isDeleted, true);
    assert.strictEqual(body.data.message.content, 'Message deleted');
    assert.ok(body.data.message.deletedAt);
  });

  it('3. Ensures deleted message does not expose original content in room history', async () => {
    const res = await fetch(`${ctx.baseUrl}/api/rooms/${ctx.globalRoom._id}/messages`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${ctx.student3Token}`,
      },
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    const deletedInList = body.data.messages.find((m) => m.id === student2Message._id.toString());
    assert.ok(deletedInList);
    assert.strictEqual(deletedInList.isDeleted, true);
    assert.strictEqual(deletedInList.content, 'Message deleted');
    assert.strictEqual(
      deletedInList.content.includes('Original secret note'),
      false,
      'Original secret note must never be present'
    );
  });

  it('4. Rejects reaction attempts on a deleted message', async () => {
    const res = await fetch(`${ctx.baseUrl}/api/messages/${student2Message._id}/reactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ctx.student3Token}`,
      },
      body: JSON.stringify({ type: 'like' }),
    });

    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.match(body.message, /deleted message/);
  });

  it('5. Allows administrator to moderate/delete any student message', async () => {
    const res = await fetch(`${ctx.baseUrl}/api/messages/${student3Message._id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${ctx.adminToken}`,
      },
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.data.message.isDeleted, true);
    assert.strictEqual(body.data.message.content, 'Message deleted');
  });
});
