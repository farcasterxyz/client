import RNICloudModule from './src/RNICloudModule';

async function isICloudAvailable(): Promise<boolean> {
  return await RNICloudModule.isICloudAvailable();
}

export { isICloudAvailable };
