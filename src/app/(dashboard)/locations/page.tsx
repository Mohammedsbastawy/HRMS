
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2, Eye, Search, Loader2 } from 'lucide-react';
import Link from 'next/link';
import type { Location } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';

export default function LocationsPage() {
    const [locations, setLocations] = useState<Location[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const { toast } = useToast();

    useEffect(() => {
        async function fetchLocations() {
            try {
                setIsLoading(true);
                const response = await fetch('/api/locations');
                if (!response.ok) {
                    throw new Error('فشل في جلب المواقع');
                }
                const data = await response.json();
                setLocations(data.locations);
            } catch (error: any) {
                toast({
                    variant: 'destructive',
                    title: 'خطأ',
                    description: error.message || 'حدث خطأ أثناء جلب البيانات.',
                });
            } finally {
                setIsLoading(false);
            }
        }
        fetchLocations();
    }, [toast]);

    const filteredLocations = locations.filter(loc => 
        (loc.name_ar || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (loc.name_en || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (loc.city && loc.city.toLowerCase().includes(searchTerm.toLowerCase()))
    );

  return (
    <div className="flex flex-col gap-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>إدارة مواقع الشركة</CardTitle>
            <CardDescription>عرض وتعديل فروع ومواقع الشركة.</CardDescription>
          </div>
            <div className="flex items-center gap-2">
                 <div className="relative">
                     <Search className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                     <Input
                        type="search"
                        placeholder="بحث عن موقع..."
                        className="w-full appearance-none bg-background pr-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                     />
                </div>
                <Button asChild size="sm" className="gap-1">
                    <Link href="/locations/new">
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">إضافة موقع</span>
                    </Link>
                </Button>
            </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">الرمز</TableHead>
                <TableHead className="text-right">اسم الموقع (العربية)</TableHead>
                <TableHead className="text-right">اسم الموقع (الإنجليزية)</TableHead>
                <TableHead className="text-right">المدينة</TableHead>
                <TableHead className="text-right">المدير المسؤول</TableHead>
                <TableHead className="text-right">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                  <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                          <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                      </TableCell>
                  </TableRow>
              ) : filteredLocations.length > 0 ? (
                filteredLocations.map((loc) => (
                    <TableRow key={loc.id}>
                    <TableCell>{loc.code || '-'}</TableCell>
                    <TableCell className="font-medium">{loc.name_ar}</TableCell>
                    <TableCell>{loc.name_en}</TableCell>
                    <TableCell>{loc.city || '-'}</TableCell>
                    <TableCell>{loc.manager?.full_name || 'غير محدد'}</TableCell>
                    <TableCell className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </TableCell>
                    </TableRow>
                ))
              ) : (
                <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                        لا توجد مواقع مسجلة حتى الآن.
                        <Button variant="link" asChild className="mt-2 block">
                           <Link href="/locations/new">ابدأ بإضافة موقع جديد</Link>
                        </Button>
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
