import { mongo, secrets } from '@lighthouse/serverless-common'
import { winteam } from '@lighthouse/serverless-integrations'
import handleFullLoadEmployees from './handleFullLoadEmployees'
import * as upsertUserModule from '../../helpers/upsertUser'
import { upsertUser } from '../../helpers/upsertUser'
import { createMockContext } from '../../../../../../__test__/helpers'
import nock from 'nock'
import employeesResponse from './__fixtures__/employees'

const mockLighthouseBaseUrl = 'http://test-api.lighthouse.io'
const mockWinteamBaseUrl = 'http://test-api.winteam.com'
const mockEndpoint = '/employees'
const mockTenantId = 'tenantId'
const mockSubscriptionKey = 'subscriptionKey'
const mockTenantBaseUrl = 'http://tenant-api.com'
const mockTenantCode = 'tenantfakecode'
const mockLighthouseApplicationId = '565e42d3d4c628373ab25231'

jest.mock('../../helpers/upsertUser', () => ({
  upsertUser: jest
    .fn()
    .mockResolvedValue({ type: 'created' })
    .mockReturnValueOnce({ type: 'update' }),
}))

const mockApplication = {
  applicationId: '593a2cb3ade57c2849a388cd',
  name: 'Mock Application',
  settings: {
    role: {
      default: 'default-role-id',
    },
  },
}
const mockWinteamTenantResponse = {
  id: 'MasterTenant1',
  masterTenantId: null,
  customerData: null,
  mappings: [
    {
      productId: 'winteam',
      tenantId: mockTenantId,
      description: 'DanF',
    },
    {
      productId: 'lighthouse',
      tenantId: mockLighthouseApplicationId,
      description: 'lightning',
    },
  ],
}

const mockWinteamApplicationNotFoundRecords = {
  id: 'MasterTenant1',
  masterTenantId: null,
  customerData: null,
  mappings: [
    {
      productId: 'winteam',
      tenantId: mockTenantId,
      description: 'DanF',
    },
    {
      productId: 'lighthouse',
      tenantId: null,
      description: 'lightning',
    },
  ],
}
const mockEmployee = {
  EmployeeID: 'e00ef350-f15c-4bed-9795-37503fffb9e6',
  EmployeeNumber: '1',
  FirstName: 'Bob',
  MiddleName: null,
  LastName: 'Smith',
  Address: {
    Address1: 'PR',
    Address2: null,
    City: 'San Juan',
    State: 'ne',
    Zip: '00901',
  },
  PhysicalAddress: {
    Address1: '407th Av',
    Address2: null,
    City: 'Rocky Creek',
    State: 'MN',
    Zip: '73563',
  },
  EmailAddress: 'bob.smith@lighthouse.io',
  ClassificationId: 111,
  DateAdded: '2016-08-26T09:14:42.82',
}

