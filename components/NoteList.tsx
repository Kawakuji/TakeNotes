import React, { useState, useMemo } from 'react';
import { noteService } from '../services/noteService';
import type { Note } from '../types';
import type { Filter } from './Sidebar';
import { PinIcon, StarIcon, SearchIcon, MenuIcon } from './icons';

interface NoteListProps {
  filter: Filter;
  activeNoteId: string | null;
  setActiveNoteId: (id: string) => void;
  onNewNote: () => void;
  onToggleSidebar: () => void;
}

const NoteListItem: React.FC<{ note: Note; isActive: boolean; onClick: () => void }> = ({ note, isActive, onClick }) => {
  const date = new Date(note.updatedAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
  const contentSnippet = note.content_md.substring(0, 100).replace(/(\r\n|\n|\r)/gm, " ");

  return (
    <li
      onClick={onClick}
      className={`p-3 cursor-pointer rounded-lg mb-2 transition-colors ${
        isActive ? 'bg-blue-500 text-white' : 'bg-bunker-50 hover:bg-bunker-100 dark:bg-bunker-900 dark:hover:bg-bunker-800'
      }`}
    >
      <div className="flex justify-between items-center">
        <h3 className="font-bold truncate text-md">{note.title || 'Untitled Note'}</h3>
        <span className={`text-xs ${isActive ? 'text-blue-200' : 'text-bunker-500 dark:text-bunker-400'}`}>{date}</span>
      </div>
      <p className={`text-sm mt-1 truncate ${isActive ? 'text-blue-100' : 'text-bunker-600 dark:text-bunker-300'}`}>
        {contentSnippet}
      </p>
      <div className="flex items-center space-x-2 mt-2">
        {note.isPinned && <PinIcon className={`w-3 h-3 ${isActive ? 'text-blue-100' : 'text-bunker-500'}`} />}
        {note.isStarred && <StarIcon solid className={`w-3 h-3 ${isActive ? 'text-yellow-300' : 'text-yellow-500'}`} />}
      </div>
    </li>
  );
};

export const NoteList: React.FC<NoteListProps> = ({ filter, activeNoteId, setActiveNoteId, onNewNote, onToggleSidebar }) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  const notes = noteService.getNotes(filter);

  const filteredNotes = useMemo(() => {
    if (!notes) return [];
    const lowercasedQuery = searchQuery.toLowerCase();
    const filtered = searchQuery
      ? notes.filter(note => 
          note.title.toLowerCase().includes(lowercasedQuery) || 
          note.content_md.toLowerCase().includes(lowercasedQuery)
        )
      : notes;

    // Separate pinned and non-pinned notes
    const pinnedNotes = filtered.filter(note => note.isPinned);
    const otherNotes = filtered.filter(note => !note.isPinned);

    return [...pinnedNotes, ...otherNotes];
  }, [notes, searchQuery]);

  return (
    <section className="w-full bg-bunker-100 dark:bg-bunker-950 p-4 flex flex-col h-full border-r border-bunker-200 dark:border-bunker-800 shrink-0">
      <div className="flex items-center gap-2 mb-4">
        <button onClick={onToggleSidebar} className="md:hidden p-2 -ml-2 text-bunker-600 dark:text-bunker-300">
            <MenuIcon className="w-6 h-6"/>
        </button>
        <div className="relative flex-1">
            <SearchIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-bunker-400"/>
            <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-bunker-50 dark:bg-bunker-900 border border-bunker-200 dark:border-bunker-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-bunker-800 dark:text-bunker-100"
            />
        </div>
      </div>
      <div className="flex items-center justify-between mb-4 pr-2">
        <h2 className="text-xl font-bold text-bunker-800 dark:text-bunker-100">Notes</h2>
        <button onClick={onNewNote} className="px-3 py-1 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 transition-colors">New Note</button>
      </div>
      <ul className="flex-1 overflow-y-auto -mr-2 pr-2">
        {filteredNotes && filteredNotes.length > 0 ? (
          filteredNotes.map((note) => (
            <NoteListItem
              key={note.id}
              note={note}
              isActive={note.id === activeNoteId}
              onClick={() => setActiveNoteId(note.id)}
            />
          ))
        ) : (
          <p className="text-center text-bunker-500 dark:text-bunker-400 mt-8">No notes found.</p>
        )}
      </ul>
    </section>
  );
};