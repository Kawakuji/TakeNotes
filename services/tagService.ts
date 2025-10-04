import { db } from './db';
import { v4 as uuidv4 } from 'uuid';
import { useLiveQuery } from 'dexie-react-hooks';
import type { Tag } from '../types';

export const tagService = {
  getAllTags: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useLiveQuery(() => db.tags.toArray());
  },

  getTagsForNote: (noteId: string | null) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useLiveQuery(async () => {
      if (!noteId) return [];
      const noteTags = await db.noteTags.where('noteId').equals(noteId).toArray();
      const tagIds = noteTags.map(nt => nt.tagId);
      return db.tags.where('id').anyOf(tagIds).toArray();
    }, [noteId]);
  },

  addTagToNote: async (noteId: string, tagName: string): Promise<void> => {
    await db.transaction('rw', db.tags, db.noteTags, async () => {
      let tag = await db.tags.where('name').equals(tagName).first();
      if (!tag) {
        tag = { id: uuidv4(), name: tagName };
        await db.tags.add(tag);
      }
      
      const existingLink = await db.noteTags.get([noteId, tag.id]);
      if (!existingLink) {
        await db.noteTags.add({ noteId, tagId: tag.id });
      }
    });
  },

  removeTagFromNote: async (noteId: string, tagId: string): Promise<void> => {
    await db.noteTags.delete([noteId, tagId]);
  },
};