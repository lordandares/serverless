import * as AWSSdk from 'aws-sdk'
import * as AWS from 'aws-sdk-mock'

import { DynamoRepository, getDocumentClient } from './dynamo'

test('document client gets instanced with no errors', async () => {
  process.env.IS_OFFLINE = 'true'
  const documentClient = getDocumentClient()

  expect(documentClient).toBeInstanceOf(AWSSdk.DynamoDB.DocumentClient)
})

test('document client gets wrapped and instanced with no errors', async () => {
  process.env.IS_OFFLINE = undefined
  const documentClient = getDocumentClient()

  expect(documentClient).toBeInstanceOf(AWSSdk.DynamoDB.DocumentClient)
})
