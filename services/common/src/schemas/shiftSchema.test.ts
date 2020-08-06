import { ValidationError } from 'yup'
import { shiftSchema } from './shiftSchema'

test('valid start shift', () => {
  expect.assertions(1)

  const validate = shiftSchema.validate(
    {
      application: 'applicationId',
      end: null,
      location: 'locationId',
      start: {
        time: 'timestamp',
      },
      user: 'userId',
    },
    { strict: true },
  )

  return expect(validate).resolves.toMatchSnapshot()
})

test('valid end shift', () => {
  expect.assertions(1)

  const validate = shiftSchema.validate(
    {
      application: 'applicationId',
      end: {
        time: 'end-timestamp',
      },
      location: 'locationId',
      start: {
        time: 'start-timestamp',
      },
      user: 'userId',
    },
    { strict: true },
  )

  return expect(validate).resolves.toMatchSnapshot()
})

test('valid shift for GPS user', () => {
  expect.assertions(1)

  const validate = shiftSchema.validate(
    {
      application: 'applicationId',
      end: {
        area: {
          location: {
            id: 'area-location-id-2',
          },
        },
        time: 'end-timestamp',
      },
      location: null,
      start: {
        area: {
          location: {
            id: 'area-location-id-1',
          },
        },
        time: 'start-timestamp',
      },
      user: 'userId',
    },
    { strict: true },
  )

  return expect(validate).resolves.toMatchSnapshot()
})

test('valid message', () => {
  expect.assertions(1)

  const validate = shiftSchema.validate(
    {
      application: 'applicationId',
      end: null,
      location: 'locationId',
      messages: [
        {
          isGlobal: false,
          messageId: 123,
          message: 'message',
          punchActionId: 0,
          response1: 'response1',
          response1Id: 0,
          response2: 'response2',
          response2Id: 0,
        },
      ],
      start: {
        time: 'timestamp',
      },
      user: 'userId',
    },
    { strict: true },
  )

  return expect(validate).resolves.toMatchSnapshot()
})

test('invalid message', () => {
  expect.assertions(1)

  const validate = shiftSchema.validate(
    {
      application: 'applicationId',
      end: null,
      location: 'locationId',
      messages: [
        {
          id: '',
        },
      ],
      start: {
        time: 'timestamp',
      },
      user: 'userId',
    },
    { strict: true },
  )

  return expect(validate).rejects.toThrowError(ValidationError)
})

test('missing application', () => {
  expect.assertions(1)

  const validate = shiftSchema.validate(
    {
      application: '',
      end: {
        area: {
          location: {
            id: 'area-location-id-2',
          },
        },
        time: 'end-timestamp',
      },
      start: {
        area: {
          location: {
            id: 'area-location-id-1',
          },
        },
        time: 'start-timestamp',
      },
      user: 'userId',
    },
    { strict: true },
  )

  return expect(validate).rejects.toThrowError(ValidationError)
})

test('missing user', () => {
  expect.assertions(1)

  const validate = shiftSchema.validate(
    {
      application: 'applicationId',
      end: {
        area: {
          location: {
            id: 'area-location-id-2',
          },
        },
        time: 'end-timestamp',
      },
      start: {
        area: {
          location: {
            id: 'area-location-id-1',
          },
        },
        time: 'start-timestamp',
      },
      user: '',
    },
    { strict: true },
  )

  return expect(validate).rejects.toThrowError(ValidationError)
})
