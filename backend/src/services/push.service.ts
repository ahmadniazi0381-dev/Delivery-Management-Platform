import prisma from '../config/db';

/**
 * ponytail: Sends a push notification to a user.
 * Creates a notification database record first.
 * If FIREBASE_SERVICE_ACCOUNT_JSON is set, it can be used to send to FCM.
 * Otherwise, it logs to the console as a development stub.
 */
export async function sendPushToUser(
  userId: string,
  title: string,
  body: string,
  type: string = 'ORDER_UPDATE'
): Promise<void> {
  try {
    // 1. Create a database record for notifications so the user can see it in app/web
    await prisma.notification.create({
      data: {
        userId,
        title,
        body,
        type,
        isRead: false,
      },
    });

    // 2. Check for Firebase configuration
    const fcmConfigStr = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (!fcmConfigStr) {
      console.log(`[PUSH STUB] User: ${userId} | Title: "${title}" | Body: "${body}"`);
      return;
    }

    // ponytail: Dev has configured credentials, try parsing and sending via FCM
    try {
      const config = JSON.parse(fcmConfigStr);
      console.log(`[PUSH FCM] FCM configuration found for project: ${config.project_id}. Stub sending notification.`);
      // Real implementation would request access token and send message to customer's FCM token.
      // Since client FCM tokens registration is needed, logging is appropriate for now.
    } catch (e) {
      console.error('[PUSH FCM ERROR] Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:', e);
    }
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
}
