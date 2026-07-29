import { describe, expect, it } from '@jest/globals';
import { buildVnpayQuery, signVnpay, verifyVnpaySignature } from './vnpay-signature';

describe('VNPay signature helpers', () => {
  it('should sort and encode parameters when building the signing query', () => {
    expect(buildVnpayQuery({ vnp_TxnRef: 'SB 123', vnp_Amount: '1000000' }))
      .toBe('vnp_Amount=1000000&vnp_TxnRef=SB+123');
  });

  it('should verify a valid signature when callback data is unchanged', () => {
    const parameters = { vnp_Amount: '1000000', vnp_TxnRef: 'SB123' };
    const signature = signVnpay(parameters, 'test-secret');
    expect(verifyVnpaySignature({ ...parameters, vnp_SecureHash: signature }, 'test-secret')).toBe(true);
  });

  it('should reject the signature when callback data is modified', () => {
    const parameters = { vnp_Amount: '1000000', vnp_TxnRef: 'SB123' };
    const signature = signVnpay(parameters, 'test-secret');
    expect(verifyVnpaySignature({ ...parameters, vnp_Amount: '2000000', vnp_SecureHash: signature }, 'test-secret')).toBe(false);
  });
});
