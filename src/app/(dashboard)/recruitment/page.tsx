
'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Search, Loader2, LayoutGrid, List } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import type { Job, Applicant, Department } from '@/lib/types';
import { JobPipeline } from './_components/job-pipeline';
import { JobsTable } from './_components/jobs-table';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { EditApplicantDialog } from './_components/edit-applicant-dialog';


export default function RecruitmentPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
  const { toast } = useToast();

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const headers = { 'Authorization': `Bearer ${token}` };
      const [jobsRes, applicantsRes] = await Promise.all([
        fetch('/api/recruitment/jobs', { headers }),
        fetch('/api/recruitment/applicants', { headers })
      ]);
      
      if (!jobsRes.ok || !applicantsRes.ok) {
        throw new Error('فشل في جلب بيانات التوظيف');
      }
      
      const jobsData = await jobsRes.json();
      const applicantsData = await applicantsRes.json();

      setJobs(jobsData.jobs);
      setApplicants(applicantsData.applicants);

    } catch (error: any) {
      toast({ variant: 'destructive', title: 'خطأ', description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleActionComplete = () => {
    fetchData(); // Refetch all data when an action is completed
  };

  const handleEditApplicant = (applicant: Applicant) => {
    setSelectedApplicant(applicant);
    setIsEditDialogOpen(true);
  };
 
  return (
    <>
      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>إدارة التوظيف</CardTitle>
                <CardDescription>عرض وإدارة الوظائف الشاغرة والمتقدمين لها.</CardDescription>
              </div>
              <div className='flex items-center gap-2'>
                  <ToggleGroup type="single" value={viewMode} onValueChange={(value) => value && setViewMode(value as any)} aria-label="View mode">
                      <ToggleGroupItem value="board" aria-label="Board view">
                          <LayoutGrid className="h-4 w-4" />
                      </ToggleGroupItem>
                      <ToggleGroupItem value="list" aria-label="List view">
                          <List className="h-4 w-4" />
                      </ToggleGroupItem>
                  </ToggleGroup>
                  <Button asChild size="sm">
                      <Link href="/recruitment/new-job"><PlusCircle className="ml-2 h-4 w-4" /> إضافة وظيفة</Link>
                  </Button>
              </div>
            </div>
          </CardHeader>
        </Card>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="mx-auto h-12 w-12 animate-spin" />
          </div>
        ) : viewMode === 'board' ? (
          <div className="flex gap-6 pb-4 overflow-x-auto">
            {jobs.filter(j => j.status === 'Open').map(job => (
              <JobPipeline
                key={job.id}
                job={job}
                applicants={applicants.filter(a => a.job_id === job.id)}
                onActionComplete={handleActionComplete}
                onEditApplicant={handleEditApplicant}
              />
            ))}
            {jobs.filter(j => j.status === 'Open').length === 0 && (
               <div className="w-full text-center py-10 text-muted-foreground">
                  لا توجد وظائف مفتوحة حاليًا.
               </div>
            )}
          </div>
        ) : (
          <JobsTable jobs={jobs} />
        )}
      </div>

      <EditApplicantDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        applicant={selectedApplicant}
        onSuccess={() => {
          setIsEditDialogOpen(false);
          handleActionComplete();
        }}
      />
    </>
  );
}

    