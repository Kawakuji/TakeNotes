import { db } from './db';
import { v4 as uuidv4 } from 'uuid';
import type { Attachment } from '../types';
import { useLiveQuery } from 'dexie-react-hooks';

export const attachmentService = {
    getAttachmentsForNote: (noteId: string | null) => {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        return useLiveQuery(
            () => noteId ? db.attachments.where('noteId').equals(noteId).toArray() : [],
            [noteId]
        );
    },

    addAttachment: async (noteId: string, file: File): Promise<string> => {
        const newAttachment: Attachment = {
            id: uuidv4(),
            noteId,
            fileName: file.name,
            filePath: '', // Not used in web version, data is in blob
            mimeType: file.type,
            sizeBytes: file.size,
            data: file, // Store the File/Blob object directly
        };
        await db.attachments.add(newAttachment);
        return newAttachment.id;
    },

    removeAttachment: async (attachmentId: string): Promise<void> => {
        await db.attachments.delete(attachmentId);
    },

    deleteAttachmentsForNote: async (noteId: string): Promise<void> => {
        await db.attachments.where('noteId').equals(noteId).delete();
    },
};
