
import { NextResponse } from 'next/server';
import db from '@/lib/db';
import type { Location } from '@/lib/types';

export async function GET() {
  try {
    const locationsQuery = `
        SELECT 
            l.*,
            e.full_name as manager_name
        FROM locations l
        LEFT JOIN employees e ON l.manager_id = e.id
        ORDER BY l.created_at DESC
    `;
    const locationsData = db.prepare(locationsQuery).all();

    const formattedLocations: Location[] = locationsData.map((loc: any) => ({
      ...loc,
      manager: loc.manager_id ? {
        id: loc.manager_id,
        full_name: loc.manager_name
      } : null
    }));

    return NextResponse.json({ locations: formattedLocations });

  } catch (error: any) {
    console.error('Failed to fetch locations:', error);
    return NextResponse.json({ message: 'فشل في جلب بيانات المواقع', error: error.message }, { status: 500 });
  }
}
