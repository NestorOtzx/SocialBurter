import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { dbGet, dbRun } from '../db';
import { LoginPayload, AuthUser } from '../types';

const SALT_ROUNDS = 10;

export async function login(req: Request, res: Response) {
  const { username, password } = req.body as LoginPayload;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  const user = await dbGet(
    `SELECT username, password_hash, role FROM users WHERE username = ?`,
    [username]
  );

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const passwordMatch = await bcrypt.compare(password, user.password_hash);

  if (!passwordMatch) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const authUser: AuthUser = { username: user.username, role: user.role };
  const token = jwt.sign(authUser, process.env.JWT_SECRET || 'secret', { expiresIn: '24h' });

  res.json({ token, user: authUser });
}

export async function changePassword(req: Request, res: Response) {
  const { currentPassword, newPassword } = req.body as {
    currentPassword: string;
    newPassword: string;
  };

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'currentPassword and newPassword are required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters' });
  }

  const username = req.user?.username;

  if (!username) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const user = await dbGet(
    `SELECT username, password_hash FROM users WHERE username = ?`,
    [username]
  );

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const passwordMatch = await bcrypt.compare(currentPassword, user.password_hash);

  if (!passwordMatch) {
    return res.status(401).json({ error: 'Current password is incorrect' });
  }

  const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

  await dbRun(
    `UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE username = ?`,
    [newHash, username]
  );

  res.json({ message: 'Password updated successfully' });
}
