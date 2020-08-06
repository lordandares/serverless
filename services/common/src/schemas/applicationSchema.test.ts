import { omit } from 'lodash/fp'
import { ValidationError } from 'yup'
import { applicationSchema } from './applicationSchema'

const validApplication = {
  _id: '5b480b46fbef0ba17da8f426',
  name: 'Default App 1',
  settings: {
    duressTypes: ['Fire', 'Intruder', 'Injury'],
    gps: {
      accuracy: 10,
    },
    location: {
      passive: {
        enabled: true,
        options: {
          distanceFilter: 50,
          preventSuspend: true,
        },
      },
      adhoc: {
        enabled: true,
        options: {
          timeout: 20,
        },
      },
    },
    uuids: [
      'AAAAAAAA-AAAA-4AAA-AAAA-AAAAAAAAAAAA',
      'C7DC932D-A1A7-4DCB-931A-8FCA647A7E01',
    ],
  },
  plugins: {
    loops: {
      enabled: true,
    },
    serviceNow: {
      enabled: true,
    },
    slack: {
      enabled: false,
    },
    winteam: {
      enabled: true,
      options: {
        configSetting: 1,
        anotherConfigSetting: 2,
      },
      secrets: {
        awsSecretId: 'lio/serverless/winteam-service/test/default-app-1',
      },
    },
  },
  flags: {
    debug: true,
  },
  theme: {
    logos: {
      pdf: 'https://s3.amazonaws.com/assets-lighthouse-io/img/logo-medium.png',
    },
  },
  timezone: 'Australia/Melbourne',
}

test('valid', () => {
  expect.assertions(1)

  const validate = applicationSchema.validate(validApplication, {
    strict: true,
  })

  return expect(validate).resolves.toMatchSnapshot()
})

test('missing name', () => {
  expect.assertions(1)

  const validate = applicationSchema.validate(omit('name', validApplication), {
    strict: true,
  })

  return expect(validate).rejects.toThrowError(ValidationError)
})