describe('http', () => {
  const scope = nock(mockWinteamBaseUrl)
  const spies: any = {}

  beforeEach(() => {
    process.env.EMPLOYEES_ENDPOINT = mockEndpoint
    process.env.LIGHTHOUSE_BASE_URL = mockLighthouseBaseUrl
    process.env.WINTEAM_BASE_URL = mockWinteamBaseUrl
    process.env.AZURE_KEY_VAULT = 'azure-key-vault'
    process.env.TENANT_BASE_URL = mockTenantBaseUrl
    process.env.TENANT_CODE = mockTenantCode
    process.env.SUBSCRIPTION_KEY = 'subscription-key-test'

    winteam.helpers.winteamRequest = jest.fn().mockResolvedValue(mockEmployee)
    secrets.getSecret = jest.fn().mockResolvedValue(mockSubscriptionKey)

    spies.applicationFindOne = jest
      .fn()
      .mockResolvedValue(mockApplication)
      .mockName('applicationFindOneSpy')

    spies.getCollection = mongo.getCollection = jest.fn(async collection => {
      if (collection === 'applications') {
        return {
          findOne: spies.applicationFindOne,
        }
      }
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('errors when missing applicationId', async () => {
    process.env.EMPLOYEES_ENDPOINT = ''

    const context = createMockContext()

    try {
      await handleFullLoadEmployees(
        {
          context,
          data: {
            PrimaryKeyValue: 'idNotExist',
            WinTeamDBName: 'WinTeamDBName',
          },
        },
        mockWinteamApplicationNotFoundRecords,
      )
    } catch (err) {
      expect(err).toMatchInlineSnapshot(`[Error: ApplicationId not found]`)
    }
  })

  test('handles unknown application', async () => {
    spies.applicationFindOne = jest.fn().mockResolvedValue(undefined)

    const context = createMockContext()

    try {
      await handleFullLoadEmployees(
        {
          context,
          data: {
            ChangeOperation: 'F',
            WinTeamDBName: 'WinTeamDBName',
          },
        },
        mockWinteamTenantResponse,
      )
    } catch (err) {
      expect(err).toMatchInlineSnapshot(
        `[Error: ApplicationNotFoundError - applicationId:${mockLighthouseApplicationId}]`,
      )
      expect(upsertUser).not.toHaveBeenCalled()
    }
  })

  test('handles valid input for created and updated', async () => {
    const context = createMockContext()
    jest.clearAllMocks()

    scope
      .get(mockEndpoint)
      .matchHeader('tenantid', mockTenantId)
      .matchHeader('ocp-apim-subscription-key', mockSubscriptionKey)
      .matchHeader('host', 'test-api.winteam.com')
      .reply(200, employeesResponse, {})
      .persist()

    const result = await handleFullLoadEmployees(
      {
        context,
        data: {
          ChangeOperation: 'F',
          WinTeamDBName: 'DanF',
        },
      },
      mockWinteamTenantResponse,
    )

    expect(spies.applicationFindOne).toHaveBeenCalledTimes(1)

    expect(upsertUser).toHaveBeenCalledTimes(14)
    expect(upsertUser).toHaveBeenCalledWith({
      application: expect.any(Object),
      employee: expect.any(Object),
    })

    expect(result).toMatchInlineSnapshot(`
Object {
  "stats": Object {
    "created": 13,
    "processed": 14,
    "updated": 1,
  },
}
`)
  })

  test('handles valid input for updated', async () => {
    const context = createMockContext()
    jest.clearAllMocks()

    let upsertUserSpy = jest.spyOn(upsertUserModule, 'upsertUser')

    upsertUserSpy.mockResolvedValue({ type: 'update' })

    scope
      .get(mockEndpoint)
      .matchHeader('tenantid', mockTenantId)
      .matchHeader('ocp-apim-subscription-key', mockSubscriptionKey)
      .matchHeader('host', 'test-api.winteam.com')
      .reply(200, employeesResponse, {})
      .persist()

    const result = await handleFullLoadEmployees(
      {
        context,
        data: {
          ChangeOperation: 'F',
          WinTeamDBName: 'DanF',
        },
      },
      mockWinteamTenantResponse,
    )

    expect(spies.applicationFindOne).toHaveBeenCalledTimes(1)

    expect(upsertUser).toHaveBeenCalledTimes(14)
    expect(upsertUser).toHaveBeenCalledWith({
      application: expect.any(Object),
      employee: expect.any(Object),
    })
    expect(result.stats.updated).toEqual(14)
    expect(result).toMatchInlineSnapshot(`
Object {
  "stats": Object {
    "created": 0,
    "processed": 14,
    "updated": 14,
  },
}
`)
  })

  test('handles valid input with dryRun`is true', async () => {
    const context = createMockContext()
    scope
      .get(mockEndpoint)
      .matchHeader('tenantid', mockTenantId)
      .matchHeader('ocp-apim-subscription-key', mockSubscriptionKey)
      .matchHeader('host', 'test-api.winteam.com')
      .reply(200, employeesResponse, {})
      .persist()

    const result = await handleFullLoadEmployees(
      {
        context,
        data: {
          ChangeOperation: 'F',
          WinTeamDBName: 'DanF',
          dryRun: true,
        },
      },
      mockWinteamTenantResponse,
    )

    expect(spies.applicationFindOne).toHaveBeenCalledTimes(1)

    expect(upsertUser).toHaveBeenCalledTimes(0)
  })
})
