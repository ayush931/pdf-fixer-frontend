import React, { useState } from 'react';
import { useApp } from '../../context/useApp';
import { apiService } from '../../services/apiService';
import type { PdfFile } from '../../types/pdf';
import { StatusBadge } from '../common/StatusBadge';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { formatFileSize, formatDate } from '../../utils/formatters';
import {
  FileText,
  Search,
  Eye,
  Trash2,
  Download,
  Filter,
  Wrench,
} from 'lucide-react';

export const FileListTable: React.FC = () => {
  const {
    files,
    loadingFiles,
    activeFile,
    setActiveFile,
    deleteFile,
    setSelectedFileForInspector,
    setActiveTab,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  const filteredFiles = files.filter((file) => {
    const matchesSearch = file.filename.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'all' || file.file_type.toLowerCase() === filterType.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  const handleSelectFile = (file: PdfFile) => {
    setActiveFile(file);
  };

  const handleRemediateClick = (file: PdfFile) => {
    setActiveFile(file);
    setActiveTab('tools');
  };

  if (loadingFiles) {
    return <LoadingSpinner label="Loading PDF repository..." size="lg" />;
  }

  return (
    <div className="space-y-3.5">
      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search PDF files by name..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all shadow-2xs font-medium"
          />
        </div>

        {/* Filter Type Pills */}
        <div className="flex items-center gap-1 bg-white border border-slate-200/80 rounded-xl p-1 text-xs shadow-2xs">
          <Filter className="w-3.5 h-3.5 text-slate-400 ml-2" />
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1 font-semibold rounded-lg transition-colors ${
              filterType === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({files.length})
          </button>
          <button
            onClick={() => setFilterType('uploaded')}
            className={`px-3 py-1 font-semibold rounded-lg transition-colors ${
              filterType === 'uploaded'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Uploaded ({files.filter((f) => f.file_type === 'uploaded').length})
          </button>
          <button
            onClick={() => setFilterType('processed')}
            className={`px-3 py-1 font-semibold rounded-lg transition-colors ${
              filterType === 'processed'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Remediated ({files.filter((f) => f.file_type === 'processed').length})
          </button>
        </div>
      </div>

      {/* File Table */}
      {filteredFiles.length === 0 ? (
        <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200/80 space-y-3 shadow-2xs">
          <FileText className="w-12 h-12 text-slate-300 mx-auto" />
          <div>
            <h3 className="text-sm font-bold text-slate-800">No PDF files found</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {searchQuery
                ? `No documents match your query "${searchQuery}"`
                : 'Upload a PDF file using the dropzone above to begin.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-2xs">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 uppercase tracking-wider text-[11px] font-semibold text-slate-600">
              <tr>
                <th scope="col" className="px-4 py-3.5">Filename</th>
                <th scope="col" className="px-4 py-3.5">Type</th>
                <th scope="col" className="px-4 py-3.5">Size</th>
                <th scope="col" className="px-4 py-3.5">Date Added</th>
                <th scope="col" className="px-4 py-3.5">Status</th>
                <th scope="col" className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredFiles.map((file) => {
                const isSelected = activeFile?.id === file.id;

                return (
                  <tr
                    key={file.id}
                    onClick={() => handleSelectFile(file)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-slate-50/90 font-medium'
                        : 'hover:bg-slate-50/60'
                    }`}
                  >
                    {/* File Name */}
                    <td className="px-4 py-3 text-slate-900 font-semibold">
                      <div className="flex items-center gap-2.5">
                        <FileText className={`w-4 h-4 shrink-0 ${isSelected ? 'text-orange-600' : 'text-slate-400'}`} />
                        <div className="truncate max-w-[200px] sm:max-w-xs" title={file.filename}>
                          <span>{file.filename}</span>
                          {isSelected && (
                            <span className="ml-2 text-[10px] font-bold text-orange-700 bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded">
                              Active
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* File Type */}
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase ${
                          file.file_type === 'processed'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {file.file_type}
                      </span>
                    </td>

                    {/* Size */}
                    <td className="px-4 py-3 text-slate-500 font-mono">
                      {formatFileSize(file.size)}
                    </td>

                    {/* Created Date */}
                    <td className="px-4 py-3 text-slate-500">
                      {formatDate(file.created_at)}
                    </td>

                    {/* Status Badge */}
                    <td className="px-4 py-3">
                      <StatusBadge status={file.file_type} size="sm" />
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      <div
                        className="flex items-center justify-end gap-1.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Inspect Button */}
                        <button
                          onClick={() => setSelectedFileForInspector(file)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
                          title="Inspect Document Structure & Bookmarks"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Remediate Button */}
                        <button
                          onClick={() => handleRemediateClick(file)}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-orange-600 hover:bg-orange-700 text-white transition-colors flex items-center gap-1 shadow-2xs"
                          title="Open in Remediation Suite"
                        >
                          <Wrench className="w-3 h-3" />
                          <span>Remediate</span>
                        </button>

                        {/* Download Button */}
                        <a
                          href={apiService.getDownloadUrl(file.id)}
                          download={file.filename}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
                          title="Download PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>

                        {/* Delete Button */}
                        <button
                          onClick={() => deleteFile(file.id)}
                          className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Delete PDF"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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
