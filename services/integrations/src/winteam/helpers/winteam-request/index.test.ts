jest.mock('node-fetch')

import fetch from 'node-fetch'
import winteamRequest from './'
import { winteamGetRequest } from './'

describe('handlers:winteamRequest', () => {
  afterEach(() => jest.resetAllMocks())

  it('should POST a valid time punch payload | POST', async () => {
    expect.assertions(1)
    const response = JSON.stringify({
      status: 'success',
    })

    fetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(response),
    })

    const payload = {
      baseUrl: 'http://baseUrl/api/v1',
      body: {
        EmployeeNumber: '1234',
        GeoCoordinate: {
          Latitude: 90,
          Longitude: 0,
        },
        HoursTypeId: 22,
        JobNumber: 33,
        JobPostId: 100,
        PunchTime: '2019-01-01 06:00:00.000+0100',
      },
      endpoint: '/endpoint',
      headers: {
        subscriptionKey: 'aaaa',
        tenantId: 'brosnan',
      },
      method: 'POST',
    }

    const result = await winteamRequest(payload)

    expect(result).toEqual({
      status: 'success',
    })
  })

  it('should handle non-json responses | POST', async () => {
    expect.assertions(1)
    fetch.mockResolvedValue({
      ok: true,
      text: () => 'text-success',
    })

    const payload = {
      baseUrl: 'http://baseUrl/api/v1',
      body: {
        EmployeeNumber: '1234',
        GeoCoordinate: {
          Latitude: 90,
          Longitude: 0,
        },
        HoursTypeId: 22,
        JobNumber: 33,
        JobPostId: 100,
        PunchTime: '2019-01-01 06:00:00.000+0100',
      },
      endpoint: '/endpoint',
      headers: {
        subscriptionKey: 'aaaa',
        tenantId: 'brosnan',
      },
      method: 'POST',
    }

    const result = await winteamRequest(payload)

    expect(result).toEqual('text-success')
  })

  it('should handle a JSON server error from the WinTeam API | POST', async () => {
    expect.assertions(1)

    fetch.mockResolvedValue({
      ok: false,
      text: () =>
        JSON.stringify({
          Result: null,
          Errors: [
            {
              AttemptedValue: '22300',
              ErrorMessage:
                'Employee Number in request body has an invalid format or value.',
              ErrorType: null,
              FieldName: 'EmployeeNumber',
            },
          ],
        }),
    })

    const payload = {
      baseUrl: 'http://baseUrl/api/v1',
      body: {
        EmployeeNumber: '1234',
        GeoCoordinate: {
          Latitude: 90,
          Longitude: 0,
        },
        HoursTypeId: 22,
        JobNumber: 33,
        JobPostId: 100,
        PunchTime: '2019-01-01 06:00:00.000+0100',
      },
      endpoint: '/endpoint',
      headers: {
        subscriptionKey: 'aaaa',
        tenantId: 'brosnan',
      },
      method: 'POST',
    }

    const result = await winteamRequest(payload)

    expect(result).toEqual({
      Errors: [
        {
          AttemptedValue: '22300',
          ErrorMessage:
            'Employee Number in request body has an invalid format or value.',
          ErrorType: null,
          FieldName: 'EmployeeNumber',
        },
      ],
      Result: null,
    })
  })

  it('should return a default error message if a non-JSON error is returned from the WinTeam API | POST', async () => {
    expect.assertions(1)

    fetch.mockResolvedValue({
      ok: false,
      text: () => 'Internal Server Error',
    })

    const payload = {
      baseUrl: 'http://baseUrl/api/v1',
      body: {
        EmployeeNumber: '1234',
        GeoCoordinate: {
          Latitude: 90,
          Longitude: 0,
        },
        HoursTypeId: 22,
        JobNumber: 33,
        JobPostId: 100,
        PunchTime: '2019-01-01 06:00:00.000+0100',
      },
      endpoint: '/endpoint',
      headers: {
        subscriptionKey: 'aaaa',
        tenantId: 'brosnan',
      },
      method: 'POST',
    }

    const result = await winteamRequest(payload)

    expect(result).toEqual({
      Errors: [
        {
          FieldName: '',
          AttemptedValue: '',
          ErrorMessage: 'Punch rejected.  Please contact your supervisor',
          ErrorType: 'BadRequest',
        },
      ],
      Result: null,
    })
  })

  it('should error if baseUrl is missing | POST', async () => {
    expect.assertions(1)

    try {
      const payload = {
        baseUrl: '',
        body: {
          EmployeeNumber: '1234',
          GeoCoordinate: {
            Latitude: 90,
            Longitude: 0,
          },
          HoursTypeId: 22,
          JobNumber: 33,
          JobPostId: 100,
          PunchTime: '2019-01-01 06:00:00.000+0100',
        },
        endpoint: '/endpoint',
        headers: {
          subscriptionKey: 'aaaa',
          tenantId: 'brosnan',
        },
        method: 'POST',
      }

      await winteamRequest(payload)
    } catch (err) {
      expect(err.message).toMatch(/Missing required vars/)
    }
  })

  it('should error if endpoint is missing | POST', async () => {
    expect.assertions(1)

    try {
      const payload = {
        baseUrl: 'http://baseUrl/api',
        body: {
          EmployeeNumber: '1234',
          GeoCoordinate: {
            Latitude: 90,
            Longitude: 0,
          },
          HoursTypeId: 22,
          JobNumber: 33,
          JobPostId: 100,
          PunchTime: '2019-01-01 06:00:00.000+0100',
        },
        endpoint: '',
        headers: {
          subscriptionKey: 'aaaa',
          tenantId: 'brosnan',
        },
        method: 'POST',
      }

      await winteamRequest(payload)
    } catch (err) {
      expect(err.message).toMatch(/Missing required vars/)
    }
  })

  it('should error if subscription key header is missing | POST', async () => {
    expect.assertions(1)

    try {
      const payload = {
        baseUrl: 'http://baseUrl/api',
        body: {
          EmployeeNumber: '1234',
          GeoCoordinate: {
            Latitude: 90,
            Longitude: 0,
          },
          HoursTypeId: 22,
          JobNumber: 33,
          JobPostId: 100,
          PunchTime: '2019-01-01 06:00:00.000+0100',
        },
        endpoint: '/endpoint',
        headers: {
          subscriptionKey: '',
          tenantId: 'brosnan',
        },
        method: 'POST',
      }

      await winteamRequest(payload)
    } catch (err) {
      expect(err.message).toMatch(/Missing required vars/)
    }
  })

  it('should error if tenantId is missing | POST', async () => {
    expect.assertions(1)

    try {
      const payload = {
        baseUrl: 'http://baseUrl/api',
        body: {
          EmployeeNumber: '1234',
          GeoCoordinate: {
            Latitude: 90,
            Longitude: 0,
          },
          HoursTypeId: 22,
          JobNumber: 33,
          JobPostId: 100,
          PunchTime: '2019-01-01 06:00:00.000+0100',
        },
        endpoint: '/endpoint',
        headers: {
          subscriptionKey: 'aaaa',
          tenantId: '',
        },
        method: 'POST',
      }

      await winteamRequest(payload)
    } catch (err) {
      expect(err.message).toMatch(/Missing required vars/)
    }
  })
})
describe('handlers:winteamGetRequest', () => {
  afterEach(() => jest.resetAllMocks())

  it('should GET a valid time punch payload | GET', async () => {
    expect.assertions(1)
    const response = JSON.stringify({
      status: 'success',
    })

    fetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(response),
    })

    const payload = {
      baseUrl: 'http://baseUrl/api/v1',
      endpoint: '/endpoint',
      headers: {
        subscriptionKey: 'aaaa',
        tenantId: 'brosnan',
      },
      method: 'GET',
    }

    const result = await winteamGetRequest(payload)

    expect(result).toEqual({
      status: 'success',
    })
  })

  it('should handle non-json responses | GET', async () => {
    expect.assertions(1)
    fetch.mockResolvedValue({
      ok: true,
      text: () => 'text-success',
    })

    const payload = {
      baseUrl: 'http://baseUrl/api/v1',
      endpoint: '/endpoint',
      headers: {
        subscriptionKey: 'aaaa',
        tenantId: 'brosnan',
      },
      method: 'GET',
    }

    const result = await winteamGetRequest(payload)

    expect(result).toEqual('text-success')
  })

  it('should handle a JSON server error from the WinTeam API | GET', async () => {
    expect.assertions(1)

    fetch.mockResolvedValue({
      ok: false,
      text: () =>
        JSON.stringify({
          Result: null,
          Errors: [
            {
              AttemptedValue: '22300',
              ErrorMessage:
                'Employee Number in request body has an invalid format or value.',
              ErrorType: null,
              FieldName: 'EmployeeNumber',
            },
          ],
        }),
    })

    const payload = {
      baseUrl: 'http://baseUrl/api/v1',
      endpoint: '/endpoint',
      headers: {
        subscriptionKey: 'aaaa',
        tenantId: 'brosnan',
      },
      method: 'GET',
    }

    const result = await winteamGetRequest(payload)

    expect(result).toEqual({
      Errors: [
        {
          AttemptedValue: '22300',
          ErrorMessage:
            'Employee Number in request body has an invalid format or value.',
          ErrorType: null,
          FieldName: 'EmployeeNumber',
        },
      ],
      Result: null,
    })
  })

  it('should return a default error message if  a non-JSON error is returned from the WinTeam API | GET', async () => {
    expect.assertions(1)

    fetch.mockResolvedValue({
      ok: false,
      text: () => 'Internal Server Error',
    })

    const payload = {
      baseUrl: 'http://baseUrl/api/v1',
      endpoint: '/endpoint',
      headers: {
        subscriptionKey: 'aaaa',
        tenantId: 'brosnan',
      },
      method: 'GET',
    }

    const result = await winteamGetRequest(payload)

    expect(result).toEqual({
      Errors: [
        {
          FieldName: '',
          AttemptedValue: '',
          ErrorMessage: 'Punch rejected.  Please contact your supervisor',
          ErrorType: 'BadRequest',
        },
      ],
      Result: null,
    })
  })

  it('should error if baseUrl is missing | GET', async () => {
    expect.assertions(1)

    try {
      const payload = {
        baseUrl: '',
        endpoint: '/endpoint',
        headers: {
          subscriptionKey: 'aaaa',
          tenantId: 'brosnan',
        },
        method: 'GET',
      }

      await winteamGetRequest(payload)
    } catch (err) {
      expect(err.message).toMatch(/Missing required vars/)
    }
  })

  it('should error if endpoint is missing | GET', async () => {
    expect.assertions(1)

    try {
      const payload = {
        baseUrl: 'http://baseUrl/api',
        endpoint: '',
        headers: {
          subscriptionKey: 'aaaa',
          tenantId: 'brosnan',
        },
        method: 'GET',
      }

      await winteamGetRequest(payload)
    } catch (err) {
      expect(err.message).toMatch(/Missing required vars/)
    }
  })

  it('should error if subscription key header is missing | GET', async () => {
    expect.assertions(1)

    try {
      const payload = {
        baseUrl: 'http://baseUrl/api',
        endpoint: '/endpoint',
        headers: {
          subscriptionKey: '',
          tenantId: 'brosnan',
        },
        method: 'GET',
      }

      await winteamGetRequest(payload)
    } catch (err) {
      expect(err.message).toMatch(/Missing required vars/)
    }
  })

  it('should error if tenantId is missing | GET', async () => {
    expect.assertions(1)

    try {
      const payload = {
        baseUrl: 'http://baseUrl/api',
        endpoint: '/endpoint',
        headers: {
          subscriptionKey: 'aaaa',
          tenantId: '',
        },
        method: 'GET',
      }

      await winteamGetRequest(payload)
    } catch (err) {
      expect(err.message).toMatch(/Missing required vars/)
    }
  })
})
