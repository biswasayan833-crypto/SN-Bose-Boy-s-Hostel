import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { io as Client } from 'socket.io-client';
import { setupTestEnvironment, teardownTestEnvironment } from './testHelper.js';
import User from '../models/User.js';

describe('Task: Unique Anonymous Identity & Historical Preservation Suite', () => {
  let env;
  let userAToken;
  let userAId;
  let userBToken;
  let userBId;
  let socketClient;

  before(async () => {
    env = await setupTestEnvironment();
  });

  after(async () => {
    if (socketClient) {
      socketClient.disconnect();
    }
    await teardownTestEnvironment();
  });

  // --- IDENTITY UNIQUENESS ---

  it('1. User A can register with an available identity', async () => {
    const res = await fetch(`${env.baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Alice Walker',
        email: 'alice.unique@snbose.edu',
        password: 'Password123!',
        year: '2nd Year',
        anonymousName: 'Quiet Tiger',
        anonymousAvatar: 'avatar-01',
      }),
    });

    assert.equal(res.status, 201);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.equal(json.data.user.anonymousName, 'Quiet Tiger');
    assert.equal(json.data.user.anonymousAvatar, 'avatar-01');

    userAToken = json.data.token;
    userAId = json.data.user.id;
  });

  it('2. User B cannot use the exact same identity (409 Conflict)', async () => {
    const res = await fetch(`${env.baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Bob Smith',
        email: 'bob.unique@snbose.edu',
        password: 'Password123!',
        year: '3rd Year',
        anonymousName: 'Quiet Tiger',
        anonymousAvatar: 'avatar-01',
      }),
    });

    assert.equal(res.status, 409);
    const json = await res.json();
    assert.equal(json.success, false);
    assert.match(json.message, /already in use/i);
  });

  it('3. Case-insensitive duplicate names are rejected', async () => {
    const res = await fetch(`${env.baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Charlie Brown',
        email: 'charlie.case@snbose.edu',
        password: 'Password123!',
        year: '4th Year',
        anonymousName: 'quiet tiger',
        anonymousAvatar: 'avatar-01',
      }),
    });

    assert.equal(res.status, 409);
    const json = await res.json();
    assert.equal(json.success, false);
    assert.match(json.message, /already in use/i);
  });

  it('4. Same anonymous name with different avatar is allowed', async () => {
    const res = await fetch(`${env.baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Daniel Craig',
        email: 'daniel.diffavatar@snbose.edu',
        password: 'Password123!',
        year: '2nd Year',
        anonymousName: 'Quiet Tiger',
        anonymousAvatar: 'avatar-02',
      }),
    });

    assert.equal(res.status, 201);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.equal(json.data.user.anonymousName, 'Quiet Tiger');
    assert.equal(json.data.user.anonymousAvatar, 'avatar-02');

    userBToken = json.data.token;
    userBId = json.data.user.id;
  });

  it('5. Different anonymous name with same avatar is allowed', async () => {
    const res = await fetch(`${env.baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Evan Wright',
        email: 'evan.diffname@snbose.edu',
        password: 'Password123!',
        year: '3rd Year',
        anonymousName: 'Silent Fox',
        anonymousAvatar: 'avatar-01',
      }),
    });

    assert.equal(res.status, 201);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.equal(json.data.user.anonymousName, 'Silent Fox');
    assert.equal(json.data.user.anonymousAvatar, 'avatar-01');
  });

  it('6. User can retain their own current identity', async () => {
    // User A updates their bio while submitting the exact same name and avatar
    const res = await fetch(`${env.baseUrl}/api/profile/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userAToken}`,
      },
      body: JSON.stringify({
        anonymousName: 'Quiet Tiger',
        anonymousAvatar: 'avatar-01',
        bio: 'Preserving my quiet identity.',
      }),
    });

    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.equal(json.data.profile.anonymousName, 'Quiet Tiger');
    assert.equal(json.data.profile.anonymousAvatar, 'avatar-01');
    assert.equal(json.data.profile.bio, 'Preserving my quiet identity.');
  });

  it('7. User can change to another unused identity', async () => {
    const res = await fetch(`${env.baseUrl}/api/profile/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userAToken}`,
      },
      body: JSON.stringify({
        anonymousName: 'Calm Panda',
        anonymousAvatar: 'avatar-06',
        bio: 'Peaceful resident.',
      }),
    });

    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.equal(json.data.profile.anonymousName, 'Calm Panda');
    assert.equal(json.data.profile.anonymousAvatar, 'avatar-06');
  });

  it('8. Duplicate identity update returns HTTP 409', async () => {
    // User B tries to change to Calm Panda + avatar-06 (now owned by User A)
    const res = await fetch(`${env.baseUrl}/api/profile/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userBToken}`,
      },
      body: JSON.stringify({
        anonymousName: 'calm panda',
        anonymousAvatar: 'avatar-06',
      }),
    });

    assert.equal(res.status, 409);
    const json = await res.json();
    assert.equal(json.success, false);
    assert.equal(
      json.message,
      'This anonymous identity is already in use. Please choose another.'
    );
  });

  it("9. Duplicate identity does not reveal the existing owner's identity", async () => {
    const res = await fetch(`${env.baseUrl}/api/profile/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userBToken}`,
      },
      body: JSON.stringify({
        anonymousName: 'Calm Panda',
        anonymousAvatar: 'avatar-06',
      }),
    });

    assert.equal(res.status, 409);
    const rawResponse = await res.text();

    // Must never leak Alice Walker or alice.unique@snbose.edu
    assert.equal(rawResponse.includes('Alice Walker'), false);
    assert.equal(rawResponse.includes('alice.unique@snbose.edu'), false);
    assert.equal(rawResponse.includes(userAId), false);
  });

  // --- HISTORICAL MESSAGES ---

  let msg1Id;
  let userCToken;

  it('10. User posts message as Identity A', async () => {
    // Register User C with Identity A (Night Owl + avatar-05)
    const regRes = await fetch(`${env.baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Claire Fisher',
        email: 'claire.history@snbose.edu',
        password: 'Password123!',
        year: '2nd Year',
        anonymousName: 'Night Owl',
        anonymousAvatar: 'avatar-05',
      }),
    });
    const regJson = await regRes.json();
    userCToken = regJson.data.token;

    // Post message
    const msgRes = await fetch(`${env.baseUrl}/api/rooms/${env.globalRoom._id}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userCToken}`,
      },
      body: JSON.stringify({
        content: 'Historical message from Identity A.',
      }),
    });

    assert.equal(msgRes.status, 201);
    const msgJson = await msgRes.json();
    msg1Id = msgJson.data.message.id;
    assert.equal(msgJson.data.message.sender.anonymousName, 'Night Owl');
    assert.equal(msgJson.data.message.sender.anonymousAvatar, 'avatar-05');
  });

  it('11. User changes identity to Identity B', async () => {
    const updateRes = await fetch(`${env.baseUrl}/api/profile/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userCToken}`,
      },
      body: JSON.stringify({
        anonymousName: 'Swift Hawk',
        anonymousAvatar: 'avatar-01',
      }),
    });

    assert.equal(updateRes.status, 200);
    const updateJson = await updateRes.json();
    assert.equal(updateJson.data.profile.anonymousName, 'Swift Hawk');
    assert.equal(updateJson.data.profile.anonymousAvatar, 'avatar-01');
  });

  it('12. Old message still shows Identity A', async () => {
    const historyRes = await fetch(`${env.baseUrl}/api/rooms/${env.globalRoom._id}/messages`, {
      headers: { Authorization: `Bearer ${env.student2Token}` },
    });

    assert.equal(historyRes.status, 200);
    const historyJson = await historyRes.json();
    const oldMsg = historyJson.data.messages.find((m) => m.id === msg1Id);

    assert.ok(oldMsg);
    assert.equal(oldMsg.sender.anonymousName, 'Night Owl');
    assert.equal(oldMsg.sender.anonymousAvatar, 'avatar-05');
  });

  it('13. New message shows Identity B', async () => {
    const msgRes = await fetch(`${env.baseUrl}/api/rooms/${env.globalRoom._id}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userCToken}`,
      },
      body: JSON.stringify({
        content: 'New message from Identity B.',
      }),
    });

    assert.equal(msgRes.status, 201);
    const msgJson = await msgRes.json();
    assert.equal(msgJson.data.message.sender.anonymousName, 'Swift Hawk');
    assert.equal(msgJson.data.message.sender.anonymousAvatar, 'avatar-01');
  });

  // --- PRIVACY PROTECTION ---

  it('14. No fullName in public message payload', async () => {
    const res = await fetch(`${env.baseUrl}/api/rooms/${env.globalRoom._id}/messages`, {
      headers: { Authorization: `Bearer ${env.student2Token}` },
    });
    const text = await res.text();

    assert.equal(text.includes('Alice Walker'), false);
    assert.equal(text.includes('Bob Smith'), false);
    assert.equal(text.includes('Claire Fisher'), false);
    assert.equal(text.includes('Second Year Student'), false);
  });

  it('15. No email in public message payload', async () => {
    const res = await fetch(`${env.baseUrl}/api/rooms/${env.globalRoom._id}/messages`, {
      headers: { Authorization: `Bearer ${env.student2Token}` },
    });
    const text = await res.text();

    assert.equal(text.includes('alice.unique@snbose.edu'), false);
    assert.equal(text.includes('bob.unique@snbose.edu'), false);
    assert.equal(text.includes('claire.history@snbose.edu'), false);
  });

  it('16. No password/hash in public payload', async () => {
    const res = await fetch(`${env.baseUrl}/api/rooms/${env.globalRoom._id}/messages`, {
      headers: { Authorization: `Bearer ${env.student2Token}` },
    });
    const text = await res.text();

    assert.equal(text.includes('password'), false);
    assert.equal(text.includes('passwordHash'), false);
    assert.equal(text.includes('Password123!'), false);
  });

  it('17. No private identity information in Socket.IO payload', async () => {
    socketClient = Client(env.baseUrl, {
      auth: { token: userCToken },
      transports: ['websocket'],
    });

    await new Promise((resolve) => socketClient.on('connect', resolve));

    // Join room
    await new Promise((resolve) =>
      socketClient.emit('join_room', { roomId: env.globalRoom._id.toString() }, resolve)
    );

    // Send a message over Socket.IO and listen for broadcast
    const receivedPayload = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Socket.IO message timeout')), 5000);

      socketClient.on('new_message', (payload) => {
        clearTimeout(timer);
        resolve(payload);
      });

      socketClient.emit('send_message', {
        roomId: env.globalRoom._id.toString(),
        content: 'Socket message testing privacy payload.',
      });
    });

    assert.ok(receivedPayload);
    assert.equal(receivedPayload.content, 'Socket message testing privacy payload.');
    assert.equal(receivedPayload.sender.anonymousName, 'Swift Hawk');
    assert.equal(receivedPayload.sender.anonymousAvatar, 'avatar-01');

    const str = JSON.stringify(receivedPayload);
    assert.equal(str.includes('Claire Fisher'), false);
    assert.equal(str.includes('claire.history@snbose.edu'), false);
    assert.equal(str.includes('password'), false);
    assert.equal(str.includes('passwordHash'), false);
  });
});
