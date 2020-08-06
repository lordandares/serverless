import { keys, omit } from 'lodash/fp'
import { ValidationError } from 'yup'
import {
  RulePatternDocumentSchema,
  rulePatternDocumentSchema,
} from './rulePatternDocumentSchema'

const requiredFields = [
  'pk',
  'sk',
  'createdAt',
  'createdBy',
  'groupType',
  'matches',
]

test('valid', () => {
  const data = getValidDocument()
  const validate = rulePatternDocumentSchema.validate(data, {
    strict: true,
  })

  return expect(validate).resolves.toBeTruthy()
})

requiredFields.forEach(field => {
  test(`errors when ${field} missing`, () => {
    expect.assertions(1)

    const data = omit(field, getValidDocument())
    const validate = rulePatternDocumentSchema.validate(data, {
      strict: true,
    })

    return expect(validate).rejects.toThrowError(ValidationError)
  })
})

function getValidDocument(): RulePatternDocumentSchema {
  return {
    createdAt: '2019-12-11T00:00:00.000Z',
    createdBy: {
      id: 'actor-uuid-1',
      label: 'actor-label',
      type: 'actor-type',
    },
    groupType: 'rule-pattern',
    matches: {
      occurrence1: {
        pk: 'application1-occurrence',
        sk: '2019-06-01T00:00:00.000Z-occurrence1',
      },
      occurrence2: {
        pk: 'application1-occurrence',
        sk: '2019-06-02T00:00:00.000Z-occurrence1',
      },
    },
    pk: 'rule-pattern-applicationId-locationId',
    sk: 'visit',
  }
}
