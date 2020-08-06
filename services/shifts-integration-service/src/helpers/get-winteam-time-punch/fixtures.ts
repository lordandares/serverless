export const validAreaLocation = {
  _id: '5d5a3fabfc13ae07b7000000',
  application: '5d5a3fabfc13ae07b0000000',
  name: 'Valid Area Location',
  timezone: 'Australia/Melbourne',
}

export const validLegacyLocation = {
  _id: '5d5a3fabfc13ae07b7000001',
  name: 'Valid Legacy Location',
  geo: {
    coordinates: [-10, 10],
  },
  timezone: 'Australia/Melbourne',
}

export const standardUser = {
  _id: '5d5a3fabfc13ae07b7000002',
  email: 'valid-email-address',
  firstName: 'first-name',
  lastName: 'last-name',
  username: 'user-name',
}

export const winteamUser = {
  ...standardUser,
  plugins: {
    winteam: {
      options: {
        employeeId: 'wt-employee-id',
      },
    },
  },
}

export const activeShift = {
  application: '5d5a3fabfc13ae07b0000000',
  breaks: [],
  start: {
    gps: {
      geometry: [45, 60],
    },
    time: '2019-01-23T00:00:00.000Z',
  },
  user: standardUser._id,
}

export const activeShiftWithBreak = {
  application: '5d5a3fabfc13ae07b0000000',
  breaks: [
    {
      _id: 'break-id',
      end: {
        time: '2019-01-23T00:00:00.000Z',
      },
      start: {
        time: '2019-01-23T00:00:00.000Z',
      },
    },
  ],
  start: {
    gps: {
      geometry: [45, 60],
    },
    time: '2019-01-23T00:00:00.000Z',
  },
  user: standardUser._id,
}

export const endedShift = {
  application: '5d5a3fabfc13ae07b0000000',
  breaks: [],
  end: {
    gps: {
      geometry: [46, 61],
    },
    time: '2019-01-23T06:00:00.000Z',
  },
  start: {
    gps: {
      geometry: [45, 60],
    },
    time: '2019-01-23T00:00:00.000Z',
  },
  user: standardUser._id,
}
