'use server';
import { NextResponse } from 'next/server';
import { syncAttendance } from '@/lib/zkt-service';

export async function POST() {
  try {
    console.log('Starting attendance sync...');
    const result = await syncAttendance();
    console.log('Attendance sync finished.', result);
    
    if (result.success) {
      return NextResponse.json({ message: `تمت مزامنة ${result.records?.length || 0} سجل بنجاح.`, records: result.records });
    } else {
      // In case of a predictable error (e.g., connection failed)
      return NextResponse.json({ message: 'فشلت المزامنة: ' + result.error }, { status: 500 });
    }
  } catch (error: any) {
    console.error('API Error during attendance sync:', error);
    // In case of an unexpected error
    return NextResponse.json({ message: 'حدث خطأ غير متوقع أثناء المزامنة: ' + error.message }, { status: 500 });
  }
}
