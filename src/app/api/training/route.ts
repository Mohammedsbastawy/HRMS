
import { NextResponse } from 'next/server';
import db from '@/lib/db';
import type { TrainingRecord, Employee, PerformanceReview } from '@/lib/types';


export async function GET() {
  try {
    const trainingRecords: any[] = db.prepare(`
        SELECT tr.*, e.full_name as employeeName, tc.title as courseTitle
        FROM training_records tr
        JOIN employees e ON tr.employee_id = e.id
        JOIN training_courses tc ON tr.course_id = tc.id
    `).all();
    
    const employees: Employee[] = db.prepare('SELECT * FROM employees').all() as Employee[];
    const performanceReviews: PerformanceReview[] = db.prepare('SELECT * FROM performance_reviews').all() as PerformanceReview[];

    return NextResponse.json({ trainingRecords, employees, performanceReviews });
  } catch(e) {
      return NextResponse.json({ message: 'فشل في جلب بيانات التدريب' }, { status: 500 });
  }
}
