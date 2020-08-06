import { AWS } from '@lighthouse/serverless-common'
import { isEmpty } from 'lodash/fp'

import * as helpers from './helpers'

interface WinteamApplication {
  _id: string
  name: string
  plugins: {
    winteam?: {
      enabled: boolean
      options?: object
    }
  }
}

interface WinteamParams {
  endpoint: string
  message?: object
  method?: string
}

interface WinteamError {
  FieldName: string
  AttemptedValue: string
  ErrorMessage: string
  ErrorType: string
}

interface WinteamResult {
  JobNumber: string
  PunchStatus: string
  PunchTime: string
  StatusReason: string
}

interface WinteamResponse {
  Errors?: WinteamError[]
  Result?: WinteamResult
}

async function request(
  application: WinteamApplication,
  params: WinteamParams,
): Promise<WinteamResponse> {
  const { _id: applicationId } = application
  const { endpoint, message: body, method = 'POST' } = params

  const baseSecretsId = process.env.WINTEAM_SECRET_ID

  if (!applicationId || !baseSecretsId) {
    throw new Error(
      `WinteamRequest: missing required values applicationId:${applicationId} / WINTEAM_SECRET_ID:${baseSecretsId}`,
    )
  }

  // TODO update to use shared secrets module
  const awsSecrets = await AWS.getAwsSecret(baseSecretsId)

  if (isEmpty(awsSecrets)) {
    throw new Error('WinteamRequest: AWS secret does not contain any values')
  }

  const tenantIdPath = `TENANT_ID_${applicationId}`

  const baseUrl = awsSecrets.WINTEAM_BASE_URL
  const subscriptionKey = awsSecrets.WINTEAM_SUBSCRIPTION_KEY
  const tenantId = awsSecrets[tenantIdPath]

  if (!baseUrl || !subscriptionKey || !tenantId) {
    console.info('WinteamRequest: Missing required params', {
      baseUrl,
      subscriptionKey,
      tenantId,
    })

    throw new Error('WinteamRequest: Missing required params')
  }

  const payload = {
    baseUrl,
    body,
    endpoint,
    headers: {
      subscriptionKey,
      tenantId,
    },
    method: method.toUpperCase(),
  }

  const response = await helpers.winteamRequest(payload)

  return response
}

export { helpers, request }
