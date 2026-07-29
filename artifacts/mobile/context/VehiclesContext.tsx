import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/build/legacy/index';
import { Platform } from 'react-native';
import {
  AddFuelInput,
  AddVehicleInput,
  FuelEntry,
  Vehicle,
} from '@/types';

const STORAGE_KEY = '@mileage_tracker_v1';

function genId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

export function recalculateFuelEntries(entries: FuelEntry[], initialOdometer: number): FuelEntry[] {
  // Sort entries chronologically by odometer
  const sorted = [...entries].sort((a, b) => a.odometer - b.odometer);

  const result: FuelEntry[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];

    const prevRefillOdometer = i === 0 ? initialOdometer : sorted[i - 1].odometer;
    const prevLitersFilled = i === 0 ? 0 : sorted[i - 1].litresFilled;
    const prevReserveOffset = i === 0 ? 0 : (sorted[i - 1].reserveOffset ?? 0);

    let displayedDistance = 0;
    let actualDistance = 0;
    let mileage = 0;
    let reserveOffset = 0;

    if (current.reachedReserve) {
      const reserveOdometer = current.reserveOdometer ?? current.odometer;
      reserveOffset = current.odometer - reserveOdometer;
      displayedDistance = reserveOdometer - prevRefillOdometer;
      actualDistance = displayedDistance - prevReserveOffset;
    } else {
      reserveOffset = 0;
      displayedDistance = current.odometer - prevRefillOdometer;
      actualDistance = displayedDistance - prevReserveOffset;
    }

    if (actualDistance < 0) {
      actualDistance = 0;
    }

    if (prevLitersFilled > 0) {
      mileage = parseFloat((actualDistance / prevLitersFilled).toFixed(2));
    }

    result.push({
      ...current,
      prevReserveOffset,
      distance: actualDistance, // map actual distance to distance for compatibility
      reserveOffset,
      mileage: i === 0 ? 0 : mileage,
    });
  }

  return result;
}

interface VehiclesContextType {
  vehicles: Vehicle[];
  loading: boolean;
  addVehicle: (data: AddVehicleInput) => void;
  updateVehicleName: (id: string, name: string) => void;
  deleteVehicle: (id: string) => void;
  addFuelEntry: (vehicleId: string, data: AddFuelInput) => { success: boolean; error?: string };
  deleteFuelEntry: (vehicleId: string, entryId: string) => void;
  exportData: () => Promise<void>;
  importFromJson: (jsonString: string) => Promise<{ success: boolean; message: string }>;
  getVehicle: (id: string) => Vehicle | undefined;
}

const VehiclesContext = createContext<VehiclesContextType | null>(null);

