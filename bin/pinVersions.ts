/* eslint-disable no-console */
import { writeFileSync } from 'fs';

import {
  getAllAppsAndPackages,
  getCurrentPackageVersion as getCurrentPackageVersion,
  getPackageJson,
  getPackageJsonPath,
} from './helpers';

(async () => {
  const appsAndPackages = await getAllAppsAndPackages({ ignoreDesktop: false });

  for (const pkgDirectory of appsAndPackages) {
    const pkgJsonPath = getPackageJsonPath(pkgDirectory);
    const pkgJson = getPackageJson(pkgJsonPath);

    console.log(`Pinning versions for ${pkgDirectory}`);

    async function getVersion(name: string, pkgVersion: string) {
      if (pkgVersion === '*') {
        return pkgVersion;
      }

      const result = await getCurrentPackageVersion(name, {
        cwd: pkgDirectory,
      });

      if (!result) {
        return pkgVersion;
      }

      return result.data.version;
    }

    async function updateDeps(key: keyof typeof pkgJson) {
      const deps = pkgJson[key];
      if (deps) {
        for (const [name, existingVersionValue] of Object.entries(deps)) {
          const version = await getVersion(name, existingVersionValue);
          console.log(
            `...${name}: ${version} (${
              version === existingVersionValue
                ? 'unmodified'
                : `changed from "${existingVersionValue}" to "${version}"`
            })`,
          );
          deps[name] = version;
        }
      }
    }

    await updateDeps('devDependencies');
    await updateDeps('dependencies');

    writeFileSync(pkgJsonPath, JSON.stringify(pkgJson, null, 2));
  }
})();
