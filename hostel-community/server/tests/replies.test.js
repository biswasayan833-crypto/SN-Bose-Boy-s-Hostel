import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { io as Client } from 'socket.io-client';
import mongoose from 'mongoose';
import { setupTestEnvironment, teardownTestEnvironment } from './testHelper.js';
import Message from '../models/Message.js';

describe('Feature Task: WhatsApp-Style Reply to Message Suite', () => {
  let ctx;
  let student2Message;
  let student3Message;
  let secondYearMessage;
  let socketClient2;
  let socketClient3;

  before(async () => {
    ctx = await setupTestEnvironment();

    // Message in Global Room by student2
    student2Message = await Message.create({
      room: ctx.globalRoom._id,
      sender: ctx.student2._id,
      content: 'Hey everyone, what time does the hostel mess close tonight?',
      anonymousName: ctx.student2.anonymousName,
      anonymousAvatar: ctx.student2.anonymousAvatar,
      senderYear: ctx.student2.year,
    });

    // Message in Global Room by student3
    student3Message = await Message.create({
      room: ctx.globalRoom._id,
      sender: ctx.student3._id,
      content: 'I will be working in the library till 10 PM.',
      anonymousName: ctx.student3.anonymousName,
      anonymousAvatar: ctx.student3.anonymousAvatar,
      senderYear: ctx.student3.year,
    });

    // Message in 2nd Year Room by student2
    secondYearMessage = await Message.create({
      room: ctx.secondYearRoom._id,
      sender: ctx.student2._id,
      content: 'Second year lab syllabus discussion.',
      anonymousName: ctx.student2.anonymousName,
      anonymousAvatar: ctx.student2.anonymousAvatar,
      senderYear: ctx.student2.year,
    });

    // Connect socket clients
    socketClient2 = Client(ctx.baseUrl, {
      auth: { token: ctx.student2Token },
      transports: ['websocket'],
    });

    socketClient3 = Client(ctx.baseUrl, {
      auth: { token: ctx.student3Token },
      transports: ['websocket'],
    });

    await Promise.all([
      new Promise((resolve) => socketClient2.on('connect', resolve)),
      new Promise((resolve) => socketClient3.on('connect', resolve)),
    ]);

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

  it('1. Successfully replies to another student\'s message (REST)', async () => {
    const res = await fetch(`${ctx.baseUrl}/api/rooms/${ctx.globalRoom._id}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ctx.student3Token}`,
      },
      body: JSON.stringify({
        content: 'Mess usually closes at 10:30 PM!',
        replyTo: student2Message._id.toString(),
      }),
    });

    assert.strictEqual(res.status, 201);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(body.data.message);
    assert.strictEqual(body.data.message.content, 'Mess usually closes at 10:30 PM!');
    assert.ok(body.data.message.replyTo);
    assert.strictEqual(body.data.message.replyTo.id, student2Message._id.toString());
    assert.strictEqual(body.data.message.replyTo.content, 'Hey everyone, what time does the hostel mess close tonight?');
    assert.strictEqual(body.data.message.replyTo.isDeleted, false);
    assert.strictEqual(body.data.message.replyTo.sender.anonymousName, ctx.student2.anonymousName);
    assert.strictEqual(body.data.message.replyTo.sender.anonymousAvatar, ctx.student2.anonymousAvatar);

    // Strict privacy assurance: Never expose email, fullName, or internal MongoDB IDs of quoted sender
    assert.strictEqual(body.data.message.replyTo.sender.email, undefined);
    assert.strictEqual(body.data.message.replyTo.sender.fullName, undefined);
    assert.strictEqual(body.data.message.replyTo.sender._id, undefined);
  });

  it('2. Successfully replies to one\'s own message', async () => {
    const res = await fetch(`${ctx.baseUrl}/api/rooms/${ctx.globalRoom._id}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ctx.student2Token}`,
      },
      body: JSON.stringify({
        content: 'Following up on my earlier question: did anyone check special dinner menu?',
        replyTo: student2Message._id.toString(),
      }),
    });

    assert.strictEqual(res.status, 201);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(body.data.message.replyTo);
    assert.strictEqual(body.data.message.replyTo.id, student2Message._id.toString());
    assert.strictEqual(body.data.message.replyTo.sender.anonymousName, ctx.student2.anonymousName);
  });

  it('3. Rejects invalid or malformed replyTo identifier (400 Bad Request)', async () => {
    const res = await fetch(`${ctx.baseUrl}/api/rooms/${ctx.globalRoom._id}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ctx.student2Token}`,
      },
      body: JSON.stringify({
        content: 'Attempting invalid reply ID',
        replyTo: 'not-a-valid-object-id',
      }),
    });

    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.match(body.message, /Invalid replyTo message identifier/);
  });

  it('4. Rejects non-existent replyTo message (404 Not Found)', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await fetch(`${ctx.baseUrl}/api/rooms/${ctx.globalRoom._id}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ctx.student2Token}`,
      },
      body: JSON.stringify({
        content: 'Attempting non-existent reply ID',
        replyTo: fakeId,
      }),
    });

    assert.strictEqual(res.status, 404);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.match(body.message, /message being replied to does not exist/);
  });

  it('5. Rejects cross-room reply attempt (400 Bad Request)', async () => {
    // Attempt to post in Global Room referencing a message that belongs to 2nd Year Room
    const res = await fetch(`${ctx.baseUrl}/api/rooms/${ctx.globalRoom._id}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ctx.student2Token}`,
      },
      body: JSON.stringify({
        content: 'Cross room reply attempt',
        replyTo: secondYearMessage._id.toString(),
      }),
    });

    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.match(body.message, /Cross-room replies are not permitted/);
  });

  it('6. Handles deleted or unavailable original messages gracefully', async () => {
    // 1. Create a temporary message to be deleted
    const tempMsg = await Message.create({
      room: ctx.globalRoom._id,
      sender: ctx.student2._id,
      content: 'This announcement will be deleted soon.',
      anonymousName: ctx.student2.anonymousName,
      anonymousAvatar: ctx.student2.anonymousAvatar,
      senderYear: ctx.student2.year,
    });

    // 2. Student 3 replies to this message
    const replyRes = await fetch(`${ctx.baseUrl}/api/rooms/${ctx.globalRoom._id}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ctx.student3Token}`,
      },
      body: JSON.stringify({
        content: 'Got it, noting this before it is removed.',
        replyTo: tempMsg._id.toString(),
      }),
    });

    assert.strictEqual(replyRes.status, 201);
    const replyBody = await replyRes.json();
    const createdReplyId = replyBody.data.message.id;

    // 3. Student 2 soft-deletes the original message
    const delRes = await fetch(`${ctx.baseUrl}/api/messages/${tempMsg._id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${ctx.student2Token}`,
      },
    });
    assert.strictEqual(delRes.status, 200);

    // 4. Fetch room history and verify the reply reflects "Original message unavailable"
    const historyRes = await fetch(`${ctx.baseUrl}/api/rooms/${ctx.globalRoom._id}/messages`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${ctx.student3Token}`,
      },
    });

    assert.strictEqual(historyRes.status, 200);
    const historyBody = await historyRes.json();
    const foundReply = historyBody.data.messages.find((m) => m.id === createdReplyId);
    assert.ok(foundReply, 'Reply message must be present in history');
    assert.ok(foundReply.replyTo, 'replyTo reference must be present');
    assert.strictEqual(foundReply.replyTo.isDeleted, true);
    assert.strictEqual(foundReply.replyTo.content, 'Original message unavailable');

    // 5. Replying to an already deleted message succeeds and populates safe unavailable excerpt
    const replyToDeletedRes = await fetch(`${ctx.baseUrl}/api/rooms/${ctx.globalRoom._id}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ctx.student3Token}`,
      },
      body: JSON.stringify({
        content: 'Replying to already deleted item',
        replyTo: tempMsg._id.toString(),
      }),
    });

    assert.strictEqual(replyToDeletedRes.status, 201);
    const replyToDeletedBody = await replyToDeletedRes.json();
    assert.strictEqual(replyToDeletedBody.data.message.replyTo.isDeleted, true);
    assert.strictEqual(replyToDeletedBody.data.message.replyTo.content, 'Original message unavailable');
  });

  it('7. Emits reply via Socket.IO and peer receives new_message with populated replyTo', async () => {
    const peerMessagePromise = new Promise((resolve) => {
      socketClient3.on('new_message', (payload) => {
        if (payload.content === 'Real-time socket reply!') {
          resolve(payload);
        }
      });
    });

    // Student 2 sends reply over Socket.IO
    socketClient2.emit(
      'send_message',
      {
        roomId: ctx.globalRoom._id.toString(),
        content: 'Real-time socket reply!',
        replyTo: student3Message._id.toString(),
      },
      (ack) => {
        assert.strictEqual(ack.success, true);
        assert.ok(ack.message.replyTo);
        assert.strictEqual(ack.message.replyTo.id, student3Message._id.toString());
      }
    );

    const receivedPeerMsg = await peerMessagePromise;
    assert.strictEqual(receivedPeerMsg.content, 'Real-time socket reply!');
    assert.strictEqual(receivedPeerMsg.isOwn, false);
    assert.ok(receivedPeerMsg.replyTo);
    assert.strictEqual(receivedPeerMsg.replyTo.id, student3Message._id.toString());
    assert.strictEqual(receivedPeerMsg.replyTo.content, 'I will be working in the library till 10 PM.');
    assert.strictEqual(receivedPeerMsg.replyTo.sender.anonymousName, ctx.student3.anonymousName);
  });
});
