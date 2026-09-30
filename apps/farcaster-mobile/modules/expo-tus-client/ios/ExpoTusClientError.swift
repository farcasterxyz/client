enum ExpoTusClientError: Error {
  case invalidFileUri
  case invalidUploadUrl
  case uploadNotFound
  case invalidStatus
  case clientNotInitialized
  case uploadFailed(description: String)
  case fileReadError(description: String)
  case initError(description: String)
  case unknownError(description: String)
  
  var localizedDescription: String {
    switch self {
    case .invalidFileUri:
      return "Invalid file URI"
    case .invalidUploadUrl:
      return "Invalid upload URL"
    case .uploadNotFound:
      return "Upload not found"
    case .invalidStatus:
      return "Invalid upload status for this operation"
    case .clientNotInitialized:
      return "TUSClient not initialized"
    case .uploadFailed(let description):
      return "Failed to upload file: \(description)"
    case .fileReadError(let description):
      return "Could not read file: \(description)"
    case .initError(let description):
      return "Failed to initialize TUSClient: \(description)"
    case .unknownError(let description):
      return "Unknown error: \(description)"
    }
  }

  var errorCode: String {
    switch self {
    case .invalidFileUri:
      return "INVALID_FILE_URI"
    case .invalidUploadUrl:
      return "INVALID_UPLOAD_URL"
    case .uploadNotFound:
      return "UPLOAD_NOT_FOUND"
    case .invalidStatus:
      return "INVALID_STATUS"
    case .clientNotInitialized:
      return "CLIENT_NOT_INITIALIZED"
    case .uploadFailed:
      return "UPLOAD_FAILED"
    case .fileReadError:
      return "FILE_READ_ERROR"
    case .initError:
      return "INIT_ERROR"
    case .unknownError:
      return "UNKNOWN_ERROR"
    }
  }
}
