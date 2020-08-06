import { errors } from '@lighthouse/serverless-common'
import { SNSEvent } from 'aws-lambda'

import { RuleService } from '../../service/RuleService'
import parseSnsEvent from '../lib/parseSnsEvent'

export async function deleteRuleHandler(event: SNSEvent) {
  try {
    if (!event) {
      throw new errors.ApplicationError({
        message: 'DeleteRuleHandler: missing event',
      })
    }

    const {
      body: { id },
    } = parseSnsEvent(event)
    await RuleService.removeRule(id)
    return
  } catch (err) {
    console.error('DeleteRuleHandlerError', {
      err,
      event,
    })
    return err
  }
}
