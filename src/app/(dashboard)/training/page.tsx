
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Wrench } from 'lucide-react';

export default function TrainingPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>التدريب والتطوير</CardTitle>
        <CardDescription>
          هذه الوحدة مخصصة لإدارة الدورات التدريبية وتتبع تطور الموظفين.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
            <Wrench className="h-16 w-16 text-muted-foreground" />
            <h3 className="text-2xl font-bold tracking-tight">
                هذه الصفحة قيد التطوير
            </h3>
            <p className="text-muted-foreground">
                نعمل حاليًا على بناء وحدة التدريب. ستكون متاحة قريبًا!
            </p>
        </div>
      </CardContent>
    </Card>
  );
}
