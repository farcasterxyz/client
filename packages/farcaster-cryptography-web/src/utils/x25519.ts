import { CURVE, Point } from '@noble/ed25519';

export const adjustBytes25519 = (bytes: Uint8Array) => {
  bytes[0] &= 248;
  bytes[31] &= 127;
  bytes[31] |= 64;
  return bytes;
};

export const mod = (a: bigint, b = CURVE.P) => {
  const res = a % b;
  return res >= BigInt(0) ? res : b + res;
};

export const bytesToHex = (uint8a: Uint8Array) => {
  const hexes = Array.from({ length: 256 }, (_, i) =>
    i.toString(16).padStart(2, '0'),
  );
  let hex = '';
  for (let i = 0; i < uint8a.length; i++) {
    hex += hexes[uint8a[i]];
  }
  return hex;
};

export const bytesToNumberLE = (uint8a: Uint8Array) => {
  return BigInt('0x' + bytesToHex(Uint8Array.from(uint8a).reverse()));
};

export const modlLE = (hash: Uint8Array) => {
  return mod(bytesToNumberLE(hash), CURVE.l);
};

export const getKeyFromHash = (hashed: Uint8Array) => {
  const head = adjustBytes25519(hashed.slice(0, 32));
  const scalar = modlLE(head);
  const point = Point.BASE.multiply(scalar);
  const pointBytes = point.toRawBytes();
  return { head, scalar, point, pointBytes };
};
