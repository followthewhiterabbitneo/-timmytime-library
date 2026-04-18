import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { BarCodeScanner, BarCodeScannerResult } from 'expo-barcode-scanner';
import { CameraView, useCameraPermissions } from 'expo-camera';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { upsertItem } from '../services/storage';
import { getCurrentCoords } from '../services/locationTracker';
import { DEFAULT_ALERT_RADIUS_METERS } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Scan'>;

type Stage = 'scan' | 'photo' | 'name';

export default function ScanScreen({ navigation }: Props) {
  const [stage, setStage] = useState<Stage>('scan');
  const [barcode, setBarcode] = useState<string>('');
  const [photoUri, setPhotoUri] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView | null>(null);

  useEffect(() => {
    if (!permission?.granted) requestPermission();
  }, [permission, requestPermission]);

  const onBarcode = (result: BarCodeScannerResult) => {
    if (barcode) return;
    setBarcode(result.data);
    setStage('photo');
  };

  const takePhoto = async () => {
    if (!cameraRef.current) return;
    const pic = await cameraRef.current.takePictureAsync({ quality: 0.6 });
    if (pic?.uri) {
      setPhotoUri(pic.uri);
      setStage('name');
    }
  };

  const saveItem = async () => {
    if (!name.trim()) {
      Alert.alert('Give it a name', 'e.g. "Pretzels" or "Backpack"');
      return;
    }
    try {
      const coords = await getCurrentCoords();
      await upsertItem({
        id: `${Date.now()}`,
        name: name.trim(),
        barcode,
        photoUri,
        anchor: {
          latitude: coords.latitude,
          longitude: coords.longitude,
        },
        alertRadiusMeters: DEFAULT_ALERT_RADIUS_METERS,
        createdAt: Date.now(),
        alerted: false,
      });
      navigation.popToTop();
    } catch (e) {
      Alert.alert(
        'Could not save',
        'We need your location to anchor the item. Check location permissions.'
      );
    }
  };

  if (!permission?.granted) {
    return (
      <View style={styles.center}>
        <Text>Camera permission is required.</Text>
      </View>
    );
  }

  if (stage === 'scan') {
    return (
      <View style={styles.container}>
        <BarCodeScanner
          onBarCodeScanned={onBarcode}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.hint}>
          <Text style={styles.hintText}>Point at the barcode</Text>
        </View>
      </View>
    );
  }

  if (stage === 'photo') {
    return (
      <View style={styles.container}>
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFillObject}
          facing="back"
        />
        <View style={styles.bottomBar}>
          <Text style={styles.hintText}>Snap a photo of the item</Text>
          <Pressable style={styles.shutter} onPress={takePhoto}>
            <View style={styles.shutterInner} />
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.namePane}>
      {photoUri ? (
        <Image source={{ uri: photoUri }} style={styles.preview} />
      ) : null}
      <Text style={styles.label}>What is it?</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Pretzels"
        autoFocus
      />
      <Text style={styles.meta}>Barcode: {barcode || 'n/a'}</Text>
      <Pressable style={styles.save} onPress={saveItem}>
        <Text style={styles.saveText}>Anchor here & start watching</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hint: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  hintText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  bottomBar: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  shutter: {
    marginTop: 16,
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
  },
  namePane: { flex: 1, padding: 20, backgroundColor: '#fff' },
  preview: { width: '100%', height: 260, borderRadius: 12, marginBottom: 16 },
  label: { fontSize: 14, color: '#666', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    marginBottom: 10,
  },
  meta: { fontSize: 13, color: '#888', marginBottom: 24 },
  save: {
    backgroundColor: '#111',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
