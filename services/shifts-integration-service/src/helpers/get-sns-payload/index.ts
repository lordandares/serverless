export default function getSnsPayload(params) {
  const { endpointArn, message, title, type: notificationType } = params

  return {
    Message: JSON.stringify({
      default: message,
      APNS: JSON.stringify({
        aps: {
          alert: message,
          'content-available': 1,
          sound: 'default',
        },
        notificationType,
      }),
      APNS_SANDBOX: JSON.stringify({
        aps: {
          alert: message,
          'content-available': 1,
          sound: 'default',
        },
        notificationType,
      }),
      GCM: JSON.stringify({
        data: {
          data: {
            notificationType,
          },
          message,
          title,
        },
      }),
    }),
    MessageStructure: 'json',
    TargetArn: endpointArn,
  }
}
