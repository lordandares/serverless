export const TZ_LA = 'America/Los_Angeles'
export const TZ_NYC = 'America/New_York'

export const applications = [
  { _id: '111111111111111111111111', name: 'Application 1' },
  { _id: '222222222222222222222222', name: 'Application 2' },
]

export const data = [
  {
    _id: '565fe59257c5d59e60cc35a1',
    email: 'testing@lighthouse.io',
    firstName: 'Testing',
    preferences: {
      notifications: {
        channels: [
          {
            enabled: true,
            name: 'daily-shift-report',
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
        module: 'locations',
        type: 'document',
        value: '565fe59257c5d59e60cc35a2',
      },
    ],
  },
  {
    _id: '565fe59257c5d59e60cc35a2',
    email: 'testing2@lighthouse.io',
    firstName: 'Testing 2',
    preferences: {
      notifications: {
        channels: [
          {
            enabled: true,
            name: 'daily-shift-report',
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
        module: 'locations',
        type: 'document',
        value: '565fe59257c5d59e60cc35a2',
      },
    ],
  },
]

export const email = {
  Destination: {
    CcAddresses: [],
    ToAddresses: ['testing@test.com'],
  },
  ReplyToAddresses: ['support@lighthouse.io'],
  Source: 'support@lighthouse.io',
  Template: 'template-name',
  TemplateData: '',
}

export const result = {
  ResponseMetadata: {
    RequestId: '88464904-fcf3-11e8-8e1f-b9c0f7c86ac5',
  },
  MessageId: '010001679b4692cd-28db95eb-8524-4abf-9303-9a1f32824a2f-000000',
}

export const shifts = [
  {
    _id: '5b480e6120d8f51322b0bfee',
    application: '565fe59257c5d59e60cc3123',
    start: {
      area: {
        location: {
          id: '565fe59257c5d59e60cc35b3',
        },
      },
      time: new Date('2019-12-30T18:00:00Z'),
    },
    end: {
      area: {
        location: {
          id: '565fe59257c5d59e60cc35b2',
        },
      },
      time: new Date('2019-12-30T18:00:00Z'),
    },
    files: {
      pdf: {
        path:
          'activity-reports/shifts/565e42d3d4c628373ab25231/2019/10/10/2019-10-10-shift-5d9f83bd8bb82c0001cc20c3-summary-1570743889529.pdf',
        timestamp: new Date('2019-12-31T18:00:00Z'),
      },
    },
    duration: 9,
    createdAt: new Date('2019-12-30T18:00:00Z'),
  },
  {
    _id: '60082e79dc704419ac763123',
    application: '565fe59257c5d59e60cc35b5',
    start: {
      area: {
        location: {
          id: '565fe59257c5d59e60cc35b2',
        },
      },
      time: new Date('2019-12-30T18:00:00Z'),
    },
    end: {
      area: {
        location: {
          id: '565fe59257c5d59e60cc35b3',
        },
      },
      time: new Date('2019-12-30T18:00:00Z'),
    },
    files: {
      pdf: {
        path:
          'activity-reports/shifts/565e42d3d4c628373ab25231/2019/10/10/2019-10-10-shift-5d9f83bd8bb82c0001cc20c3-summary-1570744458976.pdf',
        timestamp: new Date('2019-12-31T18:00:00Z'),
      },
    },
    duration: 9,
    createdAt: new Date('2019-12-30T18:00:00Z'),
  },
]

export const user_details = {
  email: 'testing@lighthouse.io',
  firstName: 'Testing',
  locations: [
    {
      _id: '565fe59257c5d59e60cc35a2',
      name: 'Testing Location 1',
    },
  ],
  shifts: [
    {
      _id: '5b480e6120d8f51322b0bfee',
      user: '565fe59257c5d59e60cc0001',
      files: {
        pdf: {
          path:
            'activity-reports/shifts/565e42d3d4c628373ab25231/2019/10/10/2019-10-10-shift-5d9f83bd8bb82c0001cc20c3-summary-1570747109531.pdf',
          timestamp: new Date('2019-12-31T18:00:00Z'),
        },
      },
    },
    {
      _id: '60082e79dc704419ac763123',
      user: '565fe59257c5d59e60cc0002',
      files: {
        pdf: {
          path:
            'activity-reports/shifts/565e42d3d4c628373ab25231/2019/10/10/2019-10-10-shift-5d9f83bd8bb82c0001cc20c3-summary-1570749390473.pdf',
          timestamp: new Date('2019-12-31T18:00:00Z'),
        },
      },
    },
  ],
}
