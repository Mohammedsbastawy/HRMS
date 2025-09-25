
import { NextResponse } from 'next/server';
import db from '@/lib/db';
import type { Applicant, Job } from '@/lib/types';

export async function GET() {
    try {
        const jobs: any[] = db.prepare(`
            SELECT j.*, d.name_ar as department_name_ar 
            FROM jobs j
            LEFT JOIN departments d ON j.department_id = d.id
            ORDER BY j.created_at DESC
        `).all();
        
        const applicantsData: any[] = db.prepare('SELECT * FROM applicants').all();
        const jobIds = [...new Set(applicantsData.map(a => a.job_id))];
        
        let relatedJobs: Job[] = [];
        if(jobIds.length > 0) {
            const placeholders = jobIds.map(() => '?').join(',');
            relatedJobs = db.prepare(`SELECT id, title FROM jobs WHERE id IN (${placeholders})`).all(...jobIds) as Job[];
        }
        
        const jobMap = new Map(relatedJobs.map(j => [j.id, j]));
        const applicants: Applicant[] = applicantsData.map(app => ({...app, job: jobMap.get(app.job_id) })) as Applicant[];

        return NextResponse.json({ jobs, applicants });

    } catch (e) {
        console.error(e);
        return NextResponse.json({ message: 'فشل في جلب بيانات التوظيف' }, { status: 500 });
    }
}
