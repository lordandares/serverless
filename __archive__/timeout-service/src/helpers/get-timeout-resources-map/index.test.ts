const getTimeoutResourcesMap = require('./').default

describe('getTimeoutResourcesMap', () => {
  const MOCK_RESOURCES = {
    Items: [
      {
        id: 'testing',
        target: 'target',
      },
    ],
  }

  const MOCK_TABLE_TIMEOUT_RESOURCES = 'timeouts-resources'

  afterEach(() => jest.clearAllMocks())

  it('should return expired timeouts', async () => {
    const ddb = {
      scan: jest.fn().mockReturnValue({
        promise: jest.fn().mockReturnValue(MOCK_RESOURCES),
      }),
    }

    const timeouts = await getTimeoutResourcesMap({
      ddb,
      table: MOCK_TABLE_TIMEOUT_RESOURCES,
    })

    expect(ddb.scan).toHaveBeenCalledTimes(1)
    expect(ddb.scan).toBeCalledWith({ TableName: MOCK_TABLE_TIMEOUT_RESOURCES })
    expect(timeouts).toEqual({
      testing: {
        id: 'testing',
        target: 'target',
      },
    })
  })
})
