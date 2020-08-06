export const STAGE = 'production'

export const active_link = {
  id: '565fe59257c5d59e60cc35a2',
  link: 'http://link.com',
}

export const inactive_link = {
  id: '565fe59257c5d59e60cc35a3',
  link: null,
}

export const long_active_links_1 = {
  id: '565fe59257c5d59e60cc35a6',
  link: 'http://link.com',
  fullName: 'Steeve Jobs',
  timestamp: null,
  lastName: 'Jobs',
}

export const long_active_links_2 = {
  id: '565fe59257c5d59e60cc35a6',
  link: 'http://link.com',
  fullName: 'John Doe',
  timestamp: null,
  lastName: 'Doe',
}

export const long_active_links_3 = {
  id: '565fe59257c5d59e60cc35a6',
  link: 'http://link.com',
  fullName: 'Paul Allen',
  timestamp: null,
  lastName: 'Allen',
}

export const formSubmission = {
  id: '565fe59257c5d59e60cc35a3',
  link:
    'activity-reports/shifts/565e42d3d4c628373ab25231/2019/10/10/2019-10-10-shift-5d9f83bd8bb82c0001cc20c3-summary-1570749390473.pdf',
}

export const withoutFormSubmission = {
  id: '565fe59257c5d59e60cc35a3',
  link:
    'activity-reports/shifts/565e42d3d4c628373ab25231/2019/10/10/2019-10-10-shift-5d9f83bd8bb82c0001cc20c3-summary-and-forms-1570749390473.pdf',
}

export const user_details_summary = {
  email: 'testing@test.com',
  firstName: 'Steve',
  shifts: [
    {
      _id: '565fe59257c5d59e60cc35a2',
    },
    {
      _id: '565fe59257c5d59e60cc35a3',
    },
  ],
  preferences: {
    notifications: {
      channels: [
        {
          enabled: true,
          name: 'daily-shift-report',
          options: {
            hours: 9,
            timezone: 'America/Los_Angeles',
            formSubmissions: false,
          },
        },
      ],
    },
  },
  timezone: 'America/Los_Angeles',
}

export const long_user_details_summary = {
  email: 'testing@test.com',
  firstName: 'Steve',
  shifts: [
    {
      _id: '565fe59257c5d59e60cc35a2',
    },
    {
      _id: '565fe59257c5d59e60cc35a6',
    },
    {
      _id: '565fe59257c5d59e60cc35a9',
    },
  ],
  preferences: {
    notifications: {
      channels: [
        {
          enabled: true,
          name: 'daily-shift-report',
          options: {
            hours: 9,
            timezone: 'America/Los_Angeles',
            formSubmissions: false,
          },
        },
      ],
    },
  },
  timezone: 'America/Los_Angeles',
}

export const user_details_summary_and_forms = {
  ...user_details_summary,
  preferences: {
    notifications: {
      channels: [
        {
          enabled: true,
          name: 'daily-shift-report',
          options: {
            hours: 9,
            timezone: 'America/Los_Angeles',
            formSubmissions: true,
          },
        },
      ],
    },
  },
}
