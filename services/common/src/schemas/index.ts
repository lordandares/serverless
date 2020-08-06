import { Schema, ValidateOptions, addMethod, mixed } from 'yup'
import { ValidationError } from '../errors'
import * as constants from './constants'
import * as geojson from './geojson'

export { constants, geojson, ValidationError }
export * from './actionSchema'
export * from './actorSchema'
export * from './applicationSchema'
export * from './matchSchema'
export * from './rulePatternDocumentSchema'
export * from './rulePayloadSchema'
export * from './scheduleDocumentBaseSchema'
export * from './scheduleDocumentSchema'
export * from './scheduleLocationDocumentSchema'
export * from './scheduleOccurrenceDocumentSchema'
export * from './schedulePayloadSchema'
export * from './shiftSchema'
export * from './timerDocumentSchema'
export * from './timerPayloadSchema'

interface Validate {
  schema: Schema<any>
  data: object
  options?: ValidateOptions
}

const defaultValidateOptions = {
  strict: true,
  stripUnknown: true,
}

export async function validate({ schema, data, options = {} }: Validate) {
  try {
    const result = await schema.validate(data, {
      ...defaultValidateOptions,
      ...options,
    })
  } catch (err) {
    throw new ValidationError({
      data: err,
    })
  }
}
