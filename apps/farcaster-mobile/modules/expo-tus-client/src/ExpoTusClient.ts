import {
  UploadErrorEventPayload,
  UploadProgressEventPayload,
  UploadStartEventPayload,
  UploadSuccessEventPayload,
} from './ExpoTusClient.types';
import ExpoTusClient from './ExpoTusClientModule';

interface UploadOptions {
  endpoint: string;
  headers?: Record<string, string>;
  chunkSize?: number;
  tusOptions?: Record<string, string | number | boolean>;
  onStart?: (event: StartEvent) => void;
  onProgress?: (event: ProgressEvent) => void;
  onSuccess?: (event: SuccessEvent) => Promise<void> | void;
  onError?: (error: UploadError) => void;
}

interface StartEvent {
  fileUri: string;
  totalBytes: number;
}

interface ProgressEvent {
  fileUri: string;
  uploadedBytes: number;
  totalBytes: number;
  progress: number;
}

interface SuccessEvent {
  fileUri: string;
  uploadedBytes: number;
  totalBytes: number;
  uploadUrl: string;
}

interface UploadError extends Error {
  code?: string;
}

class ExpoTusClientUpload {
  private fileUri: string;
  private options: UploadOptions;
  private isStarted: boolean = false;
  private isCompleted: boolean = false;
  private isStopped: boolean = false;
  private _lastProgress: number = 0;

  constructor(fileUri: string, options: UploadOptions) {
    this.fileUri = fileUri;
    this.options = options;

    if (!options.endpoint) {
      throw new Error('Upload endpoint is required');
    }

    if (typeof fileUri !== 'string') {
      throw new Error('fileUri must be a string');
    }

    this._setupEventListeners();
  }

  private _setupEventListeners(): void {
    ExpoTusClient.addListener('onStart', this._handleStart);
    ExpoTusClient.addListener('onProgress', this._handleProgress);
    ExpoTusClient.addListener('onSuccess', this._handleSuccess);
    ExpoTusClient.addListener('onError', this._handleError);
  }

  private _handleStart = (event: UploadStartEventPayload): void => {
    if (event.fileUri !== this.fileUri) {
      return;
    }

    if (this.options.onStart) {
      this.options.onStart(event);
    }
  };

  private _handleProgress = (event: UploadProgressEventPayload): void => {
    if (event.fileUri !== this.fileUri) {
      return;
    }

    this._lastProgress = event.progress;

    if (this.options.onProgress) {
      this.options.onProgress(event);
    }
  };

  private _handleSuccess = async (
    event: UploadSuccessEventPayload,
  ): Promise<void> => {
    if (event.fileUri !== this.fileUri) {
      return;
    }

    this.isCompleted = true;

    if (this.options.onSuccess) {
      await this.options.onSuccess(event);
    }

    this._cleanup();
  };

  private _handleError = (event: UploadErrorEventPayload): void => {
    if (event.fileUri !== this.fileUri) {
      return;
    }

    if (this.options.onError) {
      const error = new Error(event.error) as UploadError;
      error.code = event.code;
      this.options.onError(error);
    }

    this._cleanup();
  };

  private _cleanup(): void {
    ExpoTusClient.removeListener('onStart', this._handleStart);
    ExpoTusClient.removeListener('onProgress', this._handleProgress);
    ExpoTusClient.removeListener('onSuccess', this._handleSuccess);
    ExpoTusClient.removeListener('onError', this._handleError);
  }

  async start(): Promise<void> {
    if (this.isStarted) {
      throw new Error('Upload has already been started');
    }

    if (this.isStopped) {
      throw new Error('Upload has been stopped and cannot be restarted');
    }

    try {
      const uploadOptions: Partial<UploadOptions> = {
        headers: this.options.headers || {},
        chunkSize: this.options.chunkSize || 0,
      };

      if (this.options.tusOptions) {
        Object.assign(uploadOptions, this.options.tusOptions);
      }

      await ExpoTusClient.createUpload(
        this.fileUri,
        this.options.endpoint,
        uploadOptions,
      );
      await ExpoTusClient.startUpload(this.fileUri);
      this.isStarted = true;
    } catch (error) {
      if (this.options.onError) {
        this.options.onError(error as UploadError);
      }
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (!this.isStarted || this.isCompleted || this.isStopped) {
      return;
    }

    await ExpoTusClient.stopUpload(this.fileUri);
    this.isStopped = true;
    this._cleanup();
  }

  get progress(): number {
    return this._lastProgress;
  }

  get started(): boolean {
    return this.isStarted;
  }

  get completed(): boolean {
    return this.isCompleted;
  }

  get stopped(): boolean {
    return this.isStopped;
  }
}

export { ExpoTusClientUpload };
export type {
  ProgressEvent,
  StartEvent,
  SuccessEvent,
  UploadError,
  UploadOptions,
};
