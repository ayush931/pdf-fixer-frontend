import React, { useState } from 'react';
import { useApp } from '../../context/useApp';
import { apiService } from '../../services/apiService';
import type { LinkViewSetting } from '../../types/pdf';
import {
  FileCode,
  Tag,
  BookOpenCheck,
  ZoomIn,
  Link,
  GitCompare,
  FileText,
  Play,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Layers,
  Sparkles,
} from 'lucide-react';

interface ToolConfig {
  id: string;
  name: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  outputSuffix: string;
}

const TOOLS: ToolConfig[] = [
  {
    id: 'fix_note_ids',
    name: 'Fix Note IDs',
    category: 'Identifiers & Tags',
    icon: FileCode,
    description: 'Scans PDF note anchor tags and assigns unique, non-colliding object IDs.',
    outputSuffix: '_fixed_note_ids.pdf',
  },
  {
    id: 'tag_viewer',
    name: 'Tag Structure Viewer',
    category: 'Inspection & Logs',
    icon: Tag,
    description: 'Inspects PDF structure tree for merged or missing Link elements without altering PDF.',
    outputSuffix: '',
  },
  {
    id: 'fix_index_tag',
    name: 'Fix Index Pages Tagging',
    category: 'Accessibility & Tags',
    icon: BookOpenCheck,
    description: 'Remediates auto-tagged index pages, binding table of content items correctly.',
    outputSuffix: '_fixed_index.pdf',
  },
  {
    id: 'apply_link_view_settings',
    name: 'Link View & Zoom Settings',
    category: 'View & Navigation',
    icon: ZoomIn,
    description: 'Enforces uniform PDF destination zoom modes (Fit, FitH, InheritZoom, etc.).',
    outputSuffix: '_fixed_view_settings.pdf',
  },
  {
    id: 'fix_links',
    name: 'Repair Broken Links',
    category: 'Navigation',
    icon: Link,
    description: 'Detects and repairs internal document hyperlinks pointing to missing page targets.',
    outputSuffix: '_fixed_links.pdf',
  },
  {
    id: 'bidirectional_notes_linker',
    name: 'Bidirectional Notes Linker',
    category: 'Advanced Links',
    icon: GitCompare,
    description: 'Generates two-way hyperlinks between main text citations and endnotes/footnotes.',
    outputSuffix: '_bidirectional_linked.pdf',
  },
];

