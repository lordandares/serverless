import { isValid } from 'date-fns'
import { every, has } from 'lodash'

const REQUIRED_KEYS = ['bucket', 'expiration', 'id', 'resource']

export function validateTimeout(payload: ITimeout) {
  const hasRequiredKeys = every(REQUIRED_KEYS, key => has(payload, key))

  if (!hasRequiredKeys) {
    throw new Error('Missing required payload values')
  }

  if (!isValid(new Date(payload.bucket))) {
    throw new Error('Bucket value is not a valid date')
  }

  if (!isValid(new Date(payload.expiration))) {
    throw new Error('Expiration value is not a valid date')
  }
}

export default validateTimeout
