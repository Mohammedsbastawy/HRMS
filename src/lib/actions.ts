
'use server';

import { z } from 'zod';
import db from './db';
import { revalidatePath } from 'next/cache';
import { permanentRedirect } from 'next/navigation';

// --- Department Actions ---

const departmentFormSchema = z.object({
  name_ar: z.string().min(2),
  name_en: z.string().min(2),
  code: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  budget: z.coerce.number().min(0).optional(),
  description: z.string().optional(),
});

export async function createDepartment(formData: unknown) {
  const validatedFields = departmentFormSchema.safeParse(formData);

  if (!validatedFields.success) {
    throw new Error('Invalid form data');
  }

  const { name_ar, name_en, code, email, budget, description } = validatedFields.data;
  
  try {
    const stmt = db.prepare(`
      INSERT INTO departments (name_ar, name_en, code, email, budget, description)
      VALUES (@name_ar, @name_en, @code, @email, @budget, @description)
    `);
    
    stmt.run({
      name_ar,
      name_en,
      code: code || null,
      email: email || null,
      budget: budget || null,
      description: description || null,
    });

    revalidatePath('/departments');

    return { message: 'Department created successfully' };
  } catch (error) {
    console.error('Failed to create department:', error);
    throw new Error('Database error');
  }
}

// --- Location Actions ---

const locationFormSchema = z.object({
  name_ar: z.string().min(2, { message: "الاسم بالعربية مطلوب." }),
  name_en: z.string().min(2, { message: "الاسم بالإنجليزية مطلوب." }),
  code: z.string().optional().or(z.literal('')),
  description: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  country: z.string().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  email: z.string().email({ message: "بريد إلكتروني غير صالح." }).optional().or(z.literal('')),
  manager_id: z.string().optional().or(z.literal('')),
});

export async function createLocation(formData: unknown) {
    const validatedFields = locationFormSchema.safeParse(formData);

    if (!validatedFields.success) {
        console.error('Validation Errors:', validatedFields.error.flatten().fieldErrors);
        throw new Error('Invalid form data');
    }

    const { name_ar, name_en, code, description, address, city, country, phone, email, manager_id } = validatedFields.data;

    try {
        const stmt = db.prepare(`
            INSERT INTO locations (name_ar, name_en, code, description, address, city, country, phone, email, manager_id)
            VALUES (@name_ar, @name_en, @code, @description, @address, @city, @country, @phone, @email, @manager_id)
        `);

        stmt.run({
            name_ar,
            name_en,
            code: code || null,
            description: description || null,
            address: address || null,
            city: city || null,
            country: country || null,
            phone: phone || null,
            email: email || null,
            manager_id: manager_id ? parseInt(manager_id) : null,
        });
        
        revalidatePath('/locations');

        return { message: 'Location created successfully' };
    } catch (error) {
        console.error('Failed to create location:', error);
        throw new Error('Database error');
    }
}


// --- Employee Actions ---

const employeeFormSchema = z.object({
  full_name: z.string().min(2, { message: "الاسم الكامل مطلوب." }),
  email: z.string().email({ message: "بريد إلكتروني غير صالح." }),
  department_id: z.string({ required_error: "القسم مطلوب." }),
  job_title_id: z.string({ required_error: "المسمى الوظيفي مطلوب." }),
  location_id: z.string({ required_error: "الموقع مطلوب." }),
  hire_date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "تاريخ التعيين غير صالح."}),
  base_salary: z.coerce.number().min(0, { message: "الراتب يجب أن يكون رقمًا موجبًا." }),
  manager_id: z.string().optional(),
  status: z.enum(['Active', 'Resigned', 'Terminated']),
});


export async function createEmployee(formData: unknown) {
  const validatedFields = employeeFormSchema.safeParse(formData);

  if (!validatedFields.success) {
    console.error('Validation Errors:', validatedFields.error.flatten().fieldErrors);
    throw new Error('Invalid form data');
  }

  const { full_name, email, department_id, job_title_id, location_id, hire_date, base_salary, manager_id, status } = validatedFields.data;

  try {
    const stmt = db.prepare(`
      INSERT INTO employees (
        full_name, email, department_id, job_title_id, location_id, 
        hire_date, base_salary, manager_id, status
      ) VALUES (
        @full_name, @email, @department_id, @job_title_id, @location_id,
        @hire_date, @base_salary, @manager_id, @status
      )
    `);

    stmt.run({
      full_name,
      email,
      department_id: parseInt(department_id),
      job_title_id: parseInt(job_title_id),
      location_id: parseInt(location_id),
      hire_date,
      base_salary,
      manager_id: manager_id ? parseInt(manager_id) : null,
      status
    });

    revalidatePath('/employees');
    
  } catch (error: any) {
    console.error('Failed to create employee:', error);
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      throw new Error('An employee with this email already exists.');
    }
    throw new Error('Database error occurred while creating employee.');
  }

  permanentRedirect('/employees');
}