export function VehiclesProvider({ children }: { children: React.ReactNode }) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((json) => {
      if (json) {
        try {
          const data = JSON.parse(json);
          if (Array.isArray(data)) {
            // Auto-migrate and recalculate existing entries on load
            const migrated = data.map((v: any) => ({
              ...v,
              fuelEntries: recalculateFuelEntries(v.fuelEntries || [], v.initialOdometer || 0),
            }));
            setVehicles(migrated);
          }
        } catch {
          // ignore corrupt data
        }
      }
      setLoading(false);
    });
  }, []);

  const persist = useCallback((updated: Vehicle[]) => {
    setVehicles(updated);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
  }, []);

  const addVehicle = useCallback((data: AddVehicleInput) => {
    const now = new Date().toISOString();
    const vehicle: Vehicle = {
      id: genId(),
      name: data.name.trim(),
      type: data.type,
      initialOdometer: data.initialOdometer,
      mainTankSize: data.mainTankSize,
      reserveTankSize: data.reserveTankSize,
      createdAt: now,
      updatedAt: now,
      fuelEntries: [],
    };
    persist([...vehicles, vehicle]);
  }, [vehicles, persist]);

  const updateVehicleName = useCallback((id: string, name: string) => {
    persist(vehicles.map(v =>
      v.id === id ? { ...v, name: name.trim(), updatedAt: new Date().toISOString() } : v
    ));
  }, [vehicles, persist]);

  const deleteVehicle = useCallback((id: string) => {
    persist(vehicles.filter(v => v.id !== id));
  }, [vehicles, persist]);

  const addFuelEntry = useCallback(
    (vehicleId: string, data: AddFuelInput): { success: boolean; error?: string } => {
      const vehicle = vehicles.find(v => v.id === vehicleId);
      if (!vehicle) return { success: false, error: 'Vehicle not found' };
      if (data.litresFilled <= 0) return { success: false, error: 'Litres must be greater than 0' };

      const prevOdometer =
        vehicle.fuelEntries.length > 0
          ? vehicle.fuelEntries[vehicle.fuelEntries.length - 1].odometer
          : vehicle.initialOdometer;

      if (data.odometer <= prevOdometer) {
        return {
          success: false,
          error: `Odometer must be greater than ${prevOdometer.toLocaleString()} km`,
        };
      }

      if (data.reachedReserve) {
        const resOdo = data.reserveOdometer ?? 0;
        if (isNaN(resOdo) || resOdo <= prevOdometer) {
          return {
            success: false,
            error: `Reserve odometer must be greater than previous odometer (${prevOdometer.toLocaleString()} km)`,
          };
        }
        if (resOdo > data.odometer) {
          return {
            success: false,
            error: `Reserve odometer cannot be greater than the refill odometer (${data.odometer.toLocaleString()} km)`,
          };
        }
      }

      const newEntry: FuelEntry = {
        id: genId(),
        vehicleId,
        date: data.date,
        odometer: data.odometer,
        litresFilled: data.litresFilled,
        distance: 0, // recalculated below
        mileage: 0, // recalculated below
        reachedReserve: data.reachedReserve ?? false,
        reserveOdometer: data.reachedReserve ? data.reserveOdometer : undefined,
      };

      const updatedEntries = recalculateFuelEntries(
        [...vehicle.fuelEntries, newEntry],
        vehicle.initialOdometer
      );

      persist(
        vehicles.map(v =>
          v.id === vehicleId
            ? {
                ...v,
                fuelEntries: updatedEntries,
                updatedAt: new Date().toISOString(),
              }
            : v
        )
      );
      return { success: true };
    },
    [vehicles, persist]
  );

  const deleteFuelEntry = useCallback(
    (vehicleId: string, entryId: string) => {
      persist(
        vehicles.map(v => {
          if (v.id !== vehicleId) return v;
          const filtered = v.fuelEntries.filter(e => e.id !== entryId);
          return {
            ...v,
            fuelEntries: recalculateFuelEntries(filtered, v.initialOdometer),
            updatedAt: new Date().toISOString(),
          };
        })
      );
    },
    [vehicles, persist]
  );

  const exportData = useCallback(async () => {
    const json = JSON.stringify({ version: 1, vehicles }, null, 2);
    if (Platform.OS === 'web') {
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'mileage-tracker-backup.json';
      a.click();
      URL.revokeObjectURL(url);
      return;
    }
    const fileUri = (FileSystem.cacheDirectory ?? '') + 'mileage-tracker-backup.json';
    await FileSystem.writeAsStringAsync(fileUri, json, { encoding: FileSystem.EncodingType.UTF8 });
    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(fileUri, { mimeType: 'application/json', dialogTitle: 'Export Mileage Data' });
    }
  }, [vehicles]);

  const importFromJson = useCallback(async (jsonString: string): Promise<{ success: boolean; message: string }> => {
    try {
      const data = JSON.parse(jsonString);
      if (!data.vehicles || !Array.isArray(data.vehicles)) {
        return { success: false, message: 'Invalid backup format. Expected { "version": 1, "vehicles": [...] }' };
      }
      
      const updatedVehicles = data.vehicles.map((v: any) => ({
        ...v,
        fuelEntries: recalculateFuelEntries(v.fuelEntries || [], v.initialOdometer || 0),
      }));

      persist(updatedVehicles);
      return { success: true, message: `Imported ${data.vehicles.length} vehicle(s) successfully` };
    } catch {
      return { success: false, message: 'Failed to parse JSON. Please check the format.' };
    }
  }, [persist]);

  const getVehicle = useCallback(
    (id: string) => vehicles.find(v => v.id === id),
    [vehicles]
  );

  return (
    <VehiclesContext.Provider
      value={{
        vehicles,
        loading,
        addVehicle,
        updateVehicleName,
        deleteVehicle,
        addFuelEntry,
        deleteFuelEntry,
        exportData,
        importFromJson,
        getVehicle,
      }}
    >
      {children}
    </VehiclesContext.Provider>
  );
}

export function useVehicles(): VehiclesContextType {
  const ctx = useContext(VehiclesContext);
  if (!ctx) throw new Error('useVehicles must be used within VehiclesProvider');
  return ctx;
}

export function getVehicleStats(vehicle: Vehicle) {
  const entries = vehicle.fuelEntries;
  if (entries.length === 0) {
    return {
      currentOdometer: vehicle.initialOdometer,
      avgMileage: 0,
      bestMileage: 0,
      worstMileage: 0,
      totalDistance: 0,
      totalFuel: 0,
      lastEntry: null as FuelEntry | null,
    };
  }

  const validMileages = entries.map(e => e.mileage).filter(m => m > 0);
  const totalDistance = entries[entries.length - 1].odometer - vehicle.initialOdometer;
  const totalFuel = entries.reduce((s, e) => s + e.litresFilled, 0);

  let resolvedDistance = 0;
  let resolvedFuel = 0;
  for (let i = 1; i < entries.length; i++) {
    resolvedDistance += entries[i].distance;
    resolvedFuel += entries[i - 1].litresFilled;
  }

  const avgMileage = resolvedFuel > 0 ? parseFloat((resolvedDistance / resolvedFuel).toFixed(2)) : 0;
  const bestMileage = validMileages.length > 0 ? Math.max(...validMileages) : 0;
  const worstMileage = validMileages.length > 0 ? Math.min(...validMileages) : 0;

  return {
    currentOdometer: entries[entries.length - 1].odometer,
    avgMileage,
    bestMileage,
    worstMileage,
    totalDistance,
    totalFuel: parseFloat(totalFuel.toFixed(2)),
    lastEntry: entries[entries.length - 1],
  };
}
