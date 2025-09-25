
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import { applicants } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';

const stages = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected'];
const stageLabels: { [key: string]: string } = {
  Applied: 'المتقدمون',
  Screening: 'الفحص',
  Interview: 'المقابلة',
  Offer: 'العرض',
  Hired: 'تم التعيين',
  Rejected: 'مرفوض',
};

const ApplicantCard = ({ applicant }: { applicant: (typeof applicants)[0] }) => (
  <Card>
    <CardContent className="p-4">
      <div className="flex items-start gap-4">
        <Avatar>
          <AvatarImage src={applicant.avatar} alt={applicant.name} />
          <AvatarFallback>{applicant.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <p className="font-semibold">{applicant.name}</p>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost" className="h-6 w-6">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>عرض التفاصيل</DropdownMenuItem>
                <DropdownMenuItem>نقل إلى...</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <p className="text-sm text-muted-foreground">{applicant.jobTitle}</p>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default function RecruitmentPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-2xl font-bold">مسار التوظيف</h1>
          <p className="text-muted-foreground">إدارة المتقدمين للوظائف من البداية إلى النهاية.</p>
        </div>
        <Button asChild size="sm" className="gap-1">
          <Link href="#">
            <PlusCircle className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">إضافة متقدم</span>
          </Link>
        </Button>
      </div>
      <div className="flex-1 overflow-x-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 min-w-max">
          {stages.map((stage) => (
            <div key={stage} className="flex flex-col gap-4">
              <div className="rounded-lg bg-muted p-3">
                <h3 className="font-semibold mb-4">{stageLabels[stage]}</h3>
                <div className="space-y-4">
                  {applicants
                    .filter((applicant) => applicant.stage === stage)
                    .map((applicant) => (
                      <ApplicantCard key={applicant.id} applicant={applicant} />
                    ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
