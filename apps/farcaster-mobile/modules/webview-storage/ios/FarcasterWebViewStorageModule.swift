import ExpoModulesCore
import WebKit
import os

// Success is otherwise silent (only the JS layer tracks failures), so emit a
// start/finish breadcrumb at `.notice` — visible in `log show`/Console without
// the --info flag. Filter with: subsystem == "com.farcaster.mobile-client".
private let logger = Logger(
  subsystem: "com.farcaster.mobile-client",
  category: "WebViewStorage"
)

// `WKWebView.clearCache` (what react-native-webview exposes) omits
// `WKWebsiteDataTypeCookies`, so a mini app's session cookie for the previous
// FID survives a sign out. `allWebsiteDataTypes` is the only set that covers
// cookies alongside local storage, IndexedDB and the caches.
public class FarcasterWebViewStorageModule: Module {
  public func definition() -> ModuleDefinition {
    Name("FarcasterWebViewStorage")

    // Returns whether the wipe was complete. iOS always clears the full
    // `allWebsiteDataTypes` set (cookies, IndexedDB, service workers, …), so it
    // is always complete — the boolean exists to match Android, whose old-
    // WebView fallback can be partial.
    AsyncFunction("clearAll") { () async -> Bool in
      await clearAllWebsiteData()
      return true
    }
  }

  @MainActor
  private func clearAllWebsiteData() async {
    // Mini app web views run on the default (non-incognito) store, so this is
    // the store their credentials live in.
    let store = WKWebsiteDataStore.default()
    let types = WKWebsiteDataStore.allWebsiteDataTypes()

    logger.notice("clearAll started (\(types.count, privacy: .public) data types)")

    await withCheckedContinuation { continuation in
      store.removeData(ofTypes: types, modifiedSince: .distantPast) {
        continuation.resume()
      }
    }

    logger.notice("clearAll completed")
  }
}
