import { Response } from 'express';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

/**
 * GET /owner/salary
 * Returns salary overview for all active staff members.
 * Groups by staffRole, computes total payroll, bonus estimates.
 */
export async function getSalaryOverview(req: AuthenticatedRequest, res: Response) {
  try {
    const staff = await prisma.staffProfile.findMany({
      where: { isActive: true },
      select: {
        id: true,
        staffRole: true,
        salary: true,
        shift: true,
        department: true,
        joiningDate: true,
        lastLoginAt: true,
        user: {
          select: { id: true, name: true, email: true, phone: true, profilePicture: true },
        },
      },
      orderBy: { staffRole: 'asc' },
    });

    const totalPayroll = staff.reduce((sum, s) => {
      return sum + parseFloat(s.salary?.toString() || '0');
    }, 0);

    const byRole: Record<string, { count: number; totalSalary: number }> = {};
    staff.forEach((s) => {
      if (!byRole[s.staffRole]) byRole[s.staffRole] = { count: 0, totalSalary: 0 };
      byRole[s.staffRole].count += 1;
      byRole[s.staffRole].totalSalary += parseFloat(s.salary?.toString() || '0');
    });

    const staffWithSalary = staff.map((s) => ({
      ...s,
      salary: s.salary ? parseFloat(s.salary.toString()) : null,
      monthsServed: s.joiningDate
        ? Math.max(
            0,
            Math.floor(
              (Date.now() - new Date(s.joiningDate).getTime()) / (1000 * 60 * 60 * 24 * 30)
            )
          )
        : null,
    }));

    return res.json({
      success: true,
      data: {
        staff: staffWithSalary,
        totalPayroll,
        totalStaff: staff.length,
        byRole,
      },
    });
  } catch (error) {
    console.error('[SALARY] getSalaryOverview error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch salary overview.' });
  }
}

/**
 * GET /owner/salary/:staffId
 * Returns salary detail for a single staff member.
 */
export async function getStaffSalaryDetail(req: AuthenticatedRequest, res: Response) {
  try {
    const { staffId } = req.params;

    const profile = await prisma.staffProfile.findUnique({
      where: { id: staffId },
      select: {
        id: true,
        staffRole: true,
        salary: true,
        shift: true,
        department: true,
        joiningDate: true,
        lastLoginAt: true,
        cnic: true,
        user: {
          select: { id: true, name: true, email: true, phone: true, profilePicture: true },
        },
      },
    });

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Staff member not found.' });
    }

    // Login history for attendance proxy
    const loginHistory = await prisma.loginHistory.findMany({
      where: { userId: profile.user.id },
      orderBy: { loginTime: 'desc' },
      take: 30,
      select: { loginTime: true, ip: true, device: true },
    });

    return res.json({
      success: true,
      data: {
        ...profile,
        salary: profile.salary ? parseFloat(profile.salary.toString()) : null,
        loginHistory,
      },
    });
  } catch (error) {
    console.error('[SALARY] getStaffSalaryDetail error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch salary detail.' });
  }
}

/**
 * PUT /owner/salary/:staffId
 * Update salary for a staff member.
 */
export async function updateStaffSalary(req: AuthenticatedRequest, res: Response) {
  try {
    const { staffId } = req.params;
    const { salary, shift, department, joiningDate, assignedBranch } = req.body;

    const profile = await prisma.staffProfile.findUnique({ where: { id: staffId } });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Staff member not found.' });
    }

    if (profile.staffRole === 'OWNER') {
      // Owner can update their own salary
      const callerProfile = await prisma.staffProfile.findUnique({ where: { userId: req.user!.id } });
      if (callerProfile?.staffRole !== 'OWNER') {
        return res.status(403).json({ success: false, message: 'Only an Owner can modify Owner salary.' });
      }
    }

    const updated = await prisma.staffProfile.update({
      where: { id: staffId },
      data: {
        ...(salary !== undefined && { salary: salary ? parseFloat(salary) : null }),
        ...(shift !== undefined && { shift: shift || null }),
        ...(department !== undefined && { department: department || null }),
        ...(joiningDate !== undefined && { joiningDate: joiningDate ? new Date(joiningDate) : null }),
        ...(assignedBranch !== undefined && { assignedBranch: assignedBranch || null }),
      },
      select: {
        id: true,
        staffRole: true,
        salary: true,
        shift: true,
        department: true,
        joiningDate: true,
        user: { select: { id: true, name: true } },
      },
    });

    return res.json({
      success: true,
      message: 'Salary updated successfully.',
      data: { ...updated, salary: updated.salary ? parseFloat(updated.salary.toString()) : null },
    });
  } catch (error) {
    console.error('[SALARY] updateStaffSalary error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update salary.' });
  }
}

/**
 * GET /owner/salary/month/:year/:month
 * Generate monthly payroll report for all active staff.
 */
export async function getMonthlyPayroll(req: AuthenticatedRequest, res: Response) {
  try {
    const { year, month } = req.params;
    const y = parseInt(year);
    const m = parseInt(month); // 1-12

    if (isNaN(y) || isNaN(m) || m < 1 || m > 12) {
      return res.status(400).json({ success: false, message: 'Invalid year or month.' });
    }

    const startDate = new Date(y, m - 1, 1);
    const endDate = new Date(y, m, 0, 23, 59, 59);

    const staff = await prisma.staffProfile.findMany({
      where: { isActive: true },
      select: {
        id: true,
        staffRole: true,
        salary: true,
        shift: true,
        department: true,
        joiningDate: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            loginHistories: {
              where: { loginTime: { gte: startDate, lte: endDate } },
              select: { loginTime: true },
            },
          },
        },
      },
    });

    const payroll = staff.map((s) => {
      const baseSalary = parseFloat(s.salary?.toString() || '0');
      const daysPresent = s.user.loginHistories.length;
      const isNewJoiner = s.joiningDate && new Date(s.joiningDate) > startDate;
      const prorated = isNewJoiner
        ? Math.round(
            (baseSalary / 30) *
              Math.max(0, endDate.getDate() - new Date(s.joiningDate!).getDate() + 1)
          )
        : baseSalary;

      return {
        staffId: s.id,
        name: s.user.name,
        email: s.user.email,
        phone: s.user.phone,
        role: s.staffRole,
        shift: s.shift || 'MORNING',
        department: s.department || 'Operations',
        baseSalary,
        proratedSalary: prorated,
        daysPresent,
        isNewJoiner: !!isNewJoiner,
        joiningDate: s.joiningDate,
      };
    });

    const totalPayroll = payroll.reduce((sum, p) => sum + p.proratedSalary, 0);

    return res.json({
      success: true,
      data: {
        year: y,
        month: m,
        payroll,
        totalPayroll,
        staffCount: payroll.length,
      },
    });
  } catch (error) {
    console.error('[SALARY] getMonthlyPayroll error:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate payroll report.' });
  }
}
