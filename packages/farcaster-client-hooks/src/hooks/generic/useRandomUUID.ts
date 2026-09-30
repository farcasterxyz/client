import { useRef } from 'react';

export function useRandomUUID() {
  const idRef = useRef<string | null>(null);

  if (idRef.current === null) {
    idRef.current = crypto.randomUUID
      ? crypto.randomUUID()
      : 'id-' + Math.random().toString(36).substring(2, 9);
  }

  return idRef.current;
}
