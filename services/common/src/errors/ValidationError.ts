import { ValidationError as SchemaValidationError } from 'yup'
import DomainError from './DomainError'

interface Options {
  data?: any
  message?: string
}

const DEFAULT_MESSAGE =
  'The data you submitted was invalid. Please try again with valid data.'

export default class ValidationError extends DomainError {
  public data: object
  public message: string
  public status: number
  constructor({ data, message = DEFAULT_MESSAGE }: Options) {
    // When the data object is a schema validation error, take its data
    // attributes and apply to our wrapped error
    if (data instanceof SchemaValidationError) {
      const { message: validationMessage, name, ...other } = data

      super(validationMessage)
      this.data = other
      this.status = 400
      return
    }

    super(message)
    this.data = data
    this.status = 400
  }
}
