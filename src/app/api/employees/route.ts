
import { NextResponse } from 'next/server';
import db from '@/lib/db';
import type { Employee } from '@/lib/types';

// This file acts as our "Flask Backend" endpoint.
// It handles all database interactions for employees.

export async function GET() {
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
    const employeesData = stmt.all();

    const formattedEmployees: Employee[] = employeesData.map((emp: any) => ({
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
    
    return NextResponse.json(formattedEmployees);

  } catch (error: any) {
    console.error('Failed to fetch employees:', error);
    // Return a proper error response
    return NextResponse.json({ message: 'فشل في جلب بيانات الموظفين', error: error.message }, { status: 500 });
  }
}
