import { attempt, getOr, isError, reduce } from 'lodash/fp'
import fetch from 'node-fetch'

interface WinteamPostRequest {
  baseUrl: string
  body: object
  endpoint: string
  headers: {
    subscriptionKey: string
    tenantId: string
  }
  method: string
}

interface WinteamGetRequest {
  baseUrl: string
  endpoint: string
  headers: {
    subscriptionKey: string
    tenantId: string
  }
  method: string
}

const genericError = {
  Errors: [
    {
      FieldName: '',
      AttemptedValue: '',
      ErrorMessage: 'Punch rejected.  Please contact your supervisor',
      ErrorType: 'BadRequest',
    },
  ],
  Result: null,
}

const requiredFields: ArrayLike<string> = [
  'baseUrl',
  'endpoint',
  'subscriptionKey',
  'tenantId',
]

export default async function winteamRequest(request: WinteamPostRequest) {
  const { baseUrl, body, endpoint, headers, method } = request

  const { subscriptionKey, tenantId } = headers

  const options = {
    baseUrl,
    endpoint,
    subscriptionKey,
    tenantId,
  }

  const missingFields = reduce((accum, field: string) => {
    if (!options[field]) {
      return [...accum, field]
    }

    return accum
  }, [])(requiredFields)

  if (missingFields && missingFields.length > 0) {
    throw new Error(
      `winteamPostRequest: Missing required vars: ${missingFields.join(', ')}`,
    )
  }

  const url = `${baseUrl}${endpoint}`

  const params = {
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
      'Ocp-Apim-Subscription-Key': subscriptionKey,
      Tenantid: tenantId,
    },
    method,
  }

  const response = await fetch(url, params)

  const responseText = await response.text()
  const responseJson = attempt(() => JSON.parse(responseText))

  const isJson = !isError(responseJson)

  const result = isJson ? responseJson : responseText

  /**
   * NOTE: Node-fetch does not throw exceptions for 3xx - 5xx responses.  We need to handle
   * this manually using the ok property
   *
   * https://www.npmjs.com/package/node-fetch#handling-client-and-server-errors
   */
  return response.ok
    ? // Return the actual response if a 2xx response is detected
      result
    : isJson
      ? // Return the JSON error if a 4xx or 5xx response is detected (with a valid error payload)
        responseJson
      : // Fallback to a generic error if a non-JSON error is detected
        genericError
}

export async function winteamGetRequest(request: WinteamGetRequest) {
  const { baseUrl, endpoint, headers, method } = request

  const { subscriptionKey, tenantId } = headers

  const options = {
    baseUrl,
    endpoint,
    subscriptionKey,
    tenantId,
  }

  const missingFields = reduce((accum, field: string) => {
    if (!options[field]) {
      return [...accum, field]
    }

    return accum
  }, [])(requiredFields)

  if (missingFields && missingFields.length > 0) {
    throw new Error(
      `winteamGetRequest: Missing required vars: ${missingFields.join(', ')}`,
    )
  }

  const url = `${baseUrl}${endpoint}`

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Ocp-Apim-Subscription-Key': subscriptionKey,
      Tenantid: tenantId,
    },
    method,
  }

  const response = await fetch(url, params)

  const responseText = await response.text()
  const responseJson = attempt(() => JSON.parse(responseText))

  const isJson = !isError(responseJson)

  const result = isJson ? responseJson : responseText

  /**
   * NOTE: Node-fetch does not throw exceptions for 3xx - 5xx responses.  We need to handle
   * this manually using the ok property
   *
   * https://www.npmjs.com/package/node-fetch#handling-client-and-server-errors
   */
  return response.ok
    ? // Return the actual response if a 2xx response is detected
      result
    : isJson
      ? // Return the JSON error if a 4xx or 5xx response is detected (with a valid error payload)
        responseJson
      : // Fallback to a generic error if a non-JSON error is detected
        genericError
}
