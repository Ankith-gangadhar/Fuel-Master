export type VehicleType = 'car' | 'bike' | 'scooter' | 'truck';

export interface FuelEntry {
  id: string;
  vehicleId: string;
  date: string; // ISO string
  odometer: number; // Refill Odometer
  litresFilled: number;
  distance: number; // Actual main tank distance (calculated)
  mileage: number; // km/L, calculated (using prev refill's litres)
  
  // Reserve-offset fields
  reachedReserve: boolean;
  reserveOdometer?: number;
  reserveOffset?: number; // Offset generated in this cycle (Refill Odo - Reserve Odo)
  prevReserveOffset?: number; // Offset subtracted in this cycle (from previous cycle)
}

export interface Vehicle {
  id: string;
  name: string;
  type: VehicleType;
  initialOdometer: number;
  mainTankSize?: number; // optional, litres
  reserveTankSize?: number; // optional, litres
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  fuelEntries: FuelEntry[];
}

export interface AddVehicleInput {
  name: string;
  type: VehicleType;
  initialOdometer: number;
  mainTankSize?: number;
  reserveTankSize?: number;
}

export interface AddFuelInput {
  odometer: number;
  litresFilled: number;
  date: string;
  reachedReserve?: boolean;
  reserveOdometer?: number;
}

