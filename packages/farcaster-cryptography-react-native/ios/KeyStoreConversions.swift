import Foundation
import CryptoKit

protocol KeyStoreConvertible: CustomStringConvertible {
  init<D>(rawRepresentation data: D) throws where D: ContiguousBytes
  var rawRepresentation: Data { get }
}

extension KeyStoreConvertible {
  public var description: String {
    return self.rawRepresentation.withUnsafeBytes { bytes in
      return "Key of \(bytes.count) bytes."
    }
  }
}

// These already implicitly implement the protocol
extension Curve25519.KeyAgreement.PrivateKey: KeyStoreConvertible {}

extension Curve25519.Signing.PrivateKey: KeyStoreConvertible {}

// SymmetricKey conversion
extension SymmetricKey: KeyStoreConvertible {
  init<D>(rawRepresentation data: D) throws where D: ContiguousBytes {
    self.init(data: data)
  }

  var rawRepresentation: Data {
    return dataRepresentation
  }
}

extension ContiguousBytes {
  var dataRepresentation: Data {
    return self.withUnsafeBytes { bytes in
      return Data(bytes)
    }
  }
}

