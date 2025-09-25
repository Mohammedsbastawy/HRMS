
import { NextResponse } from 'next/server';
import db from '@/lib/db';
import type { Employee, LeaveRequest } from '@/lib/types';

export async function GET() {
    try {
        const leaveRequestsData: any[] = db.prepare(`SELECT * FROM leave_requests ORDER BY created_at DESC`).all();

        const employeeIds = [...new Set(leaveRequestsData.map(lr => lr.employee_id))];
        let employees: Employee[] = [];
        if (employeeIds.length > 0) {
            const placeholders = employeeIds.map(() => '?').join(',');
            employees = db.prepare(`SELECT id, full_name, avatar FROM employees WHERE id IN (${placeholders})`).all(...employeeIds) as Employee[];
        }
        
        const employeesMap = new Map(employees.map(e => [e.id, e]));

        const formattedLeaveRequests: LeaveRequest[] = leaveRequestsData.map(lr => ({
            ...lr,
            start_date: lr.start_date,
            end_date: lr.end_date,
            employee: employeesMap.get(lr.employee_id) || { id: lr.employee_id, full_name: 'موظف غير معروف', email: '' }
        })) as any[];

        return NextResponse.json({ leaveRequests: formattedLeaveRequests });

    } catch (e) {
        console.error(e);
        return NextResponse.json({ message: 'فشل في جلب طلبات الإجازة' }, { status: 500 });
    }
}
