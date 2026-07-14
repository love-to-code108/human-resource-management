'use server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function getUserSettings() {
  try {
    const payload = await getSession();
    if (!payload) return { error: 'Not authenticated' };

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        department: true,
        designation: true,
      }
    });

    if (!user) return { error: 'User not found' };

    // Get current year leave balances
    const currentYear = new Date().getFullYear();
    const leaveBalances = await prisma.leaveBalance.findMany({
      where: {
        userId: user.id,
        year: currentYear
      },
      include: {
        leaveType: true
      }
    });

    return {
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        department: user.department?.name,
        designation: user.designation?.name,
      },
      leaveBalances
    };
  } catch (error) {
    console.error('Error fetching user settings:', error);
    return { error: 'Failed to load user settings' };
  }
}

export async function updateUserName(newName) {
  try {
    const payload = await getSession();
    if (!payload) return { error: 'Not authenticated' };

    if (!newName || newName.trim().length === 0) {
      return { error: 'Name cannot be empty' };
    }

    const updatedUser = await prisma.user.update({
      where: { id: payload.userId },
      data: { name: newName.trim() }
    });

    return { success: true, name: updatedUser.name };
  } catch (error) {
    console.error('Error updating user name:', error);
    return { error: 'Failed to update user name' };
  }
}

export async function updateUserPassword(currentPassword, newPassword) {
  try {
    const payload = await getSession();
    if (!payload) return { error: 'Not authenticated' };

    const user = await prisma.user.findUnique({
      where: { id: payload.userId }
    });

    if (!user) return { error: 'User not found' };

    if (user.password !== currentPassword) {
      return { error: 'Incorrect current password' };
    }

    if (!newPassword || newPassword.length < 6) {
      return { error: 'New password must be at least 6 characters long' };
    }

    await prisma.user.update({
      where: { id: payload.userId },
      data: { password: newPassword }
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating password:', error);
    return { error: 'Failed to update password' };
  }
}

export async function updateUserAvatar(base64Image) {
  try {
    const payload = await getSession();
    if (!payload) return { error: 'Not authenticated' };

    if (!base64Image || !base64Image.startsWith('data:image/')) {
      return { error: 'Invalid image format' };
    }

    await prisma.user.update({
      where: { id: payload.userId },
      data: { avatar: base64Image }
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating avatar:', error);
    return { error: 'Failed to update avatar' };
  }
}
