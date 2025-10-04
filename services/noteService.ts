import { db } from './db';
import { v4 as uuidv4 } from 'uuid';
import type { Note } from '../types';
import { useLiveQuery } from 'dexie-react-hooks';
import { attachmentService } from './attachmentService';
import type { Filter } from '../components/Sidebar';

export const noteService = {
  getNotes: (filter: Filter) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useLiveQuery(async () => {
      const query = db.notes;
      
      switch(filter.type) {
        case 'starred':
            return query.where({ isStarred: 1 }).reverse().sortBy('updatedAt');
        case 'tag':
            if (!filter.id) return [];
            const noteIdsWithTag = (await db.noteTags.where('tagId').equals(filter.id).toArray()).map(nt => nt.noteId);
            return query.where('id').anyOf(noteIdsWithTag).reverse().sortBy('updatedAt');
        case 'folder':
            if (!filter.id) return [];
            return query.where('folderId').equals(filter.id).reverse().sortBy('updatedAt');
        case 'all':
        default:
            return query.reverse().sortBy('updatedAt');
      }
    }, [filter]);
  },

  getNote: (id: string | null) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useLiveQuery(() => id ? db.notes.get(id) : undefined, [id]);
  },

  createNote: async (folderId: string | null): Promise<string> => {
    const newNote: Note = {
      id: uuidv4(),
      title: 'Untitled Note',
      content_md: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isPinned: false,
      isStarred: false,
      folderId: folderId,
    };
    await db.notes.add(newNote);
    return newNote.id;
  },

  updateNote: async (id: string, updates: Partial<Omit<Note, 'id' | 'createdAt'>>): Promise<void> => {
    await db.notes.update(id, { ...updates, updatedAt: Date.now() });
  },

  deleteNote: async (id: string): Promise<void> => {
    await db.transaction('rw', db.notes, db.noteTags, db.attachments, async () => {
        await attachmentService.deleteAttachmentsForNote(id);
        await db.noteTags.where('noteId').equals(id).delete();
        await db.notes.delete(id);
    });
  },
};