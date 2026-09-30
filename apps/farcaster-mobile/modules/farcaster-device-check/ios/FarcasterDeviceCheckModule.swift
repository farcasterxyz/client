import ExpoModulesCore
import DeviceCheck

public class FarcasterDeviceCheckModule: Module {
  private let service = DCDevice.current

  // Each module class must implement the definition function. The definition consists of components
  // that describes the module's functionality and behavior.
  // See https://docs.expo.dev/modules/module-api for more details about available components.
  public func definition() -> ModuleDefinition {
    Name("FarcasterDeviceCheck")

    Constant("isSupported") {
      return service.isSupported
    }

    AsyncFunction("generateToken") { 
      do {
        let result = try await service.generateToken()
        return result.base64EncodedString()
      } catch let error {
        throw handleFarcasterDeviceCheckCheckError(error)
      }
    }
  }

  // https://developer.apple.com/documentation/devicecheck/dcerror-swift.struct
  private func handleFarcasterDeviceCheckCheckError(_ error: Error) -> Exception {
    if let error = error as? DCError {
      switch error.code {
      case .featureUnsupported:
        return FarcasterDeviceCheckException("This feature is not supported on this device", code: FarcasterDeviceCheckErrorCodes.featureUnsupported)
      case .invalidInput:
        return FarcasterDeviceCheckException("Invalid input provided", code: FarcasterDeviceCheckErrorCodes.invalidInput)
      case .invalidKey:
        return FarcasterDeviceCheckException("Invalid key provided", code: FarcasterDeviceCheckErrorCodes.invalidKey)
      case .serverUnavailable:
        return FarcasterDeviceCheckException("Server unavailable", code: FarcasterDeviceCheckErrorCodes.serverUnavailable)
      case .unknownSystemFailure:
        return FarcasterDeviceCheckException("Unknown system failure", code: FarcasterDeviceCheckErrorCodes.systemFailure)
      @unknown default:
        return FarcasterDeviceCheckException("Unknown error", code: FarcasterDeviceCheckErrorCodes.unknown)
      }
    }

    return FarcasterDeviceCheckException("Unknown error", code: FarcasterDeviceCheckErrorCodes.unknown)
  }
}
