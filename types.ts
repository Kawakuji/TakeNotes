
export interface Note {
  id: string;
  title: string;
  content_md: string;
  createdAt: number;
  updatedAt: number;
  isPinned: boolean;
  isStarred: boolean;
  folderId: string | null;
}

export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
}

export interface Tag {
  id: string;
  name: string;
}

export interface NoteTag {
  noteId: string;
  tagId: string;
}

export interface Attachment {
  id: string;
  noteId: string;
  fileName: string;
  filePath: string; // On web, this will be an object URL
  mimeType: string;
  sizeBytes: number;
  data: Blob;
}

export interface Settings {
  key: string;
  value: string;
}
