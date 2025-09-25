
import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const query = db.prepare('SELECT id, title_ar, department_id FROM job_titles');
    const jobTitles = query.all();
    return NextResponse.json(jobTitles);
  } catch (error: any) {
    console.error('Failed to fetch job titles:', error);
    return NextResponse.json(
      { message: 'فشل في جلب المسميات الوظيفية', error: error.message },
      { status: 500 }
    );
  }
}
