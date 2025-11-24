
import { useState, useEffect, useCallback } from 'react';
import { ContentItem } from '../types';

const MY_LIST_KEY = 'cineStreamMyList';

export const useMyList = () => {
  const [myList, setMyList] = useState<ContentItem[]>([]);

  useEffect(() => {
    try {
      const items = localStorage.getItem(MY_LIST_KEY);
      if (items) {
        setMyList(JSON.parse(items));
      }
    } catch (error) {
      console.error("Failed to parse My List from localStorage", error);
      // If parsing fails, clear the corrupted data
      localStorage.removeItem(MY_LIST_KEY);
    }
  }, []);

  const saveList = (list: ContentItem[]) => {
    try {
      // Avoid storing duplicate items
      const uniqueList = list.filter((item, index, self) =>
        index === self.findIndex((t) => (t.id === item.id && t.media_type === item.media_type))
      );
      localStorage.setItem(MY_LIST_KEY, JSON.stringify(uniqueList));
      setMyList(uniqueList);
    } catch (error) {
      console.error("Failed to save My List to localStorage", error);
    }
  };

  const addItem = useCallback((itemToAdd: ContentItem) => {
    setMyList(prevList => {
        const newList = [...prevList, itemToAdd];
        saveList(newList);
        return newList;
    });
  }, []);

  const removeItem = useCallback((itemIdToRemove: number) => {
    setMyList(prevList => {
        const newList = prevList.filter(item => item.id !== itemIdToRemove);
        saveList(newList);
        return newList;
    });
  }, []);

  const clearList = useCallback(() => {
      localStorage.removeItem(MY_LIST_KEY);
      setMyList([]);
  }, []);

  const isItemInList = useCallback((itemId: number): boolean => {
    return myList.some(item => item.id === itemId);
  }, [myList]);

  return { myList, addItem, removeItem, clearList, isItemInList };
};
