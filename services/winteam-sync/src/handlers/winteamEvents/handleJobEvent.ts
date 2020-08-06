import { Context } from '@azure/functions'
import { api, secrets } from '@lighthouse/serverless-common'
import { winteam } from '@lighthouse/serverless-integrations'
import circle from '@turf/circle'
import { point } from '@turf/helpers'
import { Polygon } from 'geojson'

enum Env {
  JOBS_ENDPOINT = 'JOBS_ENDPOINT',
  LIGHTHOUSE_API_SECRET = 'LIGHTHOUSE_API_SECRET',
  LIGHTHOUSE_BASE_URL = 'LIGHTHOUSE_BASE_URL',
  TENANT_ID = 'TENANT_ID', // TODO fetch from tenant api
  WINTEAM_BASE_URL = 'WINTEAM_BASE_URL',
  AZURE_KEY_VAULT = 'AZURE_KEY_VAULT',
}

interface ProcessEnv {
  env: { [env in Env]: string }
}

declare var process: ProcessEnv

export interface HandleJobEvent {
  context: Context
  data: {
    jobId: string
  }
}

const defaultGeofenceRadius = 0.1 // km

export default async function handleJobEvent({
  context,
  data,
}: HandleJobEvent): Promise<object> {
  const { jobId } = data

  assertEnv()

  if (!data.jobId) {
    throw handleError('InputError: jobId is required', {
      data,
    })
  }

  const job = await getJob(jobId)

  if (!job) {
    const err = new Error('JobNotFoundError')

    context.log.error('handleJobEvent: JobNotFoundError', {
      data,
    })

    throw err
  }

  const areaLocation: AreaLocation = mapJobToArea(job)

  const authorization = await secrets.getSecret(
    process.env.LIGHTHOUSE_API_SECRET,
    'authorization',
  )
  const apiClient = api.createClient()

  // TODO use tenant api for fetching applicationId
  const applicationId = 'fake-application-id'

  const areasBaseUrl = `${
    process.env.LIGHTHOUSE_BASE_URL
  }/applications/${applicationId}/areas`

  const matchedLocations: any[] = await apiClient.get(areasBaseUrl, {
    headers: {
      authorization,
    },
    query: {
      'plugins.winteam.options.jobId': job.JobID,
    },
  })

  const matchedLocation = matchedLocations[0]

  if (matchedLocation) {
    const putUrl = `${areasBaseUrl}/${matchedLocation._id}`

    const updatedLocation = await apiClient.put(putUrl, {
      body: areaLocation,
      headers: {
        authorization,
      },
    })

    return updatedLocation
  }

  const newLocation = await apiClient.post(areasBaseUrl, {
    body: areaLocation,
    headers: {
      authorization,
    },
  })

  return newLocation
}

interface Job {
  JobNumber: string
  JobID: string
  JobDescription: string
  LocationId: number
  CompanyNumber: number
  Address: {
    Address1: string
    Address2: string
    City: string
    State: string
    Zip: string
    Latitude: string
    // TODO where is the radius value? Perhaps a default value: 100m
    Longitude: string
    LocationCode: string
  }
  Phone1: string
  Phone1Description: string
  Phone2: string
  Phone2Description: string
  Phone3Description: string
  JobAttention: string
  TypeID: number
  SupervisorID: number
}

interface AreaLocation {
  name: string
  type: string
  geometry: Polygon
  timezone: string
  plugins: {
    winteam: {
      options: {
        jobId: string
        jobNumber: string
      }
    }
  }
  address: {
    street: string
    street2: string
    city: string
    state: string
    postalCode: string
    country: string
  }
}

function mapJobToArea(job: Job): AreaLocation {
  const lat = parseFloat(job.Address.Latitude)
  const lng = parseFloat(job.Address.Longitude)
  const pointGeoJson = point([lng, lat])
  // NOTE where does the radius come from on a job?
  const circleGeoJson = circle(pointGeoJson, defaultGeofenceRadius)

  return {
    // TODO application
    name: job.JobDescription,
    type: 'location',
    geometry: circleGeoJson.geometry,
    timezone: 'America/Los_Angeles', // TODO timezone integration
    plugins: {
      winteam: {
        options: {
          jobId: job.JobID,
          jobNumber: job.JobNumber,
        },
      },
    },
    address: {
      street: job.Address.Address1,
      street2: job.Address.Address2,
      city: job.Address.City,
      state: job.Address.State,
      postalCode: job.Address.Zip,
      country: '', // TODO country field
    },
  }
}

function assertEnv() {
  for (const env in Env) {
    if (!process.env[env]) {
      throw handleError(`ConfigurationError: Missing env '${env}'`)
    }
  }
}

// TODO This will need to be refactored to accept a tenantId
async function getJob(jobId: string) {
  const subscriptionKey = await secrets.getSecret(
    process.env.AZURE_KEY_VAULT,
    'subscriptionKey',
  )
  const request = {
    baseUrl: process.env.WINTEAM_BASE_URL,
    endpoint: `${process.env.JOBS_ENDPOINT}/${jobId}`,
    headers: {
      subscriptionKey,
      tenantId: 'tenantId', // TODO this will be passed in with the event
    },
    method: 'GET',
  }

  const job = await winteam.helpers.winteamGetRequest(request)
  return job
}

function handleError(message: string, data?: object): Error {
  const err = new Error(message)

  console.error(`handleJobEventError: ${message}`, {
    err,
    ...data,
  })

  return err
}
