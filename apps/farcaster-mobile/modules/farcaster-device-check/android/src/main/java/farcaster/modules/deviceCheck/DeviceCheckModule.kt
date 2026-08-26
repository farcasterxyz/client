package farcaster.modules.deviceCheck

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class DeviceCheckModule : Module() {
  // Each module class must implement the definition function. The definition consists of components
  // that describes the module's functionality and behavior.
  // See https://docs.expo.dev/modules/module-api for more details about available components.
  override fun definition() = ModuleDefinition {
    Name("FarcasterDeviceCheck")

    Function("isSupported") {
      false
    }

    AsyncFunction("generateToken") {
      throw DeviceCheckException(DeviceCheckErrorCodes.UNSUPPORTED, "generateToken is not supported")
    }
  }
}
