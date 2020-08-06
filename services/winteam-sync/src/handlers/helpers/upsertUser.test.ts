import { mongo, secrets, schemas } from '@lighthouse/serverless-common'
import { omit } from 'lodash/fp'
import nock from 'nock'
import { CreateUserStrategies, WinteamEmployee, upsertUser } from './upsertUser'

const mockApplication: schemas.ApplicationSchema = {
  _id: 'appId-1',
  name: 'Mock Application',
  settings: {
    roles: {
      default: '5978b4d1f155a87d119bd875',
    },
  },
}

const mockEmployee: WinteamEmployee = {
  EmployeeID: '0001',
  EmployeeNumber: '0000001',
  FirstName: 'Bob',
  LastName: 'Smith',
  EmailAddress: 'bob.smith@winteam.com',
}

const mockApplicationUser = {
  _id: 'applicationUser1',
  application: 'app1',
  firstName: 'first-name',
  lastName: 'last-name',
  username: 'username',
}

const mockUser = {
  _id: 'user1',
  firstName: 'first-name',
  lastName: 'last-name',
  auth: {
    failedLoginCount: 1,
    username: 'username',
    password: 'pass',
    token: 'faketoken',
  },
}

const defaultOptions = {
  application: mockApplication,
  employee: mockEmployee,
}

const mockData = {
  WinteamDatabaseName: 'apg',
}

const mockLighthouseBaseUrl = 'https://test-api.lighthouse.io'
const scope = nock(mockLighthouseBaseUrl, {
  reqheaders: {
    authorization: 'mock_auth_token',
  },
})
const spies: any = {}

beforeEach(() => {
  process.env.LIGHTHOUSE_BASE_URL = mockLighthouseBaseUrl
  process.env.LIGHTHOUSE_API_SECRET = 'lighthouse-api-test'
  process.env.AZURE_KEY_VAULT = 'azure-key-vault'

  secrets.getSecret = jest.fn().mockResolvedValue('mock_auth_token')

  setup()
})

test('errors when missing LIGHTHOUSE_BASE_URL env', async () => {
  expect.assertions(2)

  process.env.LIGHTHOUSE_BASE_URL = ''

  try {
    await upsertUser(defaultOptions)
  } catch (err) {
    expect(err).toMatchInlineSnapshot(
      `[Error: ConfigurationError: Missing env 'LIGHTHOUSE_BASE_URL']`,
    )

    // ensure getCollection and subsequently any mongo methods are not called
    expect(spies.getCollection).not.toHaveBeenCalled()
  }
})

test('errors when missing LIGHTHOUSE_API_SECRET env', async () => {
  expect.assertions(2)

  process.env.LIGHTHOUSE_API_SECRET = ''

  try {
    await upsertUser(defaultOptions)
  } catch (err) {
    expect(err).toMatchInlineSnapshot(
      `[Error: ConfigurationError: Missing env 'LIGHTHOUSE_API_SECRET']`,
    )

    // ensure getCollection and subsequently any mongo methods are not called
    expect(spies.getCollection).not.toHaveBeenCalled()
  }
})

test('errors when missing `application` input', async () => {
  expect.assertions(2)

  const options = omit('application', defaultOptions)

  try {
    await upsertUser(options as any)
  } catch (err) {
    expect(err).toMatchInlineSnapshot(
      `[Error: InputError: Missing "application" option]`,
    )

    // ensure getCollection and subsequently any mongo methods are not called
    expect(spies.getCollection).not.toHaveBeenCalled()
  }
})

test('errors when missing `employee` input', async () => {
  expect.assertions(2)

  const options = omit('employee', defaultOptions)

  try {
    await upsertUser(options as any)
  } catch (err) {
    expect(err).toMatchInlineSnapshot(
      `[Error: InputError: Missing "employee" option]`,
    )

    // ensure getCollection and subsequently any mongo methods are not called
    expect(spies.getCollection).not.toHaveBeenCalled()
  }
})

test('errors when application does not have default role', async () => {
  expect.assertions(1)

  const options = {
    ...defaultOptions,
    application: {
      settings: {
        roles: {
          default: undefined,
        },
      },
    },
  }

  try {
    await upsertUser(options)
  } catch (err) {
    expect(err).toMatchInlineSnapshot(
      `[Error: DefaultRoleError: Application must have a default role setting]`,
    )
  }
})

