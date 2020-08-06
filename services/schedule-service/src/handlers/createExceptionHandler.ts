import { errors, mongo, schemas } from '@lighthouse/serverless-common'
import * as turf from '@turf/turf'
import { SNSEvent } from 'aws-lambda'
import { SQS } from 'aws-sdk'
import { Point } from 'geojson'
import parseSnsEvent from './lib/parseSnsEvent'

interface Env {
  env: {
    LOOP_EXCEPTIONS_QUEUE_URL: string
  }
}

declare var process: Env

export interface ExceptionMessage {
  application: string
  floorsRef: []
  geometry: Point
  schedule: {
    id: string
    name: string
    area: string
    type: string
    data: {
      occurrenceStartAt: string
      occurrenceEndAt: string
      occurrenceId: string
      timezone: string
    }
  }
  start: string
}

export async function createExceptionHandler(event: SNSEvent) {
  try {
    const parsedEvent = parseSnsEvent(event)
    const body = parsedEvent.body as schemas.ScheduleOccurrenceDocumentSchema

    await schemas.validate({
      schema: schemas.scheduleOccurrenceDocumentSchema,
      data: body,
      options: {
        context: {
          // TODO remove once we've removed isNew requirement from
          // scheduleDocumentBaseSchema
          isNew: true,
        },
      },
    })

    const {
      applicationId,
      data,
      endAt,
      locationId,
      occurrenceId,
      scheduleId,
      startAt,
    } = body

    // TODO In future store data on occurrence
    const areaData = await getAreaData({ areaId: locationId })

    if (!areaData) {
      // NOTE the area could have been legitimately deleted, so an error is
      // probably not appropriate here
      console.warn('createExceptionHandler - AreaDataNotFound', {
        body,
      })
      return
    }

    const { center, floorsRef, geometry } = areaData

    // TODO re-enable typescript once turf types support in @types/turf
    // @ts-ignore
    const exceptionGeometry = center || turf.pointOnFeature(geometry).geometry

    const exceptionMessage: ExceptionMessage = {
      application: applicationId,
      floorsRef,
      geometry: exceptionGeometry,
      schedule: {
        id: scheduleId,
        name: data.scheduleName,
        area: locationId,
        type: 'visit', // TODO support other types
        data: {
          occurrenceEndAt: endAt,
          occurrenceId,
          occurrenceStartAt: startAt,
          timezone: data.timezone,
        },
      },
      // NOTE the exception starts when the occurrence expires
      start: endAt,
    }

    const sqsClient = new SQS()
    const messageStr = JSON.stringify(exceptionMessage)
    const queueUrl = process.env.LOOP_EXCEPTIONS_QUEUE_URL

    const messageParams = {
      MessageBody: messageStr,
      QueueUrl: queueUrl,
    }

    console.info('Sending SQS create exception message...', {
      scheduleId,
      occurrenceId,
    })

    return await sqsClient.sendMessage(messageParams).promise()
  } catch (err) {
    console.error('CreateExceptionHandlerError', {
      err,
      event,
    })

    if (err.name === 'ValidationError') {
      throw new errors.ApplicationError({
        message: 'Invalid options for createException',
        data: {
          err,
          event,
        },
      })
    }

    if (errors.isKnownError(err)) {
      throw err
    }

    throw new errors.UnknownError()
  }
}

async function getAreaData({ areaId }: { areaId: string }) {
  try {
    const areaCollection = await mongo.getCollection('areas')

    const area = await areaCollection.findOne({
      _id: new mongo.ObjectId(areaId),
    })

    if (!area) {
      return
    }

    const { center, floorsRef, geometry } = area

    return {
      center,
      floorsRef,
      geometry,
    }
  } catch (err) {
    console.error('CreateExceptionFindAreaError', {
      areaId,
      err,
    })

    throw new errors.ApplicationError({
      message: 'Error finding area data for exception',
      data: {
        areaId,
        err,
      },
    })
  }
}
