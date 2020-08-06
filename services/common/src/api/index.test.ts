import nock from 'nock'
import { createClient } from './'

const mockBaseUrl = 'https://test-api.lighthouse.io'
const scope = nock(mockBaseUrl)

test('errors when missing url', async () => {
  expect.assertions(1)

  try {
    const api = createClient()
    const options = {}

    await api.get(undefined, options)
  } catch (err) {
    expect(err).toMatchInlineSnapshot(`[Error: RequestError: missing url]`)
  }
})

test('handles errors', async () => {
  expect.assertions(1)

  const mockPath = '/path/to/data'
  const expected = { foo: 'bar' }

  nock(mockBaseUrl)
    .get(mockPath)
    .replyWithError('Something went wrong')

  const api = createClient()
  const options = {}
  const url = `${mockBaseUrl}${mockPath}`

  try {
    const result = await api.get(url, options)
  } catch (err) {
    expect(err).toMatchInlineSnapshot(
      `[FetchError: request to https://test-api.lighthouse.io/path/to/data failed, reason: Something went wrong]`,
    )
  }
})

test('supports get requests', async () => {
  expect.assertions(1)

  const mockPath = '/path/to/data'
  const expected = { foo: 'bar' }

  scope.get(mockPath).reply(200, expected)

  const api = createClient()
  const options = {}
  const url = `${mockBaseUrl}${mockPath}`

  const result = await api.get(url, options)

  expect(result).toEqual(expected)
})

test('supports post requests', async () => {
  expect.assertions(1)

  const mockPath = '/path/to/data'
  const payload = {
    foo: 'bar',
  }
  const expected = { _id: '1', foo: 'bar' }

  scope.post(mockPath, payload).reply(200, expected)

  const api = createClient()
  const options = {
    body: payload,
  }
  const url = `${mockBaseUrl}${mockPath}`

  const result = await api.post(url, options)

  expect(result).toEqual(expected)
})

test('supports put requests', async () => {
  expect.assertions(1)

  const mockPath = '/path/to/data'
  const payload = {
    foo: 'bar-updated',
  }
  const expected = { _id: '1', foo: 'bar-updated' }

  scope.put(mockPath, payload).reply(200, expected)

  const api = createClient()
  const options = {
    body: payload,
  }
  const url = `${mockBaseUrl}${mockPath}`

  const result = await api.put(url, options)

  expect(result).toEqual(expected)
})

test('supports delete requests', async () => {
  expect.assertions(1)

  const mockPath = '/collection/1'

  scope.put(mockPath).reply(204)

  const api = createClient()
  const options = {}
  const url = `${mockBaseUrl}${mockPath}`

  const result = await api.put(url, options)

  expect(result).toEqual({})
})

test('handles query params', async () => {
  expect.assertions(1)

  const mockPath = '/path/to/data'
  const query = { page: 1 }
  const expected = { foo: 'bar' }

  scope
    .get(mockPath)
    .query(query)
    .reply(200, expected)

  const api = createClient()
  const options = {
    query,
  }
  const url = `${mockBaseUrl}${mockPath}`

  const result = await api.get(url, options)

  expect(result).toEqual(expected)
})
