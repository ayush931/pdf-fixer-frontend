import React, { useState, useEffect } from 'react';
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
  Link2,
  FileType,
  Eraser,
  ShieldAlert,
  Wand2,
  Layout,
  Search,
  Sliders,
  Filter,
} from 'lucide-react';

export interface ToolConfig {
  id: string;
  name: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  outputSuffix: string;
}

export const TOOLS: ToolConfig[] = [
  {
    id: 'fix_note_ids',
    name: 'Fix Note IDs',
    category: 'Identifiers & Tags',
    icon: FileCode,
    description: 'Scans PDF note anchor tags and assigns unique, non-colliding object IDs.',
    outputSuffix: '_fixed_note_ids.pdf',
  },
  {
    id: 'fix_reference_note_ids',
    name: 'Fix Reference Note IDs',
    category: 'Identifiers & Tags',
    icon: Link2,
    description: 'Repairs citations and cross-references pointing to target Note IDs across the document.',
    outputSuffix: '_fixed_ref_notes.pdf',
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
    category: 'Accessibility & Index',
    icon: BookOpenCheck,
    description: 'Remediates auto-tagged index pages, binding table of content items correctly.',
    outputSuffix: '_fixed_index.pdf',
  },
  {
    id: 'tag_index_phrases',
    name: 'Tag Index Phrases (Robust)',
    category: 'Accessibility & Index',
    icon: FileType,
    description: 'Tags index pages keeping multi-word phrases unified with separate locator links.',
    outputSuffix: '_indexed_phrases.pdf',
  },
  {
    id: 'apply_link_view_settings',
    name: 'Link View & Zoom Settings',
    category: 'Navigation & Zoom',
    icon: ZoomIn,
    description: 'Enforces uniform PDF destination zoom modes (Fit, FitH, InheritZoom, etc.).',
    outputSuffix: '_fixed_view_settings.pdf',
  },
  {
    id: 'fix_links',
    name: 'Repair Broken Links',
    category: 'Navigation & Zoom',
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
  {
    id: 'remove_page_ids',
    name: 'Strip Page ID Tags',
    category: 'Structure Cleanup',
    icon: Eraser,
    description: 'Strips page ID attributes (/ID) from structure tree elements to prevent validation conflicts.',
    outputSuffix: '_fixed_page_ids.pdf',
  },
  {
    id: 'id_remover_strip',
    name: 'Audit & Strip Structure /IDs',
    category: 'Structure Cleanup',
    icon: ShieldAlert,
    description: 'Discovers and selectively strips auto-generated /ID attributes and clusters from structure tree.',
    outputSuffix: '_stripped_ids.pdf',
  },
  {
    id: 'auto_tagger',
    name: 'Auto-Tag PDF (PDF/UA Engine)',
    category: 'Advanced AI & Tags',
    icon: Wand2,
    description: 'Converts untagged PDF into fully accessible PDF/UA-compliant tagged document with heading & table detection.',
    outputSuffix: '_auto_tagged.pdf',
  },
  {
    id: 'structure_analyzer',
    name: 'Document Structure Analyzer',
    category: 'Advanced AI & Tags',
    icon: Layout,
    description: 'Inspects heading hierarchy, multi-column flows, and visual blocks for reading order mapping.',
    outputSuffix: '_structure_report.json',
  },
];

const CATEGORIES = [
  'All',
  'Identifiers & Tags',
  'Accessibility & Index',
  'Navigation & Zoom',
  'Structure Cleanup',
  'Advanced Links',
  'Advanced AI & Tags',
  'Inspection & Logs',
];

export const RemediationTools: React.FC = () => {
  const { files, activeFile, setActiveFile, refreshTasks, setActiveTab, addToast, selectedToolId, setSelectedToolId, setSelectedFileForInspector } = useApp();

  const [mode, setMode] = useState<'single' | 'multi'>('single');
  const [activeToolId, setActiveToolId] = useState<string>(selectedToolId || 'fix_note_ids');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedMultiToolIds, setSelectedMultiToolIds] = useState<string[]>(['fix_note_ids', 'fix_links']);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [inspectingIds, setInspectingIds] = useState<boolean>(false);

  // Form States
  const [outputName, setOutputName] = useState<string>('');
  const [indexPages, setIndexPages] = useState<string>('6, 7, 8');
  const [phraseIndexPages, setPhraseIndexPages] = useState<string>('');
  const [viewPreset, setViewPreset] = useState<LinkViewSetting>('InheritZoom');
  const [customView, setCustomView] = useState<string>('');
  const [notesPages, setNotesPages] = useState<string>('');
  const [chapterNotes, setChapterNotes] = useState<boolean>(false);
  const [bookNotes, setBookNotes] = useState<boolean>(false);
  const [notePattern, setNotePattern] = useState<string>('');
  const [dryRun, setDryRun] = useState<boolean>(false);
  const [verbose, setVerbose] = useState<boolean>(true);

  // ID Remover States
  const [idStripPattern, setIdStripPattern] = useState<string>('^[A-Za-z0-9]+-[A-Za-z0-9.-]+$');
  const [idStripTagFilter, setIdStripTagFilter] = useState<string>('Link,P');
  const [idStripClusters, setIdStripClusters] = useState<string>('');
  const [idStripAuto, setIdStripAuto] = useState<boolean>(false);
  const [idStripPrune, setIdStripPrune] = useState<boolean>(false);
  const [idStripDryRun, setIdStripDryRun] = useState<boolean>(false);

  // Auto-Tagger States
  const [autoTaggerVerbose, setAutoTaggerVerbose] = useState<boolean>(true);

  const selectedSingleTool = TOOLS.find((t) => t.id === activeToolId) || TOOLS[0];

  useEffect(() => {
    if (selectedToolId && selectedToolId !== activeToolId) {
      setActiveToolId(selectedToolId);
    }
  }, [selectedToolId, activeToolId]);

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
      case 'fix_reference_note_ids':
        return apiService.processReferenceNoteIds({ file_id: fileId, output_name: finalOutput });
      case 'tag_viewer':
        return apiService.processTagViewer({ file_id: fileId });
      case 'fix_index_tag': {
        const pagesList = indexPages
          .split(',')
          .map((p) => parseInt(p.trim(), 10))
          .filter((p) => !isNaN(p) && p > 0);
        return apiService.processIndexTags({ file_id: fileId, pages: pagesList.length > 0 ? pagesList : undefined, output_name: finalOutput });
      }
      case 'tag_index_phrases': {
        const pagesList = phraseIndexPages
          .split(',')
          .map((p) => parseInt(p.trim(), 10))
          .filter((p) => !isNaN(p) && p > 0);
        return apiService.processTagIndexPhrases({ file_id: fileId, pages: pagesList.length > 0 ? pagesList : undefined, output_name: finalOutput });
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
      case 'remove_page_ids':
        return apiService.processRemovePageIds({ file_id: fileId, output_name: finalOutput });
      case 'id_remover_strip':
        return apiService.processIdRemoverStrip({
          file_id: fileId,
          output_name: finalOutput,
          pattern: idStripPattern.trim() || undefined,
          tag_filter: idStripTagFilter.trim() || undefined,
          clusters: idStripClusters.trim() || undefined,
          auto: idStripAuto,
          prune_empty_nodes: idStripPrune,
          dry_run: idStripDryRun,
        });
      case 'auto_tagger':
        return apiService.processAutoTagger({
          file_id: fileId,
          output_name: finalOutput,
          verbose: autoTaggerVerbose,
        });
      case 'structure_analyzer':
        return apiService.processStructureAnalysis(fileId);
      default:
        throw new Error(`Unknown tool ID ${toolId}`);
    }
  };

  const handleRunIdInspect = async () => {
    if (!activeFile) return;
    setInspectingIds(true);
    try {
      const res = await apiService.processIdRemoverInspect({ file_id: activeFile.id });
      addToast('info', 'ID Audit Discovery Queued', `Task ID: ${res.task_id.slice(0, 8)}... started.`);
      await refreshTasks();
      setActiveTab('tasks');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to start ID inspection';
      addToast('error', 'Audit Failed', msg);
    } finally {
      setInspectingIds(false);
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

  const filteredTools = TOOLS.filter((t) => {
    if (selectedCategory === 'All') return true;
    return t.category === selectedCategory;
  });

  return (
    <div className="space-y-5">
      {/* Mode & Target File Selector Bar */}
      <div className="p-4 rounded-xl bg-white border border-slate-200/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-slate-100 text-slate-700">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
              Active PDF for Remediation
            </h3>
            {activeFile ? (
              <p className="text-sm font-bold text-slate-900 truncate max-w-xs sm:max-w-md">{activeFile.filename}</p>
            ) : (
              <p className="text-xs font-semibold text-rose-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> Please select a PDF file first
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Single vs Multi-Tool Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setMode('single')}
              className={`px-3 py-1 font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                mode === 'single'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Single Tool
            </button>
            <button
              type="button"
              onClick={() => setMode('multi')}
              className={`px-3 py-1 font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                mode === 'multi'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Multi-Tool Batch</span>
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
            className="px-3 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 shadow-2xs"
          >
            {files.map((f) => (
              <option key={f.id} value={f.id}>
                {f.filename} ({f.file_type})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <div className="flex items-center gap-1 text-slate-400 font-semibold px-1 shrink-0">
          <Filter className="w-3.5 h-3.5 text-slate-400" /> Filter:
        </div>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors ${
              selectedCategory === cat
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200'
            }`}
          >
            {cat} {cat === 'All' ? `(${TOOLS.length})` : ''}
          </button>
        ))}
      </div>

      {/* Multi-Tool Batch Mode Banner */}
      {mode === 'multi' && (
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4 text-slate-800 text-xs">
          <div className="flex items-center gap-3">
            <Sparkles className="w-4 h-4 text-orange-600 shrink-0" />
            <div>
              <h4 className="font-bold text-slate-900">
                Multi-Tool Batch Orchestration
              </h4>
              <p className="text-slate-500 mt-0.5">
                Check multiple remediation engines below to execute them concurrently in parallel Celery workers.
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 font-semibold text-xs rounded-lg bg-slate-900 text-white shadow-xs shrink-0">
            {selectedMultiToolIds.length} Selected
          </span>
        </div>
      )}

      {/* Tools Grid Selection Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
        {filteredTools.map((tool) => {
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
              className={`p-4 rounded-xl text-left border transition-all duration-150 relative cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-white border-2 border-orange-500 ring-2 ring-orange-500/10 shadow-xs'
                  : 'bg-white hover:border-slate-300 border-slate-200/80 shadow-2xs'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <div
                    className={`p-2 rounded-lg transition-colors ${
                      isSelected ? 'bg-orange-50 text-orange-600 border border-orange-200' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="flex items-center gap-2">
                    {mode === 'multi' && (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleMultiTool(tool.id)}
                        className="w-3.5 h-3.5 rounded text-orange-600 focus:ring-orange-500 cursor-pointer accent-orange-600"
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                      {tool.category.split(' ')[0]}
                    </span>
                  </div>
                </div>
                <h4 className="text-xs font-bold text-slate-900">{tool.name}</h4>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">{tool.description}</p>
              </div>

              {isSelected && (
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center gap-1 text-[11px] font-semibold text-orange-600">
                  <CheckCircle2 className="w-3 h-3 text-orange-600" />
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
          className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/80 space-y-5 shadow-2xs"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-slate-900 text-white shadow-xs">
                {mode === 'single' ? (
                  <selectedSingleTool.icon className="w-5 h-5" />
                ) : (
                  <Layers className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  {mode === 'single'
                    ? selectedSingleTool.name
                    : `Batch Execution Suite (${selectedMultiToolIds.length} Tools Selected)`}
                </h3>
                <p className="text-xs text-slate-500">
                  {mode === 'single'
                    ? selectedSingleTool.description
                    : 'Configure parameters for selected remediation engines and execute concurrently.'}
                </p>
              </div>
            </div>
          </div>

          {/* Single Mode Output Name */}
          {mode === 'single' && selectedSingleTool.id !== 'tag_viewer' && selectedSingleTool.id !== 'structure_analyzer' && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Output PDF Filename</label>
              <input
                type="text"
                value={effectiveOutputName}
                onChange={(e) => setOutputName(e.target.value)}
                placeholder="e.g. remediated_document.pdf"
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 font-mono font-medium"
                required
              />
            </div>
          )}

          {/* Config Section: Fix Index Tag */}
          {(mode === 'single' ? activeToolId === 'fix_index_tag' : selectedMultiToolIds.includes('fix_index_tag')) && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <BookOpenCheck className="w-4 h-4 text-slate-700" />
                Fix Index Pages Tagging Settings
                <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
              </label>
              <input
                type="text"
                value={indexPages}
                onChange={(e) => setIndexPages(e.target.value)}
                placeholder="e.g. 6, 7, 8 (or leave empty for all pages)"
                className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-orange-500 font-mono font-medium"
              />
              <p className="text-[11px] text-slate-500">
                1-indexed comma-separated list of page numbers to fix index links (e.g. 6, 7, 8).
              </p>
            </div>
          )}

          {/* Config Section: Tag Index Phrases */}
          {(mode === 'single' ? activeToolId === 'tag_index_phrases' : selectedMultiToolIds.includes('tag_index_phrases')) && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <FileType className="w-4 h-4 text-slate-700" />
                Tag Index Phrases (Multi-Column Mode)
              </label>
              <input
                type="text"
                value={phraseIndexPages}
                onChange={(e) => setPhraseIndexPages(e.target.value)}
                placeholder="e.g. 215, 216, 217 (or leave blank to process all pages)"
                className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-orange-500 font-mono font-medium"
              />
              <p className="text-[11px] text-slate-500">
                Keeps phrases unified in a single tag while creating distinct link tags for page numbers.
              </p>
            </div>
          )}

          {/* Config Section: Link View Settings */}
          {(mode === 'single' ? activeToolId === 'apply_link_view_settings' : selectedMultiToolIds.includes('apply_link_view_settings')) && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <ZoomIn className="w-4 h-4 text-slate-700" />
                Link View & Zoom Settings
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">View Preset</label>
                  <select
                    value={viewPreset}
                    onChange={(e) => setViewPreset(e.target.value as LinkViewSetting)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-orange-500 font-medium"
                  >
                    <option value="Fit">Fit (Fit page to window)</option>
                    <option value="FitH">FitH (Fit width to window)</option>
                    <option value="InheritZoom">InheritZoom (Keep user current zoom level)</option>
                    <option value="InheritScrollAndZoom">InheritScrollAndZoom (Preserve scroll & zoom)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Custom PDF View Command (Optional)
                  </label>
                  <input
                    type="text"
                    value={customView}
                    onChange={(e) => setCustomView(e.target.value)}
                    placeholder="e.g. /XYZ null null null"
                    className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-orange-500 font-mono font-medium"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Config Section: Bidirectional Notes Linker */}
          {(mode === 'single' ? activeToolId === 'bidirectional_notes_linker' : selectedMultiToolIds.includes('bidirectional_notes_linker')) && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <GitCompare className="w-4 h-4 text-slate-700" />
                Bidirectional Notes Linker Settings
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Notes Page Range (Optional)
                  </label>
                  <input
                    type="text"
                    value={notesPages}
                    onChange={(e) => setNotesPages(e.target.value)}
                    placeholder="e.g. 280-310"
                    className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-orange-500 font-mono font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Note Anchor Regex Pattern (Optional)
                  </label>
                  <input
                    type="text"
                    value={notePattern}
                    onChange={(e) => setNotePattern(e.target.value)}
                    placeholder="e.g. \[(\d+)\]"
                    className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-orange-500 font-mono font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 pt-1">
                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={chapterNotes}
                    onChange={(e) => setChapterNotes(e.target.checked)}
                    className="rounded text-orange-600 focus:ring-orange-500 accent-orange-600"
                  />
                  Chapter Notes Mode
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bookNotes}
                    onChange={(e) => setBookNotes(e.target.checked)}
                    className="rounded text-orange-600 focus:ring-orange-500 accent-orange-600"
                  />
                  Book Notes Mode
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dryRun}
                    onChange={(e) => setDryRun(e.target.checked)}
                    className="rounded text-orange-600 focus:ring-orange-500 accent-orange-600"
                  />
                  Dry Run (Report Only)
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={verbose}
                    onChange={(e) => setVerbose(e.target.checked)}
                    className="rounded text-orange-600 focus:ring-orange-500 accent-orange-600"
                  />
                  Verbose Task Logs
                </label>
              </div>
            </div>
          )}

          {/* Config Section: Audit & Strip Structure /IDs */}
          {(mode === 'single' ? activeToolId === 'id_remover_strip' : selectedMultiToolIds.includes('id_remover_strip')) && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-2.5">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-slate-700" />
                  Structure /ID Stripping & Audit Options
                </h4>
                <button
                  type="button"
                  onClick={handleRunIdInspect}
                  disabled={inspectingIds}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors flex items-center gap-1.5 disabled:opacity-50 shadow-2xs"
                  title="Scan PDF and inventory all /ID shapes into a structured JSON report"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>{inspectingIds ? 'Auditing /IDs...' : 'Run Audit Discovery'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Matching Regex Pattern</label>
                  <input
                    type="text"
                    value={idStripPattern}
                    onChange={(e) => setIdStripPattern(e.target.value)}
                    placeholder="e.g. ^[A-Za-z0-9]+-[A-Za-z0-9.-]+$"
                    className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-orange-500 font-mono font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Tag Type Filter</label>
                  <input
                    type="text"
                    value={idStripTagFilter}
                    onChange={(e) => setIdStripTagFilter(e.target.value)}
                    placeholder="e.g. Link,P"
                    className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-orange-500 font-mono font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Cluster Indices (Optional)</label>
                  <input
                    type="text"
                    value={idStripClusters}
                    onChange={(e) => setIdStripClusters(e.target.value)}
                    placeholder="e.g. 1,2"
                    className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-orange-500 font-mono font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={idStripAuto}
                    onChange={(e) => setIdStripAuto(e.target.checked)}
                    className="rounded text-orange-600 focus:ring-orange-500 accent-orange-600"
                  />
                  Auto-Clean Mode (Producer Noise)
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={idStripPrune}
                    onChange={(e) => setIdStripPrune(e.target.checked)}
                    className="rounded text-orange-600 focus:ring-orange-500 accent-orange-600"
                  />
                  Prune Empty /IDTree Nodes
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={idStripDryRun}
                    onChange={(e) => setIdStripDryRun(e.target.checked)}
                    className="rounded text-orange-600 focus:ring-orange-500 accent-orange-600"
                  />
                  Dry Run (Audit Report Only)
                </label>
              </div>
            </div>
          )}

          {/* Config Section: Auto-Tagger */}
          {(mode === 'single' ? activeToolId === 'auto_tagger' : selectedMultiToolIds.includes('auto_tagger')) && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Wand2 className="w-4 h-4 text-slate-700" />
                Auto-Tagging (PDF/UA Standard Engine) Settings
              </h4>
              <p className="text-xs text-slate-500">
                Analyzes document heading hierarchy, paragraphs, table cells, lists, and marked content sequences for accessibility compliance.
              </p>
              <label className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-800 cursor-pointer w-fit">
                <input
                  type="checkbox"
                  checked={autoTaggerVerbose}
                  onChange={(e) => setAutoTaggerVerbose(e.target.checked)}
                  className="rounded text-orange-600 focus:ring-orange-500 accent-orange-600"
                />
                Enable Diagnostics Logs
              </label>
            </div>
          )}

          {/* Config Section: Structure Analyzer */}
          {mode === 'single' && activeToolId === 'structure_analyzer' && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Layout className="w-4 h-4 text-slate-700" />
                Document Structure & Reading Flow Analyzer
              </h4>
              <p className="text-xs text-slate-500">
                Extracts heading hierarchies, multi-column flows, and visual blocks. View interactive drag-and-drop mapping in the PDF Inspector modal.
              </p>
              <button
                type="button"
                onClick={() => setSelectedFileForInspector(activeFile)}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors flex items-center gap-1.5 w-fit shadow-2xs"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Open Visual Reading Order Mapper</span>
              </button>
            </div>
          )}

          {/* Action Button */}
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 text-xs font-semibold rounded-xl bg-orange-600 hover:bg-orange-700 text-white shadow-xs transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>
                {submitting
                  ? 'Enqueueing Background Tasks...'
                  : mode === 'single'
                  ? `Execute ${selectedSingleTool.name}`
                  : `Execute Selected (${selectedMultiToolIds.length}) Engines`}
              </span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};


