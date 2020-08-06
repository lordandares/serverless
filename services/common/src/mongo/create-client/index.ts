import { getSecret } from '../../secrets'
import connect from '../lib/mongo-connector'

export const MONGO_URI_KEY =
  process.env.PLATFORM === 'AZURE' ? 'MONGODB-URI' : 'MONGODB_URI'

interface IMongoHelperEnv {
  env: {
    AWS_REGION: string
    PLATFORM: string
  }
}

declare var process: IMongoHelperEnv

export async function createClient(secretId: string): Promise<any> {
  try {
    assertEnvVars()
    const mongodbUri: string = await getSecret(secretId, MONGO_URI_KEY)
    const client = await connect(mongodbUri)

    return client
  } catch (err) {
    console.error('MongoCreateClientError', { err })
    throw err
  }
}

export function assertEnvVars() {
  const isValidPlatform =
    process.env.PLATFORM === 'AWS' || process.env.PLATFORM === 'AZURE'

  if (!isValidPlatform) {
    throw new Error('Incorrect Platform: PLATFORM')
  }

  if (process.env.PLATFORM === 'AWS' && !process.env.AWS_REGION) {
    throw new Error('Missing required environment variable: AWS_REGION')
  }
}

export default {
  createClient,
}
