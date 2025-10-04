
import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { noteService } from '../services/noteService';
import { tagService } from '../services/tagService';
import { attachmentService } from '../services/attachmentService';
import type { Tag, Attachment } from '../types';
import { useDebounce } from '../hooks/useDebounce';
import { useSettings } from '../contexts/SettingsContext';
import { StarIcon, TagIcon, XCircleIcon, PaperClipIcon, ArrowDownTrayIcon, TrashIcon, ArrowLeftIcon, BoldIcon, ItalicIcon, H1Icon, ListBulletIcon, CodeBracketIcon } from './icons';

interface EditorProps {
  activeNoteId: string | null;
  onDelete: (id: string) => void;
  onClose: () => void;
}

const TagPill: React.FC<{ tag: Tag; onRemove: (tagId: string) => void }> = ({ tag, onRemove }) => (
    <div className="flex items-center bg-bunker-200 dark:bg-bunker-700 rounded-full px-2 py-1 text-xs">
        <TagIcon className="w-3 h-3 mr-1" />
        <span>{tag.name}</span>
        <button onClick={() => onRemove(tag.id)} className="ml-1 text-bunker-500 hover:text-red-500">
            <XCircleIcon className="w-4 h-4" />
        </button>
    </div>
)

const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

const AttachmentItem: React.FC<{ attachment: Attachment; onRemove: (id: string) => void }> = ({ attachment, onRemove }) => {
    const handleDownload = () => {
        const url = URL.createObjectURL(attachment.data);
        const a = document.createElement('a');
        a.href = url;
        a.download = attachment.fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="flex items-center justify-between bg-bunker-100 dark:bg-bunker-800 p-2 rounded-md">
            <div className="flex items-center space-x-2 overflow-hidden">
                <PaperClipIcon className="w-4 h-4 text-bunker-500 shrink-0" />
                <span className="truncate text-sm">{attachment.fileName}</span>
                <span className="text-xs text-bunker-500 dark:text-bunker-400 shrink-0">{formatBytes(attachment.sizeBytes)}</span>
            </div>
            <div className="flex items-center space-x-2 shrink-0">
                <button onClick={handleDownload} className="p-1 text-bunker-500 hover:text-blue-500"><ArrowDownTrayIcon className="w-4 h-4" /></button>
                <button onClick={() => onRemove(attachment.id)} className="p-1 text-bunker-500 hover:text-red-500"><TrashIcon className="w-4 h-4" /></button>
            </div>
        </div>
    )
}


const MarkdownToolbar: React.FC<{ textareaRef: React.RefObject<HTMLTextAreaElement> }> = ({ textareaRef }) => {
    const applyStyle = (style: 'bold' | 'italic' | 'h1' | 'list' | 'code') => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = textarea.value.substring(start, end);
        let newText;

        switch (style) {
            case 'bold':
                newText = `**${selectedText}**`;
                break;
            case 'italic':
                newText = `*${selectedText}*`;
                break;
            case 'h1':
                newText = `# ${selectedText}`;
                break;
            case 'list':
                const lines = selectedText.split('\n');
                newText = lines.map(line => `- ${line}`).join('\n');
                break;
            case 'code':
                newText = `\`\`\`\n${selectedText}\n\`\`\``;
                break;
            default:
                newText = selectedText;
        }

        const updatedValue = textarea.value.substring(0, start) + newText + textarea.value.substring(end);
        textarea.value = updatedValue;

        // Manually trigger the change event to update React state
        const event = new Event('input', { bubbles: true });
        textarea.dispatchEvent(event);

        // Adjust cursor position
        textarea.focus();
        textarea.selectionStart = start + newText.length - selectedText.length;
        textarea.selectionEnd = start + newText.length - selectedText.length;
    };

    return (
        <div className="flex items-center space-x-2 px-4 py-2 border-b border-bunker-200 dark:border-bunker-800">
            <button onClick={() => applyStyle('bold')} className="p-2 rounded hover:bg-bunker-200 dark:hover:bg-bunker-700"><BoldIcon className="w-5 h-5" /></button>
            <button onClick={() => applyStyle('italic')} className="p-2 rounded hover:bg-bunker-200 dark:hover:bg-bunker-700"><ItalicIcon className="w-5 h-5" /></button>
            <button onClick={() => applyStyle('h1')} className="p-2 rounded hover:bg-bunker-200 dark:hover:bg-bunker-700"><H1Icon className="w-5 h-5" /></button>
            <button onClick={() => applyStyle('list')} className="p-2 rounded hover:bg-bunker-200 dark:hover:bg-bunker-700"><ListBulletIcon className="w-5 h-5" /></button>
            <button onClick={() => applyStyle('code')} className="p-2 rounded hover:bg-bunker-200 dark:hover:bg-bunker-700"><CodeBracketIcon className="w-5 h-5" /></button>
        </div>
    );
};

