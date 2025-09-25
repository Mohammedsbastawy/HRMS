
import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const payrolls: any[] = db.prepare(`
        SELECT p.*, e.full_name as employeeName 
        FROM payrolls p 
        JOIN employees e ON p.employee_id = e.id
      `).all();
    
    return NextResponse.json({ payrolls });

  } catch(e) {
    return NextResponse.json({ message: 'فشل في جلب بيانات الرواتب' }, { status: 500 });
  }
}
