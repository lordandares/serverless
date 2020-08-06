import { errors, http, schemas } from '@lighthouse/serverless-common'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { ScheduleService } from '../service/ScheduleService'

export async function createScheduleHandler(
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> {
  try {
    const { body: eventBody, headers } = event

    if (!eventBody) {
      throw new errors.ApplicationError({
        message: 'CreateScheduleHandler: missing body on event',
      })
    }

    if (!headers) {
      throw new errors.ApplicationError({
        message: 'CreateScheduleHandler: missing headers on event',
      })
    }

    const body: schemas.SchedulePayloadSchema = JSON.parse(eventBody)
    const applicationId: string = headers['lio-application-id']
    const userId: string = headers['lio-user-id']

    const schedule: schemas.SchedulePayloadSchema = await ScheduleService.createSchedule(
      {
        applicationId,
        body,
        userId,
      },
    )

    return {
      body: JSON.stringify(schedule),
      statusCode: http.STATUS_CODES.SUCCESSFUL.CREATED,
    }
  } catch (err) {
    console.error('CreateScheduleError', {
      err,
      event,
    })

    return errors.httpErrorHandler(err)
  }
}
