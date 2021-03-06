jest.mock('../../helpers/upsertUser', () => ({
  upsertUser: jest.fn().mockResolvedValue({}),
}))

import { mongo, secrets } from '@lighthouse/serverless-common'
import { winteam } from '@lighthouse/serverless-integrations'
import handleSingleLoadEmployee, {
  getEmployee,
} from './handleSingleLoadEmployee'
import { upsertUser } from '../../helpers/upsertUser'
import { createMockContext } from '../../../../../../__test__/helpers'
import nock from 'nock'

const mockLighthouseBaseUrl = 'https://test-api.lighthouse.io'
const mockWinteamBaseUrl = 'https://test-api.winteam.com'
const mockEndpoint = '/path/to/resource/'
const mockTenantId = 'ten7826f2e6-66c2-8294-f146-5e2b1bcb4140antId'
const mockSubscriptionKey = '69e06ced50d84c5098bf5b05356f1e9c'
const mockTenantBaseUrl = 'https://tenant-api.com'
const mockTenantCode = 'tenantfakecode'
const mockLighthouseApplicationId = '565e42d3d4c628373ab25231'

const mockApplication = {
  applicationId: '593a2cb3ade57c2849a388cd',
  name: 'Mock Application',
  settings: {
    role: {
      default: 'default-role-id',
    },
  },
}
const mockWinteamTenantResponse: WinteamTenant = {
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
const mockWinteamTenantNotFoundRecords = []
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

const scope = nock(mockTenantBaseUrl)

const spies: any = {}

beforeEach(() => {
  setup()
})

afterEach(() => {
  jest.clearAllMocks()
})

test('errors when `PrimaryKeyValue` is missing', async () => {
  expect.assertions(1)

  const context = createMockContext()

  try {
    await handleSingleLoadEmployee(
      {
        context,
        data: {
          WinTeamDBName: 'WinTeamDBName',
        },
      },
      mockWinteamTenantResponse,
    )
  } catch (err) {
    expect(err).toMatchInlineSnapshot(
      `[ValidationError: PrimaryKeyValue is required]`,
    )
  }
})

test('handles unknown employee', async () => {
  expect.assertions(3)

  winteam.helpers.winteamGetRequest = jest.fn().mockResolvedValue(undefined)

  const context = createMockContext()

  try {
    await handleSingleLoadEmployee(
      {
        context,
        data: {
          PrimaryKeyValue: 'idontexist',
          WinTeamDBName: 'WinTeamDBName',
        },
      },
      mockWinteamTenantResponse,
    )
  } catch (err) {
    expect(err).toMatchInlineSnapshot(`[Error: EmployeeNotFoundError]`)

    expect(winteam.helpers.winteamGetRequest).toHaveBeenCalledWith({
      baseUrl: mockWinteamBaseUrl,
      endpoint: mockEndpoint + 'idontexist',
      headers: {
        subscriptionKey: mockSubscriptionKey,
        tenantId: mockTenantId,
      },
      method: 'GET',
    })

    expect(upsertUser).not.toHaveBeenCalled()
  }
})

test('handles unknown application', async () => {
  winteam.helpers.winteamGetRequest = jest.fn().mockResolvedValue(mockEmployee)
  spies.applicationFindOne = jest.fn().mockResolvedValue(undefined)

  const context = createMockContext()

  try {
    await handleSingleLoadEmployee(
      {
        context,
        data: {
          PrimaryKeyValue: 'idontexist',
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

test('process new employee with valid data', async () => {
  expect.assertions(2)

  const context = createMockContext()

  const result = await handleSingleLoadEmployee(
    {
      context,
      data: {
        PrimaryKeyValue: 'e00ef350-f15c-4bed-9795-37503fffb9e6',
        WinTeamDBName: 'WinTeamDBName',
      },
    },
    mockWinteamTenantResponse,
  )

  expect(winteam.helpers.winteamGetRequest).toHaveBeenCalledWith({
    baseUrl: mockWinteamBaseUrl,
    endpoint: mockEndpoint + 'e00ef350-f15c-4bed-9795-37503fffb9e6',
    headers: {
      subscriptionKey: mockSubscriptionKey,
      tenantId: mockTenantId,
    },
    method: 'GET',
  })
  expect(result).toMatchInlineSnapshot(`Object {}`)
})

function setup() {
  process.env.EMPLOYEES_ENDPOINT = mockEndpoint
  process.env.LIGHTHOUSE_BASE_URL = mockLighthouseBaseUrl
  process.env.TENANT_ID = mockTenantId
  process.env.WINTEAM_BASE_URL = mockWinteamBaseUrl
  process.env.AZURE_KEY_VAULT = 'azure-key-vault'
  process.env.TENANT_BASE_URL = mockTenantBaseUrl
  process.env.TENANT_CODE = mockTenantCode
  process.env.SUBSCRIPTION_KEY = 'subscription-key-test'

  winteam.helpers.winteamRequest = jest.fn().mockResolvedValue(mockEmployee)

  secrets.getSecret = jest.fn().mockResolvedValue(mockSubscriptionKey)

  scope
    .get('/tenants')
    .query({
      productDescription: 'WinTeamDBName',
      code: process.env.TENANT_CODE,
    })
    .reply(200, mockWinteamTenantResponse)

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
}
