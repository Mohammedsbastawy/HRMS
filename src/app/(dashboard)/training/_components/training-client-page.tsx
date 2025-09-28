
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import type { TrainingCourse, Employee } from '@/lib/types';

import { CoursesTable } from './courses-table';
import { CourseFormDialog } from './course-form-dialog';
import { AssignEmployeesDialog } from './assign-employees-dialog';
import { useRouter } from 'next/navigation';

export function TrainingClientPage() {
  const [courses, setCourses] = useState<TrainingCourse[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const router = useRouter();

  const [isCourseFormOpen, setIsCourseFormOpen] = useState(false);
  const [isAssignFormOpen, setIsAssignFormOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<TrainingCourse | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('authToken');
        if (!token) {
          router.push('/login');
          return;
        }
      const [coursesRes, employeesRes] = await Promise.all([
        fetch('/api/training-courses', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/employees', { headers: { 'Authorization': `Bearer ${token}` } }),
      ]);

      if (coursesRes.status === 401 || employeesRes.status === 401) {
        toast({ variant: 'destructive', title: 'الجلسة منتهية', description: 'يرجى تسجيل الدخول مرة أخرى.' });
        router.push('/login');
        return;
      }
      if (!coursesRes.ok || !employeesRes.ok) throw new Error('فشل في جلب البيانات');
      
      const coursesData = await coursesRes.json();
      const employeesData = await employeesRes.json();
      setCourses(coursesData.courses);
      setEmployees(employeesData.employees);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'خطأ', description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEditCourse = (course: TrainingCourse) => {
    setEditingCourse(course);
    setIsCourseFormOpen(true);
  };
  
  const handleAddNewCourse = () => {
    setEditingCourse(null);
    setIsCourseFormOpen(true);
  };

  const handleFormSuccess = () => {
    fetchData(); // Refresh data on success
    setIsCourseFormOpen(false);
    setIsAssignFormOpen(false);
  };

  const filteredCourses = courses.filter(course => 
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (course.provider && course.provider.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>🎓 إدارة التدريب والتطوير</CardTitle>
              <CardDescription>إدارة الدورات التدريبية وتتبع تطور الموظفين.</CardDescription>
            </div>
            <div className="flex flex-shrink-0 gap-2">
               <Button size="sm" className="gap-1" onClick={handleAddNewCourse}>
                <PlusCircle className="h-3.5 w-3.5" />
                <span>إضافة دورة</span>
              </Button>
               <Button size="sm" variant="outline" className="gap-1" onClick={() => setIsAssignFormOpen(true)}>
                <PlusCircle className="h-3.5 w-3.5" />
                <span>تسجيل موظفين</span>
              </Button>
            </div>
          </div>
          <div className="relative mt-4">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="بحث عن دورة تدريبية..."
              className="w-full appearance-none bg-background pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <CoursesTable 
              courses={filteredCourses}
              onEdit={handleEditCourse}
              onDeleteSuccess={fetchData}
            />
          )}
        </CardContent>
      </Card>
      
      <CourseFormDialog 
        open={isCourseFormOpen}
        onOpenChange={setIsCourseFormOpen}
        onSuccess={handleFormSuccess}
        course={editingCourse}
      />
      <AssignEmployeesDialog
        open={isAssignFormOpen}
        onOpenChange={setIsAssignFormOpen}
        onSuccess={handleFormSuccess}
        courses={courses}
        employees={employees}
      />
    </>
  );
}
