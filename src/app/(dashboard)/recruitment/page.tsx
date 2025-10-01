
'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Search, Loader2, LayoutGrid, List, Archive } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import type { Job, Applicant } from '@/lib/types';
import { JobPipeline } from './_components/job-pipeline';
import { EditApplicantDialog } from './_components/edit-applicant-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArchiveView } from './_components/archive-view';


export default function RecruitmentPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
    fetchData();
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
                  <Button asChild size="sm">
                      <Link href="/recruitment/new-job"><PlusCircle className="ml-2 h-4 w-4" /> إضافة وظيفة</Link>
                  </Button>
              </div>
            </div>
          </CardHeader>
        </Card>
        
        <Tabs defaultValue="active_jobs">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="active_jobs">
                    <LayoutGrid className="ml-2 h-4 w-4" />
                    الوظائف النشطة
                </TabsTrigger>
                <TabsTrigger value="archive">
                    <Archive className="ml-2 h-4 w-4" />
                    الأرشيف
                </TabsTrigger>
            </TabsList>
            <TabsContent value="active_jobs">
                {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="mx-auto h-12 w-12 animate-spin" />
                </div>
                ) : (
                <div className="space-y-6">
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
                    <div className="w-full text-center py-10 text-muted-foreground border rounded-lg bg-card">
                        لا توجد وظائف مفتوحة حاليًا.
                    </div>
                    )}
                </div>
                )}
            </TabsContent>
            <TabsContent value="archive">
                <ArchiveView />
            </TabsContent>
        </Tabs>
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
