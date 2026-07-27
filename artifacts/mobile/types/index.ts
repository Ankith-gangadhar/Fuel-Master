export type VehicleType = 'car' | 'bike' | 'scooter' | 'truck';

export interface FuelEntry {
  id: string;
  vehicleId: string;
  date: string; // ISO string
  odometer: number;
  litresFilled: number;
  distance: number; // calculated
  mileage: number; // km/L, calculated
}

export interface Vehicle {
  id: string;
  name: string;
  type: VehicleType;
  initialOdometer: number;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  fuelEntries: FuelEntry[];
}

export interface AddVehicleInput {
  name: string;
  type: VehicleType;
  initialOdometer: number;
}

export interface AddFuelInput {
  odometer: number;
  litresFilled: number;
  date: string;
}
