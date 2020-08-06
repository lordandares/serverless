const mockPromise = jest.fn()
const mockSendTemplatedEmail = jest.fn().mockReturnValue({
  promise: mockPromise,
})

jest.mock('aws-sdk', () => ({
  SES: jest.fn().mockImplementation(() => ({
    sendTemplatedEmail: mockSendTemplatedEmail,
  })),
}))

import { sendEmail } from './'

describe('helpers:sendEmail', () => {
  const MOCK_PARAMS = {
    Destination: {
      CcAddresses: [],
      ToAddresses: ['testing@lighthouse.io'],
    },
    ReplyToAddresses: ['support@lighthouse.io'],
    Source: 'support@lighthouse.io',
    Template: 'template-name',
    TemplateData: '',
  }

  const MOCK_RESULT = [
    {
      ResponseMetadata: {
        RequestId: '88464904-fcf3-11e8-8e1f-b9c0f7c86ac5',
      },
      MessageId: '010001679b4692cd-28db95eb-8524-4abf-9303-9a1f32824a2f-000000',
    },
  ]

  afterEach(() => jest.clearAllMocks())

  it('handles error and returns false', async () => {
    const error = new Error('Location error')
    mockPromise.mockRejectedValue(error)

    const result = await sendEmail(MOCK_PARAMS)

    expect(result).toEqual(false)
  })

  it('it sends email and returns result', async () => {
    mockPromise.mockResolvedValue(MOCK_RESULT)

    const result = await sendEmail(MOCK_PARAMS)

    expect(mockSendTemplatedEmail).toHaveBeenCalledTimes(1)
    expect(mockSendTemplatedEmail).toBeCalledWith(MOCK_PARAMS)

    expect(result).toEqual(MOCK_RESULT)
  })
})
