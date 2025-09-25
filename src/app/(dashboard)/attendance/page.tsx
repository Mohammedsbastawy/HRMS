
import db from '@/lib/db';
import type { Employee } from '@/lib/types';
import { AttendancePageClient } from './_components/attendance-client';

// This is the main page component, now a Server Component
export default function AttendanceDataPage() {
    const employees: Employee[] = (() => {
        try {
            return db.prepare('SELECT id, full_name, avatar FROM employees').all() as Employee[];
        } catch(e) {
            console.error(e);
            return [];
        }
    })();

    return <AttendancePageClient employees={employees} />;
}
