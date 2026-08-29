import type { TaskName } from '../types/pdf';

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  } catch {
    return dateString;
  }
};

export const getTaskLabel = (taskName: TaskName | string): string => {
  switch (taskName) {
    case 'fix_note_ids':
    case 'run_fix_note_ids':
      return 'Fix Note IDs';
    case 'fix_reference_note_ids':
    case 'run_fix_reference_note_ids':
      return 'Fix Reference Note IDs';
    case 'tag_viewer':
    case 'run_tag_viewer':
      return 'Scan Structure / Merged Links';
    case 'fix_index_tag':
    case 'run_fix_index_tag':
      return 'Fix Index Pages Tagging';
    case 'tag_index_phrases':
    case 'run_tag_index_phrases':
      return 'Tag Index Phrases (Robust)';
    case 'apply_link_view_settings':
    case 'run_apply_link_view_settings':
      return 'Link View & Zoom Settings';
    case 'fix_links':
    case 'run_fix_links':
      return 'Repair Broken Links';
    case 'bidirectional_notes_linker':
    case 'run_bidirectional_notes_linker':
      return 'Bidirectional Notes Linker';
    case 'remove_page_ids':
    case 'run_remove_page_ids':
      return 'Strip Page ID Tags';
    case 'id_remover_inspect':
    case 'run_id_remover_inspect':
      return 'Audit /ID Structural Shapes';
    case 'id_remover_strip':
    case 'run_id_remover_strip':
      return 'Strip Structure /IDs';
    case 'auto_tagger':
    case 'run_auto_tagger':
    case 'backend.tasks.run_auto_tagger':
      return 'Auto-Tag PDF (PDF/UA Engine)';
    case 'document_structure_analyzer':
    case 'run_document_structure_analyzer':
      return 'Document Structure Analysis';
    case 'reorder_reading_order':
    case 'run_reorder_reading_order':
      return 'Apply Reordered Reading Order';
    default:
      return taskName;
  }
};

export const getTaskDescription = (taskName: TaskName | string): string => {
  switch (taskName) {
    case 'fix_note_ids':
    case 'run_fix_note_ids':
      return 'Ensures note anchor tags have unique and valid PDF element IDs.';
    case 'fix_reference_note_ids':
    case 'run_fix_reference_note_ids':
      return 'Repairs cross-references and citations pointing to target Note IDs across the document.';
    case 'tag_viewer':
    case 'run_tag_viewer':
      return 'Inspects PDF structure tree for merged or orphaned Link tags.';
    case 'fix_index_tag':
    case 'run_fix_index_tag':
      return 'Repairs index pages tagging structure for screen readers & compliance.';
    case 'tag_index_phrases':
    case 'run_tag_index_phrases':
      return 'Tags multi-column index pages keeping multi-word phrases unified with separate locator links.';
    case 'apply_link_view_settings':
    case 'run_apply_link_view_settings':
      return 'Standardizes PDF link zoom & view behaviors across all document references.';
    case 'fix_links':
    case 'run_fix_links':
      return 'Detects and fixes internal navigation links pointing to invalid destinations.';
    case 'bidirectional_notes_linker':
    case 'run_bidirectional_notes_linker':
      return 'Creates two-way hyperlinking between endnotes/footnotes and text citations.';
    case 'remove_page_ids':
    case 'run_remove_page_ids':
      return 'Strips page ID attributes (/ID) from structure tree elements.';
    case 'id_remover_inspect':
    case 'run_id_remover_inspect':
      return 'Audits and inventories /ID shapes across PDF structure tree.';
    case 'id_remover_strip':
    case 'run_id_remover_strip':
      return 'Selectively strips auto-generated /ID attributes and clusters from structure tree.';
    case 'auto_tagger':
    case 'run_auto_tagger':
    case 'backend.tasks.run_auto_tagger':
      return 'Converts untagged PDF into fully accessible PDF/UA compliant tagged document.';
    case 'document_structure_analyzer':
    case 'run_document_structure_analyzer':
      return 'Analyzes heading hierarchy, column layout, tables, and visual element reading flow.';
    case 'reorder_reading_order':
    case 'run_reorder_reading_order':
      return 'Applies custom logical reading order mapping to PDF structure tree.';
    default:
      return 'PDF remediation task.';
  }
};
