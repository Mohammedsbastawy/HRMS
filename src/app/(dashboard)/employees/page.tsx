
import db from '@/lib/db';
import type { Employee } from '@/lib/types';
import { EmployeesPageClient } from './_components/employees-client';

// This is the main page component, now a Server Component.
// Its only job is to fetch data.
export default function EmployeesDataPage() {
    const employeesData: any[] = (() => {
        try {
            const query = `
                SELECT 
                    e.id,
                    e.full_name,
                    e.email,
                    e.hire_date,
                    e.status,
                    e.avatar,
                    d.name_ar as department_name_ar,
                    d.name_en as department_name_en,
                    jt.title_ar as job_title_ar
                FROM employees e
                LEFT JOIN departments d ON e.department_id = d.id
                LEFT JOIN job_titles jt ON e.job_title_id = jt.id
                ORDER BY e.created_at DESC
            `;
            const stmt = db.prepare(query);
            return stmt.all();
        } catch (error) {
            console.error('Failed to fetch employees:', error);
            return [];
        }
    })();

    const formattedEmployees: Employee[] = employeesData.map(emp => ({
        id: emp.id,
        full_name: emp.full_name,
        email: emp.email,
        hire_date: emp.hire_date,
        status: emp.status,
        avatar: emp.avatar,
        department: {
            id: emp.department_id,
            name_ar: emp.department_name_ar,
            name_en: emp.department_name_en,
        },
        jobTitle: {
            id: emp.job_title_id,
            title_ar: emp.job_title_ar,
        }
    }));

    // The Server Component renders the Client Component and passes data to it.
    return <EmployeesPageClient initialEmployees={formattedEmployees} />;
}
