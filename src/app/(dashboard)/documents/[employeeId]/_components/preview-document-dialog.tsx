
'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Download } from 'lucide-react';
import type { ChecklistItem } from '../page';

interface PreviewDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: ChecklistItem;
}

export function PreviewDocumentDialog({ open, onOpenChange, item }: PreviewDocumentDialogProps) {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (open && item.file_path) {
      setIsLoading(true);
      const token = localStorage.getItem('authToken');
      // The backend will serve the file from /uploads/... but we need to fetch it via our API proxy
      const url = `/api/uploads/${item.file_path}`;
      
      // For images, we can just use the URL directly.
      // For PDFs, we need to fetch it as a blob to display it.
      if (item.mime_type?.startsWith('image/')) {
        setFileUrl(url); // The src attribute will handle the Authorization header implicitly via cookies
        setIsLoading(false);
      } else if (item.mime_type === 'application/pdf') {
         fetch(url, { headers: { Authorization: `Bearer ${token}` } })
            .then(res => res.blob())
            .then(blob => {
                const objectUrl = URL.createObjectURL(blob);
                setFileUrl(objectUrl);
                setIsLoading(false);
            })
            .catch(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    }

    return () => {
      // Clean up the object URL to avoid memory leaks
      if (fileUrl && fileUrl.startsWith('blob:')) {
        URL.revokeObjectURL(fileUrl);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, item]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <span>معاينة: {item.doc_type.title_ar}</span>
            <a href={`/api/uploads/${item.file_path}`} download={item.file_name || 'document'}>
              <Button variant="outline" size="sm">
                <Download className="ml-2 h-4 w-4"/>
                تحميل
              </Button>
            </a>
          </DialogTitle>
        </DialogHeader>
        <div className="flex-grow flex items-center justify-center bg-muted/50 rounded-md overflow-hidden">
          {isLoading && <Loader2 className="h-8 w-8 animate-spin" />}
          {!isLoading && fileUrl && item.mime_type?.startsWith('image/') && (
            <img src={fileUrl} alt={item.doc_type.title_ar} className="max-w-full max-h-full object-contain" />
          )}
          {!isLoading && fileUrl && item.mime_type === 'application/pdf' && (
            <iframe src={fileUrl} className="w-full h-full" title={item.doc_type.title_ar} />
          )}
          {!isLoading && !fileUrl && (
            <p>لا يمكن عرض هذا الملف.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
