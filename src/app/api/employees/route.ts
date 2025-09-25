
import { NextResponse } from 'next/server';
import db from '@/lib/db';
import type { Employee } from '@/lib/types';
import { URL } from 'url';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const isManager = url.searchParams.get('is_manager');

    let query = `
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
    `;
    
    const params: any[] = [];
    if (isManager === 'true') {
        // A simple heuristic for identifying managers.
        // In a real app, this might be a specific role or flag.
        query += ` WHERE e.id IN (SELECT DISTINCT manager_id FROM employees WHERE manager_id IS NOT NULL) `;
    }

    query += ` ORDER BY e.created_at DESC`;

    const stmt = db.prepare(query);
    const employeesData = stmt.all(...params);

    const formattedEmployees: Partial<Employee>[] = employeesData.map((emp: any) => ({
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
            department_id: emp.department_id,
            title_ar: emp.job_title_ar,
            title_en: '' // Not fetched, but good to have in type
        }
    }));
    
    return NextResponse.json({ employees: formattedEmployees });

  } catch (error: any) {
    console.error('Failed to fetch employees:', error);
    return NextResponse.json({ message: 'فشل في جلب بيانات الموظفين', error: error.message }, { status: 500 });
  }
}
