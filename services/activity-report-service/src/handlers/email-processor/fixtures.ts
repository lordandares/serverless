export const TZ_LA = 'America/Los_Angeles'
export const TZ_NYC = 'America/New_York'

export const MOCK_APPLICATIONS = [
  { _id: '111111111111111111111111', name: 'Application 1' },
  { _id: '222222222222222222222222', name: 'Application 2' },
]

export const MOCK_DATA = [
  {
    _id: '565fe59257c5d59e60cc35a1',
    application: '111111111111111111111111',
    email: 'testing@lighthouse.io',
    firstName: 'Testing',
    preferences: {
      notifications: {
        channels: [
          {
            enabled: true,
            name: 'daily-location-report',
            options: {
              hours: 9,
              timezone: TZ_LA,
            },
          },
        ],
      },
    },
    permissions: [
      {
        module: 'location',
        type: 'document',
        value: '565fe59257c5d59e60cc35b3',
      },
    ],
  },
  {
    _id: '565fe59257c5d59e60cc35a2',
    application: '111111111111111111111111',
    email: 'testing2@lighthouse.io',
    firstName: 'Testing2',
    preferences: {
      notifications: {
        channels: [
          {
            enabled: true,
            name: 'daily-location-report',
            options: {
              hours: 9,
              timezone: TZ_LA,
            },
          },
        ],
      },
    },
  },
  {
    _id: '565fe59257c5d59e60cc35a3',
    application: '222222222222222222222222',
    email: 'testing2@lighthouse.io',
    firstName: 'Testing 2',
    preferences: {
      notifications: {
        channels: [
          {
            enabled: true,
            name: 'daily-location-report',
            options: {
              hours: 11,
              timezone: TZ_LA,
            },
          },
        ],
      },
    },
    permissions: [
      {
        module: 'location',
        type: 'document',
        value: '565fe59257c5d59e60cc35b5',
      },
    ],
  },
]

export const MOCK_LOCATIONS = [
  {
    _id: '565fe59257c5d59e60cc35b3',
    files: {
      pdf: {
        path:
          'activity-reports/565fe59257c5d59e60cc35b3/1999/12/1999-12-31-1548194730622.pdf',
        timestamp: new Date('2019-12-31T18:00:00Z'),
      },
    },
    name: 'Testing Location 1',
  },
  {
    _id: '565fe59257c5d59e60cc35b4',
    files: {
      pdf: {
        path:
          'activity-reports/565fe59257c5d59e60cc35b4/1999/12/1999-12-30-1548194730622.pdf',
        timestamp: new Date('2019-12-30T18:00:00Z'),
      },
    },
    name: 'Testing Location 2',
  },
  {
    _id: '565fe59257c5d59e60cc35b5',
    files: {
      pdf: {
        path:
          'activity-reports/565fe59257c5d59e60cc35b5/1999/12/1999-12-29-1548194730622.pdf',
        timestamp: new Date('2019-12-29T18:00:00Z'),
      },
    },
    name: 'Testing Location 3',
    properties: {
      area: '565fe59257c5d59e60cc35c1',
    },
  },
]

export const MOCK_USER_DETAILS = {
  email: 'testing@lighthouse.io',
  firstName: 'Testing',
}

export const MOCK_EMAIL = {
  Destination: {
    CcAddresses: [],
    ToAddresses: ['testing@test.com'],
  },
  ReplyToAddresses: ['support@lighthouse.io'],
  Source: 'support@lighthouse.io',
  Template: 'template-name',
  TemplateData: '',
}

export const MOCK_RESULT1 = {
  ResponseMetadata: {
    RequestId: '88464904-fcf3-11e8-8e1f-b9c0f7c86ac5',
  },
  MessageId: '010001679b4692cd-28db95eb-8524-4abf-9303-9a1f32824a2f-000000',
}

export const MOCK_RESULT2 = {
  ResponseMetadata: {
    RequestId: '88464904-fcf3-11e8-8e1f-b9c0f7c86ac6',
  },
  MessageId: '010001679b4692cd-28db95eb-8524-4abf-9303-9a1f32824a2f-000001',
}
