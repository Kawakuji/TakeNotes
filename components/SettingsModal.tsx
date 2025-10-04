
import React from 'react';
import { useSettings, type Theme, type FontSize, type LineHeight, type EditorWidth } from '../contexts/SettingsContext';
import { XCircleIcon } from './icons';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div className="flex items-center justify-between py-3">
        <label className="text-bunker-700 dark:text-bunker-200">{label}</label>
        {children}
    </div>
);

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { settings, updateSetting } = useSettings();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="w-full max-w-md bg-white dark:bg-bunker-900 rounded-lg shadow-2xl overflow-hidden" 
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-bunker-200 dark:border-bunker-800">
            <h2 className="text-lg font-bold text-bunker-800 dark:text-bunker-100">Settings</h2>
            <button onClick={onClose} className="p-1 text-bunker-500 hover:text-bunker-900 dark:hover:text-bunker-100">
                <XCircleIcon className="w-6 h-6" />
            </button>
        </div>
        <div className="p-4 space-y-2 divide-y divide-bunker-200 dark:divide-bunker-800">
            <SettingRow label="Theme">
                <select 
                    value={settings.theme} 
                    onChange={(e) => updateSetting('theme', e.target.value as Theme)}
                    className="bg-bunker-100 dark:bg-bunker-800 border border-bunker-300 dark:border-bunker-700 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="system">System</option>
                </select>
            </SettingRow>
            <SettingRow label="Font Size">
                 <select 
                    value={settings.fontSize} 
                    onChange={(e) => updateSetting('fontSize', e.target.value as FontSize)}
                    className="bg-bunker-100 dark:bg-bunker-800 border border-bunker-300 dark:border-bunker-700 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                </select>
            </SettingRow>
            <SettingRow label="Line Height">
                 <select 
                    value={settings.lineHeight} 
                    onChange={(e) => updateSetting('lineHeight', e.target.value as LineHeight)}
                    className="bg-bunker-100 dark:bg-bunker-800 border border-bunker-300 dark:border-bunker-700 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="compact">Compact</option>
                    <option value="default">Default</option>
                    <option value="relaxed">Relaxed</option>
                </select>
            </SettingRow>
            <SettingRow label="Editor Width">
                 <select 
                    value={settings.editorWidth} 
                    onChange={(e) => updateSetting('editorWidth', e.target.value as EditorWidth)}
                    className="bg-bunker-100 dark:bg-bunker-800 border border-bunker-300 dark:border-bunker-700 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="standard">Standard</option>
                    <option value="wide">Wide</option>
                    <option value="full">Full</option>
                </select>
            </SettingRow>
        </div>
      </div>
    </div>
  );
};
