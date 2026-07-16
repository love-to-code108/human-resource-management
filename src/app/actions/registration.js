'use server'

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { revalidatePath } from 'next/cache';

// Admin: Get Settings
export async function getSignupSettings() {
  try {
    const session = await getSession();
    if (!session?.isAdmin) return { error: 'Unauthorized.' };

    const enabledSetting = await prisma.systemSetting.findUnique({ where: { key: 'SIGNUP_ENABLED' } });
    const otpSetting = await prisma.systemSetting.findUnique({ where: { key: 'SIGNUP_OTP' } });

    return {
      success: true,
      enabled: enabledSetting?.value === 'true',
      otp: otpSetting?.value || ''
    };
  } catch (error) {
    console.error('Error fetching signup settings:', error);
    return { error: 'Failed to fetch signup settings.' };
  }
}

// Public: Check if signup is enabled
export async function checkIfSignupEnabled() {
  try {
    const enabledSetting = await prisma.systemSetting.findUnique({ where: { key: 'SIGNUP_ENABLED' } });
    return { success: true, enabled: enabledSetting?.value === 'true' };
  } catch (error) {
    console.error('Error checking if signups are enabled:', error);
    return { error: 'Failed to check signup status.' };
  }
}

// Admin: Update Settings
export async function updateSignupSettings(enabled, otp) {
  try {
    const session = await getSession();
    if (!session?.isAdmin) return { error: 'Unauthorized.' };

    await prisma.systemSetting.upsert({
      where: { key: 'SIGNUP_ENABLED' },
      update: { value: enabled ? 'true' : 'false' },
      create: { key: 'SIGNUP_ENABLED', value: enabled ? 'true' : 'false' }
    });

    await prisma.systemSetting.upsert({
      where: { key: 'SIGNUP_OTP' },
      update: { value: otp },
      create: { key: 'SIGNUP_OTP', value: otp }
    });

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Error updating signup settings:', error);
    return { error: 'Failed to update signup settings.' };
  }
}

// Public: Submit Signup
export async function submitSignup(data) {
  try {
    const { name, email, password, otp, departmentId, designationId } = data;

    // Check if signup is enabled
    const enabledSetting = await prisma.systemSetting.findUnique({ where: { key: 'SIGNUP_ENABLED' } });
    if (enabledSetting?.value !== 'true') {
      return { error: 'Signups are currently disabled.' };
    }

    // Verify OTP
    const otpSetting = await prisma.systemSetting.findUnique({ where: { key: 'SIGNUP_OTP' } });
    if (otpSetting?.value !== otp) {
      return { error: 'Invalid invite code.' };
    }

    if (!departmentId || !designationId) {
      return { error: 'Department and Designation are required.' };
    }

    // Check email uniqueness in User table
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return { error: 'This email is already registered.' };
    }

    // Check email uniqueness in PendingRegistration table
    const existingPending = await prisma.pendingRegistration.findUnique({ where: { email } });
    if (existingPending) {
      return { error: 'A pending registration already exists for this email.' };
    }

    // Create Pending Registration
    const registration = await prisma.pendingRegistration.create({
      data: {
        name,
        email,
        password, // Not hashed, as per current system design
        departmentId,
        designationId,
        status: 'PENDING'
      }
    });

    return { success: true, registrationId: registration.id };
  } catch (error) {
    console.error('Error submitting signup:', error);
    return { error: 'Failed to submit signup application.' };
  }
}

// Public: Check Status
export async function checkRegistrationStatus(id) {
  try {
    if (!id) return { success: false };
    const registration = await prisma.pendingRegistration.findUnique({ where: { id } });
    if (!registration) return { success: false };
    
    return { success: true, status: registration.status };
  } catch (error) {
    console.error('Error checking registration status:', error);
    return { error: 'Failed to check status.' };
  }
}

// Admin: Get Pending Registrations
export async function getPendingRegistrations() {
  try {
    const session = await getSession();
    if (!session?.isAdmin) return { error: 'Unauthorized.' };

    const registrations = await prisma.pendingRegistration.findMany({
      include: {
        department: true,
        designation: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return { success: true, registrations };
  } catch (error) {
    console.error('Error fetching pending registrations:', error);
    return { error: 'Failed to fetch pending registrations.' };
  }
}

// Admin: Approve
export async function approveRegistration(id, departmentId, designationId) {
  try {
    const session = await getSession();
    if (!session?.isAdmin) return { error: 'Unauthorized.' };

    const pending = await prisma.pendingRegistration.findUnique({ where: { id } });
    if (!pending) return { error: 'Registration not found.' };
    if (pending.status !== 'PENDING') return { error: 'Only pending registrations can be approved.' };

    // Check email again just in case
    const existingUser = await prisma.user.findUnique({ where: { email: pending.email } });
    if (existingUser) {
      return { error: 'This email is already registered as a User.' };
    }

    // Create the User
    const newUser = await prisma.user.create({
      data: {
        name: pending.name,
        email: pending.email,
        password: pending.password, // Not hashed, as per system design
        departmentId,
        designationId
      }
    });

    // Mark as APPROVED
    await prisma.pendingRegistration.update({
      where: { id },
      data: { status: 'APPROVED' }
    });

    // Initialize leave balances
    const activeLeaveTypes = await prisma.leaveType.findMany({ 
      where: { isActive: true },
      include: { allocations: true }
    });
    const currentYear = new Date().getFullYear();

    for (const lt of activeLeaveTypes) {
      const override = lt.allocations?.find(a => a.designationId === designationId);
      const finalDays = override ? override.allocatedDays : lt.defaultDays;

      await prisma.leaveBalance.create({
        data: {
          userId: newUser.id,
          leaveTypeId: lt.id,
          year: currentYear,
          totalDays: finalDays,
          usedDays: 0
        }
      });
    }

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Error approving registration:', error);
    return { error: 'Failed to approve registration.' };
  }
}

// Admin: Reject
export async function rejectRegistration(id) {
  try {
    const session = await getSession();
    if (!session?.isAdmin) return { error: 'Unauthorized.' };

    await prisma.pendingRegistration.update({
      where: { id },
      data: { status: 'REJECTED' }
    });

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Error rejecting registration:', error);
    return { error: 'Failed to reject registration.' };
  }
}
