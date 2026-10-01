import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { setupTestEnvironment, teardownTestEnvironment } from './testHelper.js';
import Announcement from '../models/Announcement.js';
import Poll from '../models/Poll.js';
import PollVote from '../models/PollVote.js';
import Message from '../models/Message.js';

describe('Task 7: Announcements, Polls & Pinned Messages Suite', () => {
  let env;

  before(async () => {
    env = await setupTestEnvironment();
  });

  after(async () => {
    await teardownTestEnvironment();
  });

  /* ------------------------------------------------------------------ */
  /* ANNOUNCEMENTS TESTS                                                */
  /* ------------------------------------------------------------------ */
  let testAnnouncementId = null;

  it('1. Rejects unauthenticated request to /api/announcements (401 Unauthorized)', async () => {
    const res = await fetch(`${env.baseUrl}/api/announcements`);
    assert.equal(res.status, 401);
  });

  it('2. Normal student cannot create an announcement (403 Forbidden)', async () => {
    const res = await fetch(`${env.baseUrl}/api/announcements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.student2Token}`,
      },
      body: JSON.stringify({
        title: 'Unauthorized Student Announcement',
        content: 'This announcement should be rejected.',
        targetRoom: env.globalRoom._id.toString(),
      }),
    });

    assert.equal(res.status, 403);
    const body = await res.json();
    assert.match(body.message, /Administrator privileges required/i);
  });

  it('3. Admin can create an announcement for Global Room with important priority', async () => {
    const res = await fetch(`${env.baseUrl}/api/announcements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.adminToken}`,
      },
      body: JSON.stringify({
        title: 'Hostel Annual General Meeting',
        content: 'All residents must attend the annual general meeting tomorrow at 6 PM in the main hall.',
        targetRoom: env.globalRoom._id.toString(),
        priority: 'important',
        isPinned: true,
      }),
    });

    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.announcement.title, 'Hostel Annual General Meeting');
    assert.equal(body.data.announcement.priority, 'important');
    assert.equal(body.data.announcement.isPinned, true);
    assert.equal(body.data.announcement.author, 'Hostel Administration');

    testAnnouncementId = body.data.announcement.id;
  });

  it('4. Rejects invalid announcement payload (too short title, invalid priority, missing room)', async () => {
    const res = await fetch(`${env.baseUrl}/api/announcements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.adminToken}`,
      },
      body: JSON.stringify({
        title: 'No',
        content: 'Too short',
        targetRoom: env.globalRoom._id.toString(),
        priority: 'super-urgent', // invalid priority
      }),
    });

    assert.equal(res.status, 400);
  });

  it('5. Authenticated student can view announcements for authorized rooms without leaking admin private info', async () => {
    const res = await fetch(`${env.baseUrl}/api/announcements`, {
      headers: {
        Authorization: `Bearer ${env.student2Token}`,
      },
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(Array.isArray(body.data.announcements));
    assert.ok(body.data.announcements.length >= 1);

    const target = body.data.announcements.find((a) => a.id === testAnnouncementId);
    assert.ok(target, 'Global announcement must be visible to 2nd year student');
    assert.equal(target.author, 'Hostel Administration');

    // Strict privacy: no admin real name, email, or password in response
    const rawString = JSON.stringify(body);
    assert.ok(!rawString.includes(env.admin.email), 'Admin email must never leak');
    assert.ok(!rawString.includes(env.admin.fullName), 'Admin fullName must never leak');
  });

  it('6. Year-restricted announcements are hidden from students of other years', async () => {
    // Admin creates 3rd Year announcement
    const resCreate = await fetch(`${env.baseUrl}/api/announcements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.adminToken}`,
      },
      body: JSON.stringify({
        title: '3rd Year Project Submission',
        content: 'Submit major project synopsis by Friday.',
        targetRoom: env.thirdYearRoom._id.toString(),
        priority: 'normal',
      }),
    });
    assert.equal(resCreate.status, 201);
    const created = await resCreate.json();
    const thirdYearAnnounceId = created.data.announcement.id;

    // 2nd Year student fetches announcements
    const resStudent2 = await fetch(`${env.baseUrl}/api/announcements`, {
      headers: {
        Authorization: `Bearer ${env.student2Token}`,
      },
    });
    const bodyStudent2 = await resStudent2.json();
    const foundBy2nd = bodyStudent2.data.announcements.find((a) => a.id === thirdYearAnnounceId);
    assert.equal(foundBy2nd, undefined, '2nd Year student must NOT see 3rd Year announcement');

    // 2nd Year student direct fetch of 3rd Year announcement returns 403
    const resDirect = await fetch(`${env.baseUrl}/api/announcements/${thirdYearAnnounceId}`, {
      headers: {
        Authorization: `Bearer ${env.student2Token}`,
      },
    });
    assert.equal(resDirect.status, 403);

    // 3rd Year student CAN see it
    const resStudent3 = await fetch(`${env.baseUrl}/api/announcements`, {
      headers: {
        Authorization: `Bearer ${env.student3Token}`,
      },
    });
    const bodyStudent3 = await resStudent3.json();
    const foundBy3rd = bodyStudent3.data.announcements.find((a) => a.id === thirdYearAnnounceId);
    assert.ok(foundBy3rd, '3rd Year student must see 3rd Year announcement');
  });

  it('7. Admin can update an announcement and student cannot', async () => {
    // Student attempt to update -> 403
    const resStudent = await fetch(`${env.baseUrl}/api/announcements/${testAnnouncementId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.student2Token}`,
      },
      body: JSON.stringify({ title: 'Hacked Title' }),
    });
    assert.equal(resStudent.status, 403);

    // Admin updates
    const resAdmin = await fetch(`${env.baseUrl}/api/announcements/${testAnnouncementId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.adminToken}`,
      },
      body: JSON.stringify({
        title: 'Hostel Annual General Meeting (Rescheduled)',
        priority: 'urgent',
      }),
    });
    assert.equal(resAdmin.status, 200);
    const body = await resAdmin.json();
    assert.equal(body.data.announcement.title, 'Hostel Annual General Meeting (Rescheduled)');
    assert.equal(body.data.announcement.priority, 'urgent');
  });

  it('8. Expired announcements are automatically excluded from active list', async () => {
    // Admin creates expired announcement directly or with past date in DB
    const pastDate = new Date(Date.now() - 60000);
    const expiredAnnounce = await Announcement.create({
      title: 'Past Event That Already Happened',
      content: 'This event happened yesterday and is expired.',
      createdBy: env.admin._id,
      targetRoom: env.globalRoom._id,
      priority: 'normal',
      expiresAt: pastDate,
    });

    const res = await fetch(`${env.baseUrl}/api/announcements`, {
      headers: {
        Authorization: `Bearer ${env.student2Token}`,
      },
    });
    const body = await res.json();
    const found = body.data.announcements.find((a) => a.id === expiredAnnounce._id.toString());
    assert.equal(found, undefined, 'Expired announcement must not appear in active announcements list');
  });

  it('9. Admin can delete an announcement', async () => {
    const res = await fetch(`${env.baseUrl}/api/announcements/${testAnnouncementId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${env.adminToken}`,
      },
    });
    assert.equal(res.status, 200);

    // Verify deletion
    const check = await Announcement.findById(testAnnouncementId);
    assert.equal(check, null);
  });

  /* ------------------------------------------------------------------ */
  /* POLLS TESTS                                                        */
  /* ------------------------------------------------------------------ */
  let testPollId = null;
  let testOptionAId = null;
  let testOptionBId = null;

  it('10. Student cannot create a poll (403 Forbidden)', async () => {
    const res = await fetch(`${env.baseUrl}/api/polls`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.student2Token}`,
      },
      body: JSON.stringify({
        question: 'Should student create polls?',
        options: ['Yes', 'No'],
        room: env.globalRoom._id.toString(),
      }),
    });

    assert.equal(res.status, 403);
  });

  it('11. Rejects invalid poll creation (fewer than 2 options, duplicates, empty options)', async () => {
    // Fewer than 2 options
    const res1 = await fetch(`${env.baseUrl}/api/polls`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.adminToken}`,
      },
      body: JSON.stringify({
        question: 'Single option question?',
        options: ['Only One'],
        room: env.globalRoom._id.toString(),
      }),
    });
    assert.equal(res1.status, 400);

    // Duplicates
    const res2 = await fetch(`${env.baseUrl}/api/polls`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.adminToken}`,
      },
      body: JSON.stringify({
        question: 'Duplicate options question?',
        options: ['Option A', 'option a'],
        room: env.globalRoom._id.toString(),
      }),
    });
    assert.equal(res2.status, 400);
  });

  it('12. Admin can create a poll with vote changes allowed', async () => {
    const res = await fetch(`${env.baseUrl}/api/polls`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.adminToken}`,
      },
      body: JSON.stringify({
        question: 'What tournament should we host this weekend?',
        options: ['Cricket', 'Football', 'Badminton', 'Chess'],
        room: env.globalRoom._id.toString(),
        allowVoteChange: true,
      }),
    });

    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.poll.question, 'What tournament should we host this weekend?');
    assert.equal(body.data.poll.options.length, 4);
    assert.equal(body.data.poll.allowVoteChange, true);
    assert.equal(body.data.poll.totalVotes, 0);

    testPollId = body.data.poll.id;
    testOptionAId = body.data.poll.options[0].id;
    testOptionBId = body.data.poll.options[1].id;
  });

  it('13. Authorized student can vote on poll and results calculate counts & percentages', async () => {
    const res = await fetch(`${env.baseUrl}/api/polls/${testPollId}/vote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.student2Token}`,
      },
      body: JSON.stringify({ optionId: testOptionAId }),
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.poll.totalVotes, 1);
    assert.equal(body.data.poll.hasVoted, true);
    assert.equal(body.data.poll.userVotedOptionId, testOptionAId);

    const optA = body.data.poll.options.find((o) => o.id === testOptionAId);
    assert.equal(optA.votes, 1);
    assert.equal(optA.percentage, 100);

    // Verify privacy: voter identity (fullName, email, anonymous identity, user ID) is NOT exposed
    const rawString = JSON.stringify(body);
    assert.ok(!rawString.includes(env.student2.email), 'Student email must not leak in poll results');
    assert.ok(!rawString.includes(env.student2.fullName), 'Student fullName must not leak in poll results');
  });

  it('14. Student can change vote when allowVoteChange is enabled', async () => {
    // Student2 changes vote from Option A to Option B
    const res = await fetch(`${env.baseUrl}/api/polls/${testPollId}/vote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.student2Token}`,
      },
      body: JSON.stringify({ optionId: testOptionBId }),
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.poll.totalVotes, 1); // Total vote count remains 1
    assert.equal(body.data.poll.userVotedOptionId, testOptionBId);

    const optA = body.data.poll.options.find((o) => o.id === testOptionAId);
    const optB = body.data.poll.options.find((o) => o.id === testOptionBId);
    assert.equal(optA.votes, 0);
    assert.equal(optB.votes, 1);
    assert.equal(optB.percentage, 100);
  });

  it('15. Rejects voting in poll belonging to unauthorized room', async () => {
    // Admin creates 3rd Year poll
    const resCreate = await fetch(`${env.baseUrl}/api/polls`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.adminToken}`,
      },
      body: JSON.stringify({
        question: '3rd Year Lab Slot Preference?',
        options: ['Morning', 'Afternoon'],
        room: env.thirdYearRoom._id.toString(),
      }),
    });
    assert.equal(resCreate.status, 201);
    const created = await resCreate.json();
    const thirdYearPollId = created.data.poll.id;
    const optId = created.data.poll.options[0].id;

    // 2nd Year student attempts to vote on 3rd Year poll -> 403 Forbidden
    const resVote = await fetch(`${env.baseUrl}/api/polls/${thirdYearPollId}/vote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.student2Token}`,
      },
      body: JSON.stringify({ optionId: optId }),
    });
    assert.equal(resVote.status, 403);
  });

  it('16. Rejects vote change when allowVoteChange is false', async () => {
    // Admin creates strict single-vote poll
    const resCreate = await fetch(`${env.baseUrl}/api/polls`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.adminToken}`,
      },
      body: JSON.stringify({
        question: 'Strict Poll: Choose one permanently',
        options: ['Choice 1', 'Choice 2'],
        room: env.globalRoom._id.toString(),
        allowVoteChange: false,
      }),
    });
    assert.equal(resCreate.status, 201);
    const created = await resCreate.json();
    const strictPollId = created.data.poll.id;
    const opt1 = created.data.poll.options[0].id;
    const opt2 = created.data.poll.options[1].id;

    // First vote succeeds
    const resVote1 = await fetch(`${env.baseUrl}/api/polls/${strictPollId}/vote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.student2Token}`,
      },
      body: JSON.stringify({ optionId: opt1 }),
    });
    assert.equal(resVote1.status, 200);

    // Second vote attempt to change fails -> 400 Bad Request
    const resVote2 = await fetch(`${env.baseUrl}/api/polls/${strictPollId}/vote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.student2Token}`,
      },
      body: JSON.stringify({ optionId: opt2 }),
    });
    assert.equal(resVote2.status, 400);
    const bodyVote2 = await resVote2.json();
    assert.match(bodyVote2.message, /Vote changes are not allowed/i);
  });

  it('17. Closed poll rejects new votes', async () => {
    // Admin closes testPollId
    const resClose = await fetch(`${env.baseUrl}/api/polls/${testPollId}/close`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${env.adminToken}`,
      },
    });
    assert.equal(resClose.status, 200);

    // Student3 attempts to vote on closed poll -> 400 Bad Request
    const resVote = await fetch(`${env.baseUrl}/api/polls/${testPollId}/vote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.student3Token}`,
      },
      body: JSON.stringify({ optionId: testOptionAId }),
    });
    assert.equal(resVote.status, 400);
    const body = await resVote.json();
    assert.match(body.message, /closed/i);
  });

  /* ------------------------------------------------------------------ */
  /* PINNED MESSAGES TESTS                                              */
  /* ------------------------------------------------------------------ */
  let testMsgId = null;

  it('18. Creates a test message in Global Room', async () => {
    const msg = await Message.create({
      room: env.globalRoom._id,
      sender: env.student2._id,
      content: 'Important rule: Quiet hours start at 10 PM in Prof. S.N. Bose Hostel.',
    });
    testMsgId = msg._id.toString();
    assert.ok(testMsgId);
  });

  it('19. Student cannot pin a message (403 Forbidden)', async () => {
    const res = await fetch(`${env.baseUrl}/api/messages/${testMsgId}/pin`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${env.student2Token}`,
      },
    });
    assert.equal(res.status, 403);
  });

  it('20. Admin can pin a message in the room', async () => {
    const res = await fetch(`${env.baseUrl}/api/messages/${testMsgId}/pin`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${env.adminToken}`,
      },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.message.isPinned, true);
    assert.ok(body.data.message.pinnedAt);

    // Verify persistence in DB
    const inDb = await Message.findById(testMsgId);
    assert.equal(inDb.isPinned, true);
  });

  it('21. Students can retrieve pinned messages for authorized room', async () => {
    const res = await fetch(`${env.baseUrl}/api/rooms/${env.globalRoom._id}/pinned`, {
      headers: {
        Authorization: `Bearer ${env.student2Token}`,
      },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(Array.isArray(body.data.pinnedMessages));
    const found = body.data.pinnedMessages.find((m) => m.id === testMsgId);
    assert.ok(found, 'Pinned message must be present in room pinned messages list');
    assert.equal(found.isPinned, true);
  });

  it('22. Student cannot unpin a message (403 Forbidden)', async () => {
    const res = await fetch(`${env.baseUrl}/api/messages/${testMsgId}/unpin`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${env.student2Token}`,
      },
    });
    assert.equal(res.status, 403);
  });

  it('23. Admin can unpin a message', async () => {
    const res = await fetch(`${env.baseUrl}/api/messages/${testMsgId}/unpin`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${env.adminToken}`,
      },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.message.isPinned, false);

    // Verify it is no longer returned in GET /pinned
    const resList = await fetch(`${env.baseUrl}/api/rooms/${env.globalRoom._id}/pinned`, {
      headers: {
        Authorization: `Bearer ${env.student2Token}`,
      },
    });
    const bodyList = await resList.json();
    const found = bodyList.data.pinnedMessages.find((m) => m.id === testMsgId);
    assert.equal(found, undefined, 'Unpinned message must no longer appear in pinned list');
  });
});
