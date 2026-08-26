export interface UploadEventPayload {
  fileUri: string;
}

export interface UploadStartEventPayload extends UploadEventPayload {
  totalBytes: number;
}

export interface UploadProgressEventPayload extends UploadEventPayload {
  uploadedBytes: number;
  totalBytes: number;
  progress: number;
}

export interface UploadSuccessEventPayload extends UploadEventPayload {
  uploadedBytes: number;
  totalBytes: number;
  uploadUrl: string;
}

export interface UploadErrorEventPayload extends UploadEventPayload {
  error: string;
  code: string;
}

export interface ExpoTusClientModuleEvents {
  onStart: (params: UploadStartEventPayload) => void;
  onProgress: (params: UploadProgressEventPayload) => void;
  onSuccess: (params: UploadSuccessEventPayload) => void;
  onError: (params: UploadErrorEventPayload) => void;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: (...args: any[]) => void;
}
