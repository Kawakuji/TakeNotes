
import React, { useRef } from 'react';
import { folderService } from '../services/folderService';
import { tagService } from '../services/tagService';
import { exportImportService } from '../services/exportImportService';
import { useSettings } from '../contexts/SettingsContext';
import { FolderIcon, PlusIcon, StarIcon, TagIcon, MoonIcon, SunIcon, Cog6ToothIcon, ArrowDownTrayIcon, ArrowUpTrayIcon } from './icons';

export type Filter = { type: 'all' | 'folder' | 'tag' | 'starred'; id: string | null };

interface SidebarProps {
  filter: Filter;
  setFilter: (filter: Filter) => void;
  onClose?: () => void;
  onOpenSettings: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ filter, setFilter, onClose, onOpenSettings }) => {
  const folders = folderService.getAllFolders();
  const tags = tagService.getAllTags();
  // FIX: The 'theme' setting is nested inside the 'settings' object and is not used here.
  // Removed from destructuring to fix the error.
  const { effectiveTheme, toggleTheme } = useSettings();
  const importInputRef = useRef<HTMLInputElement>(null);


  const handleAddFolder = async () => {
    const newFolderName = prompt('Enter new folder name:');
    if (newFolderName) {
      await folderService.createFolder(newFolderName);
    }
  };
  
  const handleFilterClick = (newFilter: Filter) => {
    setFilter(newFilter);
    onClose?.(); // Close sidebar on mobile after selection
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await exportImportService.importData(file);
      // It's good practice to reset the filter after a full data import
      setFilter({ type: 'all', id: null }); 
    }
    // Reset file input to allow importing the same file again
    event.target.value = '';
  };

  return (
    <aside className="w-64 lg:w-72 bg-bunker-50 dark:bg-bunker-900 text-bunker-800 dark:text-bunker-200 p-4 flex flex-col h-full shrink-0 border-r border-bunker-200 dark:border-bunker-800">
      <h2 className="text-lg font-bold mb-4 px-2">TakeNote</h2>
      
      <div className="flex-1 overflow-y-auto pr-1 -mr-3">
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-bunker-500 dark:text-bunker-400 px-2 mb-2">Quick Filters</h3>
          <nav>
            <ul>
              <li
                onClick={() => handleFilterClick({ type: 'all', id: null })}
                className={`flex items-center space-x-2 p-2 rounded-md cursor-pointer ${
                  filter.type === 'all' ? 'bg-blue-500 text-white' : 'hover:bg-bunker-200 dark:hover:bg-bunker-800'
                }`}
              >
                <FolderIcon className="w-5 h-5" />
                <span>All Notes</span>
              </li>
              <li
                onClick={() => handleFilterClick({ type: 'starred', id: null })}
                className={`flex items-center space-x-2 p-2 rounded-md cursor-pointer ${
                  filter.type === 'starred' ? 'bg-blue-500 text-white' : 'hover:bg-bunker-200 dark:hover:bg-bunker-800'
                }`}
              >
                <StarIcon className="w-5 h-5" />
                <span>Starred</span>
              </li>
            </ul>
          </nav>
        </div>

        <div className="flex items-center justify-between mb-2 px-2">
          <h3 className="text-sm font-semibold text-bunker-500 dark:text-bunker-400">Folders</h3>
          <button onClick={handleAddFolder} className="p-1 hover:bg-bunker-200 dark:hover:bg-bunker-700 rounded">
            <PlusIcon className="w-5 h-5" />
          </button>
        </div>
        <nav className="mb-6">
          <ul>
            {folders?.map((folder) => (
              <li
                key={folder.id}
                onClick={() => handleFilterClick({ type: 'folder', id: folder.id })}
                className={`flex items-center space-x-2 p-2 rounded-md cursor-pointer ${
                  filter.type === 'folder' && filter.id === folder.id ? 'bg-blue-500 text-white' : 'hover:bg-bunker-200 dark:hover:bg-bunker-800'
                }`}
              >
                <FolderIcon className="w-5 h-5" />
                <span className="truncate">{folder.name}</span>
              </li>
            ))}
          </ul>
        </nav>
        
        <div className="px-2">
            <h3 className="text-sm font-semibold text-bunker-500 dark:text-bunker-400 mb-2">Tags</h3>
            <div className="flex flex-wrap gap-2">
                {tags?.map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => handleFilterClick({ type: 'tag', id: tag.id })}
                      className={`flex items-center space-x-1 px-2 py-1 rounded-full text-sm ${
                          filter.type === 'tag' && filter.id === tag.id
                              ? 'bg-blue-500 text-white' 
                              : 'bg-bunker-200 dark:bg-bunker-700 hover:bg-bunker-300 dark:hover:bg-bunker-600'
                      }`}
                    >
                      <TagIcon className="w-3 h-3"/>
                      <span>{tag.name}</span>
                    </button>
                ))}
            </div>
        </div>
      </div>

      <div className="mt-auto pt-4 border-t border-bunker-200 dark:border-bunker-800 space-y-2">
        <h3 className="text-sm font-semibold text-bunker-500 dark:text-bunker-400 px-2 mb-1">Management</h3>
         <button onClick={() => exportImportService.exportData()} className="w-full flex items-center space-x-2 p-2 rounded-md text-left hover:bg-bunker-200 dark:hover:bg-bunker-800">
            <ArrowDownTrayIcon className="w-5 h-5" />
            <span>Export Data</span>
        </button>
        <button onClick={() => importInputRef.current?.click()} className="w-full flex items-center space-x-2 p-2 rounded-md text-left hover:bg-bunker-200 dark:hover:bg-bunker-800">
            <ArrowUpTrayIcon className="w-5 h-5" />
            <span>Import Data</span>
        </button>
        <input type="file" accept=".qnote" ref={importInputRef} onChange={handleImport} className="hidden" />
        
        <button onClick={onOpenSettings} className="w-full flex items-center space-x-2 p-2 rounded-md text-left hover:bg-bunker-200 dark:hover:bg-bunker-800">
          <Cog6ToothIcon className="w-5 h-5" />
          <span>Settings</span>
        </button>

        <button onClick={toggleTheme} className="w-full flex items-center space-x-2 p-2 rounded-md text-left hover:bg-bunker-200 dark:hover:bg-bunker-800">
          {effectiveTheme === 'dark' ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
          <span>{effectiveTheme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
      </div>
    </aside>
  );
};
