// import { EventGridModels } from '@azure/eventgrid'
import { Context, HttpRequest } from '@azure/functions'
import handleEmployeeEvent, {
  HandleEmployeeEvent,
} from './employee/handleEmployeeEvent'
import handleJobEvent, { HandleJobEvent } from './handleJobEvent'
import { errors } from '@lighthouse/serverless-common'

export enum ChangeOperations {
  F = 'FULL_LOAD',
  U = 'UPDATE',
  I = 'INSERT',
}

// We get the eventGridEvent type through `data.TableName`
export enum TableNames {
  tblJB_JOBS = 'tblJB_JOBS',
  tblPAY_EMPLOYEES = 'tblPAY_EMPLOYEES',
}

type EventHandler = (
  data: HandleJobEvent | HandleEmployeeEvent,
) => Promise<object>

const strategies = {
  [TableNames.tblJB_JOBS]: handleJobEvent,
  [TableNames.tblPAY_EMPLOYEES]: handleEmployeeEvent,
}

const validationEventType: string =
  'Microsoft.EventGrid.SubscriptionValidationEvent'

export async function run(context: Context, req: HttpRequest): Promise<object> {
  if (!req.body) {
    const err = new errors.ValidationError({
      message: 'body is required',
    })

    context.log.error(err.message, {
      req,
    })

    throw err
  }
  context.log.info(`Event received with body: ${JSON.stringify(req.body)}`)

  if (req.body[0] && req.body[0].eventType === validationEventType) {
    context.log.info('Validation event received, response: ')

    const response: any = {
      validationResponse: req.body[0].data.validationCode,
    }

    context.log.info(response)
    return {
      res: {
        status: 200,
        body: response,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    }
  }
  const data = JSON.parse(req.body[0].data)
  if (!ChangeOperations[data.ChangeOperation]) {
    const err = new Error('Invalid change operation')

    context.log.error('eventGridTriggerError: Invalid change operation')

    throw err
  }

  if (!TableNames[data.TableName]) {
    const err = new Error('Invalid table name')

    // TODO how do we wrap logger for azure/aws
    context.log.error('eventGridTriggerError: Invalid table name')

    throw err
  }

  const strategyFn: EventHandler = strategies[data.TableName]
  return strategyFn({ context, data })
}
