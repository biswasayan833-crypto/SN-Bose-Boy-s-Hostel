import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import { setupTestEnvironment, teardownTestEnvironment } from './testHelper.js';
import User from '../models/User.js';

describe('Task 6: Profile & Anonymous Identity Management Suite', () => {
  let env;

  before(async () => {
    env = await setupTestEnvironment();
  });

  after(async () => {
    await teardownTestEnvironment();
  });

  it('1. Rejects unauthenticated request to /api/profile/me (401 Unauthorized)', async () => {
    const res = await fetch(`${env.baseUrl}/api/profile/me`);
    assert.equal(res.status, 401);
  });

  it('2. Authenticated resident can retrieve own profile with private fields', async () => {
    const res = await fetch(`${env.baseUrl}/api/profile/me`, {
      headers: { Authorization: `Bearer ${env.student2Token}` },
    });

    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);

    const profile = json.data.profile;
    assert.ok(profile);
    assert.equal(profile.id, env.student2._id.toString());
    assert.equal(profile.fullName, 'Second Year Student');
    assert.equal(profile.email, env.student2.email);
    assert.equal(profile.year, '2nd Year');
    assert.equal(profile.anonymousName, 'MysticFalcon');
    assert.equal(profile.anonymousAvatar, '🦅');
    assert.equal(profile.role, 'student');

    // Password and hash must NEVER be present
    assert.equal(profile.password, undefined);
    assert.equal(profile.passwordHash, undefined);
    assert.ok(!JSON.stringify(json).includes('Password123!'));
  });

  it('3. User can successfully update their own anonymous pseudonym and avatar', async () => {
    const res = await fetch(`${env.baseUrl}/api/profile/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.student2Token}`,
      },
      body: JSON.stringify({
        anonymousName: 'CyberNomad',
        anonymousAvatar: 'avatar-04',
        bio: 'Coding under the starlight.',
      }),
    });

    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.equal(json.data.profile.anonymousName, 'CyberNomad');
    assert.equal(json.data.profile.anonymousAvatar, 'avatar-04');
    assert.equal(json.data.profile.bio, 'Coding under the starlight.');

    // Verify database reflection
    const updatedUser = await User.findById(env.student2._id);
    assert.equal(updatedUser.anonymousName, 'CyberNomad');
    assert.equal(updatedUser.anonymousAvatar, 'avatar-04');
    assert.equal(updatedUser.bio, 'Coding under the starlight.');
  });

  it('4. Rejects invalid anonymous name (too short, too long, HTML/tags, empty)', async () => {
    // Too short (< 3 chars)
    const shortRes = await fetch(`${env.baseUrl}/api/profile/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.student2Token}`,
      },
      body: JSON.stringify({ anonymousName: 'ab' }),
    });
    assert.equal(shortRes.status, 400);

    // Empty
    const emptyRes = await fetch(`${env.baseUrl}/api/profile/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.student2Token}`,
      },
      body: JSON.stringify({ anonymousName: '   ' }),
    });
    assert.equal(emptyRes.status, 400);

    // Too long (> 30 chars)
    const longRes = await fetch(`${env.baseUrl}/api/profile/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.student2Token}`,
      },
      body: JSON.stringify({ anonymousName: 'A'.repeat(31) }),
    });
    assert.equal(longRes.status, 400);

    // HTML / Script injection
    const htmlRes = await fetch(`${env.baseUrl}/api/profile/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.student2Token}`,
      },
      body: JSON.stringify({ anonymousName: '<script>alert(1)</script>' }),
    });
    assert.equal(htmlRes.status, 400);
  });

  it('5. Rejects reserved administrative anonymous names', async () => {
    const res = await fetch(`${env.baseUrl}/api/profile/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.student2Token}`,
      },
      body: JSON.stringify({ anonymousName: 'Admin' }),
    });

    assert.equal(res.status, 400);
    const json = await res.json();
    assert.ok(json.message.includes('reserved'));
  });

  it('6. Rejects unapproved / external avatar inputs', async () => {
    const res = await fetch(`${env.baseUrl}/api/profile/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.student2Token}`,
      },
      body: JSON.stringify({ anonymousAvatar: 'https://malicious.site/avatar.png' }),
    });

    assert.equal(res.status, 400);
    const json = await res.json();
    assert.ok(json.message.includes('Invalid avatar'));
  });

  it('7. Strictly forbids modifying private/privileged fields (role, year, email, fullName, isActive, password)', async () => {
    const res = await fetch(`${env.baseUrl}/api/profile/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.student2Token}`,
      },
      body: JSON.stringify({
        anonymousName: 'ValidStudentName',
        role: 'admin',
        year: '4th Year',
        email: 'hacker@snbose.edu',
        fullName: 'Hacked Admin',
        isActive: false,
        password: 'HackedPassword123!',
      }),
    });

    assert.equal(res.status, 200);

    // Verify in database that NO privileged fields changed
    const dbUser = await User.findById(env.student2._id);
    assert.equal(dbUser.role, 'student'); // Role NOT escalated
    assert.equal(dbUser.year, '2nd Year'); // Year NOT changed
    assert.equal(dbUser.email, env.student2.email); // Email NOT changed
    assert.equal(dbUser.fullName, 'Second Year Student'); // Full name NOT changed
    assert.equal(dbUser.isActive, true); // Still active
  });

  it('8. Rejects password change with incorrect current password', async () => {
    const res = await fetch(`${env.baseUrl}/api/profile/me/password`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.student2Token}`,
      },
      body: JSON.stringify({
        currentPassword: 'WrongPassword!',
        newPassword: 'BrandNewPassword123!',
      }),
    });

    assert.equal(res.status, 400);
    const json = await res.json();
    assert.equal(json.success, false);
    assert.ok(json.message.includes('Current password'));
  });

  it('9. Rejects password change with weak new password (< 8 chars)', async () => {
    const res = await fetch(`${env.baseUrl}/api/profile/me/password`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.student2Token}`,
      },
      body: JSON.stringify({
        currentPassword: 'Password123!',
        newPassword: 'short',
      }),
    });

    assert.equal(res.status, 400);
  });

  it('10. Allows password change with valid current and new password, hashing it properly', async () => {
    const res = await fetch(`${env.baseUrl}/api/profile/me/password`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.student2Token}`,
      },
      body: JSON.stringify({
        currentPassword: 'Password123!',
        newPassword: 'NewSecurePassword123!',
      }),
    });

    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.ok(!JSON.stringify(json).includes('NewSecurePassword123!'));

    // Verify in database that password was hashed
    const dbUser = await User.findById(env.student2._id).select('+password');
    assert.notEqual(dbUser.password, 'NewSecurePassword123!');
    const isMatch = await bcrypt.compare('NewSecurePassword123!', dbUser.password);
    assert.equal(isMatch, true);

    // Verify old password no longer logs in
    const oldLoginRes = await fetch(`${env.baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: env.student2.email,
        password: 'Password123!',
      }),
    });
    assert.equal(oldLoginRes.status, 401);

    // Verify new password successfully logs in
    const newLoginRes = await fetch(`${env.baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: env.student2.email,
        password: 'NewSecurePassword123!',
      }),
    });
    assert.equal(newLoginRes.status, 200);
  });
});
