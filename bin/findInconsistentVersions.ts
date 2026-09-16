/* eslint-disable no-console */
import {
  getAllAppsAndPackages,
  getPackageJson,
  getPackageJsonPath,
} from './helpers';

type Dependency = {
  project: string;
  name: string;
  version: string;
};

(async () => {
  const appsAndPackages = await getAllAppsAndPackages({ ignoreDesktop: true });

  const dependencies: Record<string, Dependency[]> = {};

  appsAndPackages.forEach((pkgPath) => {
    const pkgJsonPath = getPackageJsonPath(pkgPath);
    const pkgJson = getPackageJson(pkgJsonPath);

    const handleDependency = ([name, version]: [string, string]) => {
      (dependencies[name] = dependencies[name] || []).push({
        name,
        version,
        project: pkgPath,
      });
    };

    Object.entries(pkgJson.dependencies || {}).forEach(handleDependency);
    Object.entries(pkgJson.devDependencies || {}).forEach(handleDependency);
  });

  let hasFoundInconsistencies = false;

  Object.entries(dependencies).forEach(([name, deps]) => {
    const versionsSet = new Set<string>();
    deps.forEach((dep) => versionsSet.add(dep.version));
    if (versionsSet.size > 1) {
      hasFoundInconsistencies = true;
      console.log(`Found multiple versions of ${name}:`);
      deps.forEach((dep) => {
        console.log(`...${dep.project}: ${dep.version}`);
      });
    }
  });

  if (!hasFoundInconsistencies) {
    console.log('No version inconsistencies found');
  }
})();
