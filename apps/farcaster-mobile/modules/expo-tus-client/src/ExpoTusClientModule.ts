import { NativeModule, requireNativeModule } from 'expo';

import { UploadOptions } from './ExpoTusClient';
import { ExpoTusClientModuleEvents } from './ExpoTusClient.types';

declare class ExpoTusClientModule extends NativeModule<ExpoTusClientModuleEvents> {
  createUpload(
    fileUri: string,
    uploadUrl: string,
    options?: Partial<UploadOptions>,
  ): Promise<string>;
  startUpload(fileUri: string): Promise<void>;
  stopUpload(fileUri: string): Promise<void>;
}

// eslint-disable-next-line import/no-default-export
export default requireNativeModule<ExpoTusClientModule>('ExpoTusClient');
