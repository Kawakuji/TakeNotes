import { db } from './db';
import { v4 as uuidv4 } from 'uuid';
import type { Folder } from '../types';
import { useLiveQuery } from 'dexie-react-hooks';

export const folderService = {
  getAllFolders: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useLiveQuery(() => db.folders.toArray(), []);
  },

  createFolder: async (name: string, parentId: string | null = null): Promise<string> => {
    const newFolder: Folder = {
      id: uuidv4(),
      name,
      parentId,
    };
    await db.folders.add(newFolder);
    return newFolder.id;
  },

  deleteFolder: async (id: string): Promise<void> => {
    // Also delete notes and their tags within this folder in a transaction
    await db.transaction('rw', db.folders, db.notes, db.noteTags, async () => {
      const notesInFolder = await db.notes.where('folderId').equals(id).toArray();
      const noteIds = notesInFolder.map(n => n.id);
      
      // Delete tag relationships for these notes
      await db.noteTags.where('noteId').anyOf(noteIds).delete();

      // Delete the notes
      await db.notes.where('folderId').equals(id).delete();

      // Delete the folder
      await db.folders.delete(id);
    });
  },
};