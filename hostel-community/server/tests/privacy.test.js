import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
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
});
