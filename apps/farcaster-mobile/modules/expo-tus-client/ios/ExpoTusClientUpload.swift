import Foundation
import TUSKit
import ExpoModulesCore

class TUSClientUpload: TUSClientDelegate {
  let fileUrl: URL
  let serverUrl: URL
  let options: [String: Any]
  weak var module: ExpoTusClientModule?
  
  private(set) var uploadedBytes: Int64 = 0
  private(set) var totalBytes: Int64 = 0
  private(set) var status: UploadStatus = .created
  
  private var tusClient: TUSClient?
  private var uploadId: UUID?
  
  var progress: Double {
    guard totalBytes > 0 else { return 0.0 }
    return Double(uploadedBytes) / Double(totalBytes)
  }
  
  enum UploadStatus: String {
    case created = "created"
    case uploading = "uploading"
    case completed = "completed"
    case cancelled = "cancelled"
    case error = "error"
  }
  
  init(fileUrl: URL, serverUrl: URL, options: [String: Any], module: ExpoTusClientModule) {
    self.fileUrl = fileUrl
    self.serverUrl = serverUrl
    self.options = options
    self.module = module
    
    do {
      let attributes = try FileManager.default.attributesOfItem(atPath: fileUrl.path)
      self.totalBytes = attributes[.size] as? Int64 ?? 0
    } catch {
      self.totalBytes = 0
    }
    
    try? setupTUSClient()
  }
  
  private func setupTUSClient() throws {
    do {
      let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
      let storageDirectory = documentsPath.appendingPathComponent("TUS-\(fileUrl.lastPathComponent)")
      
      let chunkSize = options["chunkSize"] as? Int ?? 0
      
      tusClient = try TUSClient(
        server: serverUrl,
        sessionIdentifier: "ExpoTusClient-\(fileUrl.lastPathComponent)",
        sessionConfiguration: .background(withIdentifier: "com.farcaster.mobile"),
        storageDirectory: storageDirectory,
        chunkSize: chunkSize
      )
      
      tusClient?.delegate = self
      
    } catch {
      status = .error
      let tusError = ExpoTusClientError.initError(description: error.localizedDescription)
      throw GenericException([
        "error": tusError.localizedDescription,
        "code": tusError.errorCode
      ])
    }
  }
  
  func start() async throws {
    guard status == .created else {
      let error = ExpoTusClientError.invalidStatus
      throw GenericException([
        "error": error.localizedDescription,
        "code": error.errorCode
      ])
    }
    
    guard let tusClient = tusClient else {
      let error = ExpoTusClientError.clientNotInitialized
      throw GenericException([
        "error": error.localizedDescription,
        "code": error.errorCode
      ])
    }
    
    status = .uploading
    module?.sendUploadEvent("onStart", fileUri: fileUrl.absoluteString, data: [
      "totalBytes": totalBytes
    ])
    
    do {
      tusClient.start()
      
      var customHeaders: [String: String]?
      if let headers = options["headers"] as? [String: String] {
        customHeaders = headers
      }
      
      uploadId = try tusClient.uploadFileAt(
        filePath: fileUrl,
        customHeaders: customHeaders ?? [:]
      )
      
    } catch {
      status = .error
      let tusError = ExpoTusClientError.uploadFailed(description: error.localizedDescription)
      throw GenericException([
        "error": tusError.localizedDescription,
        "code": tusError.errorCode
      ])
    }
  }
  
  func stop() {
    guard let tusClient = tusClient, let uploadId = uploadId else { 
      status = .cancelled
      return 
    }
    
    do {
      try tusClient.removeCacheFor(id: uploadId)
    } catch {
      // Silent failure for cache removal
    }
    status = .cancelled
  }
  
  // MARK: - TUSClientDelegate
  
  func didStartUpload(id: UUID, context: [String : String]?, client: TUSKit.TUSClient) {
    guard id == uploadId else { return }
    status = .uploading
  }
  
  func didFinishUpload(id: UUID, url: URL, context: [String : String]?, client: TUSKit.TUSClient) {
    guard id == uploadId else { return }
    
    status = .completed
    uploadedBytes = totalBytes
    
    module?.sendUploadEvent("onSuccess", fileUri: fileUrl.absoluteString, data: [
      "uploadedBytes": uploadedBytes,
      "totalBytes": totalBytes,
      "uploadUrl": url.absoluteString
    ])
  }
  
  func uploadFailed(id: UUID, error: any Error, context: [String : String]?, client: TUSKit.TUSClient) {
    guard id == uploadId else { return }
    
    status = .error
    let tusError = ExpoTusClientError.uploadFailed(description: error.localizedDescription)
    module?.sendUploadEvent("onError", fileUri: fileUrl.absoluteString, data: [
      "error": tusError.localizedDescription,
      "code": tusError.errorCode
    ])
  }
  
  func fileError(error: TUSKit.TUSClientError, client: TUSKit.TUSClient) {
    status = .error
    
    let tusError = ExpoTusClientError.fileReadError(description: error.localizedDescription)
    module?.sendUploadEvent("onError", fileUri: fileUrl.absoluteString, data: [
      "error": tusError.localizedDescription,
      "code": tusError.errorCode
    ])
  }
  
  func totalProgress(bytesUploaded: Int, totalBytes: Int, client: TUSClient) {
    uploadedBytes = Int64(bytesUploaded)
    self.totalBytes = Int64(totalBytes)
    
    module?.sendUploadEvent("onProgress", fileUri: fileUrl.absoluteString, data: [
      "uploadedBytes": uploadedBytes,
      "totalBytes": self.totalBytes,
      "progress": progress
    ])
  }

  func progressFor(id: UUID, context: [String : String]?, bytesUploaded: Int, totalBytes: Int, client: TUSKit.TUSClient) {
    guard id == uploadId else { return }
    
    uploadedBytes = Int64(bytesUploaded)
    self.totalBytes = Int64(totalBytes)
    
    module?.sendUploadEvent("onProgress", fileUri: fileUrl.absoluteString, data: [
      "uploadedBytes": uploadedBytes,
      "totalBytes": self.totalBytes,
      "progress": progress
    ])
  }
  
  func cleanupStorageDirectory() {
    guard let tusClient = tusClient else { return }
    
    do {
      tusClient.cleanup()
    } catch {}
  }
  
  deinit {
    cleanupStorageDirectory()
  }
}
