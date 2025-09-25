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
import { PlusCircle, Star } from 'lucide-react';
import { performanceReviews } from '@/lib/data';
import Link from 'next/link';

const ScoreBadge = ({ score }: { score: number }) => {
  const colorClass = score >= 4.5 ? 'text-green-500' : score >= 3.5 ? 'text-yellow-500' : 'text-red-500';
  const stars = Array(5).fill(0).map((_, i) => (
    <Star key={i} className={`h-4 w-4 ${i < Math.round(score) ? `fill-current ${colorClass}` : 'fill-muted stroke-muted-foreground'}`} />
  ));
  return <div className="flex items-center gap-1">{stars}</div>;
};

export default function PerformancePage() {
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
              <TableHead>الموظف</TableHead>
              <TableHead>تاريخ التقييم</TableHead>
              <TableHead>التقييم</TableHead>
              <TableHead>التعليقات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {performanceReviews.map((review) => (
              <TableRow key={review.id}>
                <TableCell className="font-medium">{review.employeeName}</TableCell>
                <TableCell>{new Date(review.reviewDate).toLocaleDateString('ar-EG')}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <ScoreBadge score={review.score} />
                    <span>({review.score})</span>
                  </div>
                </TableCell>
                <TableCell className="max-w-[300px] truncate">{review.comments}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
