import ExpoModulesCore

internal final class FarcasterDeviceCheckException: Exception {
  init(_ message: String, code: String? = nil) {
    super.init(name: "FarcasterDeviceCheckException", description: "[FarcasterDeviceCheck]: \(message)", code: code)
  }
}
