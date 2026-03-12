import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { LoginPayload, AuthUser } from '../types';

const demoUsers = [
  { username: 'monitor1', password: '123456', role: 'monitor' as const },
  { username: 'admin1', password: 'admin123', role: 'admin' as const },
];

export async function login(req: Request, res: Response) {
  const { username, password } = req.body as LoginPayload;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  const user = demoUsers.find((u) => u.username === username && u.password === password);

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const authUser: AuthUser = { username: user.username, role: user.role };

  const token = jwt.sign(authUser, process.env.JWT_SECRET || 'secret', { expiresIn: '24h' });

  res.json({ token, user: authUser });
}
