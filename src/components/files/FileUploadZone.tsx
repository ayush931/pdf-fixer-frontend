import React, { useState, useRef } from 'react';
import { useApp } from '../../context/useApp';
import { apiService } from '../../services/apiService';
import { UploadCloud, FileCheck2, Loader2 } from 'lucide-react';

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
      className={`relative group cursor-pointer border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all duration-300 shadow-xs ${
        isDragging
          ? 'border-indigo-500 bg-indigo-50/60 scale-[1.01] shadow-lg shadow-indigo-500/10'
          : 'border-slate-300 hover:border-indigo-400 bg-slate-100/90 hover:bg-slate-200/50'
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
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
          {uploading ? (
            <Loader2 className="w-7 h-7 animate-spin" />
          ) : (
            <UploadCloud className="w-7 h-7" />
          )}
        </div>

        {uploading ? (
          <div className="w-full max-w-xs space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-700 font-bold">
              <span>Uploading PDF...</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-600 to-cyan-500 transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : (
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center justify-center gap-2">
              Drop your PDF file here, or <span className="text-indigo-600 underline">Browse</span>
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              Supports standard PDFs for tags, note IDs, link zoom & footnote remediation
            </p>
          </div>
        )}

        <div className="flex items-center gap-4 text-[11px] text-slate-500 font-semibold pt-1">
          <span className="flex items-center gap-1">
            <FileCheck2 className="w-3.5 h-3.5 text-indigo-600" /> Auto-validated
          </span>
          <span>•</span>
          <span>Fast API Backend</span>
          <span>•</span>
          <span>Celery Queues</span>
        </div>
      </div>
    </div>
  );
};
