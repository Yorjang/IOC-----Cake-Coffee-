export const BASE_DELIVERY_DISTANCE_KM = 3;
export const BASE_DELIVERY_FEE = 15_000;
export const ADDITIONAL_KM_FEE = 5_000;

export function calculateShippingFee(distanceKm: number): number {
  if (!Number.isFinite(distanceKm) || distanceKm < 0) {
    throw new Error('Distance must be a non-negative finite number');
  }

  if (distanceKm <= BASE_DELIVERY_DISTANCE_KM) {
    return BASE_DELIVERY_FEE;
  }

  const additionalKilometers = Math.ceil(
    distanceKm - BASE_DELIVERY_DISTANCE_KM,
  );
  return BASE_DELIVERY_FEE + additionalKilometers * ADDITIONAL_KM_FEE;
}
