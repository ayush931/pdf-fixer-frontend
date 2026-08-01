import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/useApp';
import { apiService } from '../../services/apiService';
import type { PdfPagesInfo } from '../../types/pdf';
import { Modal } from '../common/Modal';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { FileText, Bookmark, Search, Eye, BookOpen, Layers, CheckCircle2 } from 'lucide-react';
import { formatFileSize } from '../../utils/formatters';

export const PdfInspectorModal: React.FC = () => {
  const { selectedFileForInspector, setSelectedFileForInspector } = useApp();
  const [info, setInfo] = useState<PdfPagesInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'outline' | 'search' | 'preview'>('outline');
  const [searchQuery, setSearchQuery] = useState<string>('index');
  const [filterText, setFilterText] = useState<string>('');

  const file = selectedFileForInspector;

  useEffect(() => {
    if (!file) return;

    const fetchInfo = async () => {
      try {
        setLoading(true);
        const data = await apiService.getPdfPagesInfo(file.id, searchQuery);
        setInfo(data);
      } catch (err: unknown) {
        console.error('Failed to fetch PDF page info:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchInfo();
  }, [file, searchQuery]);

  if (!file) return null;

  const downloadUrl = apiService.getDownloadUrl(file.id);

  const filteredOutline = info?.outline.filter((item) =>
    item.title.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <Modal
      isOpen={!!file}
      onClose={() => setSelectedFileForInspector(null)}
      maxWidth="5xl"
      title={
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">{file.filename}</h3>
            <p className="text-xs text-slate-500 font-mono">
              {formatFileSize(file.size)} • Type: {file.file_type.toUpperCase()}
            </p>
          </div>
        </div>
      }
    >
      {/* Navigation Sub-Tabs */}
      <div className="flex items-center justify-between border-b border-slate-300 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('outline')}
            className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition-colors ${
              activeTab === 'outline'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-200/80 text-slate-700 hover:text-slate-900 border border-slate-300'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            Bookmarks & Outline ({info?.outline.length || 0})
          </button>

          <button
            onClick={() => setActiveTab('search')}
            className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition-colors ${
              activeTab === 'search'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-200/80 text-slate-700 hover:text-slate-900 border border-slate-300'
            }`}
          >
            <Search className="w-4 h-4" />
            Text Search & Index Scanner ({info?.search_results.length || 0})
          </button>

          <button
            onClick={() => setActiveTab('preview')}
            className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition-colors ${
              activeTab === 'preview'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-200/80 text-slate-700 hover:text-slate-900 border border-slate-300'
            }`}
          >
            <Eye className="w-4 h-4" />
            Live Preview
          </button>
        </div>

        {info && (
          <span className="text-xs font-bold text-indigo-700 px-3 py-1 bg-indigo-50 border border-indigo-200 rounded-full flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-indigo-600" /> {info.total_pages} Total Pages
          </span>
        )}
      </div>

      {/* Main Tab View Content */}
      <div className="min-h-[400px]">
        {loading ? (
          <LoadingSpinner label="Extracting PDF pages, outline & text metadata..." size="lg" />
        ) : (
          <>
            {/* OUTLINE TAB */}
            {activeTab === 'outline' && (
              <div className="space-y-4">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    placeholder="Filter bookmark titles..."
                    className="w-full pl-9 pr-4 py-2 text-xs bg-slate-100 border border-slate-300 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-medium"
                  />
                </div>

                {!filteredOutline || filteredOutline.length === 0 ? (
                  <div className="p-12 text-center text-slate-500 bg-slate-100/90 rounded-2xl border border-slate-300">
                    <Bookmark className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm font-bold">No bookmarks or outline entries found in this document.</p>
                  </div>
                ) : (
                  <div className="max-h-[350px] overflow-y-auto space-y-1.5 pr-2">
                    {filteredOutline.map((item, idx) => (
                      <div
                        key={idx}
                        style={{ paddingLeft: `${item.depth * 20 + 12}px` }}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-200/50 hover:bg-slate-200 border border-slate-300 transition-colors"
                      >
                        <span className="text-xs font-semibold text-slate-800 truncate flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0" />
                          {item.title}
                        </span>
                        {item.page && (
                          <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
                            Page {item.page}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SEARCH TAB */}
            {activeTab === 'search' && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Keyword to scan across PDF (e.g. index, note, chapter)..."
                      className="w-full pl-9 pr-4 py-2 text-xs bg-slate-100 border border-slate-300 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-medium"
                    />
                  </div>
                  <button
                    onClick={() => {
                      setLoading(true);
                      apiService.getPdfPagesInfo(file.id, searchQuery).then((d) => {
                        setInfo(d);
                        setLoading(false);
                      });
                    }}
                    className="px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 transition-colors shadow-2xs"
                  >
                    Scan Document
                  </button>
                </div>

                {!info?.search_results || info.search_results.length === 0 ? (
                  <div className="p-12 text-center text-slate-500 bg-slate-100/90 rounded-2xl border border-slate-300">
                    <FileText className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm font-bold">No matches found for "{searchQuery}".</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[350px] overflow-y-auto pr-2">
                    {info.search_results.map((res) => (
                      <div
                        key={res.page}
                        className="p-3.5 rounded-xl bg-slate-200/60 border border-slate-300 flex items-center justify-between hover:border-indigo-400 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span className="text-xs font-bold text-slate-900">
                            Page {res.page}
                          </span>
                        </div>
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300">
                          {res.matches} {res.matches === 1 ? 'match' : 'matches'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* PREVIEW TAB */}
            {activeTab === 'preview' && (
              <div className="w-full h-[550px] rounded-xl overflow-hidden border border-slate-300 bg-slate-200">
                <iframe
                  src={downloadUrl}
                  title="PDF Preview"
                  className="w-full h-full border-none"
                />
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
};
