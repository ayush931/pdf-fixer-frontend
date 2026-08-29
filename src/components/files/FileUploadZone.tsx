import React, { useState, useRef } from 'react';
import { useApp } from '../../context/useApp';
import { apiService } from '../../services/apiService';
import { UploadCloud, FileCheck2, Loader2, ShieldCheck, CheckCircle } from 'lucide-react';

export const FileUploadZone: React.FC = () => {
  const { refreshFiles, setActiveFile, addToast } = useApp();
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const file = fileList[0];

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      addToast('error', 'Invalid File Format', 'Only PDF files (.pdf) are supported.');
      return;
    }

    try {
      setUploading(true);
      setProgress(0);

      const response = await apiService.uploadPdf(file, (percent) => {
        setProgress(percent);
      });

      addToast('success', 'Upload Successful', `${response.filename} was uploaded successfully.`);
      await refreshFiles();
      
      const allFiles = await apiService.getFiles();
      const newFile = allFiles.find((f) => f.id === response.file_id);
      if (newFile) {
        setActiveFile(newFile);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error uploading file.';
      addToast('error', 'Upload Failed', msg);
    } finally {
      setUploading(false);
      setProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !uploading && fileInputRef.current?.click()}
      className={`relative group cursor-pointer border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all duration-200 bg-white ${
        isDragging
          ? 'border-orange-500 bg-orange-50/20 shadow-xs'
          : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50/50 shadow-2xs'
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
        disabled={uploading}
      />

      <div className="flex flex-col items-center justify-center space-y-3">
        <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center group-hover:scale-105 transition-transform">
          {uploading ? (
            <Loader2 className="w-6 h-6 animate-spin text-orange-600" />
          ) : (
            <UploadCloud className="w-6 h-6" />
          )}
        </div>

        {uploading ? (
          <div className="w-full max-w-xs space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-800 font-semibold">
              <span>Uploading & Processing PDF...</span>
              <span className="text-orange-600 font-mono">{progress}%</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-orange-600 rounded-full transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : (
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              Drop your PDF file here, or <span className="text-orange-600 underline underline-offset-2">Browse</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Automated tag tree extraction, note IDs validation, broken link repair & accessibility checks.
            </p>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          <span className="inline-flex items-center gap-1 text-slate-600 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200 text-[11px] font-medium">
            <FileCheck2 className="w-3 h-3 text-slate-500" /> Auto-Validated
          </span>
          <span className="inline-flex items-center gap-1 text-slate-600 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200 text-[11px] font-medium">
            <ShieldCheck className="w-3 h-3 text-emerald-600" /> WCAG 2.1 Ready
          </span>
          <span className="inline-flex items-center gap-1 text-slate-600 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200 text-[11px] font-medium">
            <CheckCircle className="w-3 h-3 text-slate-500" /> Section 508
          </span>
        </div>
      </div>
    </div>
  );
};


