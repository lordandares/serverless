import { mongo } from '@lighthouse/serverless-common'
import { FilterQuery, UpdateQuery } from 'mongodb'

const { ObjectId } = mongo
const AUDIT_MATCHER = /audit/
const ISSUE_MATCHER = /issue/
const TASK_MATCHER = /task/

interface UpdateParams {
  query: FilterQuery<any>
  type: string
  update: UpdateQuery<any>
}

interface Options {
  applicationId: string
  entityId: string
  key: string
  type: string
}

export async function attachFileToEntry(options: Options) {
  const { applicationId, entityId, key, type } = options

  if (!applicationId || !entityId || !key || !type) {
    console.info('attachFileToEntry: Missing required options', options)
    return Promise.resolve()
  }

  const updateParams = {
    query: {
      _id: new ObjectId(entityId),
      application: new ObjectId(applicationId),
    },
    type,
    update: {
      $set: {
        'files.pdf.path': key,
        'files.pdf.timestamp': new Date(),
      },
    },
  }

  return findAndUpdateDocument(updateParams)
}

export function collectionMatcher(type: string) {
  if (type.match(AUDIT_MATCHER)) {
    return 'auditentries'
  }

  if (type.match(ISSUE_MATCHER)) {
    return 'issues'
  }

  if (type.match(TASK_MATCHER)) {
    return 'taskentries'
  }

  return null
}

export function findAndUpdateDocument(updateParams: UpdateParams) {
  const { query, type, update } = updateParams
  const secretId = process.env.AWS_SECRET_ID || ''

  if (!secretId || !query._id || !query.application) {
    throw new Error('findAndUpdateDocument: Missing required params')
  }

  const collectionName = collectionMatcher(type)

  if (!collectionName) {
    throw new Error('findAndUpdateDocument: No matching collectionName')
  }

  return mongo.createClient(secretId).then(client =>
    client
      .db()
      .collection(collectionName)
      .findOneAndUpdate(query, update),
  )
}
