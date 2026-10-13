import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { io as Client } from 'socket.io-client';
import { setupTestEnvironment, teardownTestEnvironment } from './testHelper.js';
import Message from '../models/Message.js';
import Report from '../models/Report.js';
import Room from '../models/Room.js';

describe('Task 4: Anonymous Privacy & Policy Suite', () => {
  let ctx;
  let testMsg;

  before(async () => {
    ctx = await setupTestEnvironment();

    testMsg = await Message.create({
      room: ctx.globalRoom._id,
      sender: ctx.student2._id,
      content: 'Testing privacy and anonymity guarantees.',
    });

    await Report.create({
      message: testMsg._id,
      reportedBy: ctx.student3._id,
      reason: 'spam',
    });
  });

  after(async () => {
    await teardownTestEnvironment();
  });

  it('1. Verifies room messages never leak fullName, email, or password', async () => {
    const res = await fetch(`${ctx.baseUrl}/api/rooms/${ctx.globalRoom._id}/messages`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${ctx.student3Token}`,
      },
    });

    assert.strictEqual(res.status, 200);
    const rawText = await res.text();

    assert.strictEqual(rawText.includes(ctx.student2.fullName), false, 'fullName must not be leaked');
    assert.strictEqual(rawText.includes(ctx.student2.email), false, 'email must not be leaked');
    assert.strictEqual(rawText.includes('password'), false, 'password must not be leaked');
    assert.strictEqual(rawText.includes(ctx.student2.anonymousName), true, 'anonymousName should be present');
  });

  it('2. Verifies reaction API never leaks fullName, email, or password', async () => {
    const res = await fetch(`${ctx.baseUrl}/api/messages/${testMsg._id}/reactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ctx.student3Token}`,
      },
      body: JSON.stringify({ type: 'fire' }),
    });

    assert.strictEqual(res.status, 200);
    const rawText = await res.text();

    assert.strictEqual(rawText.includes(ctx.student3.fullName), false);
    assert.strictEqual(rawText.includes(ctx.student3.email), false);
    assert.strictEqual(rawText.includes('password'), false);
  });

  it('3. Verifies admin reports never leak reporter or sender email or password', async () => {
    const res = await fetch(`${ctx.baseUrl}/api/admin/reports`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${ctx.adminToken}`,
      },
    });

    assert.strictEqual(res.status, 200);
    const rawText = await res.text();

    assert.strictEqual(rawText.includes(ctx.student2.email), false);
    assert.strictEqual(rawText.includes(ctx.student3.email), false);
    assert.strictEqual(rawText.includes('password'), false);
  });

  it('4. Verifies no 1st Year rooms exist in database or API', async () => {
    const rooms = await Room.find({});
    const roomNamesAndSlugs = rooms.map((r) => `${r.name} ${r.slug} ${r.allowedYear}`).join(' ');

    assert.strictEqual(
      roomNamesAndSlugs.toLowerCase().includes('1st year'),
      false,
      'Must NOT contain any reference to 1st Year'
    );
    assert.strictEqual(
      roomNamesAndSlugs.toLowerCase().includes('1st-year'),
      false,
      'Must NOT contain any slug reference to 1st-year'
    );

    // Verify rooms are exactly 4: Global, 2nd, 3rd, 4th
    assert.strictEqual(rooms.length, 4);
  });

  it('5. Verifies message history does not expose sender internal MongoDB ID to peers, but allows author to identify own message', async () => {
    // Student 3 also posts a message in global room
    const student3Msg = await Message.create({
      room: ctx.globalRoom._id,
      sender: ctx.student3._id,
      content: 'Hello from student 3',
    });

    // Student 3 fetches room messages
    const res = await fetch(`${ctx.baseUrl}/api/rooms/${ctx.globalRoom._id}/messages`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${ctx.student3Token}`,
      },
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);

    const peerMsg = body.data.messages.find((m) => m.id === testMsg._id.toString());
    assert.ok(peerMsg, 'Student 2 message must be present in history');
    assert.strictEqual(peerMsg.sender.id, undefined, 'Sender internal DB id must NOT be exposed to peer');
    assert.strictEqual(peerMsg.isOwn, false, 'Peer message must have isOwn: false');
    assert.ok(peerMsg.sender.anonymousName, 'Peer message must retain anonymousName');

    // Verify own message for Student 3
    const ownMsg = body.data.messages.find((m) => m.id === student3Msg._id.toString());
    assert.ok(ownMsg, 'Student 3 message must be present in history');
    assert.strictEqual(ownMsg.sender.id, ctx.student3._id.toString(), 'Author must receive own sender.id');
    assert.strictEqual(ownMsg.isOwn, true, 'Author message must have isOwn: true');

    // Double check that raw JSON text for Student 3 does NOT contain Student 2 internal DB ID
    const rawText = JSON.stringify(body);
    assert.strictEqual(rawText.includes(ctx.student2._id.toString()), false, 'Raw payload to Student 3 must never leak Student 2 _id');
  });

  it('6. Verifies Socket.IO new_message delivers author payload to multiple author tabs and peer-safe payload to peers without duplicate events', async () => {
    // Tab 1 for student 2
    const socketClient2Tab1 = Client(ctx.baseUrl, {
      auth: { token: ctx.student2Token },
      transports: ['websocket'],
    });

    // Tab 2 for student 2 (simultaneous author session)
    const socketClient2Tab2 = Client(ctx.baseUrl, {
      auth: { token: ctx.student2Token },
      transports: ['websocket'],
    });

    // Peer socket for student 3
    const socketClient3 = Client(ctx.baseUrl, {
      auth: { token: ctx.student3Token },
      transports: ['websocket'],
    });

    try {
      await Promise.all([
        new Promise((resolve) => socketClient2Tab1.on('connect', resolve)),
        new Promise((resolve) => socketClient2Tab2.on('connect', resolve)),
        new Promise((resolve) => socketClient3.on('connect', resolve)),
      ]);

      await Promise.all([
        new Promise((resolve) =>
          socketClient2Tab1.emit('join_room', { roomId: ctx.globalRoom._id.toString() }, resolve)
        ),
        new Promise((resolve) =>
          socketClient2Tab2.emit('join_room', { roomId: ctx.globalRoom._id.toString() }, resolve)
        ),
        new Promise((resolve) =>
          socketClient3.emit('join_room', { roomId: ctx.globalRoom._id.toString() }, resolve)
        ),
      ]);

      const tab1Events = [];
      const tab2Events = [];
      const peerEvents = [];

      socketClient2Tab1.on('new_message', (msg) => tab1Events.push(msg));
      socketClient2Tab2.on('new_message', (msg) => tab2Events.push(msg));
      socketClient3.on('new_message', (msg) => peerEvents.push(msg));

      socketClient2Tab1.emit('send_message', {
        roomId: ctx.globalRoom._id.toString(),
        content: 'Socket multi-tab privacy verification.',
      });

      // Wait 300ms to allow all socket emissions and verify no duplicates
      await new Promise((resolve) => setTimeout(resolve, 300));

      // 1. Author Tab 1 receives exactly 1 event with isOwn: true and author ID
      assert.strictEqual(tab1Events.length, 1, 'Author Tab 1 must receive exactly 1 new_message event');
      assert.strictEqual(tab1Events[0].isOwn, true, 'Author Tab 1 must have isOwn: true');
      assert.strictEqual(tab1Events[0].sender.id, ctx.student2._id.toString());

      // 2. Author Tab 2 receives exactly 1 event with isOwn: true and author ID (no peer payload received)
      assert.strictEqual(tab2Events.length, 1, 'Author Tab 2 must receive exactly 1 new_message event');
      assert.strictEqual(tab2Events[0].isOwn, true, 'Author Tab 2 must have isOwn: true');
      assert.strictEqual(tab2Events[0].sender.id, ctx.student2._id.toString());

      // 3. Peer socket receives exactly 1 peer-safe event without author ID
      assert.strictEqual(peerEvents.length, 1, 'Peer socket must receive exactly 1 new_message event');
      assert.strictEqual(peerEvents[0].isOwn, false, 'Peer socket must have isOwn: false');
      assert.strictEqual(peerEvents[0].sender.id, undefined, 'Peer socket must not receive author DB id');
      assert.strictEqual(
        JSON.stringify(peerEvents[0]).includes(ctx.student2._id.toString()),
        false,
        'Peer payload must not contain author MongoDB _id'
      );
    } finally {
      socketClient2Tab1.disconnect();
      socketClient2Tab2.disconnect();
      socketClient3.disconnect();
    }
  });

  it('7. Verifies room:unread_updated does not leak senderId', async () => {
    const socketClient3 = Client(ctx.baseUrl, {
      auth: { token: ctx.student3Token },
      transports: ['websocket'],
    });

    try {
      await new Promise((resolve) => socketClient3.on('connect', resolve));
      await new Promise((resolve) =>
        socketClient3.emit('join_room', { roomId: ctx.globalRoom._id.toString() }, resolve)
      );

      let unreadPayload = null;
      socketClient3.on('room:unread_updated', (data) => {
        unreadPayload = data;
      });

      // Student 2 posts a message via REST
      await fetch(`${ctx.baseUrl}/api/rooms/${ctx.globalRoom._id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ctx.student2Token}`,
        },
        body: JSON.stringify({ content: 'Unread notification test message' }),
      });

      // Wait a moment for socket event
      await new Promise((resolve) => setTimeout(resolve, 200));

      if (unreadPayload) {
        assert.strictEqual(unreadPayload.senderId, undefined, 'unreadPayload must not contain senderId');
        assert.strictEqual(
          JSON.stringify(unreadPayload).includes(ctx.student2._id.toString()),
          false,
          'unreadPayload must not contain author DB id'
        );
      }
    } finally {
      socketClient3.disconnect();
    }
  });

  it('8. Verifies unauthorized user cannot delete another resident message (authorization preserved)', async () => {
    const res = await fetch(`${ctx.baseUrl}/api/messages/${testMsg._id}`, {
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

  it('9. Verifies reaction payloads never leak reactor user IDs in REST or Socket.IO while preserving ownership & authorization', async () => {
    // Student 2 reacts to testMsg with 'like'
    const reactRes = await fetch(`${ctx.baseUrl}/api/messages/${testMsg._id}/reactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ctx.student2Token}`,
      },
      body: JSON.stringify({ type: 'like' }),
    });

    assert.strictEqual(reactRes.status, 200);
    const reactBody = await reactRes.json();
    assert.strictEqual(reactBody.success, true);
    // Reactor receives userReactions and reactedByMe: true for 'like'
    assert.strictEqual(reactBody.data.message.userReactions.includes('like'), true);
    const likeReaction = reactBody.data.message.reactions.find((r) => r.type === 'like');
    assert.ok(likeReaction);
    assert.strictEqual(likeReaction.reactedByMe, true);
    assert.strictEqual(likeReaction.user, undefined, 'Reactor payload must not expose raw user ID');

    // Peer (Student 3) fetches room messages
    const peerRes = await fetch(`${ctx.baseUrl}/api/rooms/${ctx.globalRoom._id}/messages`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${ctx.student3Token}`,
      },
    });

    assert.strictEqual(peerRes.status, 200);
    const peerBody = await peerRes.json();
    const peerMsg = peerBody.data.messages.find((m) => m.id === testMsg._id.toString());
    assert.ok(peerMsg);
    const peerLikeReaction = peerMsg.reactions.find((r) => r.type === 'like');
    assert.ok(peerLikeReaction);
    assert.strictEqual(peerLikeReaction.type, 'like');
    assert.strictEqual(peerLikeReaction.user, undefined, 'Peer must NOT receive reactor user ID in reactions');
    assert.strictEqual(peerLikeReaction.reactedByMe, undefined, 'Peer must NOT receive reactedByMe flag for another student');
    assert.strictEqual(peerMsg.userReactions.includes('like'), false, 'Peer userReactions must not include like');
    assert.strictEqual(peerMsg.userReactions.includes('fire'), true, 'Student 3 userReactions must include own reaction');

    // Double check raw text sent to peer does not contain student 2 DB id
    const peerRawText = JSON.stringify(peerBody);
    assert.strictEqual(
      peerRawText.includes(ctx.student2._id.toString()),
      false,
      'Peer message history JSON must not contain reactor MongoDB ID'
    );

    // Socket test: Student 3 listens for reaction_updated
    const socketClient3 = Client(ctx.baseUrl, {
      auth: { token: ctx.student3Token },
      transports: ['websocket'],
    });

    try {
      await new Promise((resolve) => socketClient3.on('connect', resolve));
      await new Promise((resolve) =>
        socketClient3.emit('join_room', { roomId: ctx.globalRoom._id.toString() }, resolve)
      );

      const reactionUpdatedPromise = new Promise((resolve) => {
        socketClient3.on('reaction_updated', resolve);
      });

      // Student 2 adds 'clap' reaction via REST
      await fetch(`${ctx.baseUrl}/api/messages/${testMsg._id}/reactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ctx.student2Token}`,
        },
        body: JSON.stringify({ type: 'clap' }),
      });

      const socketPayload = await reactionUpdatedPromise;
      assert.ok(socketPayload);
      assert.strictEqual(socketPayload.reactionCounts.clap, 1);
      assert.strictEqual(
        socketPayload.reactions.some((r) => r.user !== undefined),
        false,
        'Socket reaction_updated broadcast must not contain user field'
      );
      assert.strictEqual(
        JSON.stringify(socketPayload).includes(ctx.student2._id.toString()),
        false,
        'Socket reaction_updated broadcast must not contain reactor MongoDB ID'
      );
    } finally {
      socketClient3.disconnect();
    }

    // Authorization: Student 3 cannot remove Student 2 reaction
    const unauthDeleteRes = await fetch(`${ctx.baseUrl}/api/messages/${testMsg._id}/reactions/like`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${ctx.student3Token}`,
      },
    });
    assert.strictEqual(unauthDeleteRes.status, 404);

    // Owner (Student 2) can remove own reaction
    const authDeleteRes = await fetch(`${ctx.baseUrl}/api/messages/${testMsg._id}/reactions/like`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${ctx.student2Token}`,
      },
    });
    assert.strictEqual(authDeleteRes.status, 200);
  });

  it('10. Verifies notification payloads never expose actor MongoDB ID', async () => {
    // Student 3 reacts to testMsg (owned by Student 2), triggering a notification for Student 2
    await fetch(`${ctx.baseUrl}/api/messages/${testMsg._id}/reactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ctx.student3Token}`,
      },
      body: JSON.stringify({ type: 'love' }),
    });

    const notifRes = await fetch(`${ctx.baseUrl}/api/notifications`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${ctx.student2Token}`,
      },
    });

    assert.strictEqual(notifRes.status, 200);
    const notifBody = await notifRes.json();
    assert.strictEqual(notifBody.success, true);
    assert.ok(notifBody.data.notifications.length > 0);

    const reactionNotif = notifBody.data.notifications.find((n) => n.type === 'reaction');
    assert.ok(reactionNotif, 'Reaction notification must exist');
    assert.ok(reactionNotif.actor, 'Actor metadata must exist');
    assert.ok(reactionNotif.actor.anonymousName, 'Actor must retain anonymousName');
    assert.ok(reactionNotif.actor.anonymousAvatar, 'Actor must retain anonymousAvatar');
    assert.strictEqual(reactionNotif.actor.id, undefined, 'Actor must NOT expose internal MongoDB id');
    assert.strictEqual(reactionNotif.actor._id, undefined, 'Actor must NOT expose internal MongoDB _id');

    // Verify raw JSON does not leak actor's DB _id
    const rawNotifJson = JSON.stringify(notifBody);
    assert.strictEqual(
      rawNotifJson.includes(ctx.student3._id.toString()),
      false,
      'Notification JSON must not contain actor internal MongoDB _id'
    );
  });
});
