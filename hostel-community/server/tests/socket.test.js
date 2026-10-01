import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { io as Client } from 'socket.io-client';
import { setupTestEnvironment, teardownTestEnvironment } from './testHelper.js';
import Message from '../models/Message.js';

describe('Task 4: Real-Time Socket.IO Suite', () => {
  let ctx;
  let socketClient2;
  let socketClient3;
  let testMsg;

  before(async () => {
    ctx = await setupTestEnvironment();

    testMsg = await Message.create({
      room: ctx.globalRoom._id,
      sender: ctx.student2._id,
      content: 'Real-time interactive message for socket testing.',
    });

    // Connect student2 socket
    socketClient2 = Client(ctx.baseUrl, {
      auth: { token: ctx.student2Token },
      transports: ['websocket'],
    });

    // Connect student3 socket
    socketClient3 = Client(ctx.baseUrl, {
      auth: { token: ctx.student3Token },
      transports: ['websocket'],
    });

    await Promise.all([
      new Promise((resolve) => socketClient2.on('connect', resolve)),
      new Promise((resolve) => socketClient3.on('connect', resolve)),
    ]);

    // Both join global room
    await Promise.all([
      new Promise((resolve) =>
        socketClient2.emit('join_room', { roomId: ctx.globalRoom._id.toString() }, resolve)
      ),
      new Promise((resolve) =>
        socketClient3.emit('join_room', { roomId: ctx.globalRoom._id.toString() }, resolve)
      ),
    ]);
  });

  after(async () => {
    if (socketClient2) socketClient2.disconnect();
    if (socketClient3) socketClient3.disconnect();
    await teardownTestEnvironment();
  });

  it('1. Emits add_reaction and verifies reaction_updated is received by peers', async () => {
    const reactionPromise = new Promise((resolve) => {
      socketClient3.on('reaction_updated', (payload) => {
        resolve(payload);
      });
    });

    // Student 2 adds reaction via socket
    socketClient2.emit('add_reaction', {
      messageId: testMsg._id.toString(),
      type: 'fire',
    });

    const payload = await reactionPromise;
    assert.strictEqual(payload.messageId, testMsg._id.toString());
    assert.strictEqual(payload.roomId, ctx.globalRoom._id.toString());
    assert.strictEqual(payload.reactionCounts.fire, 1);
  });

  it('2. Emits remove_reaction and verifies reaction_updated is broadcasted', async () => {
    const removePromise = new Promise((resolve) => {
      socketClient3.on('reaction_updated', (payload) => {
        resolve(payload);
      });
    });

    // Student 2 removes reaction via socket
    socketClient2.emit('remove_reaction', {
      messageId: testMsg._id.toString(),
      type: 'fire',
    });

    const payload = await removePromise;
    assert.strictEqual(payload.messageId, testMsg._id.toString());
    assert.strictEqual(payload.reactionCounts.fire, 0);
  });

  it('3. Rejects delete_message if attempted by non-owner over Socket.IO', async () => {
    const errorPromise = new Promise((resolve) => {
      socketClient3.on('room_error', (err) => {
        resolve(err);
      });
    });

    // Student 3 attempts to delete Student 2's message
    socketClient3.emit('delete_message', {
      messageId: testMsg._id.toString(),
    });

    const err = await errorPromise;
    assert.match(err.message, /only delete your own messages/);
  });

  it('4. Emits delete_message by owner and verifies message_deleted is broadcasted', async () => {
    const deletePromise = new Promise((resolve) => {
      socketClient3.on('message_deleted', (payload) => {
        resolve(payload);
      });
    });

    // Student 2 deletes their own message
    socketClient2.emit('delete_message', {
      messageId: testMsg._id.toString(),
    });

    const payload = await deletePromise;
    assert.strictEqual(payload.messageId, testMsg._id.toString());
    assert.strictEqual(payload.isDeleted, true);
    assert.strictEqual(payload.content, 'Message deleted');
    assert.ok(payload.deletedAt);
  });
});
