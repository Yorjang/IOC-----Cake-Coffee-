import { describe, expect, it } from '@jest/globals';
import {
  BASE_DELIVERY_FEE,
  calculateShippingFee,
} from './shipping-fee.util';

describe('calculateShippingFee', () => {
  it('should charge the base fee when distance is within the first 3 km', () => {
    expect(calculateShippingFee(2.5)).toBe(BASE_DELIVERY_FEE);
    expect(calculateShippingFee(3)).toBe(BASE_DELIVERY_FEE);
  });

  it('should add 5000 VND for each started kilometer after 3 km', () => {
    expect(calculateShippingFee(3.1)).toBe(20_000);
    expect(calculateShippingFee(4)).toBe(20_000);
    expect(calculateShippingFee(4.1)).toBe(25_000);
  });

  it('should reject invalid distances', () => {
    expect(() => calculateShippingFee(-1)).toThrow();
    expect(() => calculateShippingFee(Number.NaN)).toThrow();
  });
});
