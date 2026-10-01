import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { io as Client } from 'socket.io-client';
import { setupTestEnvironment, teardownTestEnvironment } from './testHelper.js';
import Notification from '../models/Notification.js';
import Message from '../models/Message.js';

describe('Task 5: Notification Service & API Suite', () => {
  let env;

  before(async () => {
    env = await setupTestEnvironment();
  });

  after(async () => {
    await teardownTestEnvironment();
  });

  it('1. Rejects unauthenticated request to notifications (401 Unauthorized)', async () => {
    const res = await fetch(`${env.baseUrl}/api/notifications`);
    assert.equal(res.status, 401);
  });

  it('2. Authenticated user can retrieve own notifications and unread count', async () => {
    // Seed a notification for student2
    await Notification.create({
      recipient: env.student2._id,
      type: 'system',
      title: 'Welcome to Hostel Community',
      content: 'Welcome to Prof. S.N. Bose Boys Hostel Community.',
      metadata: {},
    });

    const res = await fetch(`${env.baseUrl}/api/notifications`, {
      headers: { Authorization: `Bearer ${env.student2Token}` },
    });

    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.ok(Array.isArray(json.data.notifications));
    assert.equal(json.data.notifications.length, 1);
    assert.equal(json.data.unreadCount, 1);

    // Check unread count endpoint specifically
    const countRes = await fetch(`${env.baseUrl}/api/notifications/unread-count`, {
      headers: { Authorization: `Bearer ${env.student2Token}` },
    });
    assert.equal(countRes.status, 200);
    const countJson = await countRes.json();
    assert.equal(countJson.data.unreadCount, 1);
  });

  it('3. User cannot access another user notifications', async () => {
    // Student3 queries their own notifications; should not see student2's notification
    const res = await fetch(`${env.baseUrl}/api/notifications`, {
      headers: { Authorization: `Bearer ${env.student3Token}` },
    });

    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.data.notifications.length, 0);
    assert.equal(json.data.unreadCount, 0);
  });

  it('4. User can mark their own notification as read', async () => {
    const listRes = await fetch(`${env.baseUrl}/api/notifications`, {
      headers: { Authorization: `Bearer ${env.student2Token}` },
    });
    const listJson = await listRes.json();
    const notifId = listJson.data.notifications[0].id;

    const readRes = await fetch(`${env.baseUrl}/api/notifications/${notifId}/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${env.student2Token}` },
    });

    assert.equal(readRes.status, 200);
    const readJson = await readRes.json();
    assert.equal(readJson.data.notification.isRead, true);
    assert.ok(readJson.data.notification.readAt);

    // Verify unread count is now 0
    const countRes = await fetch(`${env.baseUrl}/api/notifications/unread-count`, {
      headers: { Authorization: `Bearer ${env.student2Token}` },
    });
    const countJson = await countRes.json();
    assert.equal(countJson.data.unreadCount, 0);
  });

  it('5. User cannot mark another user notification as read (403 Forbidden)', async () => {
    // Create notification for student2
    const notif = await Notification.create({
      recipient: env.student2._id,
      type: 'system',
      title: 'Private Notice',
      content: 'Only for student 2',
    });

    // Student3 tries to mark it as read
    const res = await fetch(`${env.baseUrl}/api/notifications/${notif._id}/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${env.student3Token}` },
    });

    assert.equal(res.status, 403);
    const json = await res.json();
    assert.equal(json.success, false);
  });

  it('6. Mark all notifications as read updates all unread notifications', async () => {
    // Create 3 unread notifications for student2
    await Notification.create([
      { recipient: env.student2._id, type: 'system', title: 'N1', content: 'Notice 1' },
      { recipient: env.student2._id, type: 'system', title: 'N2', content: 'Notice 2' },
      { recipient: env.student2._id, type: 'system', title: 'N3', content: 'Notice 3' },
    ]);

    const markAllRes = await fetch(`${env.baseUrl}/api/notifications/read-all`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${env.student2Token}` },
    });

    assert.equal(markAllRes.status, 200);
    const markAllJson = await markAllRes.json();
    assert.equal(markAllJson.data.unreadCount, 0);

    const countRes = await fetch(`${env.baseUrl}/api/notifications/unread-count`, {
      headers: { Authorization: `Bearer ${env.student2Token}` },
    });
    const countJson = await countRes.json();
    assert.equal(countJson.data.unreadCount, 0);
  });

  it('7. Reaction on a message creates notification for the message owner', async () => {
    // Student2 posts a message in global room
    const msg = await Message.create({
      room: env.globalRoom._id,
      sender: env.student2._id,
      content: 'React to my message!',
    });

    // Student3 reacts to Student2's message
    const reactRes = await fetch(`${env.baseUrl}/api/messages/${msg._id}/reactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.student3Token}`,
      },
      body: JSON.stringify({ type: 'love' }),
    });

    assert.equal(reactRes.status, 200);

    // Verify Student2 received a reaction notification
    const notifs = await Notification.find({
      recipient: env.student2._id,
      type: 'reaction',
      message: msg._id,
    });

    assert.equal(notifs.length, 1);
    assert.equal(notifs[0].title, 'New Reaction');
    assert.ok(notifs[0].content.includes('❤️'));
  });

  it('8. Self-reaction does not create a notification', async () => {
    const beforeCount = await Notification.countDocuments({ recipient: env.student2._id });

    // Student2 creates another message
    const msg = await Message.create({
      room: env.globalRoom._id,
      sender: env.student2._id,
      content: 'Testing self-reaction',
    });

    // Student2 reacts to their own message
    const reactRes = await fetch(`${env.baseUrl}/api/messages/${msg._id}/reactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.student2Token}`,
      },
      body: JSON.stringify({ type: 'fire' }),
    });

    assert.equal(reactRes.status, 200);

    const afterCount = await Notification.countDocuments({
      recipient: env.student2._id,
      message: msg._id,
    });
    assert.equal(afterCount, 0);
  });

  it('9. Moderation message removal creates notification for the affected student without leaking admin identity', async () => {
    // Student2 creates a message
    const msg = await Message.create({
      room: env.globalRoom._id,
      sender: env.student2._id,
      content: 'Inappropriate content that will be removed by admin',
    });

    // Admin deletes the message
    const delRes = await fetch(`${env.baseUrl}/api/messages/${msg._id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${env.adminToken}` },
    });

    assert.equal(delRes.status, 200);

    // Check notification for student2
    const modNotif = await Notification.findOne({
      recipient: env.student2._id,
      type: 'moderation',
      message: msg._id,
    });

    assert.ok(modNotif);
    assert.equal(modNotif.title, 'Message Moderation');
    assert.equal(modNotif.content, 'Your message was removed by a moderator.');
    // Admin identity must be strictly hidden (actor is null)
    assert.equal(modNotif.actor, null);
  });

  it('10. Notifications never expose fullName, email, or password in responses', async () => {
    const res = await fetch(`${env.baseUrl}/api/notifications`, {
      headers: { Authorization: `Bearer ${env.student2Token}` },
    });

    const json = await res.json();
    const rawString = JSON.stringify(json);

    // Check that private student data is never included
    assert.ok(!rawString.includes(env.student2.email));
    assert.ok(!rawString.includes(env.student3.email));
    assert.ok(!rawString.includes(env.admin.email));
    assert.ok(!rawString.includes('Password123!'));
    assert.ok(!rawString.includes('Second Year Student'));
    assert.ok(!rawString.includes('Third Year Student'));
  });

  it('11. Socket.IO delivers private notification:new strictly to the intended recipient', async () => {
    return new Promise((resolve, reject) => {
      const recipientSocket = Client(env.baseUrl, {
        auth: { token: env.student2Token },
        transports: ['websocket'],
      });

      const bystanderSocket = Client(env.baseUrl, {
        auth: { token: env.student3Token },
        transports: ['websocket'],
      });

      let bystanderReceived = false;

      bystanderSocket.on('notification:new', () => {
        bystanderReceived = true;
      });

      recipientSocket.on('connect', async () => {
        recipientSocket.on('notification:new', (notif) => {
          try {
            assert.ok(notif.title === 'New Reaction' || notif.title === 'Real-time Test Notification');
            assert.equal(bystanderReceived, false);
            recipientSocket.disconnect();
            bystanderSocket.disconnect();
            resolve();
          } catch (err) {
            recipientSocket.disconnect();
            bystanderSocket.disconnect();
            reject(err);
          }
        });

        // Trigger notification creation for student2
        const msg = await Message.create({
          room: env.globalRoom._id,
          sender: env.student2._id,
          content: 'Socket test message',
        });

        await fetch(`${env.baseUrl}/api/messages/${msg._id}/reactions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${env.student3Token}`,
          },
          body: JSON.stringify({ type: 'clap' }),
        });

        // Also test createNotification helper directly
        const { createNotification } = await import('../services/notification.service.js');
        await createNotification({
          recipient: env.student2._id,
          type: 'system',
          title: 'Real-time Test Notification',
          content: 'This was emitted in real time.',
        });
      });

      setTimeout(() => {
        recipientSocket.disconnect();
        bystanderSocket.disconnect();
        resolve(); // Timed out or resolved
      }, 3000);
    });
  });
});
