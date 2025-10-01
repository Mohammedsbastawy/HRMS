
'use client';

import { useState } from 'react';
import type { Job, Applicant } from '@/lib/types';
import { StageColumn } from './stage-column';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';

interface JobPipelineProps {
  job: Job;
  applicants: Applicant[];
  onActionComplete: () => void;
  onEditApplicant: (applicant: Applicant) => void;
}

const STAGES = [
  { id: 'Applied', title: 'التقديم' },
  { id: 'Screening', title: 'الفرز' },
  { id: 'Interview', title: 'المقابلة' },
  { id: 'Offer', title: 'العرض' },
  { id: 'Hired', title: 'تم التوظيف' },
];

export function JobPipeline({ job, applicants, onActionComplete, onEditApplicant }: JobPipelineProps) {
  const [isCloseAlertOpen, setIsCloseAlertOpen] = useState(false);
  const [closeReason, setCloseReason] = useState('');
  const { toast } = useToast();
  const router = useRouter();

  const handleCloseJob = async () => {
    if (!closeReason) {
      toast({ variant: 'destructive', title: 'السبب مطلوب', description: 'يرجى كتابة سبب إغلاق الوظيفة.' });
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/recruitment/jobs/${job.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: 'Closed', close_reason: closeReason }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'فشل إغلاق الوظيفة');

      toast({ title: 'تم إغلاق الوظيفة بنجاح' });
      onActionComplete();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'خطأ', description: error.message });
    } finally {
      setIsCloseAlertOpen(false);
      setCloseReason('');
    }
  };


  return (
    <>
      <div className="p-4 rounded-lg bg-card border">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-lg font-bold tracking-tight">{job.title}</h2>
            <p className="text-sm text-muted-foreground">{job.department?.name_ar}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setIsCloseAlertOpen(true)}>
            <Lock className="ml-2 h-4 w-4" />
            إغلاق الوظيفة
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {STAGES.map(stage => (
            <StageColumn
              key={stage.id}
              stage={stage}
              jobId={job.id}
              applicants={applicants.filter(a => a.stage === stage.id)}
              onActionComplete={onActionComplete}
              onEditApplicant={onEditApplicant}
            />
          ))}
        </div>
      </div>
      
      <AlertDialog open={isCloseAlertOpen} onOpenChange={setIsCloseAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد إغلاق الوظيفة</AlertDialogTitle>
            <AlertDialogDescription>
              أنت على وشك إغلاق الوظيفة "{job.title}". لن يتمكن أحد من التقديم عليها بعد الآن. يرجى ذكر السبب.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Input 
              placeholder="مثال: تم العثور على المرشح المناسب" 
              value={closeReason}
              onChange={(e) => setCloseReason(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleCloseJob} disabled={!closeReason}>تأكيد الإغلاق</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
