import { APIGatewayProxyResult } from 'aws-lambda'
import DomainError from './DomainError'
import UnknownError from './UnknownError'

interface CustomError extends Error {
  data?: object
  message: string
  status?: number
}

export { DomainError, UnknownError }
export { default as ApplicationError } from './ApplicationError'
export { default as ResourceNotFoundError } from './ResourceNotFoundError'
export { default as ValidationError } from './ValidationError'

export function isKnownError(err: Error): boolean {
  return err instanceof DomainError
}

export function httpErrorHandler(err: CustomError): APIGatewayProxyResult {
  const error = isKnownError(err) ? err : new UnknownError()
  const body = JSON.stringify({
    ...error,
    message: error.message,
  })
  const statusCode = error.status || 500

  return {
    body,
    statusCode,
  }
}
