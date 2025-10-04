
import JSZip from 'jszip';
import { db } from './db';
import type { Note, Folder, Tag, NoteTag, Attachment, Settings } from '../types';

interface ExportData {
    notes: Note[];
    folders: Folder[];
    tags: Tag[];
    noteTags: NoteTag[];
    settings: Settings[];
    // attachments are handled separately
}

export const exportImportService = {
    exportData: async (): Promise<void> => {
        try {
            const zip = new JSZip();
            const attachmentsFolder = zip.folder('attachments');
            if (!attachmentsFolder) {
                throw new Error("Could not create attachments folder in zip.");
            }

            const dataToExport: ExportData = {
                notes: await db.notes.toArray(),
                folders: await db.folders.toArray(),
                tags: await db.tags.toArray(),
                noteTags: await db.noteTags.toArray(),
                settings: await db.settings.toArray(),
            };
            
            // Note: We are not exporting attachment blobs in the JSON
            const attachmentsMetadata = await db.attachments.toArray();
            for (const attachment of attachmentsMetadata) {
                attachmentsFolder.file(attachment.id, attachment.data, { binary: true });
                // @ts-ignore
                delete attachment.data; // remove blob from metadata
            }

            const exportJson = JSON.stringify({ ...dataToExport, attachments: attachmentsMetadata }, null, 2);
            zip.file('export.json', exportJson);

            const content = await zip.generateAsync({ type: 'blob' });
            const url = URL.createObjectURL(content);
            const a = document.createElement('a');
            const date = new Date().toISOString().slice(0, 10);
            a.href = url;
            a.download = `takenote_backup_${date}.qnote`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

        } catch (error) {
            console.error("Failed to export data:", error);
            alert("Error exporting data. See console for details.");
        }
    },

    importData: async (file: File): Promise<void> => {
        if (!window.confirm("Are you sure you want to import this file? This will overwrite all current data in the application.")) {
            return;
        }

        try {
            const zip = await JSZip.loadAsync(file);
            const exportJsonFile = zip.file('export.json');

            if (!exportJsonFile) {
                throw new Error('export.json not found in the archive.');
            }

            const exportJsonContent = await exportJsonFile.async('string');
            const importedData = JSON.parse(exportJsonContent);

            const attachmentsFolder = zip.folder('attachments');
            const attachmentsWithData: Attachment[] = [];

            if (attachmentsFolder && importedData.attachments) {
                for (const attachmentMeta of importedData.attachments as Partial<Attachment>[]) {
                    if (attachmentMeta.id) {
                         const attachmentFile = attachmentsFolder.file(attachmentMeta.id);
                         if (attachmentFile) {
                             const blobData = await attachmentFile.async('blob');
                             attachmentsWithData.push({ ...attachmentMeta, data: blobData } as Attachment);
                         }
                    }
                }
            }
            
            // FIX: Pass all tables as an array to the transaction method to avoid exceeding
            // the maximum number of arguments. Dexie's transaction method can take an array
            // of tables for transactions involving many tables.
            await db.transaction('rw', [db.notes, db.folders, db.tags, db.noteTags, db.attachments, db.settings], async () => {
                // Clear all existing data
                await Promise.all([
                    db.notes.clear(),
                    db.folders.clear(),
                    db.tags.clear(),
                    db.noteTags.clear(),
                    db.attachments.clear(),
                    db.settings.clear(),
                ]);

                // Add new data
                if (importedData.notes) await db.notes.bulkAdd(importedData.notes);
                if (importedData.folders) await db.folders.bulkAdd(importedData.folders);
                if (importedData.tags) await db.tags.bulkAdd(importedData.tags);
                if (importedData.noteTags) await db.noteTags.bulkAdd(importedData.noteTags);
                if (importedData.settings) await db.settings.bulkAdd(importedData.settings);
                if (attachmentsWithData.length > 0) await db.attachments.bulkAdd(attachmentsWithData);
            });
            
            alert('Import successful! The application will now reload.');
            window.location.reload();

        } catch (error) {
            console.error("Failed to import data:", error);
            alert("Error importing data. The file might be corrupted or in the wrong format. See console for details.");
        }
    }
};
