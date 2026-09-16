import Foundation
import CryptoKit
import Security

struct KeychainStore {
  func store<T: KeyStoreConvertible>(_ key: T, account: String, name: String, iCloudEnabled: Bool = false) throws {
    let smallname = "\(name)".replacingOccurrences(of: "[^A-Za-z0-9]+", with: "", options: [.regularExpression])

    let query = (iCloudEnabled ? [
      // Set as generic password
      kSecClass: kSecClassGenericPassword,
      // Names it
      kSecAttrAccount: smallname[..<smallname.index(smallname.startIndex, offsetBy: min(smallname.count, 20))].lowercased(),
      // Namespace it
      kSecAttrService: account,
      // iCloud keychain is enabled
      kSecAttrSynchronizable: kCFBooleanTrue,
      // Only when unlocked
      kSecAttrAccessible: kSecAttrAccessibleAfterFirstUnlock,
      // The raw data being stored
      kSecValueData: key.rawRepresentation] : [
      // Set as generic password
      kSecClass: kSecClassGenericPassword,
      // Names it
      kSecAttrAccount: smallname[..<smallname.index(smallname.startIndex, offsetBy: min(smallname.count, 20))].lowercased(),
      // Namespace it
      kSecAttrService: account,
      // Only when unlocked
      kSecAttrAccessible: kSecAttrAccessibleAfterFirstUnlock,
      // The raw data being stored
      kSecValueData: key.rawRepresentation]) as [String: Any]

    var status = SecItemAdd(query as CFDictionary, nil)
    guard status == errSecSuccess else {
      do {
        try self.delete(account: account, name: name, iCloudEnabled: iCloudEnabled)
        let query = (iCloudEnabled ? [
          // Match the type used in store()
          kSecClass: kSecClassGenericPassword,
          // Names it
          kSecAttrAccount: smallname[..<smallname.index(smallname.startIndex, offsetBy: min(smallname.count, 20))].lowercased(),
          // Namespace it
          kSecAttrService: account,
          // iCloud keychain is enabled
          kSecAttrSynchronizable: kCFBooleanTrue,
          // Only when unlocked
          kSecAttrAccessible: kSecAttrAccessibleAfterFirstUnlock,
          // The raw data being stored
          kSecValueData: key.rawRepresentation] : [
          // Set as generic password
          kSecClass: kSecClassGenericPassword,
          // Names it
          kSecAttrAccount: smallname[..<smallname.index(smallname.startIndex, offsetBy: min(smallname.count, 20))].lowercased(),
          // Namespace it
          kSecAttrService: account,
          // Only when unlocked
          kSecAttrAccessible: kSecAttrAccessibleAfterFirstUnlock,
          // The raw data being stored
          kSecValueData: key.rawRepresentation]) as [String: Any]
        
        status = SecItemAdd(query as CFDictionary, nil)
        guard status == errSecSuccess else {
          throw KeychainKeyStoreError("store: \(status.message)")
        }
      } catch {
        throw KeychainKeyStoreError("store: \(status.message)")
      }
      return
    }
  }

  func get<T: KeyStoreConvertible>(account: String, name: String, iCloudEnabled: Bool = false) throws -> T? {
    let smallname = "\(name)".replacingOccurrences(of: "[^A-Za-z0-9]+", with: "", options: [.regularExpression])
    
    let query = (iCloudEnabled ? [
      // Match the type used in store()
      kSecClass: kSecClassGenericPassword,
      // Names it
      kSecAttrAccount: smallname[..<smallname.index(smallname.startIndex, offsetBy: min(smallname.count, 20))].lowercased(),
      // Namespace it
      kSecAttrService: account,
      // Only one
      kSecMatchLimit: kSecMatchLimitOne,
      // iCloud keychain is enabled
      kSecAttrSynchronizable: kCFBooleanTrue,
      // Return the raw data
      kSecReturnData: true] : [
      // Match the type used in store()
      kSecClass: kSecClassGenericPassword,
      // Names it
      kSecAttrAccount: smallname[..<smallname.index(smallname.startIndex, offsetBy: min(smallname.count, 20))].lowercased(),
      // Namespace it
      kSecAttrService: account,
      // Only one
      kSecMatchLimit: kSecMatchLimitOne,
      // Return the raw data
      kSecReturnData: true]) as [String: Any]

    // Retrieve and convert
    var item: CFTypeRef?
    switch SecItemCopyMatching(query as CFDictionary, &item) {
      case errSecSuccess:
        guard let data = item as? Data else { throw KeychainKeyStoreError("read: corrupt") }
        return try T(rawRepresentation: data)
      case errSecItemNotFound: throw KeychainKeyStoreError("read: not found")
      case let status: throw KeychainKeyStoreError("read: \(status.message)")
    }
  }

  func delete(account: String, name: String, iCloudEnabled: Bool = false) throws {
    let smallname = "\(name)".replacingOccurrences(of: "[^A-Za-z0-9]+", with: "", options: [.regularExpression])
    
    let query = (iCloudEnabled ? [
      // Match the type used in store()
      kSecClass: kSecClassGenericPassword,
      // Names it
      kSecAttrAccount: smallname[..<smallname.index(smallname.startIndex, offsetBy: min(smallname.count, 20))].lowercased(),
      // Namespace it
      kSecAttrService: account,
      // iCloud keychain is enabled
      kSecAttrSynchronizable: kCFBooleanTrue,
      // Only when unlocked
      kSecAttrAccessible: kSecAttrAccessibleAfterFirstUnlock] :[
      // Match the type used in store()
      kSecClass: kSecClassGenericPassword,
      // Names it
      kSecAttrAccount: smallname[..<smallname.index(smallname.startIndex, offsetBy: min(smallname.count, 20))].lowercased(),
      // Namespace it
      kSecAttrService: account,
      // Match the data protection level used in store()
      kSecUseDataProtectionKeychain: true]) as [String: Any]

    // Attempt to delete, preserve idempotency
    switch SecItemDelete(query as CFDictionary) {
    case errSecItemNotFound, errSecSuccess: break
    case let status:
      throw KeychainKeyStoreError("delete: \(status.message)")
    }
  }
}

struct KeychainKeyStoreError: Error, CustomStringConvertible {
  var message: String

  init(_ message: String) {
    self.message = message
  }

  public var description: String {
    return message
  }
}

extension OSStatus {
  var message: String {
    return (SecCopyErrorMessageString(self, nil) as String?) ?? String(self)
  }
}

extension String {
  subscript(_ range: CountableRange<Int>) -> String {
    let start = index(startIndex, offsetBy: max(0, range.lowerBound))
    let end = index(start, offsetBy: min(self.count - range.lowerBound,
                                          range.upperBound - range.lowerBound))
    return String(self[start..<end])
  }

  subscript(_ range: CountablePartialRangeFrom<Int>) -> String {
    let start = index(startIndex, offsetBy: max(0, range.lowerBound))
    return String(self[start...])
  }
}
