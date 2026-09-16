/* eslint-disable no-console */
import { File, Paths } from 'expo-file-system';

export function logFileSystemUsage() {
  const dirs = [Paths.document, Paths.cache, Paths.bundle];

  for (const dir of dirs) {
    console.log(`📁 ${dir.uri}:`);
    for (const item of dir.list()) {
      const name = item.uri.replace(/\/$/, '').split('/').pop();
      const size = item instanceof File ? item.size : null;
      console.log(`${name} — ${size ?? '?'} bytes`);
    }
  }
}

// logFileSystemUsage();
