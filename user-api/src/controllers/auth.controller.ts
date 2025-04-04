import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

export const register = async (req: Request, res: Response) => {
  const { email, password, inviteCode } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ message: 'Email already exists' });

    let invitedById = undefined;
    if (inviteCode) {
      const inviter = await prisma.user.findUnique({ where: { inviteCode } });
      if (!inviter) return res.status(400).json({ message: 'Invalid invite code' });
      invitedById = inviter.id;
    }

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        invitedById,
        inviteCode: randomUUID().slice(0, 8),
      },
    });

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Registration error' });
  }
}; 