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
    (t) => t.file_id === file.id && t.name === 'run_document_structure_analyzer'
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
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Table':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Figure':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  if (analyzerTask && (analyzerTask.status === 'PENDING' || analyzerTask.status === 'RUNNING' || analyzerTask.status === 'QUEUED')) {
    return (
      <div className="p-12 text-center bg-slate-100/90 rounded-2xl border border-slate-300">
        <LoadingSpinner label="Running logical structure analyzer. This inspects multi-column layouts & maps visual reading flow..." size="lg" />
        <button
          onClick={refreshTasks}
          className="mt-4 px-4 py-2 text-xs font-bold bg-white border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50"
        >
          Check Status
        </button>
      </div>
    );
  }

  if (loadingReport) {
    return (
      <div className="p-12 text-center bg-slate-100/90 rounded-2xl border border-slate-300">
        <LoadingSpinner label="Downloading structure analysis report..." size="lg" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="p-12 text-center bg-slate-100/90 rounded-2xl border border-slate-300 space-y-4">
        <Layout className="w-12 h-12 text-slate-400 mx-auto" />
        <div>
          <h3 className="text-sm font-bold text-slate-900">Logical Reading Order Mapping</h3>
          <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
            Extract document heading hierarchies, multi-column flows, and visual blocks. Runs an automated structural mapping parser.
          </p>
        </div>
        <button
          onClick={handleStartAnalysis}
          disabled={analyzing}
          className="px-5 py-2.5 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-md flex items-center gap-2 mx-auto disabled:opacity-50"
        >
          <Play className="w-3.5 h-3.5 fill-white" />
          <span>{analyzing ? 'Starting Analyzer...' : 'Run Layout & Reading Order Analyzer'}</span>
        </button>
      </div>
    );
  }

  const currentPage = report.pages[selectedPageIdx];

  return (
    <div className="space-y-6">
      {/* Overview stats & action bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-200/50 border border-slate-300">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <span className="text-xs font-bold text-slate-900">
            Detected: {report.summary.total_headings} Headings • {report.summary.total_paragraphs} Paragraphs • {report.summary.total_tables} Tables
          </span>
        </div>
        
        <button
          onClick={handleSaveReadingOrder}
          disabled={saving}
          className="px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs flex items-center gap-1.5 justify-center disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Apply & Save Reading Order'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Page selector sidebar */}
        <div className="md:col-span-1 border border-slate-300 rounded-xl bg-white p-3 space-y-2 max-h-[450px] overflow-y-auto">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-2">Document Pages</h4>
          <div className="space-y-1">
            {report.pages.map((p, idx) => {
              const hasCustom = !!customOrders[p.page];
              return (
                <button
                  key={p.page}
                  onClick={() => handlePageChange(idx)}
                  className={`w-full text-left px-3 py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-between ${
                    selectedPageIdx === idx
                      ? 'bg-indigo-600 text-white'
                      : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <span>Page {p.page}</span>
                  <span className="flex items-center gap-1">
                    <span className="text-[10px] opacity-75 font-normal">
                      ({p.column_layout === 'Multi-Column' ? '2-Col' : '1-Col'})
                    </span>
                    {hasCustom && <Check className="w-3.5 h-3.5" />}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Reading order sorting workspace */}
        <div className="md:col-span-3 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-300 pb-2">
            <div>
              <h4 className="text-sm font-bold text-slate-800">
                Structure Sorting Workspace (Page {currentPage.page})
              </h4>
              <p className="text-xs text-slate-600">
                Drag-and-drop cards, or use arrow buttons to map reading order for screen readers.
              </p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 border border-slate-300 font-mono">
              Layout: {currentPage.column_layout}
            </span>
          </div>

          {pageElements.length === 0 ? (
            <div className="p-12 text-center bg-slate-100 border border-slate-300 rounded-xl text-slate-500">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-400" />
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
                  className={`p-3 rounded-xl bg-slate-50 border border-slate-300 flex items-start gap-3 transition-colors select-none ${
                    draggedIndex === idx ? 'opacity-40 bg-indigo-50 border-indigo-300' : 'hover:border-slate-400'
                  }`}
                >
                  {/* Drag Handle */}
                  <div className="cursor-grab active:cursor-grabbing p-1 text-slate-400 hover:text-slate-600 shrink-0 mt-1">
                    <Move className="w-4 h-4" />
                  </div>

                  {/* Reading Order Badge */}
                  <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </div>

                  {/* Element content */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 border rounded-full ${getTypeColor(elem.type)}`}>
                        {elem.type} {elem.subtype ? `(${elem.subtype})` : ''}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
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
                      className="p-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 disabled:opacity-30"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === pageElements.length - 1}
                      onClick={() => moveElement(idx, 'down')}
                      className="p-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 disabled:opacity-30"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
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
