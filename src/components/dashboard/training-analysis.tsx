'use client';

import { useState } from 'react';
import type { TrainingRecord, Employee } from '@/lib/types';
import { adjustSalaryBasedOnTraining } from '@/ai/flows/adjust-salary-based-on-training';
import { generateDevelopmentRecommendations } from '@/ai/flows/generate-development-recommendations';
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
import { useToast } from '@/hooks/use-toast';
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
    try {
      // The adjustSalaryBasedOnTraining flow provides both salary and development recommendations.
      const output = await adjustSalaryBasedOnTraining({
        employeeName: employee.name,
        performanceReviewScore: employee.performanceReviewScore,
        trainingCompletionStatus: record.status,
        trainingOutcome: record.outcome,
        currentSalary: employee.salary,
      });

      setResult(output);
    } catch (error) {
      console.error('AI analysis failed:', error);
      toast({
        variant: 'destructive',
        title: 'خطأ في التحليل',
        description: 'حدث خطأ أثناء الاتصال بالذكاء الاصطناعي. يرجى المحاولة مرة أخرى.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Bot className="ml-2 h-4 w-4" />
          تحليل وتوصية
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>تحليل التدريب بالذكاء الاصطناعي</DialogTitle>
          <DialogDescription>
            تحليل أداء {employee.name} في دورة "{record.courseTitle}" لتقديم توصيات.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-4 rounded-lg bg-muted p-8 text-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="font-medium">يقوم الذكاء الاصطناعي بالتحليل...</p>
              <p className="text-sm text-muted-foreground">قد يستغرق هذا بضع لحظات.</p>
            </div>
          ) : result ? (
            <div className="space-y-4">
              <div>
                <h4 className="font-headline font-semibold text-lg">تعديل الراتب الموصى به</h4>
                <p className="text-muted-foreground">{result.recommendedSalaryAdjustment}</p>
              </div>
              <div>
                <h4 className="font-headline font-semibold text-lg">توصيات التطوير المهني</h4>
                <p className="text-muted-foreground">{result.professionalDevelopmentRecommendations}</p>
              </div>
            </div>
          ) : (
            <div className="text-center text-muted-foreground">
              <p>اضغط على الزر أدناه لبدء التحليل وإنشاء توصيات للراتب والتطوير المهني بناءً على أداء الموظف ومراجعاته.</p>
            </div>
          )}
        </div>

        <DialogFooter>
          {result ? (
            <Button onClick={() => setResult(null)}>تحليل مرة أخرى</Button>
          ) : (
            <Button onClick={handleAnalysis} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري التحليل...
                </>
              ) : (
                'إنشاء توصيات'
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
