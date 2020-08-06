import { Context } from '@azure/functions'
import { api } from '@lighthouse/serverless-common'
import { isEmpty } from 'lodash'
import handleSingleLoadEmployee from './handleSingleLoadEmployee'
import handleFullLoadEmployees from './handleFullLoadEmployees'
import { validateError } from '../../helpers/validations'

enum ChangeOperations {
  F = 'F',
  I = 'I',
  U = 'U',
}

enum Env {
  TENANT_BASE_URL = 'TENANT_BASE_URL',
  TENANT_CODE = 'TENANT_CODE',
}

const employeeStrategies = {
  [ChangeOperations.F]: handleFullLoadEmployees,
  [ChangeOperations.U]: handleSingleLoadEmployee,
  [ChangeOperations.I]: handleSingleLoadEmployee,
}

interface ProcessEnv {
  env: { [env in Env]: string }
}

declare var process: ProcessEnv

export interface HandleEmployeeEvent {
  context: Context
  data: {
    PrimaryKeyValue?: string
    WinTeamDBName?: string
    ChangeOperation?: string
  }
}

export interface WinteamTenant {
  id: string
  masterTenantId: string
  customerData: string
  mappings: Array<object>
}

export default async function handleEmployeeEvent({
  context,
  data,
}: HandleEmployeeEvent): Promise<object> {
  assertEnv()

  validateError({ context, data }, 'ChangeOperation')
  validateError({ context, data }, 'WinTeamDBName')

  const employeeStrategyFn = employeeStrategies[data.ChangeOperation]

  const winteamTenant: WinteamTenant = await getWinteamTenant(
    data.WinTeamDBName,
  )

  if (isEmpty(winteamTenant)) {
    const err = new Error('TenantNotFoundError')

    context.log.error('handleEmployeeEvent: TenantNotFoundError', {
      data,
    })

    throw err
  }

  return employeeStrategyFn({ context, data }, winteamTenant)
}

function assertEnv() {
  for (const env in Env) {
    if (!process.env[env]) {
      throw handleError(`ConfigurationError: Missing env '${env}'`)
    }
  }
}

export async function getWinteamTenant(productDescription: string) {
  const apiClient = api.createClient()
  const tenantBaseUrl = `${process.env.TENANT_BASE_URL}/tenants`
  const code = process.env.TENANT_CODE
  const winteamTenant: WinteamTenant = await apiClient.get(tenantBaseUrl, {
    query: {
      productDescription,
      code,
    },
  })
  return winteamTenant
}

function handleError(message: string, data?: object): Error {
  const err = new Error(message)

  console.error(`handleEmployeeEventError: ${message}`, {
    err,
    ...data,
  })

  return err
}
