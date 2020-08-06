import { Context } from '@azure/functions'
import { mongo, secrets } from '@lighthouse/serverless-common'
import { winteam } from '@lighthouse/serverless-integrations'
import { WinteamEmployee, upsertUser } from '../../helpers/upsertUser'
import { validateError } from '../../helpers/validations'

export interface HandleEmployeeEvent {
  context: Context
  data: {
    PrimaryKeyValue?: string
    WinTeamDBName?: string
    ChangeOperation?: string
  }
}

enum Env {
  EMPLOYEES_ENDPOINT = 'EMPLOYEES_ENDPOINT',
  WINTEAM_BASE_URL = 'WINTEAM_BASE_URL',
  AZURE_KEY_VAULT = 'AZURE_KEY_VAULT',
}

interface ProcessEnv {
  env: { [env in Env]: string }
}

declare var process: ProcessEnv

export default async function handleSingleLoadEmployee(
  { context, data },
  winteamTenant,
): Promise<object> {
  validateError({ context, data }, 'PrimaryKeyValue')

  const { PrimaryKeyValue } = data

  const employee: WinteamEmployee = await getEmployee(
    PrimaryKeyValue,
    winteamTenant.mappings.filter(x => x['productId'] === 'winteam')[0][
      'tenantId'
    ],
  )

  context.log.info(`Winteam Employee request completed: `)
  context.log.info(employee)

  if (!employee) {
    const err = new Error('EmployeeNotFoundError')

    context.log.error('handleEmployeeEvent: EmployeeNotFoundError', {
      data,
    })

    throw err
  }

  const applicationId = winteamTenant.mappings.filter(
    x => x['productId'] === 'lighthouse',
  )[0]['tenantId']

  const applicationCollection = await mongo.getCollection('applications')
  const application = await applicationCollection.findOne({
    _id: new mongo.ObjectId(applicationId),
  })

  context.log.info(`LH Application request completed: `)
  context.log.info(application)
  if (!application) {
    throw new Error(`ApplicationNotFoundError - applicationId:${applicationId}`)
  }

  return upsertUser({
    application,
    employee,
  })
}

async function getEmployee(employeeID: string, winteamTenantId: string) {
  const subscriptionKey = await secrets.getSecret(
    process.env.AZURE_KEY_VAULT,
    'WINTEAM-SUBSCRIPTION-KEY',
  )
  const request = {
    baseUrl: process.env.WINTEAM_BASE_URL,
    endpoint: `${process.env.EMPLOYEES_ENDPOINT}${employeeID}`,
    headers: {
      subscriptionKey,
      tenantId: winteamTenantId,
    },
    method: 'GET',
  }

  const employee = await winteam.helpers.winteamGetRequest(request)
  return employee
}
