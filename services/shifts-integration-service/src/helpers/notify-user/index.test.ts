jest.mock('../')

import { getPlatformEndpoint, sendMessage } from '../'
import notifyUser from './'

describe('helpers :: notifyUser', () => {
  beforeEach(() => jest.resetAllMocks())

  it('should error if the message is missing', async () => {
    expect.assertions(1)

    const params = {
      message: '',
      user: 'valid-user',
    }

    expect(notifyUser(params)).rejects.toThrowError(/Missing required params/)
  })

  it('should error if the user is missing', async () => {
    expect.assertions(1)

    const params = {
      message: 'This is a message',
      user: '',
    }

    expect(notifyUser(params)).rejects.toThrowError(/Missing required params/)
  })

  it('should return if the user does not have an active device receiver', async () => {
    expect.assertions(1)

    const user = {
      message: 'Unable to start shift. Open Lighthouse for details',
      title: 'Start shift rejected',
      type: 'shift-rejected',
      user: {
        speakerbox: {
          deviceReceivers: null,
        },
      },
    }

    const result = await notifyUser(user)

    expect(result).toBeUndefined()
  })

  it('should process a notification to a single endpoint', async () => {
    expect.assertions(4)

    getPlatformEndpoint.mockResolvedValue('platform-endpoint')
    sendMessage.mockResolvedValue({})

    const params = {
      message: 'Unable to start shift. Open Lighthouse for details',
      title: 'Start shift rejected',
      type: 'shift-rejected',
      user: {
        speakerbox: {
          deviceReceivers: [
            { deviceToken: 'ios-device-token', platform: 'ios' },
          ],
        },
      },
    }

    await notifyUser(params)

    expect(getPlatformEndpoint).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledTimes(1)

    expect(sendMessage.mock.calls[0][1]).toEqual(['platform-endpoint'])
    expect(sendMessage.mock.calls[0][2]).toEqual(params)
  })

  it('should process a notification to multiple endpoints', async () => {
    expect.assertions(4)

    getPlatformEndpoint.mockResolvedValue('platform-endpoint')
    sendMessage.mockResolvedValue({})

    const params = {
      message: 'Unable to start shift. Open Lighthouse for details',
      title: 'Start shift rejected',
      type: 'shift-rejected',
      user: {
        speakerbox: {
          deviceReceivers: [
            { deviceToken: 'android-device-token', platform: 'android' },
            { deviceToken: 'ios-device-token', platform: 'ios' },
          ],
        },
      },
    }

    await notifyUser(params)

    expect(getPlatformEndpoint).toHaveBeenCalledTimes(2)
    expect(sendMessage).toHaveBeenCalledTimes(1)

    expect(sendMessage.mock.calls[0][1]).toEqual([
      'platform-endpoint',
      'platform-endpoint',
    ])
    expect(sendMessage.mock.calls[0][2]).toEqual(params)
  })

  it('should process a notification with a custom notification message', async () => {
    expect.assertions(4)

    getPlatformEndpoint.mockResolvedValue('platform-endpoint')
    sendMessage.mockResolvedValue({})

    const params = {
      message: 'This is a custom message',
      title: 'Notification Title',
      type: 'shift-rejected',
      user: {
        speakerbox: {
          deviceReceivers: [
            { deviceToken: 'android-device-token', platform: 'android' },
          ],
        },
      },
    }

    await notifyUser(params)

    expect(getPlatformEndpoint).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledTimes(1)

    expect(sendMessage.mock.calls[0][1]).toEqual(['platform-endpoint'])
    expect(sendMessage.mock.calls[0][2]).toEqual(params)
  })
})
