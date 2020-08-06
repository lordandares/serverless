import { errors, schemas } from '@lighthouse/serverless-common'
import * as BPromise from 'bluebird'
import { getOr } from 'lodash/fp'

import { ScheduleService } from '../service/ScheduleService'
import parseSnsEvent from './lib/parseSnsEvent'

export async function upsertLocationsHandler(
  event,
  context,
): Promise<schemas.ScheduleLocationDocumentSchema[]> {
  try {
    let payload = event

    // NOTE: this handler is invoked from a step function or an sns event
    const isSnsEvent =
      getOr(false, 'Records.0.EventSource', event) === 'aws:sns'

    if (isSnsEvent) {
      const { body } = parseSnsEvent(event)
      payload = body
    }

    if (!context) {
      throw new errors.ApplicationError({
        message: 'UpsertLocationHandler: missing context',
      })
    }

    if (!payload) {
      throw new errors.ApplicationError({
        message: 'UpsertLocationHandler: missing payload',
      })
    }

    const { applicationId, locations, scheduleId } = payload
    const { awsRequestId, invokedFunctionArn } = context

    const results: schemas.ScheduleLocationDocumentSchema[] = await BPromise.map(
      locations,
      async (
        locationId: string,
      ): Promise<schemas.ScheduleLocationDocumentSchema> => {
        const location = await ScheduleService.upsertLocation({
          applicationId,
          arn: invokedFunctionArn,
          arnId: awsRequestId,
          locationId,
          scheduleId,
        })

        return location
      },
    )

    return results
  } catch (err) {
    console.error('UpsertLocationsError', {
      err,
      event,
    })

    if (errors.isKnownError(err)) {
      throw err
    }

    throw new errors.UnknownError()
  }
}
