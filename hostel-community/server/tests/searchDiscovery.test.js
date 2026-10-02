import test from 'node:test';
import assert from 'node:assert/strict';
import { setupTestEnvironment, teardownTestEnvironment } from './testHelper.js';
import Message from '../models/Message.js';
import Announcement from '../models/Announcement.js';
import Poll from '../models/Poll.js';

test.describe('Task 9: Search & Discovery Suite', () => {
  let env;
  let globalMsg1;
  let globalMsg2;
  let secondYearMsg;
  let thirdYearMsg;
  let softDeletedMsg;
  let globalAnnouncement;
  let thirdYearAnnouncement;
  let globalPoll;
  let thirdYearPoll;

  test.before(async () => {
    env = await setupTestEnvironment();

    // 1. Seed messages across rooms
    globalMsg1 = await Message.create({
      room: env.globalRoom._id,
      sender: env.student2._id,
      content: 'Important notice regarding hostel library timings and quiet hours',
      anonymousName: 'Falcon Wing',
      anonymousAvatar: '🦅',
      senderYear: '2nd Year',
    });

    globalMsg2 = await Message.create({
      room: env.globalRoom._id,
      sender: env.student3._id,
      content: 'Is anyone going to the mess hall for dinner right now?',
      anonymousName: 'Shadow Tiger',
      anonymousAvatar: '🐅',
      senderYear: '3rd Year',
      attachment: {
        originalName: 'dinner_menu.pdf',
        storedName: 'uuid-1234.pdf',
        mimeType: 'application/pdf',
        size: 10240,
        url: '/api/messages/dummy/attachment',
      },
    });

    secondYearMsg = await Message.create({
      room: env.secondYearRoom._id,
      sender: env.student2._id,
      content: '2nd Year robotics project study group meeting at 6 PM',
      anonymousName: 'Falcon Wing',
      anonymousAvatar: '🦅',
      senderYear: '2nd Year',
    });

    thirdYearMsg = await Message.create({
      room: env.thirdYearRoom._id,
      sender: env.student3._id,
      content: '3rd Year internship preparation notes and interview tips',
      anonymousName: 'Shadow Tiger',
      anonymousAvatar: '🐅',
      senderYear: '3rd Year',
    });

    softDeletedMsg = await Message.create({
      room: env.globalRoom._id,
      sender: env.student2._id,
      content: 'This is a retracted notice about cancelled sports day',
      anonymousName: 'Falcon Wing',
      anonymousAvatar: '🦅',
      senderYear: '2nd Year',
      isDeleted: true,
      deletedAt: new Date(),
    });

    // 2. Seed announcements
    globalAnnouncement = await Announcement.create({
      title: 'Annual Hostel Cultural Night',
      content: 'Join us for music, performances, and refreshments in the quad.',
      createdBy: env.admin._id,
      targetRoom: env.globalRoom._id,
      priority: 'important',
    });

    thirdYearAnnouncement = await Announcement.create({
      title: '3rd Year Placement Orientation',
      content: 'Mandatory session for 3rd Year hostel residents in Hall B.',
      createdBy: env.admin._id,
      targetRoom: env.thirdYearRoom._id,
      priority: 'urgent',
    });

    // 3. Seed polls
    globalPoll = await Poll.create({
      question: 'Which weekend dinner special do you prefer?',
      options: [
        { text: 'Paneer Butter Masala', votes: 15 },
        { text: 'Chicken Biryani', votes: 20 },
      ],
      createdBy: env.admin._id,
      room: env.globalRoom._id,
    });

    thirdYearPoll = await Poll.create({
      question: 'Preferred time for 3rd year project review?',
      options: [
        { text: 'Saturday Morning', votes: 5 },
        { text: 'Sunday Evening', votes: 8 },
      ],
      createdBy: env.admin._id,
      room: env.thirdYearRoom._id,
    });
  });

  test.after(async () => {
    await teardownTestEnvironment();
  });

  test('1. Unauthenticated search returns 401 Unauthorized', async () => {
    const res = await fetch(`${env.baseUrl}/api/search?q=hostel`);
    assert.equal(res.status, 401);
    const data = await res.json();
    assert.equal(data.success, false);
  });

  test('2. Case-insensitive search finds matching messages', async () => {
    const res = await fetch(`${env.baseUrl}/api/search?q=LIBRARY&type=messages`, {
      headers: { Authorization: `Bearer ${env.student2Token}` },
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.data.results.length, 1);
    assert.equal(data.data.results[0].id, globalMsg1._id.toString());
    assert.match(data.data.results[0].content, /library/i);
  });

  test('3. Partial keyword matching works (e.g. "notic" matches "notice")', async () => {
    const res = await fetch(`${env.baseUrl}/api/search?q=notic&type=messages`, {
      headers: { Authorization: `Bearer ${env.student2Token}` },
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    const found = data.data.results.some((m) => m.id === globalMsg1._id.toString());
    assert.ok(found, 'Should find message matching partial word "notic"');
  });

  test('4. Multi-word search matches messages containing multiple keywords', async () => {
    const res = await fetch(`${env.baseUrl}/api/search?q=hostel+hours&type=messages`, {
      headers: { Authorization: `Bearer ${env.student2Token}` },
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.data.results.length >= 1);
    assert.equal(data.data.results[0].id, globalMsg1._id.toString());
  });

  test('5. Non-matching query returns zero results without error', async () => {
    const res = await fetch(`${env.baseUrl}/api/search?q=xylophone_zebra_neverland&type=messages`, {
      headers: { Authorization: `Bearer ${env.student2Token}` },
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.data.results.length, 0);
    assert.equal(data.data.pagination.total, 0);
  });

  test('6. Empty or whitespace query returns empty results cleanly', async () => {
    const res = await fetch(`${env.baseUrl}/api/search?q=%20%20%20&type=messages`, {
      headers: { Authorization: `Bearer ${env.student2Token}` },
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.data.results.length, 0);
    assert.equal(data.data.pagination.total, 0);
  });

  test('7. Message search pagination correctly computes total, totalPages, and limits', async () => {
    const res = await fetch(`${env.baseUrl}/api/search?q=hostel&type=messages&page=1&limit=1`, {
      headers: { Authorization: `Bearer ${env.student2Token}` },
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.data.results.length, 1);
    assert.equal(data.data.pagination.page, 1);
    assert.equal(data.data.pagination.limit, 1);
    assert.ok(data.data.pagination.total >= 1);
  });

  test('8. Authorization: 2nd Year student NEVER finds messages from 3rd Year room', async () => {
    // 3rd Year room has: "3rd Year internship preparation notes and interview tips"
    const res = await fetch(`${env.baseUrl}/api/search?q=internship&type=messages`, {
      headers: { Authorization: `Bearer ${env.student2Token}` },
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    // Student 2 must not see 3rd year message
    assert.equal(data.data.results.length, 0);

    // 3rd Year student CAN see their own room message
    const resStudent3 = await fetch(`${env.baseUrl}/api/search?q=internship&type=messages`, {
      headers: { Authorization: `Bearer ${env.student3Token}` },
    });
    assert.equal(resStudent3.status, 200);
    const data3 = await resStudent3.json();
    assert.equal(data3.data.results.length, 1);
    assert.equal(data3.data.results[0].id, thirdYearMsg._id.toString());
  });

  test('9. Room Discovery: 2nd Year student discovers ONLY authorized rooms', async () => {
    const res = await fetch(`${env.baseUrl}/api/search?type=rooms`, {
      headers: { Authorization: `Bearer ${env.student2Token}` },
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    const roomSlugs = data.data.results.map((r) => r.slug);
    assert.ok(roomSlugs.includes('global-room'), 'Global room must be accessible');
    assert.ok(roomSlugs.includes('2nd-year'), '2nd Year room must be accessible');
    assert.ok(!roomSlugs.includes('3rd-year'), '3rd Year room must be HIDDEN from 2nd Year student');
    assert.ok(!roomSlugs.includes('4th-year'), '4th Year room must be HIDDEN from 2nd Year student');
  });

  test('10. Cross-room access rejection: Searching with unauthorized roomId returns 403 Forbidden', async () => {
    const res = await fetch(
      `${env.baseUrl}/api/search?q=notes&roomId=${env.thirdYearRoom._id}`,
      {
        headers: { Authorization: `Bearer ${env.student2Token}` },
      }
    );
    assert.equal(res.status, 403);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.match(data.message, /access denied/i);
  });

  test('11. Soft-deleted messages are strictly excluded from search results', async () => {
    const res = await fetch(`${env.baseUrl}/api/search?q=cancelled+sports&type=messages`, {
      headers: { Authorization: `Bearer ${env.student2Token}` },
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.data.results.length, 0);
  });

  test('12. Privacy check: Search response NEVER leaks fullName, email, password, userId, storedName, or paths', async () => {
    const res = await fetch(`${env.baseUrl}/api/search?q=dinner&type=messages`, {
      headers: { Authorization: `Bearer ${env.student2Token}` },
    });
    assert.equal(res.status, 200);
    const rawText = await res.text();

    assert.ok(!rawText.includes(env.student2.email), 'Never leak student2 email');
    assert.ok(!rawText.includes(env.student3.email), 'Never leak student3 email');
    assert.ok(!rawText.includes(env.student2.fullName), 'Never leak student2 fullName');
    assert.ok(!rawText.includes(env.student3.fullName), 'Never leak student3 fullName');
    assert.ok(!rawText.includes('Password123!'), 'Never leak password');
    assert.ok(!rawText.includes('uuid-1234.pdf'), 'Never leak internal storedName');
    assert.ok(!rawText.includes('server/uploads'), 'Never leak filesystem path');

    const data = JSON.parse(rawText);
    const msg = data.data.results[0];
    assert.ok(msg);
    assert.equal(msg.sender.anonymousName, 'Shadow Tiger');
    assert.equal(msg.sender.anonymousAvatar, '🐅');
    assert.equal(msg.sender.id, undefined, 'Sender internal DB id should NOT be exposed in search results');
    assert.equal(msg.attachment.originalName, 'dinner_menu.pdf');
    assert.equal(msg.attachment.storedName, undefined);
  });

  test('13. Search announcements: Finds authorized announcements and hides unauthorized ones', async () => {
    // 2nd Year student searches announcements
    const res = await fetch(`${env.baseUrl}/api/search?q=Cultural&type=announcements`, {
      headers: { Authorization: `Bearer ${env.student2Token}` },
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.data.results.length, 1);
    assert.equal(data.data.results[0].title, 'Annual Hostel Cultural Night');
    assert.equal(data.data.results[0].author, 'Hostel Administration');

    // 2nd Year student searches for 3rd Year announcement -> must be 0
    const resUnauthorized = await fetch(`${env.baseUrl}/api/search?q=Placement&type=announcements`, {
      headers: { Authorization: `Bearer ${env.student2Token}` },
    });
    assert.equal(resUnauthorized.status, 200);
    const dataUnauth = await resUnauthorized.json();
    assert.equal(dataUnauth.data.results.length, 0);
  });

  test('14. Search polls: Finds authorized polls and calculates safe vote totals', async () => {
    const res = await fetch(`${env.baseUrl}/api/search?q=dinner+special&type=polls`, {
      headers: { Authorization: `Bearer ${env.student2Token}` },
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.data.results.length, 1);
    assert.equal(data.data.results[0].question, 'Which weekend dinner special do you prefer?');
    assert.equal(data.data.results[0].totalVotes, 35);
    assert.equal(data.data.results[0].optionsCount, 2);

    // 2nd Year student cannot see 3rd Year project review poll
    const resUnauth = await fetch(`${env.baseUrl}/api/search?q=project+review&type=polls`, {
      headers: { Authorization: `Bearer ${env.student2Token}` },
    });
    assert.equal(resUnauth.status, 200);
    const dataUnauth = await resUnauth.json();
    assert.equal(dataUnauth.data.results.length, 0);
  });

  test('15. Unified Global Search (type=all) returns aggregate counts and categorized results', async () => {
    const res = await fetch(`${env.baseUrl}/api/search?q=hostel&type=all`, {
      headers: { Authorization: `Bearer ${env.student2Token}` },
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.data.type, 'all');
    assert.ok(data.data.counts);
    assert.ok(data.data.results.messages !== undefined);
    assert.ok(data.data.results.rooms !== undefined);
    assert.ok(data.data.results.announcements !== undefined);
    assert.ok(data.data.results.polls !== undefined);
  });

  test('16. Input Validation: Rejects search query exceeding 100 characters with 400 Bad Request', async () => {
    const longQuery = 'a'.repeat(101);
    const res = await fetch(`${env.baseUrl}/api/search?q=${longQuery}`, {
      headers: { Authorization: `Bearer ${env.student2Token}` },
    });
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.match(data.message, /cannot exceed 100 characters/i);
  });

  test('17. Input Validation: Rejects invalid search type with 400 Bad Request', async () => {
    const res = await fetch(`${env.baseUrl}/api/search?q=test&type=invalid_category`, {
      headers: { Authorization: `Bearer ${env.student2Token}` },
    });
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.match(data.message, /invalid search type/i);
  });

  test('18. Input Validation: Rejects excessive limit (> 100) with 400 Bad Request', async () => {
    const res = await fetch(`${env.baseUrl}/api/search?q=test&limit=999`, {
      headers: { Authorization: `Bearer ${env.student2Token}` },
    });
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.match(data.message, /limit cannot exceed/i);
  });

  test('19. Security: Special regex characters in search query do not crash the server', async () => {
    const specialQuery = '.*+?^${}()|[]\\';
    const res = await fetch(
      `${env.baseUrl}/api/search?q=${encodeURIComponent(specialQuery)}`,
      {
        headers: { Authorization: `Bearer ${env.student2Token}` },
      }
    );
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.data.type, 'all');
  });

  test('20. Input Validation: Rejects invalid page parameter (negative or non-numeric) with 400 Bad Request', async () => {
    const res1 = await fetch(`${env.baseUrl}/api/search?q=test&page=-5`, {
      headers: { Authorization: `Bearer ${env.student2Token}` },
    });
    assert.equal(res1.status, 400);
    const data1 = await res1.json();
    assert.match(data1.message, /page parameter must be a positive integer/i);

    const res2 = await fetch(`${env.baseUrl}/api/search?q=test&page=abc`, {
      headers: { Authorization: `Bearer ${env.student2Token}` },
    });
    assert.equal(res2.status, 400);
    const data2 = await res2.json();
    assert.match(data2.message, /page parameter must be a positive integer/i);
  });

  test('21. Input Validation: Rejects invalid limit parameter (zero, negative, or non-numeric) with 400 Bad Request', async () => {
    const res1 = await fetch(`${env.baseUrl}/api/search?q=test&limit=0`, {
      headers: { Authorization: `Bearer ${env.student2Token}` },
    });
    assert.equal(res1.status, 400);
    const data1 = await res1.json();
    assert.match(data1.message, /limit parameter must be a positive integer/i);

    const res2 = await fetch(`${env.baseUrl}/api/search?q=test&limit=xyz`, {
      headers: { Authorization: `Bearer ${env.student2Token}` },
    });
    assert.equal(res2.status, 400);
    const data2 = await res2.json();
    assert.match(data2.message, /limit parameter must be a positive integer/i);
  });

  test('22. Input Validation: Rejects malformed roomId format with 400 Bad Request', async () => {
    const res = await fetch(`${env.baseUrl}/api/search?q=test&roomId=not-a-valid-mongo-id`, {
      headers: { Authorization: `Bearer ${env.student2Token}` },
    });
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.match(data.message, /invalid roomId format/i);
  });

  test('23. Privacy: Announcement and Poll search results never expose creator internal user IDs or voter identities', async () => {
    const resAnn = await fetch(`${env.baseUrl}/api/search?q=Cultural&type=announcements`, {
      headers: { Authorization: `Bearer ${env.student2Token}` },
    });
    const dataAnn = await resAnn.json();
    assert.equal(resAnn.status, 200);
    const ann = dataAnn.data.results[0];
    assert.equal(ann.author, 'Hostel Administration');
    assert.equal(ann.createdBy, undefined);
    assert.equal(ann.userId, undefined);

    const resPoll = await fetch(`${env.baseUrl}/api/search?q=weekend&type=polls`, {
      headers: { Authorization: `Bearer ${env.student2Token}` },
    });
    const dataPoll = await resPoll.json();
    assert.equal(resPoll.status, 200);
    const poll = dataPoll.data.results[0];
    assert.equal(poll.createdBy, undefined);
    assert.equal(poll.userId, undefined);
    assert.equal(poll.voters, undefined);
    assert.ok(Array.isArray(poll.options));
    assert.equal(poll.options[0].voters, undefined);
  });
});

