import ExpoModulesCore

public class RNICloudModule: Module {
  public func definition() -> ModuleDefinition {
    Name("RNICloud")

    AsyncFunction("isICloudAvailable") { (promise: Promise) in 
      if FileManager.default.ubiquityIdentityToken == nil {
        promise.resolve(false)
      } else  {
        promise.resolve(true)
      }
    }
  }
}
