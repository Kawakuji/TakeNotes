
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { settingsService } from '../services/settingsService';

export type Theme = 'light' | 'dark' | 'system';
export type FontSize = 'small' | 'medium' | 'large';
export type LineHeight = 'compact' | 'default' | 'relaxed';
export type EditorWidth = 'standard' | 'wide' | 'full';

interface AppSettings {
    theme: Theme;
    fontSize: FontSize;
    lineHeight: LineHeight;
    editorWidth: EditorWidth;
}

interface SettingsContextType {
    settings: AppSettings;
    effectiveTheme: 'light' | 'dark';
    updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
    toggleTheme: () => void;
}

const defaultSettings: AppSettings = {
    theme: 'system',
    fontSize: 'medium',
    lineHeight: 'default',
    editorWidth: 'standard',
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<AppSettings>(defaultSettings);
    const [isInitialized, setIsInitialized] = useState(false);
    
    // Load settings from DB on initial mount
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const theme = await settingsService.getSetting('theme') as Theme;
                const fontSize = await settingsService.getSetting('fontSize') as FontSize;
                const lineHeight = await settingsService.getSetting('lineHeight') as LineHeight;
                const editorWidth = await settingsService.getSetting('editorWidth') as EditorWidth;

                setSettings({
                    theme: theme || defaultSettings.theme,
                    fontSize: fontSize || defaultSettings.fontSize,
                    lineHeight: lineHeight || defaultSettings.lineHeight,
                    editorWidth: editorWidth || defaultSettings.editorWidth,
                });
            } catch (error) {
                console.error("Failed to load settings from DB", error);
            } finally {
                setIsInitialized(true);
            }
        };
        loadSettings();
    }, []);

    const prefersDarkMode = useMemo(() => {
        if (typeof window === 'undefined') return false;
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }, []);

    const effectiveTheme = useMemo(() => {
        return settings.theme === 'system' ? (prefersDarkMode ? 'dark' : 'light') : settings.theme;
    }, [settings.theme, prefersDarkMode]);
    
    // Apply theme class to root element
    useEffect(() => {
        if (!isInitialized) return;

        const root = document.documentElement;
        if (effectiveTheme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
    }, [effectiveTheme, isInitialized]);

    // Listen for system theme changes
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => {
            // This will trigger a re-render and recalculate effectiveTheme if theme is 'system'
            setSettings(prev => ({...prev}));
        };
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);


    const updateSetting = useCallback(<K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
        setSettings(prevSettings => {
            const newSettings = { ...prevSettings, [key]: value };
            settingsService.setSetting(key, value);
            return newSettings;
        });
    }, []);

    const toggleTheme = useCallback(() => {
        updateSetting('theme', effectiveTheme === 'light' ? 'dark' : 'light');
    }, [effectiveTheme, updateSetting]);

    const value = {
        settings,
        effectiveTheme,
        updateSetting,
        toggleTheme
    };

    return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};
