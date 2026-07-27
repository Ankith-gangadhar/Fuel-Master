import React, { useMemo } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useVehicles, getVehicleStats } from '@/context/VehiclesContext';
import { StatCard } from '@/components/StatCard';
import { GlassCard } from '@/components/GlassCard';

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { vehicles } = useVehicles();

  const global = useMemo(() => {
    if (vehicles.length === 0) return null;
    let totalDistance = 0;
    let totalFuel = 0;
    let allEntries = 0;
    let bestMileage = 0;
    let worstMileage = Infinity;
    const vehicleStats = vehicles.map(v => ({ vehicle: v, stats: getVehicleStats(v) }));

    for (const { stats } of vehicleStats) {
      totalDistance += stats.totalDistance;
      totalFuel += stats.totalFuel;
      allEntries += stats.lastEntry ? vehicles.find(v => getVehicleStats(v).lastEntry?.id === stats.lastEntry?.id)?.fuelEntries.length ?? 0 : 0;
      if (stats.avgMileage > bestMileage) bestMileage = stats.avgMileage;
      if (stats.avgMileage > 0 && stats.avgMileage < worstMileage) worstMileage = stats.avgMileage;
    }
    const avgMileage = totalFuel > 0 ? parseFloat((totalDistance / totalFuel).toFixed(2)) : 0;
    return { totalDistance, totalFuel: parseFloat(totalFuel.toFixed(2)), avgMileage, bestMileage, worstMileage: worstMileage === Infinity ? 0 : worstMileage, vehicleStats };
  }, [vehicles]);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: topPad + 16, paddingBottom: bottomPad + 80 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.title, { color: colors.foreground }]}>Dashboard</Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
        Combined stats across all vehicles
      </Text>

      {vehicles.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="chart-line-variant" size={64} color={colors.border} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No data yet</Text>
          <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
            Add vehicles and fuel entries to see your dashboard
          </Text>
        </View>
      ) : (
        <>
          {/* Global stats grid */}
          <View style={styles.gridRow}>
            <StatCard icon="map-marker-distance" label="Total Distance" value={`${global!.totalDistance.toLocaleString()} km`} accent style={{ marginRight: 8 }} />
            <StatCard icon="gas-station" label="Total Fuel" value={`${global!.totalFuel} L`} style={{ marginLeft: 8 }} />
          </View>
          <View style={styles.gridRow}>
            <StatCard icon="speedometer" label="Avg Mileage" value={global!.avgMileage > 0 ? `${global!.avgMileage} km/L` : '—'} accent style={{ marginRight: 8 }} />
            <StatCard icon="car-multiple" label="Vehicles" value={`${vehicles.length}`} style={{ marginLeft: 8 }} />
          </View>
          <View style={styles.gridRow}>
            <StatCard icon="trophy" label="Best Mileage" value={global!.bestMileage > 0 ? `${global!.bestMileage.toFixed(1)} km/L` : '—'} accent style={{ marginRight: 8 }} />
            <StatCard icon="arrow-down-circle" label="Lowest Mileage" value={global!.worstMileage > 0 ? `${global!.worstMileage.toFixed(1)} km/L` : '—'} style={{ marginLeft: 8 }} />
          </View>

          {/* Per-vehicle breakdown */}
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Per Vehicle</Text>

          {global!.vehicleStats.map(({ vehicle, stats }) => (
            <GlassCard key={vehicle.id} style={{ marginBottom: 12 }}>
              <View style={styles.vehicleRow}>
                <View style={[styles.vehicleIcon, { backgroundColor: `${colors.neonPurple}22` }]}>
                  <MaterialCommunityIcons
                    name={vehicle.type === 'car' ? 'car' : vehicle.type === 'bike' ? 'motorbike' : vehicle.type === 'scooter' ? 'scooter' : 'truck'}
                    size={22}
                    color={colors.neonPurple}
                  />
                </View>
                <Text style={[styles.vehicleName, { color: colors.foreground }]}>{vehicle.name}</Text>
                <Text style={[styles.vehicleMileage, { color: colors.neonPink }]}>
                  {stats.avgMileage > 0 ? `${stats.avgMileage} km/L` : '—'}
                </Text>
              </View>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.miniStats}>
                <View style={styles.miniStat}>
                  <Text style={[styles.miniVal, { color: colors.foreground }]}>
                    {stats.totalDistance.toLocaleString()} km
                  </Text>
                  <Text style={[styles.miniLbl, { color: colors.mutedForeground }]}>distance</Text>
                </View>
                <View style={styles.miniStat}>
                  <Text style={[styles.miniVal, { color: colors.foreground }]}>
                    {stats.totalFuel} L
                  </Text>
                  <Text style={[styles.miniLbl, { color: colors.mutedForeground }]}>fuel used</Text>
                </View>
                <View style={styles.miniStat}>
                  <Text style={[styles.miniVal, { color: colors.foreground }]}>
                    {vehicle.fuelEntries.length}
                  </Text>
                  <Text style={[styles.miniLbl, { color: colors.mutedForeground }]}>fill-ups</Text>
                </View>
                <View style={styles.miniStat}>
                  <Text style={[styles.miniVal, { color: colors.foreground }]}>
                    {stats.currentOdometer.toLocaleString()} km
                  </Text>
                  <Text style={[styles.miniLbl, { color: colors.mutedForeground }]}>odometer</Text>
                </View>
              </View>
            </GlassCard>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 26,
    fontFamily: 'Inter_700Bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    marginBottom: 20,
  },
  gridRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    marginTop: 8,
    marginBottom: 14,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Inter_600SemiBold',
  },
  emptyDesc: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  vehicleIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  vehicleName: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  vehicleMileage: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
  },
  divider: {
    height: 1,
    marginBottom: 12,
  },
  miniStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  miniStat: {
    alignItems: 'center',
    flex: 1,
  },
  miniVal: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  miniLbl: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
});
