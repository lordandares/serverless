import { schemas } from '@lighthouse/serverless-common'
import * as moment from 'moment'
import { v4 as uuid } from 'uuid'

export interface PayloadToRulePatternDocument {
  actor: schemas.ActorSchema
  existingDocument: schemas.RulePatternDocumentSchema | undefined
  payload: {
    applicationId: string
    locationId: string
    occurrenceId: string
    pk: string
    sk: string
    type: string
  }
}
export function payloadToRulePatternDocument({
  actor,
  existingDocument,
  payload,
}: PayloadToRulePatternDocument): schemas.RulePatternDocumentSchema {
  const { applicationId, locationId, occurrenceId, pk, sk, type } = payload

  const now: string = moment
    .utc()
    .toDate()
    .toISOString()

  const matchValues = { pk, sk }

  const matches: schemas.MatchSchema =
    existingDocument && existingDocument.matches
      ? { ...existingDocument.matches, [occurrenceId]: matchValues }
      : { [occurrenceId]: matchValues }

  const document: schemas.RulePatternDocumentSchema = {
    createdAt: (existingDocument && existingDocument.createdAt) || now,
    createdBy: (existingDocument && existingDocument.createdBy) || actor,
    groupType: 'rule-pattern',
    matches,
    pk: `rule-pattern-${applicationId}-${locationId}`,
    sk: type,
    updatedAt: now,
    updatedBy: actor,
  }

  return document
}
