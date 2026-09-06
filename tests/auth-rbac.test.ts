import { describe, it, expect } from 'vitest';
import { hashPassword, comparePassword, signToken, verifyToken } from '@/lib/auth';

describe('Auth & JWT Security', () => {
  it('should hash and compare passwords correctly', async () => {
    const raw = 'SuperSecret123!';
    const hash = await hashPassword(raw);
    expect(hash).not.toBe(raw);
    const isMatch = await comparePassword(raw, hash);
    expect(isMatch).toBe(true);

    const isWrongMatch = await comparePassword('WrongPassword', hash);
    expect(isWrongMatch).toBe(false);
  });

  it('should sign and verify valid JWT token', async () => {
    const payload = {
      userId: 'user-123',
      username: 'ogretmen1',
      role: 'TEACHER' as const,
      name: 'Ahmet',
      surname: 'Kaya',
    };

    const token = await signToken(payload, '1h');
    expect(typeof token).toBe('string');

    const verified = await verifyToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.userId).toBe('user-123');
    expect(verified?.role).toBe('TEACHER');
  });

  it('should reject invalid or tampered token', async () => {
    const verified = await verifyToken('invalid.tampered.token');
    expect(verified).toBeNull();
  });
});
