import { errors, schemas } from '@lighthouse/serverless-common'
import { DynamoRepository } from '../repository/dynamo'
import { payloadToRulePatternDocument } from './lib/ruleTransform'

declare var process: {
  env: {
    TABLE_SCHEDULES: string
  }
}

const removeRule = async (id: string): Promise<void> => {
  if (!id) {
    throw new errors.ApplicationError({
      message: `The rule \`id\` of the resource to delete is missing`,
    })
  }

  console.debug('RemoveRule: id', { id })

  const table: string = process.env.TABLE_SCHEDULES
  const dbObject = DynamoRepository(table)
  // await dbObject.remove(id)
}

const RuleService = {
  removeRule,
}

export { RuleService }