test('handles valid new user', async () => {
  expect.assertions(2)

  const mockResponse = {
    _id: 'newUserId1',
    firstName: 'Bob',
    lastName: 'Smith',
  }

  scope
    .put('/applications/appId-1/users', {
      firstName: 'Bob',
      lastName: 'Smith',
      plugins: {
        winteam: {
          options: {
            employeeNumber: mockEmployee.EmployeeNumber,
          },
          enabled: true,
        },
      },
      email: 'bob.smith@winteam.com',
      username: '0000001',
      auth: {},
      role: '5978b4d1f155a87d119bd875',
      password: 'team0000001',
      preferences: {},
      type: CreateUserStrategies.ResetOnNextLogin,
    })
    .reply(201, mockResponse)

  const result = await upsertUser(defaultOptions)

  expect(spies.applicationUserFindOne).toHaveBeenCalledWith({
    application: mockApplication._id,
    $and: [
      { 'plugins.winteam.options.employeeNumber': mockEmployee.EmployeeNumber },
      { deleted: false },
    ],
  })

  expect(result).toMatchInlineSnapshot(`
    Object {
      "data": Object {
        "id": "newUserId1",
      },
      "type": "new",
    }
  `)
})

test('handles valid existing user', async () => {
  spies.applicationUserFindOne.mockImplementation(() => mockApplicationUser)

  const mockResponse = {
    _id: 'newUserId1',
    firstName: 'Bob',
    lastName: 'Smith',
  }

  scope
    .put(`/applications/appId-1/users/${mockApplicationUser._id}`, {
      email: 'bob.smith@winteam.com',
      firstName: 'Bob',
      lastName: 'Smith',
      plugins: {
        winteam: {
          options: {
            employeeNumber: mockEmployee.EmployeeNumber,
          },
          enabled: true,
        },
      },
    })
    .reply(201, mockResponse)
    .persist()

  const result = await upsertUser(defaultOptions)

  expect(result).toMatchInlineSnapshot(`
    Object {
      "data": Object {
        "id": "newUserId1",
      },
      "type": "update",
    }
  `)
})

test('handles Error Update User Error', async () => {
  spies.applicationUserFindOne.mockImplementation(() => mockApplicationUser)

  const mockResponseError = {
    error: {
      code: 500,
      message: 'Unknown error',
    },
  }

  nock.cleanAll()
  scope
    .put(`/applications/appId-1/users/${mockApplicationUser._id}`, {
      email: 'bob.smith@winteam.com',
      firstName: 'Bob',
      lastName: 'Smith',
      plugins: {
        winteam: {
          options: {
            employeeNumber: mockEmployee.EmployeeNumber,
          },
          enabled: true,
        },
      },
    })
    .reply(500, mockResponseError)
    .persist()
  try {
    const result = await upsertUser(defaultOptions)
  } catch (err) {
    expect(err).toMatchInlineSnapshot(
      `[Error: ApplicationUserUpdateError: 500, Unknown error]`,
    )
  }
})

test('handles Error New User Error', async () => {
  const mockResponseError = {
    error: {
      code: 500,
      message: 'Unknown error',
    },
  }

  scope
    .put('/applications/appId-1/users', {
      firstName: 'Bob',
      lastName: 'Smith',
      plugins: {
        winteam: {
          options: {
            employeeNumber: mockEmployee.EmployeeNumber,
          },
          enabled: true,
        },
      },
      email: 'bob.smith@winteam.com',
      username: '0000001',
      auth: {},
      role: '5978b4d1f155a87d119bd875',
      password: 'team0000001',
      preferences: {},
      type: CreateUserStrategies.ResetOnNextLogin,
    })
    .reply(500, mockResponseError)

  try {
    const result = await upsertUser(defaultOptions)
  } catch (err) {
    expect(err).toMatchInlineSnapshot(
      `[Error: ApplicationUserCreateError: 500, Unknown error]`,
    )
  }
})

function setup() {
  spies.applicationUserFindOne = jest
    .fn()
    .mockResolvedValue(undefined)
    .mockName('applicationUserFindOneSpy')

  spies.getCollection = mongo.getCollection = jest.fn(async collection => {
    if (collection === 'applicationusers') {
      return {
        create: spies.applicationUserCreate,
        findOne: spies.applicationUserFindOne,
        set: spies.applicationUserSet,
      }
    }
  })
}
