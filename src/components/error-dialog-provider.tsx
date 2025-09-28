
'use client';

import { createContext, useState, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';
import { useToast } from './ui/use-toast';
import { ScrollArea } from './ui/scroll-area';

type ErrorDetails = {
  title: string;
  description: string;
  details?: any;
};

type ErrorDialogContextType = {
  showError: (details: ErrorDetails) => void;
};

export const ErrorDialogContext = createContext<ErrorDialogContextType | null>(null);

export function ErrorDialogProvider({ children }: { children: ReactNode }) {
  const [error, setError] = useState<ErrorDetails | null>(null);
  const { toast: simpleToast } = useToast();
  const router = useRouter();

  const showError = useCallback((details: ErrorDetails) => {
    setError(details);
  }, []);

  const handleClose = () => {
    setError(null);
  };
  
  const handleRedirectToLogin = () => {
    setError(null);
    // Clear the expired token from both localStorage and cookies before redirecting
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    document.cookie = "authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    router.push('/login');
  };

  const handleCopy = () => {
    if (!error?.details) return;
    const detailsString = typeof error.details === 'object' 
      ? JSON.stringify(error.details, null, 2) 
      : String(error.details);
    navigator.clipboard.writeText(detailsString);
    simpleToast({
        title: "تم النسخ",
        description: "تم نسخ تفاصيل الخطأ إلى الحافظة."
    })
  }
  
  const isSessionExpiredError = error?.title === 'الجلسة منتهية';

  return (
    <ErrorDialogContext.Provider value={{ showError }}>
      {children}
      <AlertDialog open={!!error} onOpenChange={(open) => !open && (isSessionExpiredError ? handleRedirectToLogin() : handleClose())}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">{error?.title || 'حدث خطأ'}</AlertDialogTitle>
            <AlertDialogDescription>
              {error?.description || 'فشل تنفيذ الإجراء. يرجى مراجعة التفاصيل أدناه.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error?.details && !isSessionExpiredError && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">التفاصيل الفنية:</h3>
              <ScrollArea className="h-60 w-full rounded-md border p-4 bg-muted/50">
                <pre className="text-xs whitespace-pre-wrap">
                  <code>
                    {typeof error.details === 'object' ? JSON.stringify(error.details, null, 2) : String(error.details)}
                  </code>
                </pre>
              </ScrollArea>
            </div>
          )}
          <AlertDialogFooter>
            {isSessionExpiredError ? (
                 <AlertDialogAction onClick={handleRedirectToLogin}>إعادة تسجيل الدخول</AlertDialogAction>
            ) : (
                <>
                    <AlertDialogCancel onClick={handleClose}>إغلاق</AlertDialogCancel>
                    {error?.details && (
                        <Button variant="outline" onClick={handleCopy}>
                            <Copy className="ml-2 h-4 w-4" />
                            نسخ التفاصيل
                        </Button>
                    )}
                </>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ErrorDialogContext.Provider>
  );
}
