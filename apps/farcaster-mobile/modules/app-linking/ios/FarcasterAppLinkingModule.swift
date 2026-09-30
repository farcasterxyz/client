import ExpoModulesCore
import UIKit

public class FarcasterAppLinkingModule: Module {
  public func definition() -> ModuleDefinition {
    Name("FarcasterAppLinking")

    AsyncFunction("openInstalledAppForUrl") { (urlString: String) async -> Bool in
      guard let url = URL(string: urlString),
            let scheme = url.scheme?.lowercased(),
            scheme == "https" || scheme == "http" else {
        return false
      }

      if await openUniversalLink(url) {
        return true
      }

      guard let appUrl = buildAppUrlFallback(from: url) else {
        return false
      }

      return await openAppUrl(appUrl)
    }
  }

  @MainActor
  private func openUniversalLink(_ url: URL) async -> Bool {
    await withCheckedContinuation { continuation in
      UIApplication.shared.open(
        url,
        options: [.universalLinksOnly: true]
      ) { success in
        continuation.resume(returning: success)
      }
    }
  }

  @MainActor
  private func openAppUrl(_ url: URL) async -> Bool {
    guard UIApplication.shared.canOpenURL(url) else {
      return false
    }

    return await withCheckedContinuation { continuation in
      UIApplication.shared.open(url, options: [:]) { success in
        continuation.resume(returning: success)
      }
    }
  }

  private func buildAppUrlFallback(from url: URL) -> URL? {
    guard let host = url.host?.lowercased() else {
      return nil
    }

    if host == "x.com" || host == "twitter.com" || host == "mobile.twitter.com" {
      return buildTwitterUrl(from: url)
    }

    if host == "instagram.com" || host == "www.instagram.com" {
      return buildInstagramUrl(from: url)
    }

    if host == "youtube.com" ||
      host == "www.youtube.com" ||
      host == "m.youtube.com" ||
      host == "youtu.be" {
      return buildYouTubeUrl(from: url)
    }

    return nil
  }

  private func buildTwitterUrl(from url: URL) -> URL? {
    let pathComponents = url.pathComponents.filter { $0 != "/" }

    if pathComponents.count >= 3 {
      let statusPath = pathComponents[1].lowercased()
      if statusPath == "status" || statusPath == "statuses" {
        return URL(string: "twitter://status?id=\(pathComponents[2])")
      }
    }

    if let username = pathComponents.first, !username.isEmpty {
      return URL(string: "twitter://user?screen_name=\(username)")
    }

    return URL(string: "twitter://")
  }

  private func buildInstagramUrl(from url: URL) -> URL? {
    let path = url.path.trimmingCharacters(in: CharacterSet(charactersIn: "/"))

    if path.isEmpty {
      return URL(string: "instagram://app")
    }

    return URL(string: "instagram://\(path)")
  }

  private func buildYouTubeUrl(from url: URL) -> URL? {
    guard let host = url.host?.lowercased() else {
      return nil
    }

    if host == "youtu.be",
       let videoId = url.pathComponents.filter({ $0 != "/" }).first {
      return URL(string: "youtube://www.youtube.com/watch?v=\(videoId)")
    }

    if let components = URLComponents(url: url, resolvingAgainstBaseURL: false),
       let videoId = components.queryItems?.first(where: { $0.name == "v" })?.value {
      return URL(string: "youtube://www.youtube.com/watch?v=\(videoId)")
    }

    let pathComponents = url.pathComponents.filter { $0 != "/" }
    if pathComponents.count >= 2,
       pathComponents[0].lowercased() == "shorts" {
      return URL(string: "youtube://www.youtube.com/shorts/\(pathComponents[1])")
    }

    return URL(string: "youtube://")
  }
}
