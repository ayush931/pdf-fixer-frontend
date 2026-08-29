import React, { useState, useEffect, useCallback } from 'react';
import { apiService } from '../../services/apiService';
import type { PdfFile, DocumentStructureReport, PageElement } from '../../types/pdf';
import { useApp } from '../../context/useApp';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { 
  Play, 
  ArrowUp, 
  ArrowDown, 
  Layout, 
  Save, 
  Sparkles, 
  Move, 
  Check,
  AlertCircle 
} from 'lucide-react';

interface ReadingOrderMapperProps {
  file: PdfFile;
}

export const ReadingOrderMapper: React.FC<ReadingOrderMapperProps> = ({ file }) => {
  const { tasks, refreshTasks, addToast, setActiveTab } = useApp();
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [loadingReport, setLoadingReport] = useState<boolean>(false);
  const [report, setReport] = useState<DocumentStructureReport | null>(null);
  const [selectedPageIdx, setSelectedPageIdx] = useState<number>(0);
  const [pageElements, setPageElements] = useState<PageElement[]>([]);
  const [customOrders, setCustomOrders] = useState<Record<number, string[]>>({});
  const [saving, setSaving] = useState<boolean>(false);

  // Check if there is an active or completed analyzer task
  const analyzerTask = tasks.find(
    (t) => t.file_id === file.id && (t.name === 'run_document_structure_analyzer' || t.name === 'document_structure_analyzer')
  );

  const fetchReport = useCallback(async (outputFileId: string) => {
    try {
      setLoadingReport(true);
      const url = apiService.getDownloadUrl(outputFileId);
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to download report file');
      const data = (await res.json()) as DocumentStructureReport;
      setReport(data);
      if (data.pages && data.pages.length > 0) {
        setSelectedPageIdx(0);
        setPageElements(data.pages[0].elements);
      }
    } catch (err: unknown) {
      console.error(err);
      addToast('error', 'Report Error', 'Could not load structure analysis data.');
    } finally {
      setLoadingReport(false);
    }
  }, [addToast]);

  useEffect(() => {
    if (analyzerTask?.status === 'SUCCESS' && analyzerTask.output_file_id) {
      fetchReport(analyzerTask.output_file_id);
    } else {
      setReport(null);
    }
  }, [analyzerTask, fetchReport]);

  const handleStartAnalysis = async () => {
    try {
      setAnalyzing(true);
      await apiService.processStructureAnalysis(file.id);
      addToast('info', 'Task Queued', 'Logical structure analyzer started.');
      await refreshTasks();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error starting analysis';
      addToast('error', 'Analysis Failed', msg);
    } finally {
      setAnalyzing(false);
    }
  };

  // Handle page change
  const handlePageChange = (idx: number) => {
    if (!report) return;
    setSelectedPageIdx(idx);
    const page = report.pages[idx];
    const savedOrder = customOrders[page.page];
    if (savedOrder) {
      // Re-sort elements by saved custom order
      const sorted = [...page.elements].sort((a, b) => {
        return savedOrder.indexOf(a.id) - savedOrder.indexOf(b.id);
      });
      setPageElements(sorted);
    } else {
      setPageElements(page.elements);
    }
  };

  // Move element manually via up/down buttons
  const moveElement = (index: number, direction: 'up' | 'down') => {
    const nextIndex = direction === 'up' ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= pageElements.length) return;

    const newElements = [...pageElements];
    const temp = newElements[index];
    newElements[index] = newElements[nextIndex];
    newElements[nextIndex] = temp;

    setPageElements(newElements);

    // Save order in state
    if (report) {
      const pageNum = report.pages[selectedPageIdx].page;
      setCustomOrders((prev) => ({
        ...prev,
        [pageNum]: newElements.map((e) => e.id),
      }));
    }
  };

  // Drag and Drop implementation
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newElements = [...pageElements];
    const draggedItem = newElements[draggedIndex];
    newElements.splice(draggedIndex, 1);
    newElements.splice(index, 0, draggedItem);
    
    setDraggedIndex(index);
    setPageElements(newElements);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    if (report) {
      const pageNum = report.pages[selectedPageIdx].page;
      setCustomOrders((prev) => ({
        ...prev,
        [pageNum]: pageElements.map((e) => e.id),
      }));
    }
  };

  // Save the custom reading order to backend
  const handleSaveReadingOrder = async () => {
    if (!report) return;

    // Build mapping for all pages that have modifications
    const finalOrder: Record<string, string[]> = {};
    Object.keys(customOrders).forEach((pageNum) => {
      finalOrder[pageNum] = customOrders[parseInt(pageNum)];
    });

    // For selected page, if not explicitly saved but modified order is in pageElements
    const currentPageNum = report.pages[selectedPageIdx].page;
    if (!finalOrder[currentPageNum]) {
      finalOrder[currentPageNum.toString()] = pageElements.map((e) => e.id);
    }

    setSaving(true);
    try {
      const outputName = `${file.filename.replace(/\.pdf$/i, '')}_reordered.pdf`;
      await apiService.processReorderReadingOrder({
        file_id: file.id,
        custom_order: finalOrder,
        output_name: outputName,
      });

      addToast(
        'success',
        'Reading Order Saved',
        'Applying reordered tags to PDF in background.'
      );
      await refreshTasks();
      setActiveTab('tasks');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to apply reading order';
      addToast('error', 'Save Failed', msg);
    } finally {
      setSaving(false);
    }
  };

  // Render elements classification badge
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Heading':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Table':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'Figure':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      default:
        return 'bg-orange-50 text-orange-800 border-orange-200';
    }
  };

  if (analyzerTask && (analyzerTask.status === 'PENDING' || analyzerTask.status === 'RUNNING' || analyzerTask.status === 'QUEUED')) {
    return (
      <div className="p-12 text-center bg-slate-50 rounded-2xl border border-slate-200">
        <LoadingSpinner label="Running logical structure analyzer..." size="lg" />
        <button
          onClick={refreshTasks}
          className="mt-4 px-4 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 shadow-2xs"
        >
          Check Status
        </button>
      </div>
    );
  }

  if (loadingReport) {
    return (
      <div className="p-12 text-center bg-slate-50 rounded-2xl border border-slate-200">
        <LoadingSpinner label="Downloading structure analysis report..." size="lg" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="p-12 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
        <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center mx-auto">
          <Layout className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900">Logical Reading Order Mapping</h3>
          <p className="text-xs text-slate-500 mt-0.5 max-w-md mx-auto leading-relaxed">
            Extract document heading hierarchies, multi-column flows, and visual blocks.
          </p>
        </div>
        <button
          onClick={handleStartAnalysis}
          disabled={analyzing}
          className="px-5 py-2.5 text-xs font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 text-white shadow-xs flex items-center gap-2 mx-auto disabled:opacity-50 transition-all"
        >
          <Play className="w-3.5 h-3.5 fill-white" />
          <span>{analyzing ? 'Starting Analyzer...' : 'Run Reading Order Analyzer'}</span>
        </button>
      </div>
    );
  }

  const currentPage = report.pages[selectedPageIdx];

  return (
    <div className="space-y-4">
      {/* Overview stats & action bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-orange-600" />
          <span className="text-xs font-semibold text-slate-800">
            Detected: {report.summary.total_headings} Headings • {report.summary.total_paragraphs} Paragraphs • {report.summary.total_tables} Tables
          </span>
        </div>
        
        <button
          onClick={handleSaveReadingOrder}
          disabled={saving}
          className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 text-white shadow-xs flex items-center gap-1.5 justify-center disabled:opacity-50 transition-all"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Apply & Save Order'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Page selector sidebar */}
        <div className="md:col-span-1 border border-slate-200 rounded-xl bg-white p-2.5 space-y-2 max-h-[450px] overflow-y-auto shadow-2xs">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">Document Pages</h4>
          <div className="space-y-1">
            {report.pages.map((p, idx) => {
              const hasCustom = !!customOrders[p.page];
              return (
                <button
                  key={p.page}
                  onClick={() => handlePageChange(idx)}
                  className={`w-full text-left px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center justify-between ${
                    selectedPageIdx === idx
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <span>Page {p.page}</span>
                  <span className="flex items-center gap-1">
                    <span className={`text-[10px] font-normal ${selectedPageIdx === idx ? 'text-slate-300' : 'text-slate-400'}`}>
                      ({p.column_layout === 'Multi-Column' ? '2-Col' : '1-Col'})
                    </span>
                    {hasCustom && <Check className="w-3 h-3" />}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Reading order sorting workspace */}
        <div className="md:col-span-3 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div>
              <h4 className="text-xs font-bold text-slate-900">
                Structure Sorting Workspace (Page {currentPage.page})
              </h4>
              <p className="text-[11px] text-slate-500">
                Drag-and-drop cards or use arrow buttons to map reading sequence for screen readers.
              </p>
            </div>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-mono">
              Layout: {currentPage.column_layout}
            </span>
          </div>

          {pageElements.length === 0 ? (
            <div className="p-12 text-center bg-slate-50 border border-slate-200 rounded-xl text-slate-500">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-xs font-bold">No structural layout elements detected on this page.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[450px] overflow-y-auto pr-1">
              {pageElements.map((elem, idx) => (
                <div
                  key={elem.id}
                  draggable
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDragEnd={handleDragEnd}
                  className={`p-3 rounded-xl bg-white border border-slate-200 flex items-start gap-2.5 transition-colors select-none shadow-2xs ${
                    draggedIndex === idx ? 'opacity-40 bg-slate-50 border-slate-400' : 'hover:border-slate-300'
                  }`}
                >
                  {/* Drag Handle */}
                  <div className="cursor-grab active:cursor-grabbing p-1 text-slate-400 hover:text-slate-600 shrink-0 mt-0.5">
                    <Move className="w-3.5 h-3.5" />
                  </div>

                  {/* Reading Order Badge */}
                  <div className="w-5 h-5 rounded-full bg-slate-900 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </div>

                  {/* Element content */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 border rounded-md ${getTypeColor(elem.type)}`}>
                        {elem.type} {elem.subtype ? `(${elem.subtype})` : ''}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        BBox: [{elem.bbox.map(v => Math.round(v)).join(', ')}]
                      </span>
                    </div>
                    <p className="text-xs text-slate-800 line-clamp-2 italic">
                      {elem.text || <span className="text-slate-400">(No text content)</span>}
                    </p>
                  </div>

                  {/* Move actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveElement(idx, 'up')}
                      className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 disabled:opacity-30 transition-colors"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === pageElements.length - 1}
                      onClick={() => moveElement(idx, 'down')}
                      className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 disabled:opacity-30 transition-colors"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


