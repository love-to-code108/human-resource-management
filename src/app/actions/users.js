'use server'

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/session';

export async function createUser(formData) {
  const session = await getSession();
  if (!session?.isAdmin) {
    return { error: 'Unauthorized. Only admins can create users.' };
  }

  const name = formData.get('name');
  const email = formData.get('email');
  const departmentName = formData.get('departmentName');
  const designationName = formData.get('designationName');

  if (!name || !email) {
    return { error: 'Name and email are required.' };
  }

  try {
    const password = formData.get('password') || 'UEM@123';
    
    // Resolve IDs from the submitted names
    let departmentId = null;
    if (departmentName) {
      const dept = await prisma.department.findUnique({ where: { name: departmentName } });
      departmentId = dept?.id;
    }

    let designationId = null;
    if (designationName) {
      const desig = await prisma.designation.findUnique({ where: { name: designationName } });
      designationId = desig?.id;
    }
    
    const activeLeaveTypes = await prisma.leaveType.findMany({ 
      where: { isActive: true },
      include: { allocations: true }
    });
    
    const currentYear = new Date().getFullYear();
    
    await prisma.user.create({
      data: {
        name,
        email,
        password,
        ...(departmentId && { departmentId }),
        ...(designationId && { designationId }),
        leaveBalances: {
          create: activeLeaveTypes.map(lt => {
            const override = lt.allocations?.find(a => a.designationId === designationId);
            const finalDays = override ? override.allocatedDays : lt.defaultDays;
            return {
              leaveTypeId: lt.id,
              totalDays: finalDays,
              year: currentYear,
            };
          })
        }
      },
    });

    revalidatePath('/dashboard/users');
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: 'Failed to create user. Email may already exist.' };
  }
}
