import { mapValues } from 'lodash'
import { InferType, lazy, object, string } from 'yup'

import { actorSchema } from './actorSchema'
import { eventTypes } from './constants'
import { matchSchema } from './matchSchema'

interface Matches {
  [key: string]: boolean
}

export const rulePatternDocumentSchema = object().shape({
  createdAt: string().required(),
  createdBy: actorSchema.required(),
  groupType: string().required(),
  matches: lazy(obj =>
    object(mapValues(obj as Matches, () => matchSchema.required())).required(),
  ),
  pk: string().required(),
  sk: string()
    .oneOf(eventTypes)
    .required(),
  updatedAt: string().notRequired(),
  updatedBy: actorSchema.notRequired(),
})

export type RulePatternDocumentSchema = InferType<
  typeof rulePatternDocumentSchema
>

export default rulePatternDocumentSchema
