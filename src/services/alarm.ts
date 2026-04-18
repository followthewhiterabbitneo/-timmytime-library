import { Audio } from 'expo-av';
import * as Notifications from 'expo-notifications';
import * as Speech from 'expo-speech';
import type { TrackedItem } from '../types';

export async function configureNotifications(): Promise<void> {
  await Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
  await Notifications.requestPermissionsAsync();
}

export async function triggerForgotAlarm(item: TrackedItem): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `You forgot your ${item.name}`,
      body: 'Tap to see where you left it.',
      data: { itemId: item.id },
      sound: 'default',
    },
    trigger: null,
  });

  await playAlarmTone();
  Speech.speak(`Hey — you forgot your ${item.name}.`, {
    rate: 0.95,
    pitch: 1.0,
  });
}

async function playAlarmTone(): Promise<void> {
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
    });
    const { sound } = await Audio.Sound.createAsync(
      require('../../assets/alarm.mp3'),
      { shouldPlay: true, volume: 1.0 }
    );
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync();
      }
    });
  } catch {
    // Alarm asset is optional in the scaffold; speech + notification still fire.
  }
}
