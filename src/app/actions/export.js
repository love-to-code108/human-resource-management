'use server';

import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { format } from 'date-fns';

export async function exportSystemData() {
  try {
    const session = await getSession();
    if (!session?.isAdmin) {
      return { error: 'Unauthorized. Only administrators can export data.' };
    }

    // Fetch all users with relevant relationships
    const users = await prisma.user.findMany({
      include: {
        department: true,
        designation: true,
        leaveBalances: {
          include: {
            leaveType: true
          }
        },
        leavesApplied: {
          include: {
            leaveType: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    // 1. Prepare Employee Directory Data
    const directoryData = users.map(user => {
      // Calculate totals
      const totalLeavesTaken = user.leavesApplied.reduce((sum, req) => {
        if (req.status === 'APPROVED') {
          return sum + req.totalDays;
        }
        return sum;
      }, 0);

      const row = {
        'Employee Name': user.name,
        'Email': user.email,
        'Department': user.department?.name || 'N/A',
        'Designation': user.designation?.name || 'N/A',
        'Joined Date': user.createdAt ? format(new Date(user.createdAt), 'MMM d, yyyy') : 'N/A',
        'Total Leaves Taken (Approved)': totalLeavesTaken
      };

      // Add dynamic leave balance columns
      user.leaveBalances.forEach(balance => {
        const typeName = balance.leaveType.name;
        row[`${typeName} (Remaining / Total)`] = `${balance.totalDays - balance.usedDays} / ${balance.totalDays}`;
      });

      return row;
    });

    // 2. Prepare Detailed Leave Log Data
    const leaveLogData = [];
    users.forEach(user => {
      user.leavesApplied.forEach(req => {
        leaveLogData.push({
          'Employee Name': user.name,
          'Department': user.department?.name || 'N/A',
          'Designation': user.designation?.name || 'N/A',
          'Leave Type': req.leaveType?.name || 'N/A',
          'Start Date': req.startDate ? format(new Date(req.startDate), 'MMM d, yyyy') : 'N/A',
          'End Date': req.endDate ? format(new Date(req.endDate), 'MMM d, yyyy') : 'N/A',
          'Total Days': req.totalDays,
          'Status': req.status,
          'Reason': req.reason || '',
          'Applied On': req.createdAt ? format(new Date(req.createdAt), 'MMM d, yyyy') : 'N/A'
        });
      });
    });

    // Sort leave logs chronologically by start date
    leaveLogData.sort((a, b) => new Date(b['Start Date']) - new Date(a['Start Date']));

    return { 
      success: true, 
      directoryData, 
      leaveLogData 
    };

  } catch (error) {
    console.error('Error exporting data:', error);
    return { error: 'Failed to aggregate export data.' };
  }
}
