import { mongo, secrets } from '@lighthouse/serverless-common'
import { padCharsEnd, throttle } from 'lodash/fp'
import request from 'request'
import { DataStream, StringStream } from 'scramjet'
import { upsertUser, WinteamEmployee } from '../../helpers/upsertUser'

interface Output {
  stats: {
    processed: number
    created: number
    updated: number
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

const throttledLog = throttle(5000, console.info)

declare var process: ProcessEnv

export default async function handleFullLoadEmployees(
  { context, data },
  winteamTenant,
): Promise<object> {
  try {
    context.log.info('winteamTenant: ', winteamTenant)
    const { dryRun, options, strategy } = data

    const applicationId = winteamTenant.mappings.filter(
      x => x['productId'] === 'lighthouse',
    )[0]['tenantId']

    if (!applicationId) {
      throw new Error('ApplicationId not found')
    }

    context.log.info('##APPLICATION ID:', applicationId)

    const stream: DataStream = await streamFromHttp(
      winteamTenant.mappings.filter(x => x['productId'] === 'winteam')[0][
        'tenantId'
      ],
    )

    const stats = {
      processed: 0,
      created: 0,
      updated: 0,
    }

    const applicationCollection = await mongo.getCollection('applications')
    const application = await applicationCollection.findOne({
      _id: new mongo.ObjectId(applicationId),
    })

    context.log.info(`LH Application request completed: `)
    context.log.info(application)

    if (!application) {
      throw new Error(
        `ApplicationNotFoundError - applicationId:${applicationId}`,
      )
    }

    const timeStreamStart: any = new Date().getTime()

    await stream
      .each(async (row: WinteamEmployee) => {
        stats.processed += 1
        if (!dryRun) {
          const result: any = await upsertUser({
            application,
            employee: row,
          })

          const { type } = result

          type && type === 'update'
            ? (stats.updated += 1)
            : (stats.created += 1)
        }

        throttledLog(`Processed ${stats.processed} | Updated ${stats.updated}`)

        return row
      })
      .run()

    const timeStreamEnd: any = new Date().getTime()
    // Time spent in seconds
    const timeStreamSpent: any = (timeStreamEnd - timeStreamStart) / 1000

    log(
      `Processed ${stats.processed} | Created ${stats.created} | Updated ${
        stats.updated
      }`,
    )
    log('✅ SUCCESS')

    log(`Users import time: ${timeStreamSpent} seconds.`)

    return {
      stats,
    }
  } catch (err) {
    log('🚨 Error')
    console.error(err)
    throw err
  }
}

function log(text) {
  const len = text.length
  const divider = padCharsEnd('-', len, '')
  console.info(`

${divider}
${text}
${divider}

`)
}

async function streamFromHttp(winteamTenantId: string): Promise<DataStream> {
  const subscriptionKey = await secrets.getSecret(
    process.env.AZURE_KEY_VAULT,
    'WINTEAM-SUBSCRIPTION-KEY',
  )

  const url = `${process.env.WINTEAM_BASE_URL}${process.env.EMPLOYEES_ENDPOINT}`
  const headers = {
    'Content-Type': 'application/json',
    'Ocp-Apim-Subscription-Key': subscriptionKey,
    tenantId: winteamTenantId,
  }

  const requestOptions = {
    url,
    headers,
  }

  return StringStream.from(request(requestOptions), {})
    .JSONParse()
    .flatMap((doc: object) => doc)
}
