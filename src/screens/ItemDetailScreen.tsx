import { useCallback, useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { getItem, removeItem } from '../services/storage';
import { distanceMeters, getCurrentCoords } from '../services/locationTracker';
import type { TrackedItem } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'ItemDetail'>;

export default function ItemDetailScreen({ route, navigation }: Props) {
  const [item, setItem] = useState<TrackedItem | null>(null);
  const [distance, setDistance] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        const found = await getItem(route.params.itemId);
        if (cancelled) return;
        setItem(found ?? null);
        if (found) {
          try {
            const coords = await getCurrentCoords();
            if (!cancelled) {
              setDistance(distanceMeters(coords, found.anchor));
            }
          } catch {
            // ignore
          }
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [route.params.itemId])
  );

  const openWalkingDirections = () => {
    if (!item) return;
    const { latitude, longitude } = item.anchor;
    const url = Platform.select({
      ios: `http://maps.apple.com/?daddr=${latitude},${longitude}&dirflg=w`,
      android: `google.navigation:q=${latitude},${longitude}&mode=w`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=walking`,
    });
    if (url) Linking.openURL(url);
  };

  const stopTracking = async () => {
    if (!item) return;
    Alert.alert('Stop tracking this item?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Stop',
        style: 'destructive',
        onPress: async () => {
          await removeItem(item.id);
          navigation.goBack();
        },
      },
    ]);
  };

  if (!item) {
    return (
      <View style={styles.center}>
        <Text>Item not found.</Text>
      </View>
    );
  }

  const feet = distance != null ? Math.round(distance * 3.28084) : null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image source={{ uri: item.photoUri }} style={styles.photo} />
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.barcode}>Barcode: {item.barcode}</Text>
          {feet != null && (
            <Text style={styles.distance}>
              You are {feet} ft away
              {feet >= 1000 ? ' — go back!' : ''}
            </Text>
          )}
        </View>
      </View>

      <MapView
        style={styles.map}
        initialRegion={{
          latitude: item.anchor.latitude,
          longitude: item.anchor.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        }}
      >
        <Marker coordinate={item.anchor} title={item.name} />
      </MapView>

      <View style={styles.actions}>
        <Pressable style={styles.primary} onPress={openWalkingDirections}>
          <Text style={styles.primaryText}>Walk me back</Text>
        </Pressable>
        <Pressable style={styles.secondary} onPress={stopTracking}>
          <Text style={styles.secondaryText}>I got it back · stop tracking</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
  },
  photo: { width: 88, height: 88, borderRadius: 12, marginRight: 14, backgroundColor: '#eee' },
  name: { fontSize: 20, fontWeight: '700' },
  barcode: { fontSize: 13, color: '#666', marginTop: 4 },
  distance: { fontSize: 14, color: '#111', marginTop: 6, fontWeight: '600' },
  map: { flex: 1 },
  actions: { padding: 16, gap: 10 },
  primary: {
    backgroundColor: '#111',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  secondary: {
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  secondaryText: { color: '#222', fontSize: 15 },
});
