import AsyncStorage from '@react-native-async-storage/async-storage';
import type { TrackedItem } from '../types';

const KEY = 'timmytime.items.v1';

export async function loadItems(): Promise<TrackedItem[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as TrackedItem[];
  } catch {
    return [];
  }
}

export async function saveItems(items: TrackedItem[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(items));
}

export async function upsertItem(item: TrackedItem): Promise<void> {
  const items = await loadItems();
  const next = items.filter((i) => i.id !== item.id).concat(item);
  await saveItems(next);
}

export async function removeItem(id: string): Promise<void> {
  const items = await loadItems();
  await saveItems(items.filter((i) => i.id !== id));
}

export async function getItem(id: string): Promise<TrackedItem | undefined> {
  const items = await loadItems();
  return items.find((i) => i.id === id);
}
