
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
    let objectUrl: string | null = null;

    const fetchAsBlob = async (filePath: string) => {
        setIsLoading(true);
        setFileUrl(null); // Reset previous URL
        const token = localStorage.getItem('authToken');
        const url = `/api/uploads/${filePath}`;
        
        try {
            const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!res.ok) throw new Error('Failed to fetch file');
            const blob = await res.blob();
            objectUrl = URL.createObjectURL(blob);
            setFileUrl(objectUrl);
        } catch (error) {
            console.error("Failed to load file for preview:", error);
        } finally {
            setIsLoading(false);
        }
      };

    if (open && item.file_path) {
      if (item.mime_type?.startsWith('image/') || item.mime_type === 'application/pdf') {
        fetchAsBlob(item.file_path);
      } else {
        // For other file types that can't be previewed
        setIsLoading(false);
        setFileUrl(null);
      }
    }

    return () => {
      // Clean up the object URL to avoid memory leaks
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, item.file_path, item.mime_type]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <span>معاينة: {item.doc_type.title_ar}</span>
            {item.file_path && (
                <a href={`/api/uploads/${item.file_path}`} download={item.file_name || 'document'}>
                <Button variant="outline" size="sm">
                    <Download className="ml-2 h-4 w-4"/>
                    تحميل
                </Button>
                </a>
            )}
          </DialogTitle>
        </DialogHeader>
        <div className="flex-grow flex items-center justify-center bg-muted/50 rounded-md overflow-hidden">
          {isLoading ? (
             <Loader2 className="h-8 w-8 animate-spin" />
          ) : fileUrl ? (
            item.mime_type?.startsWith('image/') ? (
                <img src={fileUrl} alt={item.doc_type.title_ar} className="max-w-full max-h-full object-contain" />
            ) : item.mime_type === 'application/pdf' ? (
                <iframe src={fileUrl} className="w-full h-full" title={item.doc_type.title_ar} />
            ) : (
                <p>لا يمكن عرض هذا الملف.</p>
            )
          ) : (
            <p>لا يمكن عرض هذا الملف.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
