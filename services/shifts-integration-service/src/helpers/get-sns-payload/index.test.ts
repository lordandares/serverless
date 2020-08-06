import getSnsPayload from './'

describe('helpers :: getSnsPayload', () => {
  it('should return a valid SNS payload', () => {
    const params = {
      endpointArn: 'this-is-an-arn',
      message: 'This is a message',
      title: 'Shift start rejected',
      type: 'shift-reject',
    }

    expect(getSnsPayload(params)).toEqual({
      Message: JSON.stringify({
        default: 'This is a message',
        APNS: JSON.stringify({
          aps: {
            alert: 'This is a message',
            'content-available': 1,
            sound: 'default',
          },
          notificationType: 'shift-reject',
        }),
        APNS_SANDBOX: JSON.stringify({
          aps: {
            alert: 'This is a message',
            'content-available': 1,
            sound: 'default',
          },
          notificationType: 'shift-reject',
        }),
        GCM: JSON.stringify({
          data: {
            data: {
              notificationType: 'shift-reject',
            },
            message: 'This is a message',
            title: 'Shift start rejected',
          },
        }),
      }),
      MessageStructure: 'json',
      TargetArn: 'this-is-an-arn',
    })
  })
})
