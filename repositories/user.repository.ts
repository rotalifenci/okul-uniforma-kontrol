import prisma from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { User, UserRole } from '@/types';

export class UserRepository {
  async findByUsername(username: string) {
    return prisma.user.findUnique({
      where: { username },
    });
  }

  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        name: true,
        surname: true,
        role: true,
        active: true,
        last_login_at: true,
        created_at: true,
        updated_at: true,
      },
    });
  }

  async getAllUsers(role?: UserRole) {
    const where: any = {};
    if (role) where.role = role;

    return prisma.user.findMany({
      where,
      orderBy: [{ role: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        username: true,
        name: true,
        surname: true,
        role: true,
        active: true,
        last_login_at: true,
        created_at: true,
        updated_at: true,
        _count: {
          select: { violations: true },
        },
      },
    });
  }

  async createUser(data: {
    username: string;
    name: string;
    surname: string;
    role: UserRole;
    password: string;
    active?: boolean;
  }) {
    const password_hash = await hashPassword(data.password);
    return prisma.user.create({
      data: {
        username: data.username,
        name: data.name,
        surname: data.surname,
        role: data.role,
        password_hash,
        active: data.active !== undefined ? data.active : true,
      },
      select: {
        id: true,
        username: true,
        name: true,
        surname: true,
        role: true,
        active: true,
        created_at: true,
      },
    });
  }

  async updateUser(
    id: string,
    data: {
      name?: string;
      surname?: string;
      role?: UserRole;
      password?: string;
      active?: boolean;
    }
  ) {
    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.surname) updateData.surname = data.surname;
    if (data.role) updateData.role = data.role;
    if (typeof data.active === 'boolean') updateData.active = data.active;
    if (data.password && data.password.trim().length >= 6) {
      updateData.password_hash = await hashPassword(data.password.trim());
    }

    return prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        name: true,
        surname: true,
        role: true,
        active: true,
        updated_at: true,
      },
    });
  }

  async updateLastLogin(id: string) {
    return prisma.user.update({
      where: { id },
      data: { last_login_at: new Date() },
    });
  }

  async toggleActive(id: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new Error('Kullanıcı bulunamadı.');
    return prisma.user.update({
      where: { id },
      data: { active: !user.active },
    });
  }
}

export const userRepository = new UserRepository();
