import { errors, schemas } from '@lighthouse/serverless-common'
import * as AWS from 'aws-sdk'
import { ClientConfiguration, DocumentClient } from 'aws-sdk/clients/dynamodb'
import SNS from 'aws-sdk/clients/sns'
import * as AWSXRay from 'aws-xray-sdk'
import {
  filter,
  flatMap,
  includes,
  join,
  keys,
  map,
  omit,
  reduce,
} from 'lodash'
import * as moment from 'moment'

declare var process: {
  env: {
    IS_OFFLINE: string
    REGION: string
    OCCURRENCE_RESOLVED_ARN: string
    TABLE_SCHEDULES: string
  }
}

interface ResolvedMatch {
  id: string
  pk: string
  sk: string
  updatedAt: string
}

export const processorStrategies = {
  location: processLocationEvent,
}

export async function processLocationEvent(streamEvent) {
  try {
    if (!streamEvent || !streamEvent.data || !streamEvent.version) {
      throw Error('ProcessLocationEvent: Invalid event received')
    }

    const isOffline = process.env.IS_OFFLINE
    const region = process.env.REGION
    const tableName = process.env.TABLE_SCHEDULES
    const topicArn = process.env.OCCURRENCE_RESOLVED_ARN

    const dynamoDbConfig: ClientConfiguration =
      region === 'localhost'
        ? /* istanbul ignore next */ {
            endpoint: 'http://localhost:8000',
            httpOptions: { timeout: 5000 },
            region,
          }
        : {}

    const DynamoDB = isOffline
      ? AWS.DynamoDB
      : /* istanbul ignore next */
        AWSXRay.captureAWS(AWS).DynamoDB

    const documentClient: DocumentClient = new DynamoDB.DocumentClient(
      dynamoDbConfig,
    )
    const snsClient: SNS = new AWS.SNS()

    const { data, version } = streamEvent

    // data property is a lighthouse event
    const { _id, application, area, user } = data

    console.info(`ProcessLocationEvent: processing ${_id} (${version})`)

    if (version === 'v1') {
      if (!application) {
        throw Error('ProcessLocationEvent: event missing application property')
      }

      const applicationId = application._id
      const patternTypes = ['visit']
      const patternPrefix = `rule-pattern-${applicationId}`

      // NOTE istanbul issue with optional chaining which breaks 100% coverage
      // https://github.com/istanbuljs/istanbuljs/issues/516
      // const areaIds = area && area?.ids || []
      const areaIds = (area && area.ids) || []
      const userId = user

      const patternQueries = flatMap(areaIds, id =>
        map(patternTypes, type => ({
          pk: `${patternPrefix}-${id}`,
          sk: type,
        })),
      )

      console.info(
        `ProcessLocationEvent: created ${
          patternQueries.length
        } pattern queries`,
        {
          patternQueries,
        },
      )

      const resolvedMatches: ResolvedMatch[] = []
      const transactItems: DocumentClient.TransactWriteItem[] = []

      for (const patternQuery of patternQueries) {
        const { pk: rulePatternPk, sk: rulePatternSk } = patternQuery

        const rulePatternQuery: DocumentClient.GetItemInput = {
          Key: { pk: rulePatternPk, sk: rulePatternSk },
          TableName: tableName,
        }

        const rulePatternResponse: DocumentClient.GetItemOutput = await documentClient
          .get(rulePatternQuery)
          .promise()

        const { Item: rulePatternItem } = rulePatternResponse

        if (!rulePatternItem) {
          console.warn('ProcessLocationEvent: unable to find rule pattern', {
            rulePatternQuery,
          })

          continue
        }

        console.info('ProcessLocationEvent: processing rule pattern', {
          rulePatternQuery,
        })

        const {
          matches: rulePatternMatches,
          updatedAt: rulePatternUpdatedAt,
        } = rulePatternItem

        const rulePatternMatchesIds = keys(rulePatternMatches)

        // NOTE: if rule pattern matches is empty then we can safely remove the
        // pattern document. Please note this will only happen on the
        // subsequent rule pattern match even though all matches could be
        // processed initially
        if (rulePatternMatchesIds.length === 0) {
          console.info(
            'ProcessLocationEvent: will remove rule pattern as no matches',
          )

          const rulePatternDelete: DocumentClient.TransactWriteItem = {
            Delete: {
              ConditionExpression: '#updatedAt = :updatedAt',
              ExpressionAttributeNames: {
                '#updatedAt': 'updatedAt',
              },
              ExpressionAttributeValues: {
                ':updatedAt': rulePatternUpdatedAt,
              },
              Key: { pk: rulePatternPk, sk: rulePatternSk },
              TableName: tableName,
            },
          }

          transactItems.push(rulePatternDelete)

          continue
        }

        const processedMatches: string[] = []

        for (const matchId in rulePatternMatches) {
          // NOTE: ensures we don't iterate prototype properties
          /* istanbul ignore next */
          if (!rulePatternMatches.hasOwnProperty(matchId)) {
            continue
          }

          const matchValues = rulePatternMatches[matchId]

          const {
            locationId: matchLocationId,
            pk: matchPk,
            sk: matchSk,
            userId: matchUserId,
          } = matchValues

          const matchesLocationId = !!matchLocationId
            ? includes(areaIds, matchLocationId)
            : true

          const matchesUserId = !!matchUserId ? matchUserId === userId : true

          const matchesEvent = matchesLocationId && matchesUserId

          if (!matchesEvent) {
            console.warn(
              `ProcessLocationEvent: pattern rule does not match data`,
              {
                matchId,
                matchesLocationId,
                matchesUserId,
              },
            )

            continue
          }

          const matchDocumentQuery: DocumentClient.GetItemInput = {
            Key: { pk: matchPk, sk: matchSk },
            TableName: tableName,
          }

          const matchDocumentResponse: DocumentClient.GetItemOutput = await documentClient
            .get(matchDocumentQuery)
            .promise()

          const { Item: matchDocument } = matchDocumentResponse

          if (!matchDocument) {
            console.warn(
              `ProcessLocationEvent: match is missing so will be removed from rule pattern`,
            )

            processedMatches.push(matchId)

            continue
          }

          const {
            endAt: matchEndAt,
            startAt: matchStartAt,
            updatedAt: matchUpdatedAt,
          } = matchDocument

          const now = moment.utc().valueOf()
          const nowIsoString = moment
            .utc()
            .toDate()
            .toISOString()
          const isFutureMatch = now < moment.utc(matchStartAt).valueOf()
          const isExpiredMatch = now > moment.utc(matchEndAt).valueOf()

          if (isFutureMatch) {
            console.warn(
              `ProcessLocationEvent: match can't be processed until ${matchStartAt} so skipping`,
              {
                endIsoString: matchEndAt,
                matchId,
                nowIsoString,
                startIsoString: matchStartAt,
              },
            )

            continue
          }

          if (isExpiredMatch) {
            console.warn(
              `ProcessLocationEvent: match expired at ${matchEndAt} so will be removed from rule pattern`,
              {
                endIsoString: matchEndAt,
                matchId,
                nowIsoString,
                startIsoString: matchStartAt,
              },
            )

            processedMatches.push(matchId)

            continue
          }

          processedMatches.push(matchId)

          resolvedMatches.push({
            id: matchId,
            pk: matchPk,
            sk: matchSk,
            updatedAt: matchUpdatedAt,
          })
        }

        const processedMatchesLength = processedMatches.length

        if (processedMatchesLength) {
          const nextUpdatedAt = moment
            .utc()
            .toDate()
            .toISOString()

          const nextMatches = omit(rulePatternMatches, processedMatches)

          const rulePatternUpdate: DocumentClient.TransactWriteItem = {
            Update: {
              ConditionExpression: '#updatedAt = :updatedAt',
              ExpressionAttributeNames: {
                '#matches': 'matches',
                '#updatedAt': 'updatedAt',
              },
              ExpressionAttributeValues: {
                ':nextMatches': nextMatches,
                ':nextUpdatedAt': nextUpdatedAt,
                ':updatedAt': rulePatternUpdatedAt,
              },
              Key: { pk: rulePatternPk, sk: rulePatternSk },
              TableName: tableName,
              UpdateExpression: `SET #matches = :nextMatches, #updatedAt = :nextUpdatedAt`,
            },
          }

          transactItems.push(rulePatternUpdate)
        }
      }

      const resolvedMatchesLength = resolvedMatches.length
      const transactItemsLength = transactItems.length

      if (transactItemsLength) {
        console.info(
          `ProcessLocationEvent: processing ${transactItemsLength} transactions`,
        )

        const transactParams: DocumentClient.TransactWriteItemsInput = {
          TransactItems: transactItems,
        }

        await documentClient.transactWrite(transactParams).promise()

        console.info(
          'ProcessLocationEvent: completed transactions successfully',
        )
      }

      if (resolvedMatchesLength) {
        console.info(
          `ProcessLocationEvent: processing ${resolvedMatchesLength} resolved matches`,
        )

        for (const resolvedMatch of resolvedMatches) {
          try {
            await snsClient
              .publish({
                Message: JSON.stringify(resolvedMatch),
                TopicArn: topicArn,
              })
              .promise()
          } catch (error) {
            console.error(`ProcessLocationEvent: resolving match failed`, {
              error: error.message,
              resolvedMatch,
            })
          }
        }

        console.info(
          'ProcessLocationEvent: finished processing resolved matches',
        )
      }
    }

    console.info(
      `ProcessLocationEvent: finished processing ${_id} (${version})`,
    )
  } catch (err) {
    throw new errors.ApplicationError({ message: err.message })
  }
}
