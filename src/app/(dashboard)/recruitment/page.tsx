import db from '@/lib/db';
import type { Applicant, Job } from '@/lib/types';
import { RecruitmentPageClient } from './_components/recruitment-client';

export default function RecruitmentPage() {
    
    const jobs: any[] = db.prepare(`
        SELECT j.*, d.name_ar as department_name_ar 
        FROM jobs j
        LEFT JOIN departments d ON j.department_id = d.id
    `).all();
    
    const applicants: Applicant[] = db.prepare('SELECT * FROM applicants').all() as Applicant[];

    return <RecruitmentPageClient jobs={jobs} applicants={applicants} />
}