export const RemediationTools: React.FC = () => {
  const { files, activeFile, setActiveFile, refreshTasks, setActiveTab, addToast, selectedToolId, setSelectedToolId } = useApp();

  const [mode, setMode] = useState<'single' | 'multi'>('single');
  const [activeToolId, setActiveToolId] = useState<string>(selectedToolId || 'fix_note_ids');
  const [selectedMultiToolIds, setSelectedMultiToolIds] = useState<string[]>(['fix_note_ids', 'fix_links']);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Form States
  const [outputName, setOutputName] = useState<string>('');
  const [indexPages, setIndexPages] = useState<string>('6, 7, 8');
  const [viewPreset, setViewPreset] = useState<LinkViewSetting>('InheritZoom');
  const [customView, setCustomView] = useState<string>('');
  const [notesPages, setNotesPages] = useState<string>('');
  const [chapterNotes, setChapterNotes] = useState<boolean>(false);
  const [bookNotes, setBookNotes] = useState<boolean>(false);
  const [notePattern, setNotePattern] = useState<string>('');
  const [dryRun, setDryRun] = useState<boolean>(false);
  const [verbose, setVerbose] = useState<boolean>(true);

  const selectedSingleTool = TOOLS.find((t) => t.id === activeToolId) || TOOLS[0];

  const defaultOutputName = activeFile
    ? `${activeFile.filename.replace(/\.pdf$/i, '')}${selectedSingleTool.outputSuffix || '_fixed.pdf'}`
    : '';
  const effectiveOutputName = outputName || defaultOutputName;

  const handleToolSelect = (toolId: string) => {
    setActiveToolId(toolId);
    setSelectedToolId(toolId);
    if (activeFile) {
      const base = activeFile.filename.replace(/\.pdf$/i, '');
      const tool = TOOLS.find((t) => t.id === toolId);
      setOutputName(`${base}${tool?.outputSuffix || '_fixed.pdf'}`);
    }
  };



  const toggleMultiTool = (toolId: string) => {
    setSelectedMultiToolIds((prev) =>
      prev.includes(toolId) ? prev.filter((id) => id !== toolId) : [...prev, toolId]
    );
  };

  const executeToolCall = async (toolId: string, fileId: string, baseFilename: string) => {
    const tool = TOOLS.find((t) => t.id === toolId);
    const suffix = tool?.outputSuffix || `_${toolId}.pdf`;
    const finalOutput = outputName && mode === 'single' ? outputName : `${baseFilename}${suffix}`;

    switch (toolId) {
      case 'fix_note_ids':
        return apiService.processNoteIds({ file_id: fileId, output_name: finalOutput });
      case 'tag_viewer':
        return apiService.processTagViewer({ file_id: fileId });
      case 'fix_index_tag': {
        const pagesList = indexPages
          .split(',')
          .map((p) => parseInt(p.trim(), 10))
          .filter((p) => !isNaN(p) && p > 0);
        return apiService.processIndexTags({ file_id: fileId, pages: pagesList, output_name: finalOutput });
      }
      case 'apply_link_view_settings':
        return apiService.processLinkView({
          file_id: fileId,
          view: viewPreset,
          custom_view: customView.trim() || undefined,
          output_name: finalOutput,
        });
      case 'fix_links':
        return apiService.processFixLinks({ file_id: fileId, output_name: finalOutput });
      case 'bidirectional_notes_linker':
        return apiService.processBidirectional({
          file_id: fileId,
          notes_pages: notesPages.trim() || undefined,
          chapter_notes: chapterNotes,
          book_notes: bookNotes,
          note_pattern: notePattern.trim() || undefined,
          dry_run: dryRun,
          verbose: verbose,
          output_name: finalOutput,
        });
      default:
        throw new Error(`Unknown tool ID ${toolId}`);
    }
  };

  const handleRunTools = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFile) return;

    const toolsToRun = mode === 'single' ? [activeToolId] : selectedMultiToolIds;
    if (toolsToRun.length === 0) {
      addToast('info', 'No Tools Selected', 'Please select at least one tool to execute.');
      return;
    }

    setSubmitting(true);
    const fileId = activeFile.id;
    const baseFilename = activeFile.filename.replace(/\.pdf$/i, '');

    try {
      const promises = toolsToRun.map(async (tId) => {
        const toolObj = TOOLS.find((t) => t.id === tId);
        try {
          const res = await executeToolCall(tId, fileId, baseFilename);
          return { status: 'fulfilled', toolName: toolObj?.name, taskId: res.task_id };
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Execution error';
          return { status: 'rejected', toolName: toolObj?.name, error: msg };
        }
      });

      const results = await Promise.all(promises);
      const successCount = results.filter((r) => r.status === 'fulfilled').length;
      const failCount = results.filter((r) => r.status === 'rejected').length;

      if (successCount > 0) {
        addToast(
          'success',
          `Queued ${successCount} Tool${successCount > 1 ? 's' : ''}`,
          `Successfully enqueued ${successCount} background job${successCount > 1 ? 's' : ''} for execution.`
        );
      }
      if (failCount > 0) {
        addToast('error', `${failCount} Task Failed`, 'One or more tool requests encountered an error.');
      }

      await refreshTasks();
      setActiveTab('tasks');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Mode & Target File Selector Bar */}
      <div className="p-4 rounded-2xl bg-slate-100/90 border border-slate-300 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs uppercase tracking-wider font-bold text-slate-500">
              Target Document
            </h3>
            {activeFile ? (
              <p className="text-sm font-bold text-slate-900">{activeFile.filename}</p>
            ) : (
              <p className="text-sm font-semibold text-amber-700 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" /> Please select a PDF file first
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Single vs Multi-Tool Mode Toggle */}
          <div className="flex items-center bg-slate-200/80 p-1 rounded-xl border border-slate-300 text-xs">
            <button
              type="button"
              onClick={() => setMode('single')}
              className={`px-3 py-1.5 font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
                mode === 'single'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Single Tool Mode
            </button>
            <button
              type="button"
              onClick={() => setMode('multi')}
              className={`px-3 py-1.5 font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
                mode === 'multi'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Multi-Tool Batch Mode</span>
            </button>
          </div>

          {/* Active File Dropdown */}
          <select
            value={activeFile?.id || ''}
            onChange={(e) => {
              const selected = files.find((f) => f.id === e.target.value);
              if (selected) {
                setActiveFile(selected);
                const base = selected.filename.replace(/\.pdf$/i, '');
                setOutputName(`${base}${selectedSingleTool.outputSuffix}`);
              }
            }}
            className="px-4 py-2 text-xs font-semibold bg-slate-200/60 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500"
          >
            {files.map((f) => (
              <option key={f.id} value={f.id}>
                {f.filename} ({f.file_type})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Multi-Tool Batch Mode Banner */}
      {mode === 'multi' && (
        <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-between gap-4 text-indigo-900">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-indigo-600 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider">
                Multi-Tool Batch Suite Enabled
              </h4>
              <p className="text-xs text-indigo-800 mt-0.5">
                Check multiple tools below to execute them all concurrently in parallel background queues.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 font-bold text-xs rounded-full bg-indigo-600 text-white shadow-2xs shrink-0">
            {selectedMultiToolIds.length} Selected
          </span>
        </div>
      )}

      {/* Tools Grid Selection Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {TOOLS.map((tool) => {
          const Icon = tool.icon;
          const isSelected =
            mode === 'single' ? activeToolId === tool.id : selectedMultiToolIds.includes(tool.id);

          return (
            <div
              key={tool.id}
              onClick={() => {
                if (mode === 'single') {
                  handleToolSelect(tool.id);
                } else {
                  toggleMultiTool(tool.id);
                }
              }}
              className={`p-4 rounded-2xl text-left border transition-all duration-200 relative cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-indigo-50/80 border-indigo-400 shadow-md shadow-indigo-500/10'
                  : 'bg-slate-100/90 hover:bg-slate-200/60 border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`p-2 rounded-xl ${
                      isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="flex items-center gap-2">
                    {mode === 'multi' && (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleMultiTool(tool.id)}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-600 border border-slate-300">
                      {tool.category}
                    </span>
                  </div>
                </div>
                <h4 className="text-sm font-bold text-slate-900">{tool.name}</h4>
                <p className="text-xs text-slate-600 mt-1 line-clamp-2">{tool.description}</p>
              </div>

              {isSelected && (
                <div className="mt-3 pt-2 border-t border-indigo-200 flex items-center gap-1 text-[11px] font-bold text-indigo-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{mode === 'single' ? 'Active Tool' : 'Included in Batch'}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected Tool Configuration Form */}
      {activeFile && (
        <form
          onSubmit={handleRunTools}
          className="p-6 rounded-2xl bg-slate-100/90 border border-slate-300 space-y-6 shadow-md"
        >
          <div className="flex items-center justify-between border-b border-slate-300 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-xs">
                {mode === 'single' ? (
                  <selectedSingleTool.icon className="w-6 h-6" />
                ) : (
                  <Layers className="w-6 h-6" />
                )}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {mode === 'single'
                    ? selectedSingleTool.name
                    : `Batch Execution Suite (${selectedMultiToolIds.length} Tools Selected)`}
                </h3>
                <p className="text-xs text-slate-600">
                  {mode === 'single'
                    ? selectedSingleTool.description
                    : 'Configure settings for all selected tools below and execute simultaneously.'}
                </p>
              </div>
            </div>
          </div>

          {/* Single Mode Output Name */}
          {mode === 'single' && selectedSingleTool.id !== 'tag_viewer' && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Output PDF Filename</label>
              <input
                type="text"
                value={effectiveOutputName}
                onChange={(e) => setOutputName(e.target.value)}
                placeholder="e.g. remediated_document.pdf"

                className="w-full px-4 py-2.5 text-xs bg-slate-200/50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-500 font-mono font-semibold"
                required
              />
            </div>
          )}

          {/* Config Section 1: Fix Index Tag */}
          {(mode === 'single' ? activeToolId === 'fix_index_tag' : selectedMultiToolIds.includes('fix_index_tag')) && (
            <div className="p-4 rounded-xl bg-slate-200/40 border border-slate-300 space-y-2">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <BookOpenCheck className="w-4 h-4 text-indigo-600" />
                Fix Index Pages Tagging Settings
                <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
              </label>
              <input
                type="text"
                value={indexPages}
                onChange={(e) => setIndexPages(e.target.value)}
                placeholder="e.g. 6, 7, 8"
                className="w-full px-4 py-2 text-xs bg-slate-100 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-500 font-mono font-semibold"
                required
              />
              <p className="text-[11px] text-slate-500">
                1-indexed comma-separated list of page numbers containing index links (e.g. 6, 7, 8).
              </p>
            </div>
          )}

          {/* Config Section 2: Link View Settings */}
          {(mode === 'single' ? activeToolId === 'apply_link_view_settings' : selectedMultiToolIds.includes('apply_link_view_settings')) && (
            <div className="p-4 rounded-xl bg-slate-200/40 border border-slate-300 space-y-3">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <ZoomIn className="w-4 h-4 text-indigo-600" />
                Link View & Zoom Settings
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">View Preset</label>
                  <select
                    value={viewPreset}
                    onChange={(e) => setViewPreset(e.target.value as LinkViewSetting)}
                    className="w-full px-4 py-2 text-xs bg-slate-100 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-500 font-medium"
                  >
                    <option value="Fit">Fit (Fit page to window)</option>
                    <option value="FitH">FitH (Fit width to window)</option>
                    <option value="InheritZoom">InheritZoom (Keep user current zoom level)</option>
                    <option value="InheritScrollAndZoom">InheritScrollAndZoom (Preserve scroll & zoom)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Custom PDF View Command (Optional)
                  </label>
                  <input
                    type="text"
                    value={customView}
                    onChange={(e) => setCustomView(e.target.value)}
                    placeholder="e.g. /XYZ null null null"
                    className="w-full px-4 py-2 text-xs bg-slate-100 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-500 font-mono font-semibold"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Config Section 3: Bidirectional Notes Linker */}
          {(mode === 'single' ? activeToolId === 'bidirectional_notes_linker' : selectedMultiToolIds.includes('bidirectional_notes_linker')) && (
            <div className="p-4 rounded-xl bg-slate-200/40 border border-slate-300 space-y-4">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <GitCompare className="w-4 h-4 text-indigo-600" />
                Bidirectional Notes Linker Settings
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Notes Page Range (Optional)
                  </label>
                  <input
                    type="text"
                    value={notesPages}
                    onChange={(e) => setNotesPages(e.target.value)}
                    placeholder="e.g. 280-310"
                    className="w-full px-4 py-2 text-xs bg-slate-100 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-500 font-mono font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Note Anchor Regex Pattern (Optional)
                  </label>
                  <input
                    type="text"
                    value={notePattern}
                    onChange={(e) => setNotePattern(e.target.value)}
                    placeholder="e.g. \[(\d+)\]"
                    className="w-full px-4 py-2 text-xs bg-slate-100 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-500 font-mono font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-100 border border-slate-300 text-xs font-semibold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={chapterNotes}
                    onChange={(e) => setChapterNotes(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  Chapter Notes Mode
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-100 border border-slate-300 text-xs font-semibold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bookNotes}
                    onChange={(e) => setBookNotes(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  Book Notes Mode
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-100 border border-slate-300 text-xs font-semibold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dryRun}
                    onChange={(e) => setDryRun(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  Dry Run (Report Only)
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-100 border border-slate-300 text-xs font-semibold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={verbose}
                    onChange={(e) => setVerbose(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  Verbose Task Logs
                </label>
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>
                {submitting
                  ? 'Enqueueing Celery Tasks...'
                  : mode === 'single'
                  ? 'Run Remediation Tool'
                  : `Run Selected (${selectedMultiToolIds.length}) Tools in Parallel`}
              </span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
