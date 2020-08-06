import { HttpMethod } from '@azure/functions'
import { run, TableNames } from './subscriber'
import handleJobEvent from './handleJobEvent'
import handleEmployeeEvent from './employee/handleEmployeeEvent'
import { createMockContext } from '../../../../../__test__/helpers'

jest.mock('./handleJobEvent')
jest.mock('./employee/handleEmployeeEvent')

beforeEach(() => {
  jest.clearAllMocks()
})

const mockEventGridJob = {
  data: JSON.stringify({
    ChangeOperation: 'U',
    TableName: TableNames.tblJB_JOBS,
  }),
}

const mockEventGridEmployee = {
  data: JSON.stringify({
    ChangeOperation: 'U',
    TableName: TableNames.tblPAY_EMPLOYEES,
  }),
}

const mockEventGridUnknownTable = {
  data: JSON.stringify({
    ChangeOperation: 'U',
    TableName: 'unknown',
  }),
}

const mockEventGridWithoutTable = {
  data: JSON.stringify({ ChangeOperation: 'U' }),
}

const mockEventGridUnknownOperation = {
  data: JSON.stringify({ ChangeOperation: 'unknown' }),
}

const mockEventGridWithoutOperation = {
  data: JSON.stringify({ TableName: TableNames.tblPAY_EMPLOYEES }),
}

//does the data need to be stringified?
const mockEventGridJobTest = {
  data: {
    ChangeOperation: 'U',
    TableName: TableNames.tblPAY_EMPLOYEES,
    validationCode: 'somevalidationcode',
  },
  eventType: 'Microsoft.EventGrid.SubscriptionValidationEvent',
}

test('errors when `body` is missing', async () => {
  expect.assertions(1)

  const mockContext = createMockContext()
  const mockReq = { body: undefined }

  try {
    await run(mockContext, mockReq as any)
  } catch (err) {
    expect(err).toMatchInlineSnapshot(`[ValidationError: body is required]`)
  }
})

test('should get a json response if the body has a valid eventType', async () => {
  expect.assertions(1)

  const mockContext = createMockContext()
  const mockReq = generateEventGridEvent(mockEventGridJobTest)
  const response = await run(mockContext, mockReq as any)

  expect(response).toMatchInlineSnapshot(`
  Object {
    "res": Object {
      "body": Object {
        "validationResponse": "somevalidationcode",
      },
      "headers": Object {
        "Content-Type": "application/json",
      },
      "status": 200,
    },
  }
  `)
})

test('validates unknown `change operation`', async () => {
  expect.assertions(1)

  const mockContext = createMockContext()
  const mockReq = generateEventGridEvent(mockEventGridUnknownOperation)

  try {
    await run(mockContext, mockReq as any)
  } catch (err) {
    expect(err).toMatchInlineSnapshot(`[Error: Invalid change operation]`)
  }
})

test('validates missing `change operation`', async () => {
  expect.assertions(1)

  const mockContext = createMockContext()
  const mockReq = generateEventGridEvent(mockEventGridWithoutOperation)

  try {
    await run(mockContext, mockReq as any)
  } catch (err) {
    expect(err).toMatchInlineSnapshot(`[Error: Invalid change operation]`)
  }
})

test('validates unknown `table name`', async () => {
  expect.assertions(1)

  const mockContext = createMockContext()
  const mockReq = generateEventGridEvent(mockEventGridUnknownTable)

  try {
    await run(mockContext, mockReq as any)
  } catch (err) {
    expect(err).toMatchInlineSnapshot(`[Error: Invalid table name]`)
  }
})

test('validates missing `table name`', async () => {
  expect.assertions(1)

  const mockContext = createMockContext()
  const mockReq = generateEventGridEvent(mockEventGridWithoutTable)

  try {
    await run(mockContext, mockReq as any)
  } catch (err) {
    expect(err).toMatchInlineSnapshot(`[Error: Invalid table name]`)
  }
})

test('handles job events', async () => {
  expect.assertions(2)

  const mockContext = createMockContext()
  const mockReq = generateEventGridEvent(mockEventGridJob)

  await run(mockContext, mockReq)

  expect(handleJobEvent).toHaveBeenCalled()
  expect(handleEmployeeEvent).not.toHaveBeenCalled()
})

test('handles employee events', async () => {
  expect.assertions(2)

  const mockContext = createMockContext()
  const mockReq = generateEventGridEvent(mockEventGridEmployee)

  await run(mockContext, mockReq)

  expect(handleJobEvent).not.toHaveBeenCalled()
  expect(handleEmployeeEvent).toHaveBeenCalled()
})

function generateEventGridEvent({ data, eventType }) {
  return {
    body: [
      {
        data,
        eventType,
      },
    ],
    headers: {},
    method: 'POST' as HttpMethod,
    params: {},
    query: {},
    url: '/events',
    // TODO reimplement event grid pattern when ready
    // data,
    // dataVersion: 'v1',
    // eventTime: new Date(),
    // eventType: 'eventGridEvent',
    // id: 'id1',
    // subject: 'test-event',
    // time: new Date(),
  }
}
