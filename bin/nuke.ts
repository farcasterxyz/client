/* eslint-disable no-console */
import glob from 'glob';
import rimraf from 'rimraf';

import { absoluteWorkspaceRoot } from './config';

function recursivelyDeleteFolders(name: string) {
  glob(`${absoluteWorkspaceRoot}/**/${name}`, (error, filesOrDirectories) => {
    if (error) {
      console.error(error);
      return process.exit(1);
    }

    filesOrDirectories.forEach((path) => {
      rimraf(path, (error) => {
        if (error) {
          console.error(error);
          return process.exit(1);
        }
      });
    });
  });
}

recursivelyDeleteFolders('node_modules');
