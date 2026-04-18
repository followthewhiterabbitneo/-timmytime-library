import { useCallback, useState } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { loadItems } from '../services/storage';
import type { TrackedItem } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const [items, setItems] = useState<TrackedItem[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadItems().then(setItems);
    }, [])
  );

  return (
    <View style={styles.container}>
      {items.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Nothing tracked yet</Text>
          <Text style={styles.emptyBody}>
            Scan an item and TimmyTime will yell at you if you wander more than
            1,000 feet from it.
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <Pressable
              style={styles.row}
              onPress={() =>
                navigation.navigate('ItemDetail', { itemId: item.id })
              }
            >
              <Image source={{ uri: item.photoUri }} style={styles.thumb} />
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.meta}>
                  {item.alerted ? 'ALERTED' : 'Watching'} · {item.barcode}
                </Text>
              </View>
            </Pressable>
          )}
        />
      )}

      <Pressable
        style={styles.fab}
        onPress={() => navigation.navigate('Scan')}
      >
        <Text style={styles.fabText}>+ Scan item</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyTitle: { fontSize: 20, fontWeight: '600', marginBottom: 8 },
  emptyBody: { fontSize: 15, color: '#555', textAlign: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 10,
    borderRadius: 12,
    backgroundColor: '#f5f5f7',
  },
  thumb: { width: 56, height: 56, borderRadius: 8, marginRight: 12, backgroundColor: '#ddd' },
  name: { fontSize: 16, fontWeight: '600' },
  meta: { fontSize: 13, color: '#666', marginTop: 2 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 28,
    backgroundColor: '#111',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 28,
  },
  fabText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
