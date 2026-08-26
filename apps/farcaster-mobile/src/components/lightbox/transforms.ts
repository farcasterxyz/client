// Transform matrix utilities for Android lightbox
// Based on BlueSky's implementation for proper gesture handling

export type TransformMatrix = {
  a: number; // scaleX
  b: number; // skewY
  c: number; // skewX
  d: number; // scaleY
  e: number; // translateX
  f: number; // translateY
};

export function createTransform(): TransformMatrix {
  'worklet';
  return {
    a: 1,
    b: 0,
    c: 0,
    d: 1,
    e: 0,
    f: 0,
  };
}

export function readTransform(t: TransformMatrix): [number, number, number] {
  'worklet';
  const translateX = t.e;
  const translateY = t.f;
  const scale = t.a;
  return [translateX, translateY, scale];
}

export function prependTransform(
  t1: TransformMatrix,
  t2: TransformMatrix,
): void {
  'worklet';
  const a = t1.a * t2.a + t1.b * t2.c;
  const b = t1.a * t2.b + t1.b * t2.d;
  const c = t1.c * t2.a + t1.d * t2.c;
  const d = t1.c * t2.b + t1.d * t2.d;
  const e = t1.e * t2.a + t1.f * t2.c + t2.e;
  const f = t1.e * t2.b + t1.f * t2.d + t2.f;
  t1.a = a;
  t1.b = b;
  t1.c = c;
  t1.d = d;
  t1.e = e;
  t1.f = f;
}

export function prependPan(
  t: TransformMatrix,
  translation: { x: number; y: number },
): void {
  'worklet';
  t.e += translation.x;
  t.f += translation.y;
}

export function prependPinch(
  t: TransformMatrix,
  scale: number,
  origin: { x: number; y: number },
  translation: { x: number; y: number },
): void {
  'worklet';
  t.a *= scale;
  t.b *= scale;
  t.c *= scale;
  t.d *= scale;
  t.e = t.e * scale + origin.x * (1 - scale) + translation.x;
  t.f = t.f * scale + origin.y * (1 - scale) + translation.y;
}

export function applyRounding(t: TransformMatrix): void {
  'worklet';
  t.e = Math.round(t.e);
  t.f = Math.round(t.f);
}
