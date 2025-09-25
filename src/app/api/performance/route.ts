
import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const performanceReviews: any[] = db.prepare(`
            SELECT pr.*, e.full_name as employeeName 
            FROM performance_reviews pr 
            JOIN employees e ON pr.employee_id = e.id
        `).all();
    
    return NextResponse.json({ performanceReviews });

  } catch(e) {
    return NextResponse.json({ message: 'فشل في جلب تقييمات الأداء' }, { status: 500 });
  }
}
