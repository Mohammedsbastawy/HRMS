
import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const auditLogs: any[] = db.prepare(`
        SELECT al.*, u.username 
        FROM audit_logs al 
        LEFT JOIN users u ON al.user_id = u.id 
        ORDER BY al.timestamp DESC
      `).all();
    
    return NextResponse.json({ auditLogs });
  } catch(e) {
    console.error(e);
    return NextResponse.json({ message: 'فشل في جلب سجلات التدقيق' }, { status: 500 });
  }
}
