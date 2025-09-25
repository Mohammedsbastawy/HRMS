'use server';
import { NextResponse } from 'next/server';
import { syncAttendance, testConnection } from '@/lib/zkt-service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { ip, user, pass, test } = body;

    if (!ip) {
      return NextResponse.json({ message: 'عنوان IP للجهاز مطلوب.' }, { status: 400 });
    }
    
    // If it's just a connection test
    if (test) {
        console.log(`Starting connection test to ${ip}...`);
        const result = await testConnection(ip, user, pass);
        console.log('Connection test finished.', result);
        if (result.success) {
            return NextResponse.json(result);
        } else {
            return NextResponse.json({ message: result.error || 'فشل الاتصال', success: false }, { status: 500 });
        }
    }

    // Full sync process
    console.log('Starting attendance sync...');
    const result = await syncAttendance(ip, user, pass);
    console.log('Attendance sync finished.', result);
    
    if (result.success) {
      return NextResponse.json({ message: `تمت مزامنة ${result.records?.length || 0} سجل بنجاح.`, records: result.records, success: true });
    } else {
      // In case of a predictable error (e.g., connection failed)
      return NextResponse.json({ message: 'فشلت المزامنة: ' + result.error, success: false }, { status: 500 });
    }
  } catch (error: any) {
    console.error('API Error during attendance sync:', error);
    // In case of an unexpected error
    return NextResponse.json({ message: 'حدث خطأ غير متوقع أثناء المزامنة: ' + error.message, success: false }, { status: 500 });
  }
}
