import React, { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useVehicles } from '@/context/VehiclesContext';
import { VehicleCard } from '@/components/VehicleCard';
import { Vehicle } from '@/types';

type SortMode = 'name' | 'updated';

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { vehicles, deleteVehicle, updateVehicleName, exportData, importFromJson } = useVehicles();
  const [search, setSearch] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('updated');

  const filtered = useMemo(() => {
    let list = vehicles;
    if (search.trim()) {
      list = list.filter(v => v.name.toLowerCase().includes(search.toLowerCase()));
    }
    return [...list].sort((a, b) => {
      if (sortMode === 'name') return a.name.localeCompare(b.name);
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [vehicles, search, sortMode]);

  const handleLongPress = (vehicle: Vehicle) => {
    Alert.alert(vehicle.name, 'What would you like to do?', [
      {
        text: 'Rename',
        onPress: () => {
          Alert.prompt(
            'Rename Vehicle',
            'Enter a new name:',
            (newName) => {
              if (newName?.trim()) updateVehicleName(vehicle.id, newName.trim());
            },
            'plain-text',
            vehicle.name
          );
        },
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          Alert.alert(
            'Delete Vehicle',
            `Delete "${vehicle.name}" and all its fuel entries?`,
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: () => deleteVehicle(vehicle.id),
              },
            ]
          );
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleExport = async () => {
    await exportData();
  };

  const handleImport = () => {
    router.push('/import-data');
  };

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: topPad + 12,
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>
              Mileage Tracker
            </Text>
            <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
              {vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              onPress={handleImport}
              style={[styles.actionBtn, { backgroundColor: colors.muted }]}
            >
              <Ionicons name="download-outline" size={20} color={colors.mutedForeground} />
            </Pressable>
            <Pressable
              onPress={handleExport}
              style={[styles.actionBtn, { backgroundColor: colors.muted }]}
            >
              <Ionicons name="share-outline" size={20} color={colors.mutedForeground} />
            </Pressable>
            <Pressable
              onPress={() =>
                setSortMode(s => (s === 'name' ? 'updated' : 'name'))
              }
              style={[
                styles.actionBtn,
                {
                  backgroundColor:
                    sortMode === 'name'
                      ? `${colors.neonPurple}33`
                      : colors.muted,
                },
              ]}
            >
              <MaterialCommunityIcons
                name={sortMode === 'name' ? 'sort-alphabetical-ascending' : 'sort-clock-descending-outline'}
                size={20}
                color={sortMode === 'name' ? colors.neonPurple : colors.mutedForeground}
              />
            </Pressable>
          </View>
        </View>

        {/* Search */}
        <View style={[styles.searchBar, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          <Ionicons name="search" size={18} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search vehicles..."
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={colors.mutedForeground} />
            </Pressable>
          )}
        </View>
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <VehicleCard
            vehicle={item}
            onPress={() => router.push(`/vehicle/${item.id}`)}
            onLongPress={() => handleLongPress(item)}
          />
        )}
        contentContainerStyle={[
          styles.listContent,
          filtered.length === 0 && styles.emptyContent,
          { paddingBottom: (Platform.OS === 'web' ? 34 : insets.bottom) + 100 },
        ]}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="car-off"
              size={60}
              color={colors.border}
            />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              {search ? 'No results found' : 'No vehicles yet'}
            </Text>
            <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
              {search
                ? 'Try a different search term'
                : 'Tap + to add your first vehicle'}
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />

      {/* FAB */}
      <View
        style={[
          styles.fab,
          { bottom: (Platform.OS === 'web' ? 34 : insets.bottom) + 24 },
        ]}
      >
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push('/add-vehicle');
          }}
          style={{ borderRadius: 28, overflow: 'hidden' }}
        >
          <LinearGradient
            colors={[colors.neonPink, colors.neonPurple]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fabInner}
          >
            <Ionicons name="add" size={30} color="#FFFFFF" />
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 26,
    fontFamily: 'Inter_700Bold',
  },
  headerSub: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    padding: 0,
  },
  listContent: {
    paddingTop: 8,
  },
  emptyContent: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Inter_600SemiBold',
    marginTop: 8,
  },
  emptyDesc: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  fab: {
    position: 'absolute',
    right: 20,
    shadowColor: '#C84BFF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 10,
  },
  fabInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
