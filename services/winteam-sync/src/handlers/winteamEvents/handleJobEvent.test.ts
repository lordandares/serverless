import { secrets } from '@lighthouse/serverless-common'
import { winteam } from '@lighthouse/serverless-integrations'
import nock from 'nock'
import handleJobEvent from './handleJobEvent'
import { createMockContext } from '../../../../../__test__/helpers'
import lighthouseLocation from './__fixtures__/lighthouseLocation'

const mockLighthouseBaseUrl = 'https://test-api.lighthouse.io'
const mockBaseUrl = '/Winteam/v2'
const mockEndpoint = '/path/to/resource'
const mockJob = {
  JobNumber: '50012',
  JobID: '947049c7-e118-4ee9-8e2e-c956285917f1',
  JobDescription: 'Powell Motors',
  LocationId: 6,
  CompanyNumber: 1,
  Address: {
    Address1: 'Center',
    Address2: '7855 So. River Pkwy',
    City: 'San Diego',
    State: 'CA',
    Zip: '852840000',
    // TODO where is the radius value? Perhaps a default value: 100m
    Latitude: '-75.344',
    Longitude: '39.984',
    LocationCode: 'string',
  },
  Phone1: 'string',
  Phone1Description: 'string',
  Phone2: 'string',
  Phone2Description: 'string',
  Phone3Description: 'string',
  JobAttention: 'string',
  TypeID: 0,
  SupervisorID: 0,
}
const scope = nock(mockLighthouseBaseUrl, {
  reqheaders: {
    authorization: 'mock_auth_token',
  },
})

beforeEach(() => {
  process.env.JOBS_ENDPOINT = mockEndpoint
  process.env.LIGHTHOUSE_API_SECRET = 'lighthouse-api-test'
  process.env.LIGHTHOUSE_BASE_URL = mockLighthouseBaseUrl
  process.env.TENANT_ID = 'tenantId'
  process.env.WINTEAM_BASE_URL = mockBaseUrl
  process.env.AZURE_KEY_VAULT = 'azure-key-vault'

  secrets.getSecret = jest
    .fn()
    .mockResolvedValueOnce('subscriptionKey')
    .mockResolvedValueOnce('mock_auth_token')
  winteam.helpers.winteamGetRequest = jest.fn().mockResolvedValue(mockJob)
})

afterEach(() => {
  jest.clearAllMocks()
})

afterAll(() => {
  jest.resetAllMocks()
})

test('errors when missing JOBS_ENDPOINT env', async () => {
  expect.assertions(1)

  process.env.JOBS_ENDPOINT = ''

  const context = createMockContext()

  try {
    await handleJobEvent({
      context,
      data: {
        jobId: mockJob.JobID,
      },
    })
  } catch (err) {
    expect(err).toMatchInlineSnapshot(
      `[Error: ConfigurationError: Missing env 'JOBS_ENDPOINT']`,
    )
  }
})

test('errors when missing WINTEAM_BASE_URL env', async () => {
  expect.assertions(1)

  process.env.WINTEAM_BASE_URL = ''

  const context = createMockContext()

  try {
    await handleJobEvent({
      context,
      data: {
        jobId: mockJob.JobID,
      },
    })
  } catch (err) {
    expect(err).toMatchInlineSnapshot(
      `[Error: ConfigurationError: Missing env 'WINTEAM_BASE_URL']`,
    )
  }
})

test('errors when missing AZURE_KEY_VAULT env', async () => {
  expect.assertions(1)

  process.env.AZURE_KEY_VAULT = ''

  const context = createMockContext()

  try {
    await handleJobEvent({
      context,
      data: {
        jobId: mockJob.JobID,
      },
    })
  } catch (err) {
    expect(err).toMatchInlineSnapshot(
      `[Error: ConfigurationError: Missing env 'AZURE_KEY_VAULT']`,
    )
  }
})

test('errors when missing LIGHTHOUSE_BASE_URL env', async () => {
  expect.assertions(1)

  process.env.LIGHTHOUSE_BASE_URL = ''

  const context = createMockContext()

  try {
    await handleJobEvent({
      context,
      data: {
        jobId: mockJob.JobID,
      },
    })
  } catch (err) {
    expect(err).toMatchInlineSnapshot(
      `[Error: ConfigurationError: Missing env 'LIGHTHOUSE_BASE_URL']`,
    )
  }
})

