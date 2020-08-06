jest.mock('uuid/v4', () => () => 'action-uuid-1234')

import { schemas } from '@lighthouse/serverless-common'
import * as MockDate from 'mockdate'

import { rulePatternDocument, rulePayload } from '../../__fixtures__'
import { payloadToRulePatternDocument } from './ruleTransform'

beforeEach(() => MockDate.set('2019-10-13T01:00:00.000Z'))
afterEach(() => MockDate.reset())

test('transforms new payload to rulePattern document', async () => {
  const actionId = 'action-id-22222'
  const actor = {
    id: 'actor-id-2222',
    label: 'actor-label-22222',
    type: 'actor-type-22222',
  }

  const { applicationId, locationId, occurrenceId, pk, sk, type } = rulePayload

  const result: schemas.RulePatternDocumentSchema = payloadToRulePatternDocument(
    {
      actor,
      existingDocument: undefined,
      payload: {
        applicationId,
        locationId,
        occurrenceId,
        pk,
        sk,
        type,
      },
    },
  )
  expect(result).toMatchSnapshot()
})

test('transforms existing rulePattern document payload to rulePattern document', async () => {
  const actionId = 'action-id-22222'
  const actor = {
    id: 'actor-id-2222',
    label: 'actor-label-22222',
    type: 'actor-type-22222',
  }
  const existingDocument = rulePatternDocument
  const { applicationId, locationId, occurrenceId, pk, sk, type } = rulePayload

  const result: schemas.RulePatternDocumentSchema = payloadToRulePatternDocument(
    {
      actor,
      existingDocument,
      payload: {
        applicationId,
        locationId,
        occurrenceId,
        pk,
        sk,
        type,
      },
    },
  )
  expect(result).toMatchSnapshot()
})
