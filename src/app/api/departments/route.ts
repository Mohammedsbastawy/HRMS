
import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const departmentsQuery = db.prepare('SELECT * FROM departments ORDER BY created_at DESC');
    const departments = departmentsQuery.all();

    const jobTitlesQuery = db.prepare(`
        SELECT jt.*, d.name_ar as department_name_ar 
        FROM job_titles jt 
        JOIN departments d ON jt.department_id = d.id 
        ORDER BY jt.created_at DESC
    `);
    const jobTitles = jobTitlesQuery.all();
    
    return NextResponse.json({ departments, jobTitles });

  } catch (error: any) {
    console.error('Failed to fetch department data:', error);
    return NextResponse.json(
      { message: 'فشل في جلب البيانات', error: error.message }, 
      { status: 500 }
    );
  }
}
