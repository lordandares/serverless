import { errors, http, schemas } from '@lighthouse/serverless-common'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { ScheduleService } from '../service/ScheduleService'

export async function updateScheduleHandler(
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> {
  try {
    const { body: eventBody, headers, pathParameters } = event

    if (!eventBody) {
      throw new errors.ApplicationError({
        message: 'UpdateScheduleHandler: missing body on event',
      })
    }

    if (!headers) {
      throw new errors.ApplicationError({
        message: 'UpdateScheduleHandler: missing headers on event',
      })
    }

    if (!pathParameters) {
      throw new errors.ApplicationError({
        message: 'UpdateScheduleHandler: missing pathParameters on event',
      })
    }

    const applicationId: string = headers['lio-application-id']
    const body: schemas.SchedulePayloadSchema = JSON.parse(eventBody)
    const scheduleId: string = pathParameters.id
    const userId: string = headers['lio-user-id']

    const schedule: schemas.SchedulePayloadSchema = await ScheduleService.updateSchedule(
      {
        applicationId,
        body,
        scheduleId,
        userId,
      },
    )

    return {
      body: JSON.stringify(schedule),
      statusCode: http.STATUS_CODES.SUCCESSFUL.OK,
    }
  } catch (err) {
    console.error('UpdateScheduleError', {
      err,
      event,
    })

    return errors.httpErrorHandler(err)
  }
}
