
import { useState, useEffect, useCallback } from 'react';
import { ContentItem, ViewingHistoryItem } from '../types';

const VIEWING_HISTORY_KEY = 'cineStreamViewingHistory';
const MAX_HISTORY_ITEMS = 50;

export const useViewingHistory = () => {
  const [viewingHistory, setViewingHistory] = useState<ViewingHistoryItem[]>([]);

  useEffect(() => {
    try {
      const items = localStorage.getItem(VIEWING_HISTORY_KEY);
      if (items) {
        setViewingHistory(JSON.parse(items));
      }
    } catch (error) {
      console.error("Failed to parse Viewing History from localStorage", error);
      localStorage.removeItem(VIEWING_HISTORY_KEY);
    }
  }, []);

  const saveHistory = (history: ViewingHistoryItem[]) => {
    try {
      const sortedHistory = history.sort((a, b) => b.lastWatched - a.lastWatched);
      const limitedHistory = sortedHistory.slice(0, MAX_HISTORY_ITEMS);
      localStorage.setItem(VIEWING_HISTORY_KEY, JSON.stringify(limitedHistory));
      setViewingHistory(limitedHistory);
    } catch (error) {
      console.error("Failed to save Viewing History to localStorage", error);
    }
  };

  const addItemToHistory = useCallback((itemToAdd: ContentItem, season?: number, episode?: number) => {
    setViewingHistory(prevHistory => {
        const existingItemIndex = prevHistory.findIndex(
            item => item.content.id === itemToAdd.id && item.content.media_type === itemToAdd.media_type
        );

        let newHistory = [...prevHistory];
        
        if (existingItemIndex !== -1) {
            const existingItem = newHistory.splice(existingItemIndex, 1)[0];
            existingItem.lastWatched = Date.now();
            existingItem.progress = itemToAdd.media_type === 'movie' 
                ? (existingItem.progress >= 0.9 ? 0.15 : (existingItem.progress || 0) + 0.2)
                : 1; // Mark episodes as 'watched'
            
            if (itemToAdd.media_type === 'tv') {
                existingItem.lastSeason = season;
                existingItem.lastEpisode = episode;
            }
            if (existingItem.progress > 1) existingItem.progress = 1;

            newHistory.unshift(existingItem);
        } else {
            const newItem: ViewingHistoryItem = {
                content: itemToAdd,
                lastWatched: Date.now(),
                progress: itemToAdd.media_type === 'movie' ? 0.15 : 1,
            };
            if (itemToAdd.media_type === 'tv') {
                newItem.lastSeason = season;
                newItem.lastEpisode = episode;
            }
            newHistory.unshift(newItem);
        }
        
        saveHistory(newHistory);
        return newHistory;
    });
  }, []);
  
  const getHistoryForItem = useCallback((contentId: number): ViewingHistoryItem | undefined => {
    return viewingHistory.find(item => item.content.id === contentId);
  }, [viewingHistory]);

  const clearHistory = useCallback(() => {
      localStorage.removeItem(VIEWING_HISTORY_KEY);
      setViewingHistory([]);
  }, []);

  return { viewingHistory, addItemToHistory, getHistoryForItem, clearHistory };
};
