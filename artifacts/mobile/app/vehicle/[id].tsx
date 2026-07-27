import React, { useMemo } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '@/hooks/useColors';
import { useVehicles, getVehicleStats } from '@/context/VehiclesContext';
import { CircularGauge } from '@/components/CircularGauge';
import { MileageLineChart } from '@/components/MileageLineChart';
import { StatCard } from '@/components/StatCard';
import { FuelEntryRow } from '@/components/FuelEntryRow';
import { GlassCard } from '@/components/GlassCard';
import { FuelEntry } from '@/types';

export default function VehicleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { getVehicle, deleteFuelEntry, deleteVehicle } = useVehicles();

  const vehicle = getVehicle(id ?? '');
  const stats = useMemo(() => vehicle ? getVehicleStats(vehicle) : null, [vehicle]);

  if (!vehicle || !stats) {
    return (
      <View style={[styles.notFound, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.foreground }}>Vehicle not found</Text>
      </View>
    );
  }

  const sortedEntries = [...vehicle.fuelEntries].reverse();

  const chartData = vehicle.fuelEntries.slice(-10).map((e, i) => ({
    label: `#${vehicle.fuelEntries.length - (vehicle.fuelEntries.slice(-10).length - 1 - i)}`,
    value: e.mileage,
  }));

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const handleDeleteEntry = (entry: FuelEntry) => {
    Alert.alert('Delete Entry', 'Remove this fuel entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteFuelEntry(vehicle.id, entry.id);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        },
      },
    ]);
  };

  const handleDeleteVehicle = () => {
    Alert.alert(
      'Delete Vehicle',
      `Delete "${vehicle.name}" and all ${vehicle.fuelEntries.length} fuel entries?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteVehicle(vehicle.id);
            router.back();
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: topPad + 8, borderBottomColor: colors.border },
        ]}
      >
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]} numberOfLines={1}>
            {vehicle.name}
          </Text>
          <Text style={[styles.headerType, { color: colors.mutedForeground }]}>
            {vehicle.type.charAt(0).toUpperCase() + vehicle.type.slice(1)}
          </Text>
        </View>
        <Pressable onPress={handleDeleteVehicle} style={styles.backBtn}>
          <MaterialCommunityIcons name="delete-outline" size={22} color={colors.destructive} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Top stats */}
        <View style={styles.gaugeRow}>
          <CircularGauge value={stats.avgMileage} size={150} label="Avg Mileage" />
          <View style={styles.sideStats}>
            <GlassCard style={{ marginBottom: 10 }}>
              <Text style={[styles.sideStatVal, { color: colors.neonPink }]}>
                {stats.currentOdometer.toLocaleString()}
              </Text>
              <Text style={[styles.sideStatLbl, { color: colors.mutedForeground }]}>km odometer</Text>
            </GlassCard>
            <GlassCard>
              <Text style={[styles.sideStatVal, { color: colors.foreground }]}>
                {stats.totalDistance.toLocaleString()}
              </Text>
              <Text style={[styles.sideStatLbl, { color: colors.mutedForeground }]}>km tracked</Text>
            </GlassCard>
          </View>
        </View>

        {/* Stat cards */}
        <View style={styles.statRow}>
          <StatCard
            icon="trophy"
            label="Best"
            value={stats.bestMileage > 0 ? `${stats.bestMileage.toFixed(1)} km/L` : '—'}
            accent
            style={{ marginRight: 8 }}
          />
          <StatCard
            icon="arrow-down-circle"
            label="Worst"
            value={stats.worstMileage > 0 ? `${stats.worstMileage.toFixed(1)} km/L` : '—'}
            style={{ marginRight: 8, marginLeft: 8 }}
          />
          <StatCard
            icon="gas-station"
            label="Total Fuel"
            value={`${stats.totalFuel} L`}
            style={{ marginLeft: 8 }}
          />
        </View>

        {/* Chart */}
        {vehicle.fuelEntries.length > 1 && (
          <GlassCard style={styles.chartCard}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Mileage Trend</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <MileageLineChart data={chartData} height={160} />
            </ScrollView>
          </GlassCard>
        )}

        {/* Add Fuel Button */}
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push(`/add-fuel?vehicleId=${vehicle.id}`);
          }}
          style={styles.addFuelBtnWrapper}
        >
          <LinearGradient
            colors={[colors.neonPink, colors.neonPurple]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.addFuelBtn}
          >
            <MaterialCommunityIcons name="fuel" size={24} color="#FFFFFF" />
            <Text style={styles.addFuelText}>Add Fuel Entry</Text>
          </LinearGradient>
        </Pressable>

        {/* Fuel history */}
        <View style={[styles.historyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.historyHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Fuel History</Text>
            <Text style={[styles.entryCount, { color: colors.mutedForeground }]}>
              {vehicle.fuelEntries.length} entries
            </Text>
          </View>

          {sortedEntries.length === 0 ? (
            <View style={styles.emptyHistory}>
              <MaterialCommunityIcons name="fuel" size={40} color={colors.border} />
              <Text style={[styles.emptyHistoryText, { color: colors.mutedForeground }]}>
                No fuel entries yet
              </Text>
              <Text style={[styles.emptyHistoryHint, { color: colors.mutedForeground }]}>
                Swipe left on an entry to delete it
              </Text>
            </View>
          ) : (
            sortedEntries.map((entry, i) => (
              <FuelEntryRow
                key={entry.id}
                entry={entry}
                isFirst={i === 0}
                onDelete={() => handleDeleteEntry(entry)}
              />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: 'Inter_600SemiBold',
  },
  headerType: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  gaugeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  sideStats: {
    flex: 1,
  },
  sideStatVal: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    marginBottom: 2,
  },
  sideStatLbl: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
  statRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  chartCard: {
    padding: 16,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 12,
  },
  addFuelBtnWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#C84BFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 6,
  },
  addFuelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  addFuelText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  historyCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 8,
  },
  entryCount: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  emptyHistory: {
    alignItems: 'center',
    padding: 32,
    gap: 10,
  },
  emptyHistoryText: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
  },
  emptyHistoryHint: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
});
