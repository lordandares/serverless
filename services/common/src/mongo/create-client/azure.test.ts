process.env.PLATFORM = 'AZURE'

import { createClient, MONGO_URI_KEY } from './index'

import * as getSecretModule from '../../secrets'

describe('getSecret', () => {
  it('should use kebab-case for mongodb if using Azure', async () => {
    process.env.AZURE_CLIENT_SECRET = 'secret'
    const getSecretMock = jest.spyOn(getSecretModule, 'getSecret')
    getSecretMock.mockReturnValue(
      'mongodb://localhost:27017/lighthouse-serverless-test',
    )

    const db = await createClient(process.env.AZURE_CLIENT_SECRET)

    expect(getSecretMock).toHaveBeenCalled()
    expect(getSecretMock).toBeCalledWith(
      process.env.AZURE_CLIENT_SECRET,
      'MONGODB-URI',
    )
  })
})
