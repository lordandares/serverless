import { InferType, array, object, string } from 'yup'

import { eventTypes } from './constants'

export const rulePayloadSchema = object().shape({
  applicationId: string().required(),
  data: object()
    .shape({
      occurrenceInterval: array().required(),
    })
    .required(),
  locationId: string().required(),
  occurrenceId: string().required(),
  pk: string().required(),
  sk: string().required(),
  startAt: string().required(),
  type: string()
    .oneOf(eventTypes)
    .required(),
})

export type RulePayloadSchema = InferType<typeof rulePayloadSchema>

export default rulePayloadSchema
