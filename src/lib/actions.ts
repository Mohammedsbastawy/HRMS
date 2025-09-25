
'use server';

import { z } from 'zod';
import db from './db';
import { revalidatePath } from 'next/cache';

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
  name_ar: z.string().min(2),
  name_en: z.string().min(2),
  code: z.string().optional(),
  description: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  country: z.string().optional().or(z.literal('')),
  phone: z-string().optional().or(z.literal('')),
  email: z.string().email().optional().or(z.literal('')),
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
