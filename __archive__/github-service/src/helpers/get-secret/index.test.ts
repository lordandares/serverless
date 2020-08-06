const mockPromise = jest.fn()
const mockDecrypt = jest.fn().mockReturnValue({ promise: mockPromise })

jest.mock('aws-sdk', () => ({
  KMS: jest.fn().mockImplementation(() => ({
    decrypt: mockDecrypt,
  })),
}))

import getSecret from './'

describe('getSecret', () => {
  afterEach(() => jest.clearAllMocks())

  it('should return plain text secret', async () => {
    const MOCK_RESPONSE = { Plaintext: 'plaintext-secret' }
    mockPromise.mockReturnValue(MOCK_RESPONSE)

    const secret = await getSecret('test')

    expect(mockDecrypt).toHaveBeenCalledTimes(1)
    expect(secret).toEqual('plaintext-secret')
  })
})
