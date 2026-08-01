import React, { useState } from 'react';
import { useApp } from '../../context/useApp';
import type { PdfFile } from '../../types/pdf';
import { apiService } from '../../services/apiService';
import { formatFileSize, formatDate } from '../../utils/formatters';
import { StatusBadge } from '../common/StatusBadge';
import { LoadingSpinner } from '../common/LoadingSpinner';
import {
  FileText,
  Download,
  Eye,
  Wrench,
  Search,
  CheckCircle2,
  Filter,
  Trash2,
} from 'lucide-react';

export const FileListTable: React.FC = () => {
  const {
    files,
    loadingFiles,
    activeFile,
    setActiveFile,
    setSelectedFileForInspector,
    setActiveTab,
    deleteFile,
  } = useApp();

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'uploaded' | 'processed'>('all');
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);

  const filteredFiles = files.filter((f) => {
    const matchesSearch = f.filename.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === 'all' || f.file_type === filterType;
    return matchesSearch && matchesType;
  });

  const handleSelectForTool = (file: PdfFile) => {
    setActiveFile(file);
    setActiveTab('tools');
  };

  const handleDelete = async (fileId: string) => {
    setDeletingFileId(fileId);
    try {
      await deleteFile(fileId);
    } finally {
      setDeletingFileId(null);
    }
  };

  if (loadingFiles) {
    return <LoadingSpinner label="Loading file repository..." size="lg" />;
  }

  return (
    <div className="space-y-4">
      {/* Top Toolbar: Search & Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search PDF files by name..."
            className="w-full pl-9 pr-4 py-2.5 text-xs bg-slate-100 border border-slate-300 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 shadow-2xs font-medium"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-200/60 border border-slate-300 rounded-xl p-1 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-500 ml-2" />
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 font-bold rounded-lg transition-colors ${
                filterType === 'all'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({files.length})
            </button>
            <button
              onClick={() => setFilterType('uploaded')}
              className={`px-3 py-1.5 font-bold rounded-lg transition-colors ${
                filterType === 'uploaded'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Uploaded ({files.filter((f) => f.file_type === 'uploaded').length})
            </button>
            <button
              onClick={() => setFilterType('processed')}
              className={`px-3 py-1.5 font-bold rounded-lg transition-colors ${
                filterType === 'processed'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Remediated ({files.filter((f) => f.file_type === 'processed').length})
            </button>
          </div>
        </div>
      </div>

      {/* Table Container */}
      {filteredFiles.length === 0 ? (
        <div className="p-12 text-center text-slate-600 bg-slate-100/90 rounded-2xl border border-slate-300 space-y-3 shadow-xs">
          <FileText className="w-12 h-12 text-slate-400 mx-auto" />
          <div>
            <h3 className="text-base font-bold text-slate-800">No PDF files found</h3>
            <p className="text-xs text-slate-500">
              Upload a PDF above to get started with tags, note IDs & link fixing.
            </p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-300 bg-slate-100/90 shadow-sm">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-200/80 border-b border-slate-300 uppercase tracking-wider text-[11px] font-bold text-slate-600">
              <tr>
                <th scope="col" className="px-4 py-3.5">Filename</th>
                <th scope="col" className="px-4 py-3.5">Status</th>
                <th scope="col" className="px-4 py-3.5">Size</th>
                <th scope="col" className="px-4 py-3.5">Date</th>
                <th scope="col" className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredFiles.map((file) => {
                const isActive = activeFile?.id === file.id;

                return (
                  <tr
                    key={file.id}
                    className={`transition-colors hover:bg-indigo-50/40 ${
                      isActive ? 'bg-indigo-50/70' : ''
                    }`}
                  >
                    {/* Filename & Active Pill */}
                    <td className="px-4 py-3 font-medium text-slate-800">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200 shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 max-w-xs sm:max-w-md">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 truncate" title={file.filename}>
                              {file.filename}
                            </span>
                            {isActive && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">
                                <CheckCircle2 className="w-3 h-3 text-indigo-600" /> Active
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">ID: {file.id.slice(0, 13)}...</span>
                        </div>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="px-4 py-3">
                      <StatusBadge status={file.file_type} size="sm" />
                    </td>

                    {/* Size */}
                    <td className="px-4 py-3 font-mono text-slate-600 font-semibold">
                      {formatFileSize(file.size)}
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3 text-slate-600 font-medium">
                      {formatDate(file.created_at)}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleSelectForTool(file)}
                          className="px-2.5 py-1.5 text-xs font-bold rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors flex items-center gap-1 shadow-2xs"
                          title="Select for Remediation Tools"
                        >
                          <Wrench className="w-3.5 h-3.5" />
                          <span>Use Tool</span>
                        </button>

                        <button
                          onClick={() => setSelectedFileForInspector(file)}
                          className="p-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors"
                          title="Inspect PDF Bookmarks & Pages"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <a
                          href={apiService.getDownloadUrl(file.id)}
                          download={file.filename}
                          className="p-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors"
                          title="Download PDF File"
                        >
                          <Download className="w-4 h-4" />
                        </a>

                        <button
                          onClick={() => handleDelete(file.id)}
                          disabled={deletingFileId === file.id}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors disabled:opacity-50"
                          title="Delete PDF File"
                        >
                          <Trash2 className={`w-4 h-4 ${deletingFileId === file.id ? 'animate-spin' : ''}`} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
