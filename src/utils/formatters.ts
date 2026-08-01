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
      return 'Fix Note IDs';
    case 'tag_viewer':
      return 'Scan Structure / Tags';
    case 'fix_index_tag':
      return 'Fix Index Pages Tagging';
    case 'apply_link_view_settings':
      return 'Link View & Zoom Settings';
    case 'fix_links':
      return 'Repair Broken Links';
    case 'bidirectional_notes_linker':
      return 'Bidirectional Notes Linker';
    default:
      return taskName;
  }
};

export const getTaskDescription = (taskName: TaskName | string): string => {
  switch (taskName) {
    case 'fix_note_ids':
      return 'Ensures note anchor tags have unique and valid PDF element IDs.';
    case 'tag_viewer':
      return 'Inspects PDF structure tree for merged or orphaned Link tags.';
    case 'fix_index_tag':
      return 'Repairs index pages tagging structure for screen readers & compliance.';
    case 'apply_link_view_settings':
      return 'Standardizes PDF link zoom & view behaviors across all document references.';
    case 'fix_links':
      return 'Detects and fixes internal navigation links pointing to invalid destinations.';
    case 'bidirectional_notes_linker':
      return 'Creates two-way hyperlinking between endnotes/footnotes and text citations.';
    default:
      return 'PDF remediation task.';
  }
};
