package expo.modules.tusclient

import kotlinx.coroutines.*
import io.tus.java.client.TusClient
import io.tus.java.client.TusUpload
import io.tus.java.client.TusUploader
import io.tus.java.client.TusExecutor
import io.tus.java.client.ProtocolException
import java.io.File
import java.io.IOException
import java.net.URL
import java.util.*

class ExpoTusClientUpload(
  val fileUrl: File,
  val serverUrl: URL,
  val options: Map<String, Any>,
  val module: ExpoTusClientModule
) {
  private var uploadedBytes: Long = 0L
  private var totalBytes: Long = 0L
  private var status: UploadStatus = UploadStatus.CREATED

  private var tusClient: TusClient? = null
  private var uploadId: String? = null
  private val uploadScope = CoroutineScope(Dispatchers.IO + SupervisorJob())
  private var currentJob: Job? = null
  private var tusUpload: TusUpload? = null
  private var tusUploader: TusUploader? = null

  val progress: Double
    get() = if (totalBytes > 0) uploadedBytes.toDouble() / totalBytes.toDouble() else 0.0

  enum class UploadStatus(val value: String) {
    CREATED("created"),
    UPLOADING("uploading"),
    COMPLETED("completed"),
    CANCELLED("cancelled"),
    ERROR("error")
  }

  init {
    try {
      totalBytes = fileUrl.length()
    } catch (e: Exception) {
      totalBytes = 0L
    }

    try {
      setupTUSClient()
    } catch (e: Exception) {
      // Silent failure for setup
    }
  }

  private fun setupTUSClient() {
    try {
      val client = TusClient()
      client.setUploadCreationURL(serverUrl)

      val chunkSize = (options["chunkSize"] as? Number)?.toInt() ?: 0
      if (chunkSize > 0) {
        // TUS client will use default chunk size if not set
      }

      tusClient = client

    } catch (e: Exception) {
      status = UploadStatus.ERROR
      val tusError = ExpoTusClientError.initError(e.message ?: "")
      throw Exception(tusError.message)
    }
  }

  fun start() {
    if (status != UploadStatus.CREATED) {
      val error = ExpoTusClientError.invalidStatus()
      throw Exception(error.message)
    }

    val client = tusClient ?: run {
      val error = ExpoTusClientError.clientNotInitialized()
      throw Exception(error.message)
    }

    status = UploadStatus.UPLOADING
    module.sendUploadEvent("onStart", fileUrl.absolutePath, mapOf<String, Any>(
      "totalBytes" to totalBytes
    ))

    currentJob = uploadScope.launch {
      try {
        client.setUploadCreationURL(serverUrl)

        val headers = options["headers"] as? Map<String, String>
        if (!headers.isNullOrEmpty()) {
          client.setHeaders(headers)
        }

        uploadId = UUID.randomUUID().toString()
        tusUpload = TusUpload(fileUrl).apply {
          fingerprint = uploadId
        }

        startUploadWithExecutor()

      } catch (e: Exception) {
        status = UploadStatus.ERROR
        val tusError = ExpoTusClientError.uploadFailed(e.message ?: "")
        throw Exception(tusError.message)
      }
    }
  }

  fun stop() {
    currentJob?.cancel()
    uploadScope.cancel()

    tusUploader?.let { uploader ->
      try {
        uploader.finish()
      } catch (e: Exception) {}
    }
    status = UploadStatus.CANCELLED
  }

  private suspend fun startUploadWithExecutor() = withContext(Dispatchers.IO) {
    val client = tusClient ?: return@withContext
    val upload = tusUpload ?: return@withContext

    val executor = object : TusExecutor() {
      override fun makeAttempt() {
        try {
          tusUploader = client.resumeOrCreateUpload(upload)
          val uploader = tusUploader ?: throw IOException("Failed to create uploader")

          status = UploadStatus.UPLOADING

          var bytesUploaded: Long

          do {
            if (status != UploadStatus.UPLOADING) {
              break
            }

            bytesUploaded = uploader.offset
            uploadedBytes = bytesUploaded
            totalBytes = fileUrl.length()

            runBlocking(Dispatchers.Main) {
              module.sendUploadEvent("onProgress", fileUrl.absolutePath, mapOf<String, Any>(
                "uploadedBytes" to uploadedBytes,
                "totalBytes" to totalBytes,
                "progress" to progress
              ))
            }

          } while (uploader.uploadChunk() > -1 && status == UploadStatus.UPLOADING)

          uploader.finish()

          if (uploadedBytes >= totalBytes && status == UploadStatus.UPLOADING) {
            status = UploadStatus.COMPLETED
            uploadedBytes = totalBytes

            runBlocking(Dispatchers.Main) {
              module.sendUploadEvent("onSuccess", fileUrl.absolutePath, mapOf<String, Any>(
                "uploadedBytes" to uploadedBytes,
                "totalBytes" to totalBytes,
                "uploadUrl" to uploader.uploadURL.toString()
              ))
            }
          }

        } catch (e: Exception) {
          throw e
        }
      }
    }

    try {
      executor.makeAttempts()
    } catch (e: Exception) {
      handleUploadError(e)
    }
  }

  private fun handleUploadError(e: Exception) {
    status = UploadStatus.ERROR

    val tusError = when (e) {
      is ProtocolException -> ExpoTusClientError.uploadFailed(e.message ?: "")
      is IOException -> ExpoTusClientError.fileReadError(e.message ?: "")
      else -> ExpoTusClientError.uploadFailed(e.message ?: "")
    }

    module.sendUploadEvent("onError", fileUrl.absolutePath, mapOf<String, Any>(
      "error" to tusError.message,
      "code" to tusError.code
    ))
  }

  fun cleanupStorageDirectory() {
    tusUploader?.let { uploader ->
      try {
        uploader.finish()
      } catch (e: Exception) {}
    }
    
    tusUpload?.let { upload ->
      try {
        upload.getInputStream()?.close()
      } catch (e: Exception) {}
    }
    
    currentJob?.cancel()
    uploadScope.cancel()
  }

  protected fun finalize() {
    cleanupStorageDirectory()
  }
}