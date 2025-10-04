
import React, { useState, useCallback, useMemo } from 'react';
import { noteService } from './services/noteService';
import { useHotkeys } from './hooks/useHotkeys';
import { useSettings } from './contexts/SettingsContext';
import { Sidebar, type Filter } from './components/Sidebar';
import { NoteList } from './components/NoteList';
import { Editor } from './components/Editor';
import { CommandPalette } from './components/CommandPalette';
import { SettingsModal } from './components/SettingsModal';
import { MoonIcon, SunIcon, PlusIcon } from './components/icons';

export default function App() {
  const [filter, setFilter] = useState<Filter>({ type: 'all', id: null });
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [isCommandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isSettingsModalOpen, setSettingsModalOpen] = useState(false);
  const { effectiveTheme, toggleTheme } = useSettings();

  const handleNewNote = useCallback(async () => {
    // When creating a new note, it should belong to the currently active folder if one is selected.
    const folderIdForNewNote = filter.type === 'folder' ? filter.id : null;
    const newNoteId = await noteService.createNote(folderIdForNewNote);
    
    // If we were filtering by tag or starred, switch to all notes to ensure the new note is visible.
    if (filter.type === 'tag' || filter.type === 'starred') {
        setFilter({ type: 'all', id: null });
    }
    
    setActiveNoteId(newNoteId);
    setSidebarOpen(false); // Close sidebar on mobile
  }, [filter]);
  
  const handleDeleteNote = useCallback(async (id: string) => {
    await noteService.deleteNote(id);
    if(activeNoteId === id){
        setActiveNoteId(null);
    }
  }, [activeNoteId]);

  const commands = useMemo(() => [
    { id: 'new-note', name: 'New Note', action: handleNewNote, icon: <PlusIcon/> },
    { id: 'toggle-theme', name: 'Toggle Theme', action: toggleTheme, icon: effectiveTheme === 'dark' ? <SunIcon/> : <MoonIcon/> }
  ], [handleNewNote, toggleTheme, effectiveTheme]);

  useHotkeys({
    'mod+k': () => setCommandPaletteOpen(prev => !prev),
    'mod+n': handleNewNote,
  }, [handleNewNote]);
  
  const handleSetFilter = (newFilter: Filter) => {
      setFilter(newFilter);
      // When a filter is selected, we should deselect any active note to avoid confusion.
      setActiveNoteId(null);
  }

  return (
    <div className="flex h-screen font-sans antialiased text-bunker-900 bg-white dark:text-bunker-100 dark:bg-bunker-950 overflow-hidden">
      {/* Mobile-only background overlay for sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/30 z-10 md:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <div className={`
        absolute top-0 left-0 h-full z-20 transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0 md:flex-shrink-0
      `}>
          <Sidebar 
            filter={filter} 
            setFilter={handleSetFilter}
            onClose={() => setSidebarOpen(false)}
            onOpenSettings={() => setSettingsModalOpen(true)}
          />
      </div>

      {/* Main Content */}
      <main className="flex flex-1 min-w-0">
          {/* NoteList (visible on mobile if no note is active, always visible on desktop) */}
          <div className={`
            w-full h-full flex-shrink-0
            ${activeNoteId ? 'hidden' : 'flex'}
            md:flex md:w-80 lg:w-96
          `}>
            <NoteList 
              filter={filter}
              activeNoteId={activeNoteId}
              setActiveNoteId={setActiveNoteId}
              onNewNote={handleNewNote}
              onToggleSidebar={() => setSidebarOpen(true)}
            />
          </div>
          
          {/* Editor (visible on mobile only if a note is active, always visible on desktop) */}
          <div className={`
            w-full h-full
            ${!activeNoteId ? 'hidden' : 'flex'}
            md:flex
          `}>
             <Editor 
                activeNoteId={activeNoteId} 
                onDelete={handleDeleteNote}
                onClose={() => setActiveNoteId(null)}
            />
          </div>
      </main>

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        commands={commands}
      />
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
      />
    </div>
  );
}