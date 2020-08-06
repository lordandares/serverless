export const application = {
  _id: '565fe59257c5d59e60cc35b1',
  name: 'Testing Application',
}

export const user = {
  application: '565fe59257c5d59e60cc35b5',
  email: 'testing@test.com',
  firstName: 'Testing',
  preferences: {
    notifications: {
      channels: [
        {
          enabled: true,
          name: 'daily-location-report',
          options: {
            hours: 9,
            timezone: 'America/Los_Angeles',
          },
        },
      ],
    },
  },
  permissions: [
    {
      module: 'area',
      type: 'document',
      value: '565fe59257c5d59e60cc35b3',
    },
    {
      module: 'area',
      type: 'document',
      value: '565fe59257c5d59e60cc35b4',
    },
  ],
}

export const legacyUser = {
  application: '565fe59257c5d59e60cc35b5',
  email: 'testing@test.com',
  firstName: 'Testing',
  preferences: {
    notifications: {
      channels: [
        {
          enabled: true,
          name: 'daily-location-report',
          options: {
            hours: 9,
            timezone: 'America/Los_Angeles',
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
}

export const userWithNoPermissions = {
  application: '565fe59257c5d59e60cc35b8',
  email: 'testing@test.com',
  firstName: 'Testing',
  preferences: {
    notifications: {
      channels: [
        {
          enabled: true,
          name: 'daily-location-report',
          options: {
            hours: 9,
            timezone: 'America/Los_Angeles',
          },
        },
      ],
    },
  },
  permissions: [],
}

export const locations = [
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

export const shifts = [
  {
    _id: '5b480e6120d8f51322b0bfee',
    application: '565fe59257c5d59e60cc3123',
    user: '565fe59257c5d59e60cc0001',
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
          'activity-reports/565fe59257c5d59e60cc35b3/1999/12/1999-12-31-1548194730622.pdf',
        timestamp: new Date('2019-12-31T18:00:00Z'),
      },
    },
    location: null,
    duration: 9,
    createdAt: new Date('2019-12-30T18:00:00Z'),
  },
  {
    _id: '60082e79dc704419ac763517',
    user: '565fe59257c5d59e60cc0002',
    application: '565fe59257c5d59e60cc3123',
    start: {
      area: {
        location: {
          id: '565fe59257c5d59e60cc35b0',
        },
      },
      time: new Date('2019-12-30T18:00:00Z'),
    },
    end: {
      area: {
        location: {
          id: '565fe59257c5d59e60cc35b0',
        },
      },
      time: new Date('2019-12-30T18:00:00Z'),
    },
    files: {
      pdf: {
        path:
          'activity-reports/565fe59257c5d59e60cc35b3/1999/12/1999-12-31-1548194730622.pdf',
        timestamp: new Date('2019-12-31T18:00:00Z'),
      },
    },
    location: null,
    duration: 6,
    createdAt: new Date('2019-12-30T18:00:00Z'),
  },
  {
    _id: '60082e79dc704419ac763123',
    user: '565fe59257c5d59e60cc0003',
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
          'activity-reports/565fe59257c5d59e60cc35b3/1999/12/1999-12-31-1548194730622.pdf',
        timestamp: new Date('2019-12-31T18:00:00Z'),
      },
    },
    location: null,
    duration: 9,
    createdAt: new Date('2019-12-30T18:00:00Z'),
  },
]

export const legacyShifts = [
  {
    _id: '5b480e6120d8f51322b0bfed',
    application: '565fe59257c5d59e60cc3123',
    location: '565fe59257c5d59e60cc35b3',
    user: '565fe59257c5d59e60cc0001',
    start: {
      time: new Date('2019-12-30T18:00:00Z'),
    },
    end: {
      time: new Date('2019-12-30T18:00:00Z'),
    },
    files: {
      pdf: {
        path:
          'activity-reports/565fe59257c5d59e60cc35b3/1999/12/1999-12-31-1548194730622.pdf',
        timestamp: new Date('2019-12-31T18:00:00Z'),
      },
    },
    duration: 9,
    createdAt: new Date('2019-12-30T18:00:00Z'),
  },
  {
    _id: '60082e79dc704419ac763518',
    user: '565fe59257c5d59e60cc0002',
    application: '565fe59257c5d59e60cc3123',
    location: '565fe59257c5d59e60cc35b3',
    start: {
      time: new Date('2019-12-30T18:00:00Z'),
    },
    end: {
      time: new Date('2019-12-30T18:00:00Z'),
    },
    files: {
      pdf: {
        path:
          'activity-reports/565fe59257c5d59e60cc35b3/1999/12/1999-12-31-1548194730622.pdf',
        timestamp: new Date('2019-12-31T18:00:00Z'),
      },
    },
    duration: 6,
    createdAt: new Date('2019-12-30T18:00:00Z'),
  },
  {
    _id: '60082e79dc704419ac763124',
    user: '565fe59257c5d59e60cc0003',
    location: '565fe59257c5d59e60cc35b4',
    application: '565fe59257c5d59e60cc35b5',
    start: {
      time: new Date('2019-12-30T18:00:00Z'),
    },
    end: {
      time: new Date('2019-12-30T18:00:00Z'),
    },
    files: {
      pdf: {
        path:
          'activity-reports/565fe59257c5d59e60cc35b3/1999/12/1999-12-31-1548194730622.pdf',
        timestamp: new Date('2019-12-31T18:00:00Z'),
      },
    },
    duration: 9,
    createdAt: new Date('2019-12-30T18:00:00Z'),
  },
]
