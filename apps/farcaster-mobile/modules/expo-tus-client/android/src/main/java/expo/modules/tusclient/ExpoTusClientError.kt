package expo.modules.tusclient

class ExpoTusClientError(override val message: String, val code: String) : Exception(message) {
  companion object {
    fun invalidFileUri() = ExpoTusClientError("Invalid file URI", "INVALID_FILE_URI")
    fun invalidUploadUrl() = ExpoTusClientError("Invalid upload URL", "INVALID_UPLOAD_URL")
    fun uploadNotFound() = ExpoTusClientError("Upload not found", "UPLOAD_NOT_FOUND")
    fun invalidStatus() = ExpoTusClientError("Invalid upload status for this operation", "INVALID_STATUS")
    fun clientNotInitialized() = ExpoTusClientError("TUSClient not initialized", "CLIENT_NOT_INITIALIZED")
    fun uploadFailed(description: String) = ExpoTusClientError("Failed to upload file: $description", "UPLOAD_FAILED")
    fun fileReadError(description: String) = ExpoTusClientError("Could not read file: $description", "FILE_READ_ERROR")
    fun initError(description: String) = ExpoTusClientError("Failed to initialize TUSClient: $description", "INIT_ERROR")
    fun unknownError(description: String) = ExpoTusClientError("Unknown error: $description", "UNKNOWN_ERROR")
  }
}