export const payload = {
  shiftId: '5c18e2d030148e00017e9bdf',
}

export const secretId = 'lio/serverless/dar-service/secretId'

export const application = '5bff0da28d7c870001a01639'

export const audits = [
  {
    _id: '5bf73690dba3c200011dd416',
    createdAt: '2019-09-19T18:06:56.477+0000',
    title: 'Health and Safety',
    zone: '5bb7d1c618c1bb0001e8000a',
  },
  {
    _id: '5bf73690dba3c200011dd417',
    createdAt: '2019-09-19T19:07:56.477+0000',
    title: 'Medical First Aid Kits',
    area: {
      label: 'Emergency Room',
    },
  },
  {
    _id: '5bf73690dba3c200011dd418',
    createdAt: '2019-09-19T20:08:56.477+0000',
    title: 'Trip Hazards',
    gps: {
      reverseGeocoded: {
        label: 'Broadway, NYC, New York',
      },
    },
  },
]

export const events = [
  {
    _id: '5bf739c4dba3c200011de26c',
    timestamp: '2019-09-19T11:45:00.000+0000',
    zone: '5bb7d1c618c1bb0001e8000b',
    type: 'enter',
  },
  {
    _id: '5bf739c4dba3c200011de26d',
    timestamp: '2019-09-19T11:50:00.000+0000',
    zone: '5bb7d1c618c1bb0001e8000b',
    type: 'enter',
  },
  {
    _id: '5bf739c4dba3c200011de26e',
    timestamp: '2019-09-19T12:15:00.000+0000',
    zone: '5bb7d1c618c1bb0001e8000b',
    type: 'enter',
  },
  {
    _id: '5bf739c4dba3c200011de26g',
    geometryReverseGeocoded: {
      label: 'Broadway, NYC, New York',
    },
    timestamp: '2019-09-19T12:15:30.000+0000',
    type: 'geo',
    zone: undefined,
  },
]

export const issues = [
  {
    _id: '5bf73690dba3c200011dd416',
    createdAt: '2019-09-19T22:06:56.477+0000',
    entry: {
      summaryFields: [
        {
          fieldtype: 'text',
          label: 'Activity Type',
          value: 'Parking Area Check',
        },
        {
          fieldtype: 'text',
          label: 'Activity Details',
          value:
            'Officer Blake: Darcars College Park Nissan is officially safe and secured, no problems in disturbances or incidents, site is complete.',
        },
        {
          fieldtype: 'list',
          label: 'Photo',
          options: { type: 'media' },
          value: [
            '59e836b04260960f86301471/324873FE-ABE5-4795-9187-ED2DB3F34BA8-6B7DDF4A-8E8A-4DD9-AE54-E8CCAA53B23A.jpg',
            '59e836b04260960f86301471/324873FE-ABE5-4795-9187-ED2DB3F34BA8-95474B07-5826-4AA5-B4B7-1CEF2F533F20.jpg',
            '59e836b04260960f86301471/324873FE-ABE5-4795-9187-ED2DB3F34BA8-E4E8AB2D-A3F1-462A-98ED-C3106C975A31.jpg',
            '59e836b04260960f86301471/324873FE-ABE5-4795-9187-ED2DB3F34BA8-9E78D6B0-BDC9-427D-942A-E6D5CB0466C5.jpg',
          ],
        },
        {
          fieldtype: 'text',
          label: 'Activity Type',
          value: 'Parking Area Check Backyard',
        },
        {
          fieldtype: 'text',
          label: 'Activity Details',
          value:
            'Officer Blake: Darcars College Backyard is officially safe and secured.',
        },
        {
          fieldtype: 'list',
          label: 'Photo',
          options: { type: 'media' },
          value: [],
        },
      ],
    },
    title: 'Incident Report (Internal Patrols)',
    zone: '5bb7d1c618c1bb0001e8000b',
  },
  {
    _id: '5bf73690dba3c200011dd419',
    createdAt: '2019-09-19T23:09:56.477+0000',
    entry: {
      summaryFields: [
        {
          fieldtype: 'text',
          label: 'Activity Type',
          value: 'Building Area Check',
        },
        {
          fieldtype: 'text',
          label: 'Activity Details',
          value: 'Building patrol monitoring at Empire State.',
        },
      ],
    },
    gps: {
      reverseGeocoded: {
        label: 'Empire State, NYC, New York',
      },
    },
    title: 'Building Patrol',
  },
]

export const location = {
  _id: '5bf73690dba3c200011dd888',
  application: '5bff0da28d7c870001a01639',
  name: 'Testing Location',
  timezone: 'America/La_Paz',
}

export const locations = [
  {
    _id: '5bf73690dba3c200011dd888',
    name: 'Lighthouse Collingwood',
  },
]

export const locationWithArea = {
  ...location,
  properties: {
    area: '5bff0da28d7c870001a01639',
  },
}

export const area = {
  _id: locationWithArea.properties.area,
  geometry: {
    coordinates: [
      [
        [144.98665809631345, -37.79712984141311],
        [144.98663127422333, -37.79726760509564],
        [144.98681366443634, -37.79729303836279],
        [144.9868431687355, -37.797148916399856],
        [144.98665809631345, -37.79712984141311],
      ],
    ],
    type: 'Polygon',
  },
}

export const tasks = [
  {
    _id: '5bf73690dba3c200011dd416',
    createdAt: '2019-09-19T10:06:56.477+0000',
    entry: {
      summaryFields: [
        {
          fieldtype: 'text',
          label: 'Activity Type',
          value: 'Shopping Area Check',
        },
        {
          fieldtype: 'text',
          label: 'Activity Details',
          value:
            'Shopping patrol monitoring at Walmart. No suspicious behavior to report.',
        },
        {
          fieldtype: 'list',
          label: 'Photo',
          options: { type: 'media' },
          value: [
            '59e836b04260960f86301471/324873FE-ABE5-4795-9187-ED2DB3F34BA8-6B7DDF4A-8E8A-4DD9-AE54-E8CCAA53B23A.jpg',
          ],
        },
        {
          fieldtype: 'text',
          label: 'Activity Type',
          value: 'Parking Area Check',
        },
        {
          fieldtype: 'text',
          label: 'Activity Details',
          value:
            'Shopping patrol monitoring at Walmart Parking. No suspicious behavior to report.',
        },
        {
          fieldtype: 'list',
          label: 'Photo',
          options: { type: 'media' },
          value: [],
        },
      ],
    },
    title: 'Clean Office',
    zone: '5bb7d1c618c1bb0001e8000b',
  },
]

export const timestamp = '2019-09-19T20:30:00.000+0000'
export const timezone = 'America/La_Paz'

export const settings = {
  awsS3BaseUrl: 'https://uploads-lighthouse-io.s3.amazonaws.com',
  cloudinaryBaseUrl: 'https://res.cloudinary.com/lighthouseio/image/fetch',
}

export const user = {
  _id: '5bb7d1c618c1bb0001e8028a',
  firstName: 'John',
  lastName: 'Doe',
}

export const zones = [
  {
    _id: '5bb7d1c618c1bb0001e8000a',
    name: 'Blue Hill Command Center',
  },
  {
    _id: '5bb7d1c618c1bb0001e8000b',
    name: 'Under Armour',
  },
]

export const shift = {
  _id: '5c18e2d030148e00017e9bdf',
  breaks: [
    {
      end: {
        time: '2019-09-19T15:00:00.000+0000',
        zone: '5bb7d1c618c1bb0001e8000a',
      },
      start: {
        time: '2019-09-19T14:40:00.000+0000',
        zone: '5bb7d1c618c1bb0001e8000a',
      },
    },
    {
      end: {
        time: '2019-09-19T17:30:00.000+0000',
        zone: '5bb7d1c618c1bb0001e8000a',
      },
      start: {
        time: '2019-09-19T17:00:00.000+0000',
        zone: '5bb7d1c618c1bb0001e8000a',
      },
    },
  ],
  duration: 30000000,
  end: {
    time: '2019-09-19T20:00:00.000+0000',
    zone: '5bb7d1c618c1bb0001e8000a',
  },
  start: {
    time: '2019-09-19T14:00:00.000+0000',
    zone: '5bb7d1c618c1bb0001e8000b',
  },
  user: '5bb7d1c618c1bb0001e8028a',
}
