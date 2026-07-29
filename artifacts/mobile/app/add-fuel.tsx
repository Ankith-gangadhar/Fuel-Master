import React, { useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useVehicles, getVehicleStats } from '@/context/VehiclesContext';
import { GlowButton } from '@/components/GlowButton';
import { GlassCard } from '@/components/GlassCard';

export default function AddFuelScreen() {
  const { vehicleId } = useLocalSearchParams<{ vehicleId: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { getVehicle, addFuelEntry } = useVehicles();

  const vehicle = getVehicle(vehicleId ?? '');
  const stats = useMemo(() => vehicle ? getVehicleStats(vehicle) : null, [vehicle]);

  const [odometer, setOdometer] = useState('');
  const [litres, setLitres] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [reachedReserve, setReachedReserve] = useState(false);
  const [reserveOdometer, setReserveOdometer] = useState('');
  const [errors, setErrors] = useState<{ odometer?: string; litres?: string; date?: string; reserveOdometer?: string }>({});

  const prevOdo = stats
    ? vehicle!.fuelEntries.length > 0
      ? vehicle!.fuelEntries[vehicle!.fuelEntries.length - 1].odometer
      : vehicle!.initialOdometer
    : 0;

  // Live preview calculation using reserve tank offset
  const preview = useMemo(() => {
    const odo = parseFloat(odometer);
    const l = parseFloat(litres);
    const resOdo = parseFloat(reserveOdometer);

    const hasPrev = vehicle && vehicle.fuelEntries.length > 0;
    const prevLiters = hasPrev ? vehicle.fuelEntries[vehicle.fuelEntries.length - 1].litresFilled : 0;
    const prevOffset = hasPrev ? (vehicle.fuelEntries[vehicle.fuelEntries.length - 1].reserveOffset ?? 0) : 0;

    if (isNaN(odo) || isNaN(l) || l <= 0) return null;

    if (reachedReserve) {
      if (isNaN(resOdo) || resOdo <= prevOdo || odo < resOdo) return null;
      const displayedDistance = resOdo - prevOdo;
      const actualDistance = Math.max(0, displayedDistance - prevOffset);
      const reserveOffset = odo - resOdo;
      const mileage = prevLiters > 0 ? (actualDistance / prevLiters).toFixed(2) : null;
      return { displayedDistance, actualDistance, reserveOffset, mileage, hasPrev, prevLiters, prevOffset };
    } else {
      if (odo <= prevOdo) return null;
      const displayedDistance = odo - prevOdo;
      const actualDistance = Math.max(0, displayedDistance - prevOffset);
      const mileage = prevLiters > 0 ? (actualDistance / prevLiters).toFixed(2) : null;
      return { displayedDistance, actualDistance, reserveOffset: 0, mileage, hasPrev, prevLiters, prevOffset };
    }
  }, [odometer, litres, reachedReserve, reserveOdometer, prevOdo, vehicle]);

  const validate = () => {
    const e: typeof errors = {};
    const odo = parseFloat(odometer);
    if (!odometer || isNaN(odo)) e.odometer = 'Enter a valid odometer reading';
    else if (odo <= prevOdo) e.odometer = `Must be greater than ${prevOdo.toLocaleString()} km`;

    if (reachedReserve) {
      const resOdo = parseFloat(reserveOdometer);
      if (!reserveOdometer || isNaN(resOdo)) {
        e.reserveOdometer = 'Enter reserve odometer';
      } else if (resOdo <= prevOdo) {
        e.reserveOdometer = `Must be greater than previous refill (${prevOdo.toLocaleString()} km)`;
      } else if (resOdo > odo) {
        e.reserveOdometer = 'Cannot be greater than refill odometer';
      }
    }

    const l = parseFloat(litres);
    if (!litres || isNaN(l) || l <= 0) e.litres = 'Enter litres filled (must be > 0)';
    if (!date) e.date = 'Enter a valid date';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    const result = addFuelEntry(vehicleId!, {
      odometer: parseFloat(odometer),
      litresFilled: parseFloat(litres),
      date,
      reachedReserve,
      reserveOdometer: reachedReserve ? parseFloat(reserveOdometer) : undefined,
    });
    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } else {
      setErrors({ odometer: result.error });
    }
  };

  if (!vehicle) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.foreground }}>Vehicle not found</Text>
      </View>
    );
  }

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: topPad + 8, borderBottomColor: colors.border },
        ]}
      >
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <MaterialCommunityIcons name="close" size={24} color={colors.foreground} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Add Fuel Entry</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>{vehicle.name}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.form,
          { paddingBottom: (Platform.OS === 'web' ? 34 : insets.bottom) + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Previous odometer info */}
        <GlassCard style={{ marginBottom: 8 }}>
          <View style={styles.prevRow}>
            <MaterialCommunityIcons name="speedometer" size={20} color={colors.mutedForeground} />
            <Text style={[styles.prevLabel, { color: colors.mutedForeground }]}>
              Previous odometer:
            </Text>
            <Text style={[styles.prevValue, { color: colors.foreground }]}>
              {prevOdo.toLocaleString()} km
            </Text>
          </View>
        </GlassCard>

        {/* Reached Reserve Toggle */}
        <View style={[styles.toggleContainer, { borderColor: colors.border }]}>
          <Text style={[styles.toggleLabel, { color: colors.foreground }]}>
            Reached reserve before refilling?
          </Text>
          <Pressable
            onPress={() => {
              setReachedReserve(!reachedReserve);
              setReserveOdometer('');
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            style={[
              styles.switch,
              {
                backgroundColor: reachedReserve ? colors.neonPurple : colors.muted,
                borderColor: reachedReserve ? colors.neonPurple : colors.border,
              },
            ]}
          >
            <View
              style={[
                styles.switchThumb,
                {
                  backgroundColor: '#FFFFFF',
                  transform: [{ translateX: reachedReserve ? 20 : 0 }],
                },
              ]}
            />
          </Pressable>
        </View>

        {reachedReserve && (
          <>
            {/* Reserve Odometer */}
            <Text style={[styles.label, { color: colors.foreground }]}>Reserve Odometer (km)</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.muted,
                  color: colors.foreground,
                  borderColor: errors.reserveOdometer ? colors.destructive : colors.border,
                },
              ]}
              placeholder={`When did it reach reserve? (> ${prevOdo.toLocaleString()})`}
              placeholderTextColor={colors.mutedForeground}
              value={reserveOdometer}
              onChangeText={t => { setReserveOdometer(t); setErrors(e => ({ ...e, reserveOdometer: undefined })); }}
              keyboardType="numeric"
            />
            {errors.reserveOdometer && (
              <Text style={[styles.errorText, { color: colors.destructive }]}>{errors.reserveOdometer}</Text>
            )}
          </>
        )}

        {/* Current Odometer */}
        <Text style={[styles.label, { color: colors.foreground }]}>
          {reachedReserve ? 'Refill Odometer (km)' : 'Current Odometer (km)'}
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.muted,
              color: colors.foreground,
              borderColor: errors.odometer ? colors.destructive : colors.border,
            },
          ]}
          placeholder={`Greater than ${prevOdo.toLocaleString()}`}
          placeholderTextColor={colors.mutedForeground}
          value={odometer}
          onChangeText={t => { setOdometer(t); setErrors(e => ({ ...e, odometer: undefined })); }}
          keyboardType="numeric"
        />
        {errors.odometer && (
          <Text style={[styles.errorText, { color: colors.destructive }]}>{errors.odometer}</Text>
        )}

        {/* Litres Filled */}
        <Text style={[styles.label, { color: colors.foreground }]}>Litres Filled</Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.muted,
              color: colors.foreground,
              borderColor: errors.litres ? colors.destructive : colors.border,
            },
          ]}
          placeholder="e.g. 35.5"
          placeholderTextColor={colors.mutedForeground}
          value={litres}
          onChangeText={t => { setLitres(t); setErrors(e => ({ ...e, litres: undefined })); }}
          keyboardType="decimal-pad"
        />
        {errors.litres && (
          <Text style={[styles.errorText, { color: colors.destructive }]}>{errors.litres}</Text>
        )}

        {/* Date */}
        <Text style={[styles.label, { color: colors.foreground }]}>Date</Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.muted,
              color: colors.foreground,
              borderColor: errors.date ? colors.destructive : colors.border,
            },
          ]}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={colors.mutedForeground}
          value={date}
          onChangeText={t => { setDate(t); setErrors(e => ({ ...e, date: undefined })); }}
        />
        {errors.date && (
          <Text style={[styles.errorText, { color: colors.destructive }]}>{errors.date}</Text>
        )}

        {/* Live Mileage Preview */}
        {preview && (
          <GlassCard glow style={{ marginTop: 8 }}>
            <Text style={[styles.previewTitle, { color: colors.mutedForeground }]}>
              Calculation Preview
            </Text>
            
            {preview.hasPrev ? (
              <View style={{ gap: 12 }}>
                <View style={styles.previewRow}>
                  <View style={styles.previewItem}>
                    <Text style={[styles.previewValue, { color: colors.neonPink }]}>
                      {preview.mileage ? `${preview.mileage} km/L` : '—'}
                    </Text>
                    <Text style={[styles.previewLabel, { color: colors.mutedForeground }]}>
                      Mileage (of prev fill's {preview.prevLiters}L)
                    </Text>
                  </View>
                  <View style={[styles.previewDivider, { backgroundColor: colors.border }]} />
                  <View style={styles.previewItem}>
                    <Text style={[styles.previewValue, { color: colors.foreground }]}>
                      {preview.actualDistance} km
                    </Text>
                    <Text style={[styles.previewLabel, { color: colors.mutedForeground }]}>
                      Actual Main Tank Dist
                    </Text>
                  </View>
                </View>

                {/* Formula details */}
                <View style={{ borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10, gap: 4 }}>
                  <Text style={{ fontSize: 11, color: colors.mutedForeground }}>
                    • Displayed Distance: <Text style={{ color: colors.foreground, fontFamily: 'Inter_600SemiBold' }}>{preview.displayedDistance} km</Text>
                  </Text>
                  {preview.prevOffset > 0 && (
                    <Text style={{ fontSize: 11, color: colors.mutedForeground }}>
                      • Previous Reserve Offset: <Text style={{ color: colors.destructive, fontFamily: 'Inter_600SemiBold' }}>-{preview.prevOffset} km</Text>
                    </Text>
                  )}
                  {reachedReserve && preview.reserveOffset > 0 && (
                    <Text style={{ fontSize: 11, color: colors.mutedForeground }}>
                      • New Reserve Offset (offset for next fill): <Text style={{ color: colors.neonPurple, fontFamily: 'Inter_600SemiBold' }}>+{preview.reserveOffset} km</Text>
                    </Text>
                  )}
                </View>
              </View>
            ) : (
              <View style={{ paddingVertical: 8, alignItems: 'center' }}>
                <MaterialCommunityIcons name="information-outline" size={24} color={colors.neonPurple} />
                <Text style={{ fontSize: 13, fontFamily: 'Inter_500Medium', color: colors.foreground, marginTop: 8, textAlign: 'center' }}>
                  First Refill Entry
                </Text>
                <Text style={{ fontSize: 11, color: colors.mutedForeground, marginTop: 2, textAlign: 'center' }}>
                  This establishes the baseline. Mileage will be calculated on the next refill.
                </Text>
                {reachedReserve && preview.reserveOffset > 0 && (
                  <Text style={{ fontSize: 11, color: colors.neonPurple, fontFamily: 'Inter_600SemiBold', marginTop: 8 }}>
                    Reserve Offset: {preview.reserveOffset} km
                  </Text>
                )}
              </View>
            )}
          </GlassCard>
        )}

        {/* Save */}
        <GlowButton
          title="Save Entry"
          onPress={handleSave}
          fullWidth
          size="lg"
          style={{ marginTop: 8 }}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  closeBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: {
    fontSize: 17,
    fontFamily: 'Inter_600SemiBold',
  },
  headerSub: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  form: {
    padding: 20,
    gap: 8,
  },
  prevRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  prevLabel: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    flex: 1,
  },
  prevValue: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  label: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 8,
    marginTop: 8,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    borderWidth: 1,
  },
  errorText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 4,
  },
  previewTitle: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewItem: {
    flex: 1,
    alignItems: 'center',
  },
  previewDivider: {
    width: 1,
    height: 40,
    marginHorizontal: 16,
  },
  previewValue: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    marginBottom: 4,
  },
  previewLabel: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginTop: 8,
    marginBottom: 4,
  },
  toggleLabel: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  switch: {
    width: 46,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    padding: 2,
    justifyContent: 'center',
  },
  switchThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
});
