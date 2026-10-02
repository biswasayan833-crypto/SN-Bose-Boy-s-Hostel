import test from 'node:test';
import assert from 'node:assert/strict';
import { io as ClientIO } from 'socket.io-client';
import { setupTestEnvironment, teardownTestEnvironment } from './testHelper.js';
import Message from '../models/Message.js';

test.describe('Task 8: Media & File Sharing Suite', () => {
  let env;
  let testMessageId;
  let unauthorizedRoomMessageId;

  // Real valid binary signatures for test files
  // JPEG: FF D8 FF E0 00 10 4A 46 49 46 00 01 (JFIF standard header)
  const validJpegBuffer = Buffer.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48,
    0x00, 0x48, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43, 0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0xff,
    0xd9,
  ]);

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  const validPngBuffer = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
    0x89, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
  ]);

  // WEBP: RIFF....WEBP (52 49 46 46 .... 57 45 42 50)
  const validWebpBuffer = Buffer.from([
    0x52, 0x49, 0x46, 0x46, 0x1a, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50, 0x56, 0x50, 0x38, 0x4c,
    0x0e, 0x00, 0x00, 0x00, 0x2f, 0x00, 0x00, 0x00, 0x00, 0x07, 0x00, 0x08, 0x25, 0x98, 0x24, 0x00,
  ]);

  // PDF: %PDF-1.4 ... %%EOF
  const validPdfBuffer = Buffer.from(
    '%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [] /Count 0 >>\nendobj\nxref\n0 3\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \ntrailer\n<< /Size 3 /Root 1 0 R >>\nstartxref\n115\n%%EOF'
  );

  test.before(async () => {
    env = await setupTestEnvironment();
  });

  test.after(async () => {
    await teardownTestEnvironment();
  });

  // Helper to create multipart form-data payload using standard FormData
  const createUploadFormData = ({ filename, contentType, buffer, content }) => {
    const formData = new FormData();
    const blob = new Blob([buffer], { type: contentType });
    formData.append('file', blob, filename);
    if (content) {
      formData.append('content', content);
    }
    return formData;
  };

  test('1. Authenticated upload of valid JPEG image in authorized Global Room', async () => {
    const formData = createUploadFormData({
      filename: 'campus_view.jpg',
      contentType: 'image/jpeg',
      buffer: validJpegBuffer,
      content: 'Here is a photo of the quad!',
    });

    const res = await fetch(`${env.baseUrl}/api/messages/${env.globalRoom._id}/attachments`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.student2Token}`,
      },
      body: formData,
    });

    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.data.message);
    assert.equal(data.data.message.content, 'Here is a photo of the quad!');
    assert.ok(data.data.message.attachment);
    assert.equal(data.data.message.attachment.originalName, 'campus_view.jpg');
    assert.equal(data.data.message.attachment.mimeType, 'image/jpeg');
    assert.ok(data.data.message.attachment.size > 0);
    assert.ok(data.data.message.attachment.url.includes(`/api/messages/${data.data.message.id}/attachment`));

    // Retain message ID for download and deletion tests
    testMessageId = data.data.message.id;
  });

  test('2. Authenticated upload of valid PNG image in authorized year room', async () => {
    const formData = createUploadFormData({
      filename: 'hostel_diagram.png',
      contentType: 'image/png',
      buffer: validPngBuffer,
      content: 'Wing layout plan',
    });

    const res = await fetch(`${env.baseUrl}/api/rooms/${env.secondYearRoom._id}/attachments`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.student2Token}`,
      },
      body: formData,
    });

    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.data.message.attachment.originalName, 'hostel_diagram.png');
    assert.equal(data.data.message.attachment.mimeType, 'image/png');
  });

  test('3. Authenticated upload of valid WEBP image without caption (attachment-only message)', async () => {
    const formData = createUploadFormData({
      filename: 'sunset.webp',
      contentType: 'image/webp',
      buffer: validWebpBuffer,
    });

    const res = await fetch(`${env.baseUrl}/api/messages/${env.globalRoom._id}/attachments`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.student3Token}`,
      },
      body: formData,
    });

    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.data.message.content, '');
    assert.equal(data.data.message.attachment.mimeType, 'image/webp');
  });

  test('4. Authenticated upload of valid PDF document', async () => {
    const formData = createUploadFormData({
      filename: 'hostel_rules_2026.pdf',
      contentType: 'application/pdf',
      buffer: validPdfBuffer,
      content: 'Official hostel rulebook',
    });

    const res = await fetch(`${env.baseUrl}/api/messages/${env.globalRoom._id}/attachments`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.adminToken}`,
      },
      body: formData,
    });

    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.data.message.attachment.originalName, 'hostel_rules_2026.pdf');
    assert.equal(data.data.message.attachment.mimeType, 'application/pdf');
  });

  test('5. Rejects unauthenticated upload attempt (401 Unauthorized)', async () => {
    const formData = createUploadFormData({
      filename: 'test.jpg',
      contentType: 'image/jpeg',
      buffer: validJpegBuffer,
    });

    const res = await fetch(`${env.baseUrl}/api/messages/${env.globalRoom._id}/attachments`, {
      method: 'POST',
      body: formData,
    });

    assert.equal(res.status, 401);
    const data = await res.json();
    assert.equal(data.success, false);
  });

  test('6. Rejects upload attempt by student to unauthorized room (403 Forbidden)', async () => {
    // 2nd Year student attempting to upload into 3rd Year room
    const formData = createUploadFormData({
      filename: 'notes.pdf',
      contentType: 'application/pdf',
      buffer: validPdfBuffer,
    });

    const res = await fetch(`${env.baseUrl}/api/messages/${env.thirdYearRoom._id}/attachments`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.student2Token}`,
      },
      body: formData,
    });

    assert.equal(res.status, 403);
    const data = await res.json();
    assert.equal(data.success, false);
  });

  test('7. Rejects oversized file exceeding 5 MB limit (400 Bad Request)', async () => {
    // Generate buffer larger than 5 MB (5.1 MB)
    const largeBuffer = Buffer.alloc(5.1 * 1024 * 1024);
    largeBuffer[0] = 0xff;
    largeBuffer[1] = 0xd8;
    largeBuffer[2] = 0xff;

    const formData = createUploadFormData({
      filename: 'huge_image.jpg',
      contentType: 'image/jpeg',
      buffer: largeBuffer,
    });

    const res = await fetch(`${env.baseUrl}/api/messages/${env.globalRoom._id}/attachments`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.student2Token}`,
      },
      body: formData,
    });

    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.match(data.message.toLowerCase(), /exceeds.*5.*mb/i);
  });

  test('8. Rejects unsupported and executable file types (.exe, .sh, .js)', async () => {
    const execBuffer = Buffer.from('MZ\x90\x00\x03\x00\x00\x00'); // Windows PE executable header
    const formData = createUploadFormData({
      filename: 'dangerous_tool.exe',
      contentType: 'application/octet-stream',
      buffer: execBuffer,
    });

    const res = await fetch(`${env.baseUrl}/api/messages/${env.globalRoom._id}/attachments`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.student2Token}`,
      },
      body: formData,
    });

    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.match(data.message.toLowerCase(), /prohibited|unsupported/i);
  });

  test('9. Rejects MIME-spoofed file: Executable disguised as PNG image (400 Bad Request)', async () => {
    // Declared as image/png, but contains executable shell script
    const fakePngBuffer = Buffer.from('#!/bin/bash\necho "exploit"\n');
    const formData = createUploadFormData({
      filename: 'fake_photo.png',
      contentType: 'image/png',
      buffer: fakePngBuffer,
    });

    const res = await fetch(`${env.baseUrl}/api/messages/${env.globalRoom._id}/attachments`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.student2Token}`,
      },
      body: formData,
    });

    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.match(data.message.toLowerCase(), /validation failed|signature|spoofing/i);
  });

  test('10. Rejects path traversal attempts in filename and sanitizes safely', async () => {
    const formData = createUploadFormData({
      filename: '../../../../etc/passwd.jpg',
      contentType: 'image/jpeg',
      buffer: validJpegBuffer,
    });

    const res = await fetch(`${env.baseUrl}/api/messages/${env.globalRoom._id}/attachments`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.student2Token}`,
      },
      body: formData,
    });

    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(data.success, true);
    // Verified that path was stripped and only safe filename saved
    assert.doesNotMatch(data.data.message.attachment.originalName, /\.\./);
    assert.equal(data.data.message.attachment.originalName, 'passwd.jpg');
  });

  test('11. Successful retrieval of attachment by authorized room member (200 OK)', async () => {
    assert.ok(testMessageId, 'testMessageId must exist from Test 1');

    // Retrieve via Bearer header
    const res = await fetch(`${env.baseUrl}/api/messages/${testMessageId}/attachment`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${env.student3Token}`, // 3rd year student in Global Room
      },
    });

    assert.equal(res.status, 200);
    assert.equal(res.headers.get('content-type'), 'image/jpeg');
    assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
    const bodyBuffer = Buffer.from(await res.arrayBuffer());
    assert.equal(bodyBuffer.length, validJpegBuffer.length);

    // Also verify retrieval via query parameter token (?token=...)
    const queryRes = await fetch(
      `${env.baseUrl}/api/messages/${testMessageId}/attachment?token=${env.student3Token}`
    );
    assert.equal(queryRes.status, 200);
    assert.equal(queryRes.headers.get('content-type'), 'image/jpeg');
  });

  test('12. Rejects attachment retrieval by unauthorized student from another year (403 Forbidden)', async () => {
    // 1. Upload an attachment in 3rd Year room by 3rd Year student
    const formData = createUploadFormData({
      filename: '3rd_year_notes.pdf',
      contentType: 'application/pdf',
      buffer: validPdfBuffer,
    });

    const uploadRes = await fetch(`${env.baseUrl}/api/messages/${env.thirdYearRoom._id}/attachments`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.student3Token}`,
      },
      body: formData,
    });

    assert.equal(uploadRes.status, 201);
    const uploadData = await uploadRes.json();
    unauthorizedRoomMessageId = uploadData.data.message.id;

    // 2. 2nd Year student tries to access 3rd Year attachment
    const getRes = await fetch(`${env.baseUrl}/api/messages/${unauthorizedRoomMessageId}/attachment`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${env.student2Token}`,
      },
    });

    assert.equal(getRes.status, 403);
    const getData = await getRes.json();
    assert.equal(getData.success, false);
    assert.match(getData.message.toLowerCase(), /access denied|cannot access/i);
  });

  test('13. Soft-deleted message no longer exposes its attachment (404 Not Found)', async () => {
    assert.ok(testMessageId, 'testMessageId must exist');

    // 1. Soft-delete the message created in Test 1
    const delRes = await fetch(`${env.baseUrl}/api/messages/${testMessageId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${env.student2Token}`,
      },
    });
    assert.equal(delRes.status, 200);

    // 2. Verify formatSafeMessage strips attachment
    const listRes = await fetch(`${env.baseUrl}/api/rooms/${env.globalRoom._id}/messages`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${env.student2Token}`,
      },
    });
    const listData = await listRes.json();
    const deletedMsg = listData.data.messages.find((m) => m.id === testMessageId);
    assert.ok(deletedMsg);
    assert.equal(deletedMsg.isDeleted, true);
    assert.equal(deletedMsg.attachment, null);

    // 3. Attempt to download attachment of deleted message
    const getRes = await fetch(`${env.baseUrl}/api/messages/${testMessageId}/attachment`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${env.student2Token}`,
      },
    });

    assert.equal(getRes.status, 404);
    const getData = await getRes.json();
    assert.equal(getData.success, false);
    assert.match(getData.message.toLowerCase(), /deleted|no longer available/i);
  });

  test('14. Verifies attachment message delivery over Socket.IO', async () => {
    // Connect Socket.IO client for student 3 in Global Room
    const clientSocket = ClientIO(env.baseUrl, {
      auth: { token: env.student3Token },
      transports: ['websocket'],
    });

    await new Promise((resolve) => clientSocket.on('connect', resolve));

    // Join Global Room
    await new Promise((resolve) => {
      clientSocket.emit('join_room', { roomId: env.globalRoom._id.toString() }, resolve);
    });

    // Set up listener for new_message
    const messagePromise = new Promise((resolve) => {
      clientSocket.on('new_message', (msg) => {
        if (msg.attachment && msg.attachment.originalName === 'realtime_photo.png') {
          resolve(msg);
        }
      });
    });

    // Student 2 uploads an attachment to Global Room
    const formData = createUploadFormData({
      filename: 'realtime_photo.png',
      contentType: 'image/png',
      buffer: validPngBuffer,
      content: 'Realtime socket attachment test',
    });

    const res = await fetch(`${env.baseUrl}/api/messages/${env.globalRoom._id}/attachments`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.student2Token}`,
      },
      body: formData,
    });
    assert.equal(res.status, 201);

    // Verify Socket.IO client received the message with attachment details
    const receivedMsg = await Promise.race([
      messagePromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Socket.IO timeout')), 3000)),
    ]);

    assert.ok(receivedMsg);
    assert.equal(receivedMsg.attachment.originalName, 'realtime_photo.png');
    assert.equal(receivedMsg.attachment.mimeType, 'image/png');
    assert.equal(receivedMsg.content, 'Realtime socket attachment test');

    clientSocket.disconnect();
  });

  test('15. Privacy check: Message payload NEVER leaks fullName, email, password, or storedName', async () => {
    const formData = createUploadFormData({
      filename: 'privacy_check.pdf',
      contentType: 'application/pdf',
      buffer: validPdfBuffer,
      content: 'Privacy test payload',
    });

    const res = await fetch(`${env.baseUrl}/api/messages/${env.globalRoom._id}/attachments`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.student2Token}`,
      },
      body: formData,
    });

    assert.equal(res.status, 201);
    const data = await res.json();
    const msg = data.data.message;

    // Must have anonymous persona
    assert.ok(msg.sender.anonymousName);
    assert.ok(msg.sender.anonymousAvatar);
    assert.ok(msg.sender.year);

    // MUST NOT have private details
    assert.equal(msg.sender.fullName, undefined);
    assert.equal(msg.sender.email, undefined);
    assert.equal(msg.sender.password, undefined);

    // MUST NOT leak internal stored filename on disk
    assert.equal(msg.attachment.storedName, undefined);
    assert.equal(msg.attachment.path, undefined);
  });
});
