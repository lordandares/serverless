import { scheduling } from '@lighthouse/common'
import { errors, schemas } from '@lighthouse/serverless-common'
import { Context, SNSEvent } from 'aws-lambda'
import { DynamoDB } from 'aws-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import * as BPromise from 'bluebird'
import { filter, orderBy } from 'lodash'
import * as moment from 'moment'
import { v4 as uuid } from 'uuid'

import {
  MAX_OCCURRENCES,
  MAX_STOPWATCH_OCCURRENCES,
  OCCURRENCE_STATUS_PENDING,
  OCCURRENCE_STATUS_RESOLVED,
} from '../constants'

interface Event {
  scheduleId: string
}

declare var process: {
  env: {
    TABLE_SCHEDULES: string
  }
}

export async function generateOccurrencesHandler(
  event: Event,
  context: Context,
): Promise<schemas.ScheduleOccurrenceDocumentSchema[]> {
  try {
    if (!context) {
      throw new errors.ApplicationError({
        message: 'GenerateOccurrencesHandler: missing context',
      })
    }

    if (!event) {
      throw new errors.ApplicationError({
        message: 'GenerateOccurrencesHandler: missing event',
      })
    }

    const documentClient = new DynamoDB.DocumentClient()
    const tableName = process.env.TABLE_SCHEDULES

    const { scheduleId } = event

    if (!scheduleId) {
      throw new errors.ApplicationError({
        message: 'The `scheduleId` is missing',
      })
    }

    const { awsRequestId, invokedFunctionArn } = context

    if (!awsRequestId) {
      throw new errors.ApplicationError({
        message: 'The `awsRequestId` is missing',
      })
    }

    if (!invokedFunctionArn) {
      throw new errors.ApplicationError({
        message: 'The `invokedFunctionArn` is missing',
      })
    }

    const resourcesQueryParams: DocumentClient.QueryInput = {
      ExpressionAttributeNames: {
        '#groupType': 'groupType',
        '#scheduleId': 'scheduleId',
      },
      ExpressionAttributeValues: {
        ':occurrenceGroupType': 'occurrence',
        ':scheduleGroupType': 'schedule',
        ':scheduleId': scheduleId,
      },
      FilterExpression:
        '#groupType = :occurrenceGroupType OR #groupType = :scheduleGroupType',
      IndexName: 'ScheduleIdIndex',
      KeyConditionExpression: '#scheduleId = :scheduleId',
      TableName: tableName,
    }

    const resourcesQueryResponse: DocumentClient.QueryOutput = await documentClient
      .query(resourcesQueryParams)
      .promise()

    const { Items: resourceItems } = resourcesQueryResponse

    const scheduleItems = filter(resourceItems, ['groupType', 'schedule'])

    if (!scheduleItems || scheduleItems.length === 0) {
      throw new errors.ResourceNotFoundError({
        id: scheduleId,
        resource: 'schedule',
      })
    }

    if (scheduleItems.length !== 1) {
      throw new errors.ApplicationError({
        message: `The schedule query returned multiple items`,
      })
    }

    const schedule = scheduleItems[0]

    const { applicationId, data, endAt, startAt } = schedule

    const {
      areas: scheduleAreas,
      enabled,
      locations: scheduleLocations,
      serviceHours: overridingServiceHours,
      name: scheduleName,
      strategy,
    } = data

    if (!enabled) {
      console.debug(
        'GenerateOccurrencesHandler: schedule disabled so returning empty array',
      )
      return []
    }

    const end: number | null = endAt
      ? moment.utc(new Date(endAt)).valueOf()
      : null
    const now: number = moment.utc().valueOf()
    const isScheduleEndInPast: boolean = end ? end < now : false

    if (isScheduleEndInPast) {
      console.debug(
        'GenerateOccurrencesHandler: Schedule endAt is in past so returning empty array',
        {
          end,
          endAt,
          scheduleId,
        },
      )

      return []
    }

    const hasAreas = scheduleAreas && scheduleAreas.length
    const occurrenceLocations = hasAreas ? scheduleAreas : scheduleLocations

    const pendingOccurrenceItems = filter(
      resourceItems,
      ({ groupType, status }) =>
        groupType === 'occurrence' && status === 'pending',
    )

    console.debug(
      `GenerateOccurrencesHandler: schedule has ${
        occurrenceLocations.length
      } locations`,
      {
        hasAreas,
        occurrenceLocations,
        scheduleAreas,
        scheduleLocations,
      },
    )

    console.debug(
      `GenerateOccurrencesHandler: schedule has ${
        pendingOccurrenceItems.length
      } pending occcurences in database`,
    )

    const occurrences: schemas.ScheduleOccurrenceDocumentSchema[] = await BPromise.reduce(
      occurrenceLocations,
      async (
        accum: schemas.ScheduleOccurrenceDocumentSchema[],
        locationId: string,
      ) => {
        const databaseOccurrences = filter(pendingOccurrenceItems, [
          'locationId',
          locationId,
        ])

        if (databaseOccurrences.length === 0) {
          console.warn(
            `GenerateOccurrencesHandler: no pending occurrence for ${locationId} so will generate next occurrence from now`,
          )
        }

        const isStopwatchStrategy: boolean =
          strategy.type === scheduling.StrategyTypes.Stopwatch

        // NOTE: when a stopwatch strategy schedule we only allow one
        // occurrence in the database at anyone time. All other strategies
        // allow the max occurrences constant.
        const maxOccurrences = isStopwatchStrategy
          ? MAX_STOPWATCH_OCCURRENCES
          : MAX_OCCURRENCES

        const occurrenceLimit: number =
          maxOccurrences - databaseOccurrences.length

        if (occurrenceLimit <= 0) {
          console.warn(
            `GenerateOccurrencesHandler: skipping next occurrence as reached limit of ${maxOccurrences} for ${locationId}`,
          )

          return accum
        }

        // NOTE: although database occurrences should be in the correct order
        // sort for completeness
        const sortedDatabaseOccurrences = orderBy(
          databaseOccurrences,
          ['endAt'],
          ['desc'],
        )

        // NOTE: if there is no active pending occurrence we'll just use the
        // current time to generate the next occurrences
        const previousDatabaseOccurrence = sortedDatabaseOccurrences[0]

        const isInitial: boolean = !previousDatabaseOccurrence
        const nowIsoString: string = new Date().toISOString()

        const nextStartAt: string = !!previousDatabaseOccurrence
          ? previousDatabaseOccurrence.endAt
          : nowIsoString > startAt
            ? nowIsoString
            : startAt

        const start: number = moment.utc(new Date(nextStartAt)).valueOf()

        const locationPk: string = `${applicationId}-location`

        // NOTE: when a schedule has areas there is only one location defined
        // on the schedule, when a schedule has no areas they can have multiple
        // locations so switch appropriately to ensure we look up the correct
        // location to pull the service hours and timezone
        const locationSk: string = hasAreas ? scheduleLocations[0] : locationId

        const locationGetParams: DocumentClient.GetItemInput = {
          Key: { pk: locationPk, sk: locationSk },
          TableName: tableName,
        }

        const locationGetResponse: DocumentClient.GetItemOutput = await documentClient
          .get(locationGetParams)
          .promise()

        const { Item: locationDocument } = locationGetResponse

        if (!locationDocument) {
          console.warn(
            `GenerateOccurrencesHandler: location is missing so skipping`,
            {
              id: JSON.stringify({ pk: locationPk, sk: locationSk }),
            },
          )

          return accum
        }

        const locationServiceHours = locationDocument.data.serviceHours
        const locationTimezone = locationDocument.data.serviceHours.timezone

        // NOTE: if schedule service hours override location service hours
        const serviceHours = !!overridingServiceHours
          ? overridingServiceHours
          : locationServiceHours

        const generator = scheduling.scheduleIntervalsGenerator({
          end,
          isInitial,
          serviceHours,
          start,
          strategy,
        })

        let occurrenceCount: number = 0
        let serviceInterval = null

        while (occurrenceCount !== occurrenceLimit) {
          const { done, value } = generator.next()

          console.debug('GenerateOccurrencesHandler: generator next', {
            done,
            value,
          })

          /* istanbul ignore next */
          if (done) {
            break
          }

          const { interval, type: intervalType } = value

          // NOTE: A service interval is a period of time which occurrences can
          // occur within. To add further context to the occurrence document we
          // store this so we can add as a reference.
          if (intervalType === scheduling.IntervalTypes.Service) {
            console.debug('GenerateOccurrencesHandler: service interval', {
              interval,
            })
            serviceInterval = interval
            continue
          }

          console.debug('GenerateOccurrencesHandler: occurrence interval', {
            interval,
          })

          const occurrenceId: string = uuid()

          const createdAt: string = new Date().toISOString()
          const occurrenceEnd: string = new Date(interval[1]).toISOString()
          const occurrenceStart: string = new Date(interval[0]).toISOString()

          const newOccurrenceDocument: schemas.ScheduleOccurrenceDocumentSchema = {
            applicationId,
            createdAt,
            createdBy: {
              id: awsRequestId,
              label: invokedFunctionArn,
              type: 'system',
            },
            data: {
              occurrenceInterval: interval,
              scheduleName,
              serviceInterval,
              timezone: locationTimezone,
            },
            endAt: occurrenceEnd,
            groupType: 'occurrence',
            locationId,
            location_endAt_occurrenceId: `${locationId}-${occurrenceEnd}-${occurrenceId}`,
            occurrenceId,
            pk: `${applicationId}-occurrence`,
            scheduleId,
            sk: `${createdAt}-${occurrenceId}`,
            startAt: occurrenceStart,
            status: OCCURRENCE_STATUS_PENDING,
            updatedAt: createdAt,
            updatedBy: {
              id: awsRequestId,
              label: invokedFunctionArn,
              type: 'system',
            },
          }

          try {
            await schemas.validate({
              data: newOccurrenceDocument,
              schema: schemas.scheduleOccurrenceDocumentSchema,
            })
          } catch (err) {
            throw new errors.ApplicationError({
              message: `GenerateOccurrencesHandler: ${err.message}`,
            })
          }

          console.debug('GenerateOccurrencesHandler: document to be created', {
            newOccurrenceDocument,
          })

          const occurrencePutParams: DocumentClient.PutItemInput = {
            Item: newOccurrenceDocument,
            TableName: tableName,
          }

          try {
            await documentClient.put(occurrencePutParams).promise()
            accum.push(newOccurrenceDocument)
          } catch (error) {
            console.warn(
              'GenerateOccurrencesHandler: failed to create occurrence for location',
              {
                error,
                locationId,
                newOccurrenceDocument: JSON.stringify(newOccurrenceDocument),
              },
            )
          }

          occurrenceCount++
        }

        return accum
      },
      [],
    )

    console.debug('GenerateOccurrencesHandler: occurrences', { occurrences })

    return occurrences
  } catch (err) {
    console.error('GenerateOccurrencesError', {
      err,
      event,
    })

    if (errors.isKnownError(err)) {
      throw err
    }

    throw new errors.UnknownError()
  }
}
