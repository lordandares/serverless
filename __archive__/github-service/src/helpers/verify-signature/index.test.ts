import verifySignature from './'

describe('verifySignature', () => {
  afterEach(() => jest.clearAllMocks())

  it('should return false if signature does not match', async () => {
    const body = '{"id":"123456789"}'
    const secret = '987654321'
    const signature = 'sha1=3d7d098d4a52f4344d7d784d10236c01c8d4e415'

    const result = verifySignature({ body, secret, signature })
    expect(result).toEqual(false)
  })

  it('should return true if signature is a match', async () => {
    const body = '{"id":"123456789"}'
    const secret = '123456789'
    const signature = 'sha1=3d7d098d4a52f4344d7d784d10236c01c8d4e415'

    const result = verifySignature({ body, secret, signature })
    expect(result).toEqual(true)
  })
})
