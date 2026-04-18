import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { loadItems, upsertItem } from './storage';
import { triggerForgotAlarm } from './alarm';
import type { TrackedItem } from '../types';

const LOCATION_TASK = 'timmytime-location-task';

export function distanceMeters(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number }
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

async function checkAllItems(current: {
  latitude: number;
  longitude: number;
}): Promise<void> {
  const items = await loadItems();
  for (const item of items) {
    if (item.alerted) continue;
    const d = distanceMeters(current, item.anchor);
    if (d >= item.alertRadiusMeters) {
      await triggerForgotAlarm(item);
      await upsertItem({ ...item, alerted: true });
    }
  }
}

TaskManager.defineTask(LOCATION_TASK, async ({ data, error }) => {
  if (error) return;
  const { locations } = (data ?? {}) as {
    locations?: Location.LocationObject[];
  };
  const latest = locations?.[locations.length - 1];
  if (!latest) return;
  await checkAllItems(latest.coords);
});

export async function startBackgroundTracking(): Promise<void> {
  const fg = await Location.requestForegroundPermissionsAsync();
  if (fg.status !== 'granted') return;

  const bg = await Location.requestBackgroundPermissionsAsync();
  if (bg.status !== 'granted') return;

  const alreadyRunning = await Location.hasStartedLocationUpdatesAsync(
    LOCATION_TASK
  );
  if (alreadyRunning) return;

  await Location.startLocationUpdatesAsync(LOCATION_TASK, {
    accuracy: Location.Accuracy.Balanced,
    distanceInterval: 25,
    timeInterval: 30000,
    showsBackgroundLocationIndicator: true,
    foregroundService: {
      notificationTitle: 'TimmyTime is watching your stuff',
      notificationBody:
        "We'll ping you if you wander too far from a tracked item.",
    },
  });
}

export async function stopBackgroundTracking(): Promise<void> {
  const running = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK);
  if (running) await Location.stopLocationUpdatesAsync(LOCATION_TASK);
}

export async function getCurrentCoords(): Promise<Location.LocationObjectCoords> {
  const loc = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });
  return loc.coords;
}

export type { TrackedItem };
