
import db from '@/lib/db';
import type { Applicant, Job } from '@/lib/types';
import { RecruitmentPageClient } from './_components/recruitment-client';

export default function RecruitmentPage() {
    
    const jobs: any[] = (() => {
        try {
            return db.prepare(`
                SELECT j.*, d.name_ar as department_name_ar 
                FROM jobs j
                LEFT JOIN departments d ON j.department_id = d.id
                ORDER BY j.created_at DESC
            `).all();
        } catch (e) {
            console.error(e);
            return [];
        }
    })();
    
    const applicants: Applicant[] = (() => {
        try {
            const data = db.prepare('SELECT * FROM applicants').all() as any[];
            const jobIds = [...new Set(data.map(a => a.job_id))];
            let jobs: Job[] = [];
            if(jobIds.length > 0) {
                const placeholders = jobIds.map(() => '?').join(',');
                jobs = db.prepare(`SELECT id, title FROM jobs WHERE id IN (${placeholders})`).all(jobIds) as Job[];
            }
            const jobMap = new Map(jobs.map(j => [j.id, j]));
            return data.map(app => ({...app, job: jobMap.get(app.job_id) })) as Applicant[];
        } catch(e) {
            console.error(e);
            return [];
        }
    })();

    return <RecruitmentPageClient jobs={jobs} applicants={applicants} />
}
