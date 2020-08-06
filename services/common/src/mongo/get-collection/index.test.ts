const mockCollection = jest.fn()
const mockDb = jest.fn().mockReturnValue({ collection: mockCollection })
const mockClient = jest.fn().mockResolvedValue({ db: mockDb })

jest.mock('../create-client', () => ({
  createClient: mockClient,
}))

import { createClient } from '../create-client'

import { getCollection } from './'

describe('helpers:getCollection', () => {
  const MOCK_SECRET_ID = 'lio/serverless/dar-service/secretId'

  beforeEach(() => {
    process.env.MONGODB_SECRET_ID = MOCK_SECRET_ID
  })

  afterEach(() => jest.clearAllMocks())

  it('should create mongo client passing secret id', async () => {
    await getCollection('collection')

    expect(createClient).toHaveBeenCalledTimes(1)
    expect(createClient).toBeCalledWith(MOCK_SECRET_ID)
  })

  it('should return collection', async () => {
    const collection = jest.fn()
    mockCollection.mockReturnValue(collection)

    const result = await getCollection('locations')

    expect(mockDb).toHaveBeenCalledTimes(1)

    expect(mockCollection).toHaveBeenCalledTimes(1)
    expect(mockCollection).toBeCalledWith('locations')

    expect(result).toEqual(collection)
  })
})
