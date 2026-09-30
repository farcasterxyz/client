//
//  NotificationService.swift
//  FarcasterNotifications
//
//  Created by Cassandra Heart on 3/14/24.
//

import UserNotifications
import Intents
import UIKit

class NotificationService: UNNotificationServiceExtension {

    var contentHandler: ((UNNotificationContent) -> Void)?
    var bestAttemptContent: UNMutableNotificationContent?

    override func didReceive(_ request: UNNotificationRequest, withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void) {
        self.contentHandler = contentHandler
        self.bestAttemptContent = (request.content.mutableCopy() as? UNMutableNotificationContent)

        if let content = bestAttemptContent {
          if let data = content.userInfo["body"] as? [String: Any] {
            if let imageUrl = data["imageUrl"] as? String {
              if let conversationId = data["conversationId"] as? String {
                if let url = URL(string: imageUrl) {
                  if let data = try? Data(contentsOf: url) {
                    if let img = UIImage(data: data) {
                      if let png = img.pngData() {
                        // We are relying on conversationId and its uniqueness as backend generates idem key on each push
                        let handle = INPersonHandle(value: conversationId, type: .unknown)
                        let avatar = INImage(imageData: png)
                        let sender = INPerson(personHandle: handle,
                                              nameComponents: nil,
                                              displayName: content.title,
                                              image: avatar,
                                              contactIdentifier: nil,
                                              customIdentifier: nil)
                        
                        
                        // Because this communication is incoming, you can infer that the current user is
                        // a recipient. Don't include the current user when initializing the intent.
                        let intent = INSendMessageIntent(recipients: nil,
                                                          outgoingMessageType: .outgoingMessageText,
                                                          content: content.body,
                                                          speakableGroupName: nil,
                                                          conversationIdentifier: conversationId,
                                                          serviceName: nil,
                                                          sender: sender,
                                                          attachments: nil)
                        let interaction = INInteraction(intent: intent, response: nil)
                        interaction.direction = .incoming
                        
                        do {
                          if #available(iOS 15, *) {
                            interaction.donate(completion: nil)
                            // Update notification content before displaying the
                            // communication notification.
                            let updatedContent = try content.updating(from: intent) as? UNMutableNotificationContent
                            contentHandler(updatedContent!)
                          }
                        } catch {
                          
                        }
                    
                        } else {
                          contentHandler(content)
                        }
                      } else {
                        contentHandler(content)
                      }
                    } else {
                      contentHandler(content)
                    }
                  } else {
                    contentHandler(content)
                  }
                } else {
                  contentHandler(content)
                }
              } else {
                contentHandler(content)
              }
            } else {
              contentHandler(content)
            }
        } else {
          contentHandler(self.bestAttemptContent!)
        }
      }
    
      override func serviceExtensionTimeWillExpire() {
          // Called just before the extension will be terminated by the system.
          // Use this as an opportunity to deliver your "best attempt" at modified content, otherwise the original push payload will be used.
          if let contentHandler = contentHandler, let bestAttemptContent =  bestAttemptContent {
              contentHandler(bestAttemptContent)
          }
      }
}
