import * as AWS from 'aws-sdk'
import * as BPromise from 'bluebird'
import { endOfHour, format, startOfHour, subDays, subHours } from 'date-fns'
import { drop, each, isEmpty, reduce, take } from 'lodash'
import * as moment from 'moment-timezone'

import { fetchApplications } from '../../helpers/fetch-applications'
import { fetchLocations } from '../../helpers/fetch-locations'

interface Location {
  applicationId: string
  end: string
  locationId: string
  start: string
}

const BATCH_SIZE = 30
const BATCH_DELAY = 5000

export const ISO_STRING = 'YYYY-MM-DD[T]HH:mm:ssZ'

export default locationProcessor

export async function locationProcessor(event) {
  if (!process.env.LOCATION_PROCESSOR_ARN) {
    throw new Error('locationProcessor: Missing required environment variables')
  }

  const isJson = typeof event.body === 'string'
  const payload = isJson ? JSON.parse(event.body) : event
  const datetime = payload.datetime ? new Date(payload.datetime) : new Date()

  console.info('fetch applications')
  const applications = await fetchApplications()

  console.info('fetch application locations')
  const applicationLocations = await BPromise.mapSeries(
    applications,
    application =>
      BPromise.delay(100).then(() => fetchLocations(application._id)),
  )

  let locationsToProcess: Location[] = parseApplicationLocations(
    applicationLocations,
    datetime,
  )

  const locationsToProcessCount = locationsToProcess.length

  console.info('trigger location processor', {
    count: locationsToProcessCount,
  })

  // NOTE This pattern has an upper limit of the number of locations we can
  // process. A delay of 5 seconds means a location limit of 180 * BATCH_SIZE
  // (e.g. 180 * 30 = 5400 locations) because lambdas have a max run time of
  // 15mins. The intention is to refactor this into a step function which
  // iterates over all locations until it completes
  while (locationsToProcess.length) {
    const nextBatch = take(locationsToProcess, BATCH_SIZE)

    console.info('processing next batch', nextBatch.length)

    nextBatch.forEach(processLocation)

    locationsToProcess = drop(locationsToProcess, BATCH_SIZE)

    // Delay next batch to stagger DB queries in processor
    await BPromise.delay(BATCH_DELAY)
  }

  return {
    locationsProcessedCount: locationsToProcessCount,
  }
}

export function parseApplicationLocations(applicationLocations, datetime) {
  if (isEmpty(applicationLocations)) {
    return []
  }

  const startTime = startOfHour(subDays(datetime, 1))
  const endTime = endOfHour(subHours(datetime, 1))

  return reduce(
    applicationLocations,
    (accum, locations) => {
      each(locations, location => {
        const {
          _id,
          activityReportTriggerTime,
          application,
          timezone,
        } = location

        // NOTE: if no trigger time or timezone skip location
        if (!activityReportTriggerTime || !timezone) {
          return
        }

        const { hours } = activityReportTriggerTime

        // NOTE: we must account for daylight saving time in all timezones so
        // check current hour value for location timezone and then ensure it
        // matches the hours set on the location
        const hourInTimezone = moment(datetime)
          .utc()
          .tz(timezone)
          .hours()

        if (hours === hourInTimezone) {
          accum.push({
            applicationId: application,
            end: format(endTime, ISO_STRING),
            locationId: _id,
            start: format(startTime, ISO_STRING),
          })
        }
      })

      return accum
    },
    [],
  )
}

export function processLocation(location) {
  const stateMachineArn = process.env.LOCATION_PROCESSOR_ARN

  if (!stateMachineArn) {
    throw new Error(
      'processLocations: Missing LOCATION_PROCESSOR_ARN environment variable',
    )
  }

  const request = {
    input: JSON.stringify(location),
    stateMachineArn,
  }

  return new AWS.StepFunctions().startExecution(request).promise()
}
