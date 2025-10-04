
import Dexie, { type Table } from 'dexie';
import { v4 as uuidv4 } from 'uuid';
import type { Note, Folder, Tag, NoteTag, Attachment, Settings } from '../types';

export class TakeNoteDB extends Dexie {
  notes!: Table<Note, string>;
  folders!: Table<Folder, string>;
  tags!: Table<Tag, string>;
  noteTags!: Table<NoteTag, [string, string]>;
  attachments!: Table<Attachment, string>;
  settings!: Table<Settings, string>;

  constructor() {
    super('TakeNoteDB');
    // FIX: Explicitly cast `this` to `Dexie` to resolve a TypeScript error where
    // the `version` method is not found on the extended class type. This is often
    // due to a subtle type inference issue, and casting ensures the compiler
    // recognizes the inherited method from the base class.
    (this as Dexie).version(1).stores({
      notes: 'id, title, folderId, updatedAt, isPinned, isStarred',
      folders: 'id, name, parentId',
      tags: 'id, &name',
      noteTags: '[noteId+tagId], noteId, tagId',
      attachments: 'id, noteId',
      settings: 'key',
    });

    this.on('populate', this.populate.bind(this));
  }

  async populate() {
    const initialFolderId = uuidv4();
    await this.folders.add({
      id: initialFolderId,
      name: 'Getting Started',
      parentId: null,
    });

    const welcomeNoteId = uuidv4();
    await this.notes.add({
        id: welcomeNoteId,
        title: 'Welcome to TakeNote!',
        content_md: `# Welcome to TakeNote!\n\nThis is a simple, fluid, and beautiful note-taking app.\n\n## Features\n\n- **Markdown Support**: Write in Markdown and see it rendered beautifully.\n- **Folders & Tags**: Organize your notes with folders and tags.\n- **Local-First**: All your data is stored securely on your own device.\n- **Fast Search**: Quickly find what you're looking for.\n- **Keyboard Shortcuts**: Use \`Cmd/Ctrl + K\` to open the command palette and \`Cmd/Ctrl + N\` for a new note.\n\nEnjoy taking notes!`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isPinned: true,
        isStarred: true,
        folderId: initialFolderId,
    });

    const markdownNoteId = uuidv4();
    await this.notes.add({
        id: markdownNoteId,
        title: 'Markdown Basics',
        content_md: `# Heading 1\n## Heading 2\n### Heading 3\n\n*Italic text*\n**Bold text**\n\`inline code\`\n\n- List item 1\n- List item 2\n\n\`\`\`javascript\nfunction hello() {\n    console.log("Hello, World!");\n}\n\`\`\``,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isPinned: false,
        isStarred: false,
        folderId: initialFolderId,
    });

    // Seed Tags
    const welcomeTagId = uuidv4();
    const guideTagId = uuidv4();
    await this.tags.bulkAdd([
        { id: welcomeTagId, name: 'welcome' },
        { id: guideTagId, name: 'guide' },
    ]);

    // Seed NoteTags
    await this.noteTags.bulkAdd([
        { noteId: welcomeNoteId, tagId: welcomeTagId },
        { noteId: markdownNoteId, tagId: guideTagId },
    ]);
      
    // Seed Settings
    await this.settings.add({ key: 'theme', value: 'system' });
  }
}

export const db = new TakeNoteDB();