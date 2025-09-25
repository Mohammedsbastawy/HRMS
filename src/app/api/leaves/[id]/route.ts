
import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const leaveId = parseInt(params.id, 10);
    if (isNaN(leaveId)) {
      return NextResponse.json({ success: false, message: 'معرف طلب غير صالح' }, { status: 400 });
    }

    const body = await request.json();
    const { action, notes } = body;

    let stmt;
    let result;

    if (action === 'approve') {
      stmt = db.prepare(`
        UPDATE leave_requests
        SET status = 'Approved', approved_by = 1 -- Placeholder for current user ID
        WHERE id = @id AND status = 'Pending'
      `);
      result = stmt.run({ id: leaveId });
    } else if (action === 'reject') {
      stmt = db.prepare(`
        UPDATE leave_requests
        SET status = 'Rejected', approved_by = 1, notes = @notes -- Placeholder
        WHERE id = @id AND status = 'Pending'
      `);
      result = stmt.run({ id: leaveId, notes: notes || '' });
    } else {
      return NextResponse.json({ success: false, message: 'إجراء غير صالح' }, { status: 400 });
    }

    if (result.changes > 0) {
      const message = action === 'approve' ? 'تمت الموافقة على طلب الإجازة.' : 'تم رفض طلب الإجازة.';
      return NextResponse.json({ success: true, message });
    } else {
      return NextResponse.json({ success: false, message: 'لم يتم العثور على الطلب أو تمت معالجته بالفعل.' }, { status: 404 });
    }

  } catch (error) {
    console.error('Failed to update leave request:', error);
    return NextResponse.json({ success: false, message: 'حدث خطأ في قاعدة البيانات.' }, { status: 500 });
  }
}
