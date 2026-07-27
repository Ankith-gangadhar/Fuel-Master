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
  const [errors, setErrors] = useState<{ odometer?: string; litres?: string; date?: string }>({});

  const prevOdo = stats
    ? vehicle!.fuelEntries.length > 0
      ? vehicle!.fuelEntries[vehicle!.fuelEntries.length - 1].odometer
      : vehicle!.initialOdometer
    : 0;

  // Live preview calculation
  const preview = useMemo(() => {
    const odo = parseFloat(odometer);
    const l = parseFloat(litres);
    if (isNaN(odo) || isNaN(l) || odo <= prevOdo || l <= 0) return null;
    const distance = odo - prevOdo;
    const mileage = distance / l;
    return { distance, mileage: mileage.toFixed(2) };
  }, [odometer, litres, prevOdo]);

  const validate = () => {
    const e: typeof errors = {};
    const odo = parseFloat(odometer);
    if (!odometer || isNaN(odo)) e.odometer = 'Enter a valid odometer reading';
    else if (odo <= prevOdo) e.odometer = `Must be greater than ${prevOdo.toLocaleString()} km`;
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

        {/* Current Odometer */}
        <Text style={[styles.label, { color: colors.foreground }]}>Current Odometer (km)</Text>
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
          autoFocus
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
              Calculated Mileage
            </Text>
            <View style={styles.previewRow}>
              <View style={styles.previewItem}>
                <Text style={[styles.previewValue, { color: colors.neonPink }]}>
                  {preview.mileage} km/L
                </Text>
                <Text style={[styles.previewLabel, { color: colors.mutedForeground }]}>
                  mileage
                </Text>
              </View>
              <View style={[styles.previewDivider, { backgroundColor: colors.border }]} />
              <View style={styles.previewItem}>
                <Text style={[styles.previewValue, { color: colors.foreground }]}>
                  {preview.distance.toLocaleString()} km
                </Text>
                <Text style={[styles.previewLabel, { color: colors.mutedForeground }]}>
                  distance travelled
                </Text>
              </View>
            </View>
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
});
