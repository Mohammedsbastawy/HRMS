'use client';

import type { Job, Applicant } from '@/lib/types';
import { StageColumn } from './stage-column';

interface JobPipelineProps {
  job: Job;
  applicants: Applicant[];
  onApplicantAdded: () => void;
}

const STAGES = [
  { id: 'Applied', title: 'التقديم' },
  { id: 'Screening', title: 'الفرز' },
  { id: 'Interview', title: 'المقابلة' },
  { id: 'Offer', title: 'العرض' },
  { id: 'Hired', title: 'تم التوظيف' },
];

export function JobPipeline({ job, applicants, onApplicantAdded }: JobPipelineProps) {
  return (
    <div className="flex-shrink-0 w-[calc(100vw-3rem)] md:w-[calc(100vw-20rem)] lg:w-[calc(100vw-35rem)]">
      <div className="p-4 rounded-lg bg-card border">
        <h2 className="text-lg font-bold tracking-tight">{job.title}</h2>
        <p className="text-sm text-muted-foreground mb-4">{job.department?.name_ar}</p>
        <div className="grid grid-cols-5 gap-4">
          {STAGES.map(stage => (
            <StageColumn
              key={stage.id}
              stage={stage}
              jobId={job.id}
              applicants={applicants.filter(a => a.stage === stage.id)}
              onApplicantAdded={onApplicantAdded}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
