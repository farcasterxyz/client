package farcaster.modules.webViewStorage

import android.content.Context
import android.util.Log
import android.webkit.CookieManager
import android.webkit.WebStorage
import android.webkit.WebView
import androidx.webkit.WebStorageCompat
import androidx.webkit.WebViewFeature
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

private const val TAG = "WebViewStorage"

class MissingReactContextException :
  CodedException("Cannot clear WebView storage without a react context")

// Mini apps persist their own auth in WebView-backed storage — SIWF / Quick
// Auth tokens in local storage or IndexedDB, backend sessions in cookies — none
// of it keyed by FID. It has to be wiped when the active account changes or the
// next account inherits those sessions and can act as them.
//
// react-native-webview only exposes WebView.clearCache, which on Android drops
// the HTTP resource cache and nothing else; clearing the rest needs APIs it
// does not surface.
class WebViewStorageModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("FarcasterWebViewStorage")

    // WebView / WebStorage / CookieManager APIs must run on the UI thread, and
    // the async completion callbacks below are delivered to the UI thread's
    // looper — so the main queue is required for them to fire.
    AsyncFunction("clearAll") { promise: Promise ->
      clearAll(promise)
    }.runOnQueue(Queues.MAIN)
  }

  private fun clearAll(promise: Promise) {
    val context = appContext.reactContext ?: throw MissingReactContextException()
    val webStorage = WebStorage.getInstance()

    // Preferred path: one awaited call that deletes network cache, cookies and
    // every JavaScript-readable store — local/session storage, IndexedDB,
    // CacheStorage, service workers. This is what makes the wipe complete;
    // WebStorage.deleteAllData below does not guarantee IndexedDB/CacheStorage.
    //
    // Gated on isFeatureSupported, which reflects the *installed* WebView, not
    // just the AndroidX lib version, so older system WebViews fall through.
    if (WebViewFeature.isFeatureSupported(WebViewFeature.DELETE_BROWSING_DATA)) {
      // Success is otherwise silent (only the JS layer tracks failures), so log
      // a start/finish breadcrumb — `adb logcat -s WebViewStorage`.
      Log.i(TAG, "clearAll started (deleteBrowsingData)")
      // Single-arg overload invokes the callback on the UI thread. Resolves
      // true: this path clears cookies + every JS-readable store, so the wipe
      // is complete.
      WebStorageCompat.deleteBrowsingData(webStorage) {
        Log.i(TAG, "clearAll completed (deleteBrowsingData, complete)")
        promise.resolve(true)
      }
      return
    }

    Log.i(TAG, "clearAll started (deleteAllData fallback)")

    // Fallback for WebViews without DELETE_BROWSING_DATA. deleteAllData only
    // documents Application Cache, Web SQL and HTML5 Web Storage — IndexedDB and
    // CacheStorage may survive — but it is the best available there.
    webStorage.deleteAllData()

    // Cookies are managed separately and are untouched by deleteAllData.
    // removeAllCookies is asynchronous; resolving before its callback fires
    // would let sign out proceed with the previous account's session cookies
    // still present — the exact leak this module exists to close. flush() only
    // persists what is currently readable, so it is not a substitute for
    // awaiting the callback.
    val cookieManager = CookieManager.getInstance()
    cookieManager.removeAllCookies {
      cookieManager.flush()

      // The HTTP cache holds no credentials, so a failure here must not fail
      // the credential wipe that already succeeded above.
      try {
        clearHttpCache(context)
      } catch (e: Exception) {
        Log.w(TAG, "Failed to clear WebView HTTP cache", e)
      }

      // Resolves false: deleteAllData does not guarantee IndexedDB /
      // CacheStorage, so this wipe is only partial. The JS layer treats an
      // incomplete wipe as a failed account-isolation boundary and gates the
      // next sign-in rather than trusting it.
      Log.i(TAG, "clearAll completed (deleteAllData fallback, INCOMPLETE)")
      promise.resolve(false)
    }
  }

  // clearCache writes through to the app-global cache directory, so a throwaway
  // instance is enough to clear it for the mini app web views.
  private fun clearHttpCache(context: Context) {
    val webView = WebView(context)
    try {
      webView.clearCache(true)
      webView.clearFormData()
      webView.clearHistory()
    } finally {
      webView.destroy()
    }
  }
}
