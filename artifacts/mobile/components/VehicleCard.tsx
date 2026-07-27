import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { Vehicle, VehicleType } from '@/types';
import { getVehicleStats } from '@/context/VehiclesContext';

const VEHICLE_ICONS: Record<VehicleType, string> = {
  car: 'car',
  bike: 'motorbike',
  scooter: 'scooter',
  truck: 'truck',
};

interface VehicleCardProps {
  vehicle: Vehicle;
  onPress: () => void;
  onLongPress: () => void;
}

export function VehicleCard({ vehicle, onPress, onLongPress }: VehicleCardProps) {
  const colors = useColors();
  const scale = useSharedValue(1);
  const stats = getVehicleStats(vehicle);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => scale.value = withSpring(0.97, { damping: 15 });
  const handlePressOut = () => scale.value = withSpring(1, { damping: 15 });

  const handleLongPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onLongPress();
  };

  const lastDate = stats.lastEntry
    ? new Date(stats.lastEntry.date).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '—';

  return (
    <Animated.View
      style={[
        animStyle,
        {
          shadowColor: colors.neonPurple,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 12,
          elevation: 6,
          marginHorizontal: 16,
          marginVertical: 8,
          borderRadius: 20,
        },
      ]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onLongPress={handleLongPress}
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            borderColor: colors.glassBorder,
            borderWidth: 1,
          },
        ]}
      >
        {/* Top row: icon + name + type */}
        <View style={styles.topRow}>
          <LinearGradient
            colors={[colors.neonPink, colors.neonPurple]}
            style={styles.iconContainer}
          >
            <MaterialCommunityIcons
              name={VEHICLE_ICONS[vehicle.type] as any}
              size={26}
              color="#FFFFFF"
            />
          </LinearGradient>

          <View style={styles.titleBlock}>
            <Text
              style={[styles.vehicleName, { color: colors.foreground }]}
              numberOfLines={1}
            >
              {vehicle.name}
            </Text>
            <Text style={[styles.vehicleType, { color: colors.mutedForeground }]}>
              {vehicle.type.charAt(0).toUpperCase() + vehicle.type.slice(1)}
            </Text>
          </View>

          <Pressable onPress={onPress} style={styles.arrowBtn}>
            <Ionicons name="chevron-forward" size={22} color={colors.neonPurple} />
          </Pressable>
        </View>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Last Mileage</Text>
            <Text style={[styles.statValue, { color: colors.neonPink }]}>
              {stats.lastEntry ? `${stats.lastEntry.mileage} km/L` : '—'}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Odometer</Text>
            <Text style={[styles.statValue, { color: colors.foreground }]}>
              {stats.currentOdometer.toLocaleString()} km
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Last Fill</Text>
            <Text style={[styles.statValue, { color: colors.foreground }]}>{lastDate}</Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 16,
    overflow: 'hidden',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  titleBlock: {
    flex: 1,
  },
  vehicleName: {
    fontSize: 17,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 2,
  },
  vehicleType: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    textTransform: 'capitalize',
  },
  arrowBtn: {
    padding: 4,
  },
  divider: {
    height: 1,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    marginBottom: 4,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'center',
  },
});
