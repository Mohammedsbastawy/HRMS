'use client';

import { useState } from 'react';
import type { Applicant } from '@/lib/types';
import { ApplicantCard } from './applicant-card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { AddApplicantDialog } from './add-applicant-dialog';

interface StageColumnProps {
  stage: { id: string; title: string };
  jobId: number;
  applicants: Applicant[];
  onApplicantAdded: () => void;
}

export function StageColumn({ stage, jobId, applicants, onApplicantAdded }: StageColumnProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-md">{stage.title}</h3>
          <span className="text-sm font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
            {applicants.length}
          </span>
        </div>
        <div className="bg-muted/50 rounded-lg p-2 min-h-64 flex-1">
          {applicants.map(applicant => (
            <ApplicantCard key={applicant.id} applicant={applicant} />
          ))}
          {stage.id === 'Applied' && (
             <Button variant="ghost" className="w-full mt-2" onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="ml-2 h-4 w-4" />
                إضافة متقدم
             </Button>
          )}
        </div>
      </div>
      <AddApplicantDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        jobId={jobId}
        onSuccess={() => {
            setIsAddDialogOpen(false);
            onApplicantAdded();
        }}
       />
    </>
  );
}
