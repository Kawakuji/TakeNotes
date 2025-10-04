
import React, { useState, useEffect, useMemo } from 'react';

interface Command {
  id: string;
  name: string;
  action: () => void;
  icon?: React.ReactNode;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands: Command[];
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, commands }) => {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const filteredCommands = useMemo(() => {
    return commands.filter(cmd => cmd.name.toLowerCase().includes(search.toLowerCase()));
  }, [commands, search]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
          onClose();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, filteredCommands, selectedIndex]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20" onClick={onClose}>
      <div className="w-full max-w-lg bg-white dark:bg-bunker-900 rounded-lg shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <input
          type="text"
          autoFocus
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Type a command or search..."
          className="w-full p-4 text-lg bg-transparent focus:outline-none text-bunker-800 dark:text-bunker-100 border-b border-bunker-200 dark:border-bunker-700"
        />
        <ul className="p-2 max-h-96 overflow-y-auto">
          {filteredCommands.length > 0 ? filteredCommands.map((cmd, index) => (
            <li
              key={cmd.id}
              onClick={() => {
                cmd.action();
                onClose();
              }}
              className={`p-3 flex items-center space-x-3 rounded-md cursor-pointer ${
                index === selectedIndex ? 'bg-blue-500 text-white' : 'hover:bg-bunker-100 dark:hover:bg-bunker-800 text-bunker-700 dark:text-bunker-200'
              }`}
            >
              {cmd.icon && <span className="w-5 h-5">{cmd.icon}</span>}
              <span>{cmd.name}</span>
            </li>
          )) : (
             <li className="p-4 text-center text-bunker-500">No commands found.</li>
          )}
        </ul>
      </div>
    </div>
  );
};
