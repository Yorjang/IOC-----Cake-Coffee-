import { createHmac, timingSafeEqual } from 'crypto';

export interface VnpayParameters {
  [key: string]: string;
}

export function buildVnpayQuery(parameters: VnpayParameters): string {
  const sortedEntries = Object.entries(parameters)
    .filter(([, value]) => value !== '')
    .sort(([left], [right]) => left.localeCompare(right));
  return new URLSearchParams(sortedEntries).toString();
}

export function signVnpay(parameters: VnpayParameters, secret: string): string {
  return createHmac('sha512', secret).update(buildVnpayQuery(parameters), 'utf8').digest('hex');
}

export function verifyVnpaySignature(parameters: VnpayParameters, secret: string): boolean {
  const receivedHash = parameters.vnp_SecureHash ?? '';
  if (!/^[a-fA-F0-9]{128}$/.test(receivedHash)) return false;

  const signingParameters = { ...parameters };
  delete signingParameters.vnp_SecureHash;
  delete signingParameters.vnp_SecureHashType;
  const expectedHash = signVnpay(signingParameters, secret);
  return timingSafeEqual(Buffer.from(expectedHash, 'hex'), Buffer.from(receivedHash, 'hex'));
}
