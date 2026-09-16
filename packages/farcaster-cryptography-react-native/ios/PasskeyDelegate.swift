import Foundation
import AuthenticationServices

@objc(PasskeyDelegate)
class PasskeyDelegate: NSObject, ASAuthorizationControllerDelegate, ASAuthorizationControllerPresentationContextProviding {
  private var _completion: (_ error: Error?, _ result: PassKeyResult?) -> Void;
  
  init(completionHandler: @escaping (_ error: Error?, _ result: PassKeyResult?) -> Void) {
    self._completion = completionHandler;
  }
  
  @available(iOS 15.0, *)
  @objc(performAuthForController:)
  func performAuthForController(controller: ASAuthorizationController) {
    controller.delegate = self;
    controller.presentationContextProvider = self;
    controller.performRequests();
  }
  
  @available(iOS 13.0, *)
  func presentationAnchor(for controller: ASAuthorizationController) -> ASPresentationAnchor {
    return UIApplication.shared.keyWindow!;
  }
  
  @available(iOS 13.0, *)
  func authorizationController(
      controller: ASAuthorizationController,
      didCompleteWithError error: Error
  ) {
    self._completion(error, nil);
  }

  @available(iOS 13.0, *)
  func authorizationController(controller: ASAuthorizationController, didCompleteWithAuthorization authorization: ASAuthorization) {
    if #available(iOS 17.0, *) {
      if let credential = authorization.credential as? ASAuthorizationPlatformPublicKeyCredentialRegistration {
        // Registration: proceed regardless of largeBlob support — mnemonic is stored in iCloud Keychain
        self.handlePublicKeyRegistrationResponse(credential: credential)
      } else if let credential = authorization.credential as? ASAuthorizationPlatformPublicKeyCredentialAssertion {
        if let largeBlob = credential.largeBlob {
          // Legacy largeBlob path — used as fallback for pre-migration users on iOS 17/18
          switch (largeBlob.result) {
          case .read(let data):
            self.handlePublicKeyAssertionResponseWithLargeBlob(credential: credential, largeBlob: data)
          case .write(let success):
            if success {
              self.handlePublicKeyAssertionResponseRegisteringLargeBlob(credential: credential, success: success)
            } else {
              self._completion(PassKeyError.notSupported, nil)
            }
          @unknown default:
            self._completion(PassKeyError.notSupported, nil)
          }
        } else {
          // Plain assertion (no largeBlob) — used for iCloud Keychain flow
          self.handlePublicKeyAssertionResponseWithLargeBlob(credential: credential, largeBlob: nil)
        }
      } else {
        self._completion(PassKeyError.requestFailed, nil)
      }
    } else {
      self._completion(PassKeyError.notSupported, nil);
    }
  }
  
  @available(iOS 17.0, *)
  func handlePublicKeyRegistrationResponse(credential: ASAuthorizationPlatformPublicKeyCredentialRegistration) -> Void {
    if let rawAttestationObject = credential.rawAttestationObject {
      let registrationResult = PassKeyRegistrationResult(credentialID: credential.credentialID,
                                                         rawAttestationObject: rawAttestationObject,
                                                         rawClientDataJSON: credential.rawClientDataJSON);
      self._completion(nil, PassKeyResult(registrationResult: registrationResult));
    } else {
      self._completion(PassKeyError.requestFailed, nil);
    }
  }
    
    @available(iOS 17.0, *)
    func handlePublicKeyAssertionResponseRegisteringLargeBlob(credential: ASAuthorizationPlatformPublicKeyCredentialAssertion, success: Bool) -> Void {
      let assertionResult = PassKeyAssertionResult(credentialID: credential.credentialID,
                                                   rawAuthenticatorData: credential.rawAuthenticatorData,
                                                   rawClientDataJSON: credential.rawClientDataJSON,
                                                   signature: credential.signature,
                                                   userID: credential.userID,
                                                   registeredLargeBlob: success);
      self._completion(nil, PassKeyResult(assertionResult: assertionResult));
    }
    
    @available(iOS 17.0, *)
    func handlePublicKeyAssertionResponseWithLargeBlob(credential: ASAuthorizationPlatformPublicKeyCredentialAssertion, largeBlob: Data?) -> Void {
      let assertionResult = PassKeyAssertionResult(credentialID: credential.credentialID,
                                                   rawAuthenticatorData: credential.rawAuthenticatorData,
                                                   rawClientDataJSON: credential.rawClientDataJSON,
                                                   signature: credential.signature,
                                                   userID: credential.userID,
                                                   largeBlob: largeBlob, registeredLargeBlob: false);
      self._completion(nil, PassKeyResult(assertionResult: assertionResult));
    }
}