export const Editor: React.FC<EditorProps> = ({ activeNoteId, onDelete, onClose }) => {
  const note = noteService.getNote(activeNoteId);
  const tags = tagService.getTagsForNote(activeNoteId);
  const attachments = attachmentService.getAttachmentsForNote(activeNoteId);
  const { settings } = useSettings();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isStarred, setIsStarred] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [newTag, setNewTag] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const debouncedTitle = useDebounce(title, 800);
  const debouncedContent = useDebounce(content, 800);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content_md);
      setIsStarred(note.isStarred);
    } else {
      setTitle('');
      setContent('');
      setIsStarred(false);
    }
  }, [note]);

  const saveNote = useCallback(async () => {
    if (activeNoteId) {
      await noteService.updateNote(activeNoteId, {
        title: debouncedTitle,
        content_md: debouncedContent,
      });
    }
  }, [activeNoteId, debouncedTitle, debouncedContent]);

  useEffect(() => {
    if (activeNoteId && note && (debouncedTitle !== note.title || debouncedContent !== note.content_md)) {
      saveNote();
    }
  }, [debouncedTitle, debouncedContent, saveNote, activeNoteId, note]);
  
  const handleToggleStar = async () => {
    if (activeNoteId) {
        const newStarredState = !isStarred;
        setIsStarred(newStarredState);
        await noteService.updateNote(activeNoteId, { isStarred: newStarredState });
    }
  }
  
  const handleDelete = () => {
      if(activeNoteId && window.confirm("Are you sure you want to delete this note?")) {
          onDelete(activeNoteId);
      }
  }

  const handleAddTag = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newTag.trim() && activeNoteId) {
        e.preventDefault();
        await tagService.addTagToNote(activeNoteId, newTag.trim().toLowerCase());
        setNewTag('');
    }
  }

  const handleRemoveTag = async (tagId: string) => {
      if (activeNoteId) {
          await tagService.removeTagFromNote(activeNoteId, tagId);
      }
  }
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && activeNoteId) {
          for (const file of Array.from(e.target.files)) {
              await attachmentService.addAttachment(activeNoteId, file);
          }
          e.target.value = '';
      }
  }
  
  const handleRemoveAttachment = async (attachmentId: string) => {
      if (window.confirm("Are you sure you want to remove this attachment?")) {
          await attachmentService.removeAttachment(attachmentId);
      }
  }

  const editorStyleClasses = {
      fontSize: {
          small: 'text-sm',
          medium: 'text-base',
          large: 'text-lg',
      },
      lineHeight: {
          compact: 'leading-tight',
          default: 'leading-relaxed',
          relaxed: 'leading-loose',
      }
  };

  const editorWidthClass = {
      standard: 'max-w-3xl mx-auto',
      wide: 'max-w-5xl mx-auto',
      full: 'w-full'
  }[settings.editorWidth];


  if (!activeNoteId && window.innerWidth < 768) {
    return null;
  }
  
  if (!activeNoteId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-bunker-950 text-bunker-500 dark:text-bunker-400">
        <p>Select a note to start editing or create a new one.</p>
      </div>
    );
  }

  return (
    <main className="flex-1 flex flex-col h-full bg-white dark:bg-bunker-950 text-bunker-800 dark:text-bunker-100">
      <div className="flex items-center justify-between p-4 border-b border-bunker-200 dark:border-bunker-800">
        <div className="flex items-center space-x-2">
           <button onClick={onClose} className="p-1 text-bunker-500 hover:text-bunker-100 rounded-md md:hidden">
              <ArrowLeftIcon className="w-5 h-5" />
           </button>
          <button onClick={handleToggleStar} className="p-1 text-bunker-500 hover:text-yellow-500">
              <StarIcon solid={isStarred} className={`w-5 h-5 ${isStarred ? 'text-yellow-400' : ''}`} />
          </button>
          <button onClick={() => setShowPreview(!showPreview)} className={`px-3 py-1 rounded-md text-sm ${showPreview ? 'bg-blue-500 text-white' : 'bg-bunker-200 dark:bg-bunker-700'}`}>
            {showPreview ? 'Edit' : 'Preview'}
          </button>
        </div>
        <button onClick={handleDelete} className="px-3 py-1 bg-red-500 text-white rounded-md text-sm hover:bg-red-600">Delete</button>
      </div>
      <div className="flex-1 flex flex-col overflow-y-hidden">
        <div className={`${editorWidthClass} w-full flex flex-col flex-1 overflow-y-hidden`}>
            <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note Title"
            className="p-4 text-2xl font-bold bg-transparent focus:outline-none shrink-0"
            />
            <div className="px-4 pb-2 flex items-center flex-wrap gap-2 shrink-0">
                {tags?.map(tag => <TagPill key={tag.id} tag={tag} onRemove={handleRemoveTag} />)}
                <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={handleAddTag}
                    placeholder="Add a tag..."
                    className="bg-transparent focus:outline-none text-sm p-1"
                />
            </div>

            {!showPreview && <MarkdownToolbar textareaRef={textareaRef} />}

            <div className="flex-1 p-4 pt-2 overflow-y-auto">
            {showPreview ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]} className={`prose dark:prose-invert max-w-none ${editorStyleClasses.fontSize[settings.fontSize]} ${editorStyleClasses.lineHeight[settings.lineHeight]}`}>
                {content}
                </ReactMarkdown>
            ) : (
                <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Start writing..."
                className={`w-full h-full bg-transparent resize-none focus:outline-none leading-relaxed ${editorStyleClasses.fontSize[settings.fontSize]} ${editorStyleClasses.lineHeight[settings.lineHeight]}`}
                />
            )}
            </div>
        </div>
        <div className="p-4 border-t border-bunker-200 dark:border-bunker-800 shrink-0">
            <div className={`${editorWidthClass} w-full`}>
                <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold">Attachments</h3>
                    <button onClick={() => fileInputRef.current?.click()} className="text-sm px-3 py-1 bg-bunker-200 dark:bg-bunker-700 rounded-md hover:bg-bunker-300 dark:hover:bg-bunker-600">Add Attachment</button>
                    <input type="file" multiple ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                    {attachments && attachments.length > 0 ? (
                        attachments.map(att => <AttachmentItem key={att.id} attachment={att} onRemove={handleRemoveAttachment} />)
                    ) : (
                        <p className="text-sm text-bunker-500 dark:text-bunker-400 text-center py-2">No attachments.</p>
                    )}
                </div>
            </div>
        </div>
      </div>
    </main>
  );
};