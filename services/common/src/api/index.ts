import { isEmpty } from 'lodash'
import fetch, { RequestInit, Response } from 'node-fetch'
import qs from 'querystring'

enum Methods {
  Get = 'GET',
  Post = 'POST',
  Put = 'PUT',
  Delete = 'DELETE',
}

type ClientRequest = (url: string, options: RequestOptions) => Promise<any>
type ClientResponse = object | object[]

interface RequestOptions {
  body?: any
  headers?: object
  query?: {
    [key: string]: any
  }
}

interface Client {
  post: ClientRequest
  get: ClientRequest
  put: ClientRequest
  delete: ClientRequest
}

const JSON_REGEX = /json/

export function createClient(): Client {
  const defaultHeaders = {
    'content-type': 'application/json',
  }

  const request = (method: Methods) => async (
    url: string,
    requestOptions: RequestOptions,
  ): Promise<ClientResponse> => {
    if (!url) {
      throw new Error('RequestError: missing url')
    }

    const { body, headers = {}, query } = requestOptions

    const queryString = query ? qs.stringify(query) : ''
    const fullUrl = queryString ? `${url}?${queryString}` : url

    const fetchOptions: RequestInit = {
      body: JSON.stringify(body),
      headers: {
        ...defaultHeaders,
        ...headers,
      },
      method,
    }

    const response: Response = await fetch(fullUrl, fetchOptions)

    const contentType = response.headers.get('Content-Type')

    if (contentType && JSON_REGEX.test(contentType)) {
      return response.json()
    }

    // Support non-json responses, e.g. 204
    return {}
  }

  return {
    delete: request(Methods.Delete),
    get: request(Methods.Get),
    post: request(Methods.Post),
    put: request(Methods.Put),
  }
}
