
import { NextResponse } from 'next/server';
import db from '@/lib/db';
import type { Employee, LeaveRequest, PerformanceReview, Job } from '@/lib/types';

export async function GET() {
  try {
    const employees = db.prepare('SELECT id, full_name, hire_date FROM employees').all();
    const leaveRequestsData = db.prepare(`
        SELECT lr.*, e.full_name, e.avatar 
        FROM leave_requests lr 
        JOIN employees e ON lr.employee_id = e.id
      `).all();

    const leaveRequests = leaveRequestsData.map((lr: any) => ({ 
        ...lr, 
        employee: { id: lr.employee_id, full_name: lr.full_name, avatar: lr.avatar } 
    }));

    const performanceReviews = db.prepare('SELECT score FROM performance_reviews').all();
    const jobs = db.prepare("SELECT id, created_at FROM jobs WHERE status = 'Open'").all();
    
    const logs = db.prepare('SELECT al.*, u.username FROM audit_logs al LEFT JOIN users u ON al.user_id = u.id ORDER BY al.timestamp DESC LIMIT 5').all();
    const recentActivities = logs.map((log: any) => ({
        text: `${log.username || 'النظام'} قام بـ "${log.action}"`,
        time: new Date(log.timestamp).toLocaleString('ar-EG'),
    }));

    return NextResponse.json({
        employees,
        leaveRequests,
        performanceReviews,
        jobs,
        recentActivities
    });

  } catch (error: any) {
    console.error('Failed to fetch dashboard data:', error);
    return NextResponse.json({ message: 'فشل في جلب بيانات لوحة التحكم', error: error.message }, { status: 500 });
  }
}
