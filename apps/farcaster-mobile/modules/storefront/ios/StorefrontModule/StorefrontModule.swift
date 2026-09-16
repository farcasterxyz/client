import CoreTelephony
import ExpoModulesCore
import StoreKit

public class FarcasterStorefrontModule: Module {
  private let telephonyInfo = CTTelephonyNetworkInfo()

  public func definition() -> ModuleDefinition {
    Name("FarcasterStorefront")

    AsyncFunction("getStorefront") { () -> [String: Any]? in
      guard #available(iOS 13.0, *) else {
        return nil
      }

      guard let storefront = SKPaymentQueue.default().storefront else {
        return nil
      }

      return [
        "countryCode": storefront.countryCode,
        "identifier": storefront.identifier,
        "simCountryCodes": self.currentSimCountryCodes(),
      ]
    }
  }

  private func currentSimCountryCodes() -> [String] {
    if #available(iOS 12.1, *) {
      if let providers = telephonyInfo.serviceSubscriberCellularProviders?.values {
        return deduplicateCountryCodes(
          providers.compactMap { $0.isoCountryCode?.uppercased() }
        )
      }
      return []
    }

    if let provider = telephonyInfo.subscriberCellularProvider,
       let isoCode = provider.isoCountryCode {
      return [isoCode.uppercased()]
    }

    return []
  }

  private func deduplicateCountryCodes(_ codes: [String]) -> [String] {
    var seen = Set<String>()
    var result: [String] = []

    for code in codes where !code.isEmpty {
      if !seen.contains(code) {
        seen.insert(code)
        result.append(code)
      }
    }

    return result
  }
}
