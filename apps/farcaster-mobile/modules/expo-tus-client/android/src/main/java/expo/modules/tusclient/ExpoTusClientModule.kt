package expo.modules.tusclient

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File
import java.net.URL
import java.util.concurrent.ConcurrentHashMap

class ExpoTusClientModule : Module() {
  private val activeUploads = ConcurrentHashMap<String, ExpoTusClientUpload>()

  override fun definition() = ModuleDefinition {
    Name("ExpoTusClient")

    Events("onProgress", "onSuccess", "onError", "onStart")

    AsyncFunction("createUpload") { fileUri: String, uploadUrl: String, options: Map<String, Any>? ->
      val file = File(fileUri)
      if (!file.exists()) {
        val error = ExpoTusClientError.invalidFileUri()
        throw Exception(error.message)
      }

      val serverUrl = try {
        URL(uploadUrl)
      } catch (e: Exception) {
        val error = ExpoTusClientError.invalidUploadUrl()
        throw Exception(error.message)
      }

      val upload = ExpoTusClientUpload(
        fileUrl = file,
        serverUrl = serverUrl,
        options = options ?: emptyMap<String, Any>(),
        module = this@ExpoTusClientModule
      )

      activeUploads[fileUri] = upload
      fileUri
    }

    AsyncFunction("startUpload") { fileUri: String ->
      val upload = activeUploads[fileUri] ?: run {
        val error = ExpoTusClientError.uploadNotFound()
        throw Exception(error.message)
      }

      try {
        upload.start()
      } catch (e: Exception) {
        val error = ExpoTusClientError.unknownError("Unknown Error")
        throw Exception(error.message)
      }
    }

    AsyncFunction("stopUpload") { fileUri: String ->
      val upload = activeUploads[fileUri] ?: run {
        val error = ExpoTusClientError.uploadNotFound()
        throw Exception(error.message)
      }

      upload.stop()
      activeUploads.remove(fileUri)
    }

    AsyncFunction("cleanup") { fileUri: String ->
      val upload = activeUploads[fileUri] ?: run {
        val error = ExpoTusClientError.uploadNotFound()
        throw Exception(error.message)
      }

      upload.cleanupStorageDirectory()
      activeUploads.remove(fileUri)
    }
  }

  internal fun sendUploadEvent(eventName: String, fileUri: String, data: Map<String, Any> = emptyMap()) {
    val eventData = data.toMutableMap()
    eventData["fileUri"] = fileUri
    sendEvent(eventName, eventData)
  }
}
