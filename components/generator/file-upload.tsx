import { useState, useRef } from 'react';
import { FileText, Mic, Video, X, File as FileIcon, Cloud, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSupabase } from '@/pages/_app';
import { edgeFunctions } from '@/lib/edge-functions';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: 'pdf' | 'text' | 'audio' | 'video';
  file: File;
}

interface FileUploadProps {
  files: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
}

const FILE_TYPE_ICONS: Record<string, React.ReactNode> = {
  pdf: <FileText className="h-5 w-5 text-rose-500" />,
  text: <FileIcon className="h-5 w-5 text-blue-500" />,
  audio: <Mic className="h-5 w-5 text-purple-500" />,
  video: <Video className="h-5 w-5 text-green-500" />,
};

const FILE_TYPE_COLORS: Record<string, string> = {
  pdf: 'bg-rose-500/10',
  text: 'bg-blue-500/10',
  audio: 'bg-purple-500/10',
  video: 'bg-green-500/10',
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function getFileType(file: File): 'pdf' | 'text' | 'audio' | 'video' {
  if (file.type.includes('pdf')) return 'pdf';
  if (file.type.includes('audio')) return 'audio';
  if (file.type.includes('video')) return 'video';
  return 'text';
}

export function FileUpload({ files, onFilesChange }: FileUploadProps) {
  const { supabase } = useSupabase();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeType, setActiveType] = useState<'pdf' | 'text' | 'audio' | 'video' | null>(null);
  const [driveLink, setDriveLink] = useState('');
  const [driveError, setDriveError] = useState('');
  const [driveLoading, setDriveLoading] = useState(false);

  const handleFileSelect = (type: 'pdf' | 'text' | 'audio' | 'video') => {
    setActiveType(type);
    if (fileInputRef.current) {
      switch (type) {
        case 'pdf':
          fileInputRef.current.accept = '.pdf';
          break;
        case 'text':
          fileInputRef.current.accept = '.txt,.doc,.docx,.rtf';
          break;
        case 'audio':
          fileInputRef.current.accept = 'audio/*';
          break;
        case 'video':
          fileInputRef.current.accept = 'video/*';
          break;
      }
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    const newFiles: UploadedFile[] = Array.from(selectedFiles).map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: getFileType(file),
      file,
    }));

    onFilesChange([...files, ...newFiles]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveFile = (id: string) => {
    onFilesChange(files.filter((f) => f.id !== id));
  };

  const extractDriveFileId = (link: string) => {
    const trimmed = link.trim();
    if (!trimmed) return null;
    const match = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/) || trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (match?.[1]) return match[1];
    if (/^[a-zA-Z0-9_-]{10,}$/.test(trimmed)) return trimmed;
    return null;
  };

  const handleDriveImport = async () => {
    const fileId = extractDriveFileId(driveLink);
    if (!fileId) {
      setDriveError('Enter a valid Google Drive share link or file ID.');
      return;
    }

    setDriveError('');
    setDriveLoading(true);
    try {
      const data = await edgeFunctions.googleDriveImport(supabase, fileId);
      const blob = base64ToBlob(data.data, data.contentType || 'application/octet-stream');
      const file = new File([blob], data.fileName || `google-drive-${fileId}`, { type: data.contentType || 'application/octet-stream' });
      const newFile: UploadedFile = {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: file.size,
        type: getFileType(file),
        file,
      };
      onFilesChange([...files, newFile]);
      setDriveLink('');
    } catch (error: any) {
      setDriveError(error?.message || 'Unable to import from Google Drive.');
    } finally {
      setDriveLoading(false);
    }
  };

  const base64ToBlob = (data: string, contentType: string) => {
    const byteCharacters = atob(data);
    const byteArrays = new Uint8Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i += 1) {
      byteArrays[i] = byteCharacters.charCodeAt(i);
    }
    return new Blob([byteArrays], { type: contentType });
  };

  const uploadButtons = [
    { type: 'pdf' as const, icon: <FileText className="h-6 w-6" />, label: 'PDF' },
    { type: 'text' as const, icon: <FileIcon className="h-6 w-6" />, label: 'Text' },
    { type: 'audio' as const, icon: <Mic className="h-6 w-6" />, label: 'Audio' },
    { type: 'video' as const, icon: <Video className="h-6 w-6" />, label: 'Video' },
  ];

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
        multiple
      />
      
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
        Add Evidence Source
      </p>
      
      <div className="grid grid-cols-4 gap-3">
        {uploadButtons.map(({ type, icon, label }) => (
          <button
            key={type}
            onClick={() => handleFileSelect(type)}
            className="flex flex-col items-center justify-center gap-2 p-3 rounded-2xl bg-card/40 dark:bg-card/20 hover:bg-primary/10 hover:border-primary/30 border border-transparent transition-all group aspect-square"
            data-testid={`button-upload-${type}`}
          >
            <span className="text-primary group-hover:scale-110 transition-transform">
              {icon}
            </span>
            <span className="text-[10px] font-medium text-muted-foreground">{label}</span>
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-border/60 bg-card/40 dark:bg-card/20 p-4 space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <Cloud className="h-4 w-4 text-primary" />
          Google Drive Import
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            value={driveLink}
            onChange={(e) => setDriveLink(e.target.value)}
            placeholder="Paste Google Drive share link or file ID"
            className="bg-card/50 dark:bg-card/30 border-border rounded-xl text-xs"
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleDriveImport}
            disabled={!driveLink.trim() || driveLoading}
            className="rounded-xl border-primary/40 text-primary hover:bg-primary/10"
          >
            {driveLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Import'}
          </Button>
        </div>
        {driveError && (
          <p className="text-[10px] text-rose-500">{driveError}</p>
        )}
        <p className="text-[10px] text-muted-foreground">
          Supports publicly shared files. For private files, download locally before uploading.
        </p>
      </div>

      {files.length > 0 && (
        <div className="pt-4 border-t border-border">
          <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
            Attached Files ({files.length})
          </p>
          <div className="flex space-x-3 overflow-x-auto no-scrollbar pb-2">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex-shrink-0 w-40 bg-card/40 dark:bg-card/20 rounded-xl p-2.5 border border-border flex items-center space-x-3 relative group hover:bg-card/60 transition-colors"
              >
                <div className={`w-9 h-9 rounded-lg ${FILE_TYPE_COLORS[file.type]} flex items-center justify-center`}>
                  {FILE_TYPE_ICONS[file.type]}
                </div>
                <div className="overflow-hidden flex-1">
                  <p className="text-xs font-medium truncate text-foreground">{file.name}</p>
                  <p className="text-[10px] text-muted-foreground">{formatFileSize(file.size)}</p>
                </div>
                <button
                  onClick={() => handleRemoveFile(file.id)}
                  className="absolute -top-1.5 -right-1.5 bg-muted text-muted-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-destructive hover:text-destructive-foreground"
                  data-testid={`button-remove-file-${file.id}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export type { UploadedFile };
