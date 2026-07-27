import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
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
          if (Array.isArray(data)) setVehicles(data);
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

      const distance = data.odometer - prevOdometer;
      const mileage = parseFloat((distance / data.litresFilled).toFixed(2));

      const entry: FuelEntry = {
        id: genId(),
        vehicleId,
        date: data.date,
        odometer: data.odometer,
        litresFilled: data.litresFilled,
        distance,
        mileage,
      };

      persist(
        vehicles.map(v =>
          v.id === vehicleId
            ? {
                ...v,
                fuelEntries: [...v.fuelEntries, entry],
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
        vehicles.map(v =>
          v.id === vehicleId
            ? {
                ...v,
                fuelEntries: v.fuelEntries.filter(e => e.id !== entryId),
                updatedAt: new Date().toISOString(),
              }
            : v
        )
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
      persist(data.vehicles);
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
  const mileages = entries.map(e => e.mileage);
  const totalDistance = entries.reduce((s, e) => s + e.distance, 0);
  const totalFuel = entries.reduce((s, e) => s + e.litresFilled, 0);
  return {
    currentOdometer: entries[entries.length - 1].odometer,
    avgMileage: parseFloat((totalDistance / totalFuel).toFixed(2)),
    bestMileage: Math.max(...mileages),
    worstMileage: Math.min(...mileages),
    totalDistance,
    totalFuel: parseFloat(totalFuel.toFixed(2)),
    lastEntry: entries[entries.length - 1],
  };
}
