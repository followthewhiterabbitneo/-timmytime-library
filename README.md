# TimmyTime

> "Hey — you forgot your pretzels."

TimmyTime is a don't-forget-your-stuff app for people with ADHD (and anyone
else who leaves things behind). Scan a barcode on the thing you're carrying.
If you walk more than **1,000 feet away** from it, your phone:

1. Sounds an alarm and says out loud: *"You forgot your **\<item\>**."*
2. Shows the product photo so you instantly remember what it is.
3. Opens a walking map back to where you left it.

## How it works

```
 [Scan barcode + snap photo]
            │
            ▼
   Anchor GPS coordinate is saved
            │
            ▼
 Background location watcher compares
  your position to the anchor point
            │
            ▼
  distance > 1000 ft  →  ALARM + SPEECH + MAP
```

## Stack

- **Expo / React Native + TypeScript** — one codebase, runs on iOS & Android.
- **expo-barcode-scanner** — barcode scanning.
- **expo-camera** — product photo capture.
- **expo-location** — foreground + background geofencing.
- **expo-av** / **expo-speech** — alarm tone and text-to-speech reminder.
- **expo-notifications** — push the reminder even when the app is backgrounded.
- **react-native-maps** — walk-back-to-it map directions.
- **@react-native-async-storage/async-storage** — local persistence of tracked items.

## Project layout

```
src/
├── screens/
│   ├── HomeScreen.tsx       list of items currently being tracked
│   ├── ScanScreen.tsx       scan barcode + snap photo + anchor location
│   └── ItemDetailScreen.tsx view an item, see map back to it, stop tracking
├── services/
│   ├── storage.ts           AsyncStorage wrapper for tracked items
│   ├── locationTracker.ts   background geofence + distance math
│   └── alarm.ts             sound + speech + notification
└── types.ts                 TrackedItem shape
```

## Getting started

```bash
npm install
npm start           # launches Expo dev tools
npm run ios         # or: npm run android
```

You'll need the Expo Go app on your device (or a dev build for background
location in production).

## Permissions

The app requests:

- **Camera** — barcode scanning + photographing the item.
- **Location (while using + background)** — so we can check distance after
  you've put the phone away.
- **Notifications** — to alert you if the app isn't in the foreground.

## Roadmap

- [ ] Custom alert distance (per item, not just 1,000 ft).
- [ ] Lookup product name/image from barcode via a public database.
- [ ] "Snooze" or "I got it back" one-tap dismiss.
- [ ] Multi-item tracking (bag, keys, laptop) with named alarms.
- [ ] Optional share-with-family so a partner gets notified too.

## License

MIT — see [LICENSE](./LICENSE).