test('errors when missing LIGHTHOUSE_API_SECRET env', async () => {
  expect.assertions(1)

  process.env.LIGHTHOUSE_API_SECRET = ''

  const context = createMockContext()

  try {
    await handleJobEvent({
      context,
      data: {
        jobId: mockJob.JobID,
      },
    })
  } catch (err) {
    expect(err).toMatchInlineSnapshot(
      `[Error: ConfigurationError: Missing env 'LIGHTHOUSE_API_SECRET']`,
    )
  }
})

test('errors when jobId is missing', async () => {
  expect.assertions(1)

  const context = createMockContext()

  try {
    await handleJobEvent({
      context,
      data: {},
    } as any)
  } catch (err) {
    expect(err).toMatchInlineSnapshot(`[Error: InputError: jobId is required]`)
  }
})

test('handles unknown job', async () => {
  expect.assertions(2)

  winteam.helpers.winteamGetRequest = jest.fn().mockResolvedValue(undefined)

  const context = createMockContext()

  try {
    await handleJobEvent({
      context,
      data: {
        jobId: 'idontexist',
      },
    })
  } catch (err) {
    expect(err).toMatchInlineSnapshot(`[Error: JobNotFoundError]`)

    expect(winteam.helpers.winteamGetRequest).toHaveBeenCalledWith({
      baseUrl: mockBaseUrl,
      endpoint: `${mockEndpoint}/idontexist`,
      headers: {
        subscriptionKey: 'subscriptionKey',
        tenantId: 'tenantId',
      },
      method: 'GET',
    })

    // TODO assert that mongo apis were not called
  }
})

// TODO
test.skip('handles mongo error', () => {})

test('process new job with valid data', async () => {
  expect.assertions(2)

  scope
    .get('/applications/fake-application-id/areas')
    .query({
      'plugins.winteam.options.jobId': mockJob.JobID,
    })
    .reply(200, [])

  scope
    .post('/applications/fake-application-id/areas')
    .reply(201, lighthouseLocation)

  const context = createMockContext()

  const result = await handleJobEvent({
    context,
    data: {
      jobId: mockJob.JobID,
    },
  })

  expect(winteam.helpers.winteamGetRequest).toHaveBeenCalledWith({
    baseUrl: mockBaseUrl,
    endpoint: `${mockEndpoint}/${mockJob.JobID}`,
    headers: {
      subscriptionKey: 'subscriptionKey',
      tenantId: 'tenantId',
    },
    method: 'GET',
  })

  expect(result).toEqual({
    _id: expect.any(String),
    name: 'Powell Motors',
    type: 'location',
    geometry: lighthouseLocation.geometry,
    timezone: 'America/Los_Angeles',
    plugins: {
      winteam: {
        options: {
          jobNumber: '50012',
          jobId: '947049c7-e118-4ee9-8e2e-c956285917f1',
        },
      },
    },
    address: {
      street: 'Center',
      street2: '7855 So. River Pkwy',
      city: 'San Diego',
      state: 'CA',
      postalCode: '852840000',
      country: 'US',
    },
  })
})

test('process existing job with valid data', async () => {
  expect.assertions(2)

  const updatedJobDescription = 'Wills Motors'

  winteam.helpers.winteamGetRequest = jest.fn().mockResolvedValue({
    ...mockJob,
    JobDescription: updatedJobDescription,
  })

  scope
    .get('/applications/fake-application-id/areas')
    .query({
      'plugins.winteam.options.jobId': mockJob.JobID,
    })
    .reply(200, [lighthouseLocation])

  scope
    .put(`/applications/fake-application-id/areas/${lighthouseLocation._id}`)
    .reply(200, {
      ...lighthouseLocation,
      name: updatedJobDescription,
    })

  const context = createMockContext()

  const result = await handleJobEvent({
    context,
    data: {
      jobId: mockJob.JobID,
    },
  })

  expect(winteam.helpers.winteamGetRequest).toHaveBeenCalledWith({
    baseUrl: mockBaseUrl,
    endpoint: `${mockEndpoint}/${mockJob.JobID}`,
    headers: {
      subscriptionKey: 'subscriptionKey',
      tenantId: 'tenantId',
    },
    method: 'GET',
  })

  expect(result).toEqual({
    _id: expect.any(String),
    name: updatedJobDescription,
    type: 'location',
    geometry: lighthouseLocation.geometry,
    timezone: 'America/Los_Angeles',
    plugins: {
      winteam: {
        options: {
          jobNumber: '50012',
          jobId: '947049c7-e118-4ee9-8e2e-c956285917f1',
        },
      },
    },
    address: {
      street: 'Center',
      street2: '7855 So. River Pkwy',
      city: 'San Diego',
      state: 'CA',
      postalCode: '852840000',
      country: 'US',
    },
  })
})
