
'use client';

import { useState } from 'react';
import type { TrainingRecord, Employee } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Bot, Loader2 } from 'lucide-react';

interface TrainingAnalysisProps {
  record: TrainingRecord;
  employee: Employee;
  performanceReviewComments: string;
}

type AIOutput = {
  recommendedSalaryAdjustment: string;
  professionalDevelopmentRecommendations: string;
};

export function TrainingAnalysis({ record, employee, performanceReviewComments }: TrainingAnalysisProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIOutput | null>(null);
  const { toast } = useToast();

  const handleAnalysis = async () => {
    setLoading(true);
    setResult(null);
    toast({
      variant: 'destructive',
      title: 'ميزة غير متاحة',
      description: 'تم تعطيل ميزة التحليل بالذكاء الاصطناعي للعمل دون اتصال بالإنترنت.',
    });
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled>
          <Bot className="ml-2 h-4 w-4" />
          تحليل وتوصية (معطل)
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>تحليل التدريب بالذكاء الاصطناعي</DialogTitle>
          <DialogDescription>
            هذه الميزة تتطلب اتصالاً بالإنترنت وهي معطلة حاليًا.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="text-center text-muted-foreground">
            <p>تم تعطيل التحليل بالذكاء الاصطناعي لضمان عمل التطبيق دون اتصال بالإنترنت.</p>
          </div>
        </div>

        <DialogFooter>
            <Button onClick={() => setOpen(false)} variant="outline">إغلاق</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
