import { db } from './db';
import type { Settings } from '../types';

export const settingsService = {
  getSetting: async (key: string): Promise<string | undefined> => {
    const setting = await db.settings.get(key);
    return setting?.value;
  },

  setSetting: async (key: string, value: string): Promise<void> => {
    await db.settings.put({ key, value });
  },
};