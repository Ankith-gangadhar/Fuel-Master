import React, { useState } from 'react';
import {
  Alert,
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
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useVehicles } from '@/context/VehiclesContext';
import { GlowButton } from '@/components/GlowButton';
import { VehicleType } from '@/types';

const VEHICLE_TYPES: { type: VehicleType; label: string; icon: string }[] = [
  { type: 'car', label: 'Car', icon: 'car' },
  { type: 'bike', label: 'Bike', icon: 'motorbike' },
  { type: 'scooter', label: 'Scooter', icon: 'scooter' },
  { type: 'truck', label: 'Truck', icon: 'truck' },
];

export default function AddVehicleScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addVehicle } = useVehicles();
  const [name, setName] = useState('');
  const [vehicleType, setVehicleType] = useState<VehicleType>('car');
  const [odometer, setOdometer] = useState('');
  const [errors, setErrors] = useState<{ name?: string; odometer?: string }>({});

  const validate = () => {
    const e: { name?: string; odometer?: string } = {};
    if (!name.trim()) e.name = 'Vehicle name is required';
    const odo = parseFloat(odometer);
    if (!odometer || isNaN(odo) || odo < 0) e.odometer = 'Enter a valid odometer reading';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    addVehicle({
      name: name.trim(),
      type: vehicleType,
      initialOdometer: parseFloat(odometer),
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

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
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Add Vehicle</Text>
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
        {/* Vehicle Name */}
        <Text style={[styles.label, { color: colors.foreground }]}>Vehicle Name</Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.muted,
              color: colors.foreground,
              borderColor: errors.name ? colors.destructive : colors.border,
            },
          ]}
          placeholder="e.g. Honda City, Royal Enfield"
          placeholderTextColor={colors.mutedForeground}
          value={name}
          onChangeText={t => { setName(t); setErrors(e => ({ ...e, name: undefined })); }}
          autoFocus
        />
        {errors.name && <Text style={[styles.errorText, { color: colors.destructive }]}>{errors.name}</Text>}

        {/* Vehicle Type */}
        <Text style={[styles.label, { color: colors.foreground }]}>Vehicle Type</Text>
        <View style={styles.typeGrid}>
          {VEHICLE_TYPES.map(({ type, label, icon }) => {
            const selected = vehicleType === type;
            return (
              <Pressable
                key={type}
                onPress={() => { setVehicleType(type); Haptics.selectionAsync(); }}
                style={[
                  styles.typeCard,
                  {
                    backgroundColor: selected ? `${colors.neonPurple}33` : colors.muted,
                    borderColor: selected ? colors.neonPurple : colors.border,
                    borderWidth: selected ? 1.5 : 1,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={icon as any}
                  size={28}
                  color={selected ? colors.neonPink : colors.mutedForeground}
                />
                <Text
                  style={[
                    styles.typeLabel,
                    { color: selected ? colors.foreground : colors.mutedForeground },
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Initial Odometer */}
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
          placeholder="e.g. 10000"
          placeholderTextColor={colors.mutedForeground}
          value={odometer}
          onChangeText={t => { setOdometer(t); setErrors(e => ({ ...e, odometer: undefined })); }}
          keyboardType="numeric"
        />
        {errors.odometer && (
          <Text style={[styles.errorText, { color: colors.destructive }]}>{errors.odometer}</Text>
        )}
        <Text style={[styles.hint, { color: colors.mutedForeground }]}>
          Enter the current odometer reading. This will be used as the baseline for mileage calculation.
        </Text>

        {/* Save */}
        <GlowButton
          title="Add Vehicle"
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
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  closeBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontFamily: 'Inter_600SemiBold',
  },
  form: {
    padding: 20,
    gap: 8,
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
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 8,
  },
  typeCard: {
    width: '47%',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  typeLabel: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  errorText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 4,
  },
  hint: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 4,
    marginBottom: 8,
    lineHeight: 18,
  },
});
