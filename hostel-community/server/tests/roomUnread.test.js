import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { setupTestEnvironment, teardownTestEnvironment } from './testHelper.js';
import Message from '../models/Message.js';
import Room from '../models/Room.js';
import RoomReadState from '../models/RoomReadState.js';

describe('Task 5: Room Unread Messages Suite', () => {
  let env;

  before(async () => {
    env = await setupTestEnvironment();
  });

  after(async () => {
    await teardownTestEnvironment();
  });

  it('1. Rejects unauthenticated request to /api/rooms/unread (401 Unauthorized)', async () => {
    const res = await fetch(`${env.baseUrl}/api/rooms/unread`);
    assert.equal(res.status, 401);
  });

  it('2. 2nd Year student only receives unread data for authorized rooms (Global Room & 2nd Year)', async () => {
    const res = await fetch(`${env.baseUrl}/api/rooms/unread`, {
      headers: { Authorization: `Bearer ${env.student2Token}` },
    });

    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);

    const unread = json.data.unread;
    assert.ok(unread);
    assert.ok('Global Room' in unread);
    assert.ok('2nd Year' in unread);

    // Strictly forbidden: 2nd Year student must NOT receive 3rd Year or 4th Year unread info
    assert.ok(!('3rd Year' in unread));
    assert.ok(!('4th Year' in unread));
    assert.ok(!('1st Year' in unread));
  });

  it('3. 3rd Year student only receives unread data for authorized rooms (Global Room & 3rd Year)', async () => {
    const res = await fetch(`${env.baseUrl}/api/rooms/unread`, {
      headers: { Authorization: `Bearer ${env.student3Token}` },
    });

    assert.equal(res.status, 200);
    const json = await res.json();

    const unread = json.data.unread;
    assert.ok('Global Room' in unread);
    assert.ok('3rd Year' in unread);
    assert.ok(!('2nd Year' in unread));
    assert.ok(!('4th Year' in unread));
    assert.ok(!('1st Year' in unread));
  });

  it('4. Unread count correctly increments when another student posts messages', async () => {
    // Student2 marks global room as read first
    await fetch(`${env.baseUrl}/api/rooms/${env.globalRoom._id}/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${env.student2Token}` },
    });

    // Student3 sends 2 messages in Global Room
    await fetch(`${env.baseUrl}/api/rooms/${env.globalRoom._id}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.student3Token}`,
      },
      body: JSON.stringify({ content: 'Message 1 from Student 3' }),
    });

    await fetch(`${env.baseUrl}/api/rooms/${env.globalRoom._id}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.student3Token}`,
      },
      body: JSON.stringify({ content: 'Message 2 from Student 3' }),
    });

    // Student2 checks unread
    const res = await fetch(`${env.baseUrl}/api/rooms/unread`, {
      headers: { Authorization: `Bearer ${env.student2Token}` },
    });

    const json = await res.json();
    assert.equal(json.data.unread[env.globalRoom._id.toString()], 2);
    assert.equal(json.data.unread['Global Room'], 2);
  });

  it('5. User own messages are NOT counted towards unread count', async () => {
    // Student2 sends their own message in Global Room
    await fetch(`${env.baseUrl}/api/rooms/${env.globalRoom._id}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.student2Token}`,
      },
      body: JSON.stringify({ content: 'Message from myself (Student 2)' }),
    });

    // Unread count for Student2 in Global Room should still be 2 (from Student3), not 3
    const res = await fetch(`${env.baseUrl}/api/rooms/unread`, {
      headers: { Authorization: `Bearer ${env.student2Token}` },
    });

    const json = await res.json();
    assert.equal(json.data.unread[env.globalRoom._id.toString()], 2);
  });

  it('6. Soft-deleted messages are NOT counted towards unread count', async () => {
    // Create a message by Student3 in Global Room and immediately delete it
    const msg = await Message.create({
      room: env.globalRoom._id,
      sender: env.student3._id,
      content: 'This will be deleted',
      isDeleted: true,
      deletedAt: new Date(),
    });

    // Student2 checks unread; deleted message must NOT be counted
    const res = await fetch(`${env.baseUrl}/api/rooms/unread`, {
      headers: { Authorization: `Bearer ${env.student2Token}` },
    });

    const json = await res.json();
    assert.equal(json.data.unread[env.globalRoom._id.toString()], 2);
  });

  it('7. PATCH /api/rooms/:roomId/read marks room as read and resets unread count to 0', async () => {
    const readRes = await fetch(`${env.baseUrl}/api/rooms/${env.globalRoom._id}/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${env.student2Token}` },
    });

    assert.equal(readRes.status, 200);
    const readJson = await readRes.json();
    assert.equal(readJson.data.unreadCount, 0);

    // Verify unread endpoint now reports 0 for Global Room
    const checkRes = await fetch(`${env.baseUrl}/api/rooms/unread`, {
      headers: { Authorization: `Bearer ${env.student2Token}` },
    });

    const checkJson = await checkRes.json();
    assert.equal(checkJson.data.unread[env.globalRoom._id.toString()], 0);
    assert.equal(checkJson.data.unread['Global Room'], 0);
  });

  it('8. Rejects marking read for unauthorized year room (403 Forbidden)', async () => {
    // Student2 (2nd Year) attempts to mark 3rd Year room as read
    const res = await fetch(`${env.baseUrl}/api/rooms/${env.thirdYearRoom._id}/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${env.student2Token}` },
    });

    assert.equal(res.status, 403);
    const json = await res.json();
    assert.equal(json.success, false);
  });

  it('9. Verifies that 1st Year room strictly does NOT exist anywhere', async () => {
    const firstYearRoom = await Room.findOne({
      $or: [
        { name: /1st Year/i },
        { slug: /1st-year/i },
        { allowedYear: '1st Year' },
      ],
    });
    assert.equal(firstYearRoom, null);

    const allRooms = await Room.find({});
    const names = allRooms.map((r) => r.name);
    assert.ok(!names.includes('1st Year'));
    assert.ok(!names.includes('First Year'));
  });
});
