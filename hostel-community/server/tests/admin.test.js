import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { setupTestEnvironment, teardownTestEnvironment } from './testHelper.js';
import Message from '../models/Message.js';
import Report from '../models/Report.js';

describe('Task 4: Admin Moderation Suite', () => {
  let ctx;
  let reportedMessage;
  let testReport;

  before(async () => {
    ctx = await setupTestEnvironment();

    reportedMessage = await Message.create({
      room: ctx.globalRoom._id,
      sender: ctx.student2._id,
      content: 'Offensive language violation in global room.',
    });

    testReport = await Report.create({
      message: reportedMessage._id,
      reportedBy: ctx.student3._id,
      reason: 'harassment',
      status: 'pending',
    });
  });

  after(async () => {
    await teardownTestEnvironment();
  });

  it('1. Rejects student attempt to access admin reports (403 Forbidden)', async () => {
    const res = await fetch(`${ctx.baseUrl}/api/admin/reports`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${ctx.student2Token}`,
      },
    });

    assert.strictEqual(res.status, 403);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.match(body.message, /Administrator privileges required/);
  });

  it('2. Rejects unauthenticated request to admin reports (401 Unauthorized)', async () => {
    const res = await fetch(`${ctx.baseUrl}/api/admin/reports`, {
      method: 'GET',
    });

    assert.strictEqual(res.status, 401);
  });

  it('3. Allows admin to retrieve moderation reports list', async () => {
    const res = await fetch(`${ctx.baseUrl}/api/admin/reports`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${ctx.adminToken}`,
      },
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(Array.isArray(body.data.reports));
    assert.ok(body.data.reports.length >= 1);
    assert.strictEqual(body.data.reports[0].reason, 'harassment');
  });

  it('4. Rejects invalid report status update (400 Bad Request)', async () => {
    const res = await fetch(`${ctx.baseUrl}/api/admin/reports/${testReport._id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ctx.adminToken}`,
      },
      body: JSON.stringify({ status: 'not_a_valid_status' }),
    });

    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.match(body.message, /Invalid report status/);
  });

  it('5. Allows admin to update report status to reviewed', async () => {
    const res = await fetch(`${ctx.baseUrl}/api/admin/reports/${testReport._id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ctx.adminToken}`,
      },
      body: JSON.stringify({ status: 'reviewed', notes: 'Report has been acknowledged.' }),
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.data.report.status, 'reviewed');
    assert.strictEqual(body.data.report.notes, 'Report has been acknowledged.');
  });

  it('6. Allows admin to take moderation action to remove reported message', async () => {
    const res = await fetch(`${ctx.baseUrl}/api/admin/reports/${testReport._id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ctx.adminToken}`,
      },
      body: JSON.stringify({ action: 'delete_message' }),
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.data.report.status, 'actioned');
    assert.strictEqual(body.data.messageModerated, true);
    assert.strictEqual(body.data.deletedMessage.isDeleted, true);
    assert.strictEqual(body.data.deletedMessage.content, 'Message deleted');

    // Verify in database that message was indeed soft deleted
    const updatedMsg = await Message.findById(reportedMessage._id);
    assert.strictEqual(updatedMsg.isDeleted, true);
  });
});
