package farcaster.modules.deviceCheck

import expo.modules.kotlin.exception.CodedException

internal class DeviceCheckException(code: String, reason: String, cause: Throwable? = null) :
  CodedException(
    code,
    "[FarcasterDeviceCheck]: $reason",
    cause
  )
