
'use client';

import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PlusCircle, Star, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ui/use-toast';
import type { PerformanceReview } from '@/lib/types';

const ScoreBadge = ({ score }: { score: number }) => {
  const colorClass = score >= 4 ? 'text-green-500' : score >= 3 ? 'text-yellow-500' : 'text-red-500';
  const stars = Array(5).fill(0).map((_, i) => (
    <Star key={i} className={`h-4 w-4 ${i < Math.round(score) ? `fill-current ${colorClass}` : 'fill-muted stroke-muted-foreground'}`} />
  ));
  return <div className="flex items-center gap-1">{stars}</div>;
};

export default function PerformancePage() {
    const [performanceReviews, setPerformanceReviews] = useState<PerformanceReview[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        async function fetchReviews() {
            setIsLoading(true);
            try {
                const response = await fetch('/api/performance');
                if(!response.ok) throw new Error('فشل في جلب تقييمات الأداء');
                const data = await response.json();
                setPerformanceReviews(data.performanceReviews);
            } catch (error: any) {
                toast({
                    variant: 'destructive',
                    title: 'خطأ',
                    description: error.message
                });
            } finally {
                setIsLoading(false);
            }
        }
        fetchReviews();
    }, [toast]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>تقييمات الأداء</CardTitle>
          <CardDescription>تسجيل وتتبع تقييمات أداء الموظفين.</CardDescription>
        </div>
        <Button asChild size="sm" className="gap-1">
          <Link href="#">
            <PlusCircle className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">إضافة تقييم</span>
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">الموظف</TableHead>
              <TableHead className="text-right">تاريخ التقييم</TableHead>
              <TableHead className="text-right">التقييم</TableHead>
              <TableHead className="text-right">التعليقات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
                 <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                        <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                    </TableCell>
                </TableRow>
            ) : performanceReviews.length > 0 ? (
                performanceReviews.map((review) => (
                <TableRow key={review.id}>
                    <TableCell className="font-medium">{review.employee?.full_name}</TableCell>
                    <TableCell>{new Date(review.review_date).toLocaleDateString('ar-EG')}</TableCell>
                    <TableCell>
                    <div className="flex items-center gap-2 justify-end">
                        <span>({review.score})</span>
                        <ScoreBadge score={review.score} />
                    </div>
                    </TableCell>
                    <TableCell className="max-w-[300px] truncate">{review.comments}</TableCell>
                </TableRow>
                ))
            ) : (
                <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                        لا توجد تقييمات أداء لعرضها.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
