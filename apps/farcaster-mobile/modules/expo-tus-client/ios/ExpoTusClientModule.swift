import ExpoModulesCore
import Foundation

public class ExpoTusClientModule: Module {
  private var activeUploads: [String: TUSClientUpload] = [:]
  
  public func definition() -> ModuleDefinition {
    Name("ExpoTusClient")
    
    Events("onProgress", "onSuccess", "onError", "onStart")

    AsyncFunction("createUpload") { (fileUri: String, uploadUrl: String, options: [String: Any]?) -> String in
      guard let fileUrl = URL(string: fileUri) else {
        let error = ExpoTusClientError.invalidFileUri
        throw GenericException([
          "error": error.localizedDescription,
          "code": error.errorCode
        ])
      }
      
      guard let serverUrl = URL(string: uploadUrl) else {
        let error = ExpoTusClientError.invalidUploadUrl
        throw GenericException([
          "error": error.localizedDescription,
          "code": error.errorCode
        ])
      }
      
      let upload = TUSClientUpload(
        fileUrl: fileUrl,
        serverUrl: serverUrl,
        options: options ?? [:],
        module: self
      )
      
      self.activeUploads[fileUri] = upload
      return fileUri
    }
    
    AsyncFunction("startUpload") { (fileUri: String) in
      guard let upload = self.activeUploads[fileUri] else {
        let error = ExpoTusClientError.uploadNotFound
        throw GenericException([
          "error": error.localizedDescription,
          "code": error.errorCode
        ])
      }
      
      do {
        try await upload.start()
      } catch let error as ExpoTusClientError {
        throw GenericException([
          "error": error.localizedDescription,
          "code": error.errorCode
        ])
      } catch {
        let error = ExpoTusClientError.unknownError(description: "Unknown Error")
        throw GenericException([
          "error": error.localizedDescription,
          "code": error.errorCode
        ])
      }
    }
    
    AsyncFunction("stopUpload") { (fileUri: String) in
      guard let upload = self.activeUploads[fileUri] else {
        let error = ExpoTusClientError.uploadNotFound
        throw GenericException([
          "error": error.localizedDescription,
          "code": error.errorCode
        ])
      }
      
      upload.stop()
      self.activeUploads.removeValue(forKey: fileUri)
    }

    AsyncFunction("cleanup") { (fileUri: String) in
      guard let upload = self.activeUploads[fileUri] else {
        let error = ExpoTusClientError.uploadNotFound
        throw GenericException([
          "error": error.localizedDescription,
          "code": error.errorCode
        ])
      }
      
      upload.cleanupStorageDirectory()
      self.activeUploads.removeValue(forKey: fileUri)
    }
  }
  
  internal func sendUploadEvent(_ eventName: String, fileUri: String, data: [String: Any] = [:]) {
    var eventData = data
    eventData["fileUri"] = fileUri
    sendEvent(eventName, eventData)
  }
}
