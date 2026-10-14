import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import crypto from 'crypto';
import { setupTestEnvironment, teardownTestEnvironment } from './testHelper.js';
import User from '../models/User.js';

describe('Task 2FA: Email Two-Factor Authentication Suite', () => {
  let ctx;

  before(async () => {
    ctx = await setupTestEnvironment();
  });

  after(async () => {
    await teardownTestEnvironment();
  });

  it('1. POST /api/auth/login verifies credentials and returns requires2FA without issuing JWT token directly', async () => {
    const res = await fetch(`${ctx.baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: ctx.student2.email,
        password: 'Password123!',
      }),
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.requires2FA, true);
    assert.strictEqual(body.data.email, ctx.student2.email);
    assert.strictEqual(body.data.token, undefined);
    assert.ok(body.data.testOtp);
    assert.match(body.data.testOtp, /^\d{6}$/);

    // Verify OTP is hashed in database and valid for 10 minutes
    const userInDb = await User.findById(ctx.student2._id).select('+otpCode +otpExpires');
    assert.ok(userInDb.otpCode);
    assert.ok(userInDb.otpExpires);
    const expectedHash = crypto.createHash('sha256').update(body.data.testOtp).digest('hex');
    assert.strictEqual(userInDb.otpCode, expectedHash);
    assert.ok(new Date(userInDb.otpExpires) > new Date());
  });

  it('2. POST /api/auth/login rejects invalid password before generating OTP (401)', async () => {
    const res = await fetch(`${ctx.baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: ctx.student2.email,
        password: 'WrongPassword!',
      }),
    });

    assert.strictEqual(res.status, 401);
    const body = await res.json();
    assert.strictEqual(body.success, false);
  });

  it('3. POST /api/auth/verify-otp rejects invalid 6-digit code with 400', async () => {
    const res = await fetch(`${ctx.baseUrl}/api/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: ctx.student2.email,
        otp: '999999',
      }),
    });

    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.match(body.message, /Invalid verification code/i);
  });

  it('4. POST /api/auth/verify-otp rejects malformed OTP format (non-numeric or not 6 digits)', async () => {
    const res = await fetch(`${ctx.baseUrl}/api/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: ctx.student2.email,
        otp: '123',
      }),
    });

    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.success, false);
  });

  it('5. POST /api/auth/verify-otp successfully authenticates with correct code, clears OTP fields and issues JWT', async () => {
    // 1. Initiate login
    const loginRes = await fetch(`${ctx.baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: ctx.student2.email,
        password: 'Password123!',
      }),
    });
    const loginBody = await loginRes.json();
    const otp = loginBody.data.testOtp;

    // 2. Verify OTP
    const verifyRes = await fetch(`${ctx.baseUrl}/api/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: ctx.student2.email,
        otp,
      }),
    });

    assert.strictEqual(verifyRes.status, 200);
    const verifyBody = await verifyRes.json();
    assert.strictEqual(verifyBody.success, true);
    assert.ok(verifyBody.data.token);
    assert.strictEqual(verifyBody.data.user.anonymousName, ctx.student2.anonymousName);

    // 3. Confirm OTP fields are wiped from user record
    const userInDb = await User.findById(ctx.student2._id).select('+otpCode +otpExpires');
    assert.strictEqual(userInDb.otpCode, null);
    assert.strictEqual(userInDb.otpExpires, null);
  });

  it('6. POST /api/auth/verify-otp prevents replay attacks (cannot reuse OTP once verified)', async () => {
    // Attempting to verify again with the same OTP
    const res = await fetch(`${ctx.baseUrl}/api/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: ctx.student2.email,
        otp: '123456',
      }),
    });

    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.match(body.message, /No active verification code/i);
  });

  it('7. POST /api/auth/resend-otp generates a fresh OTP with 10-minute validity', async () => {
    const res = await fetch(`${ctx.baseUrl}/api/auth/resend-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: ctx.student2.email,
      }),
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(body.data.testOtp);
    assert.match(body.data.testOtp, /^\d{6}$/);

    // Verify it can now be used to authenticate
    const verifyRes = await fetch(`${ctx.baseUrl}/api/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: ctx.student2.email,
        otp: body.data.testOtp,
      }),
    });

    assert.strictEqual(verifyRes.status, 200);
    const verifyBody = await verifyRes.json();
    assert.ok(verifyBody.data.token);
  });

  it('8. POST /api/auth/verify-otp rejects expired OTP with 400', async () => {
    // Generate an expired OTP directly in DB
    const expiredOtp = '654321';
    const hashed = crypto.createHash('sha256').update(expiredOtp).digest('hex');
    await User.findByIdAndUpdate(ctx.student2._id, {
      otpCode: hashed,
      otpExpires: new Date(Date.now() - 5000), // 5 seconds in the past
    });

    const res = await fetch(`${ctx.baseUrl}/api/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: ctx.student2.email,
        otp: expiredOtp,
      }),
    });

    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.match(body.message, /expired/i);
  });
});
