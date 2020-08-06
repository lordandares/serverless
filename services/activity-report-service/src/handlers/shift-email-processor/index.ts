import { mongo } from '@lighthouse/serverless-common'
import * as BPromise from 'bluebird'
import { compact, filter, find, getOr, map } from 'lodash/fp'
import * as moment from 'moment-timezone'
import { User } from '../../helpers/get-user-details'

import { buildShiftEmail } from '../../helpers/build-shift-email'
import { fetchApplications } from '../../helpers/fetch-applications'
import { getShiftDetails } from '../../helpers/get-shift-details'
import { sendEmail } from '../../helpers/send-email'

interface EventJson {
  body: object | string
}

interface Event {
  [key: string]: string
}

export async function shiftEmailProcessor(event: Event | EventJson) {
  const isString = typeof event.body === 'string'
  const payload = isString ? JSON.parse(event.body as string) : event
  const datetime = payload.datetime ? new Date(payload.datetime) : new Date()
  const applications = await fetchApplications()
  const applicationIds = map('_id')(applications)

  const query = {
    application: {
      $in: applicationIds,
    },
    deleted: { $ne: true },
    'preferences.notifications.channels': {
      $elemMatch: {
        name: 'daily-shift-report',
        enabled: true,
      },
    },
  }

  const collection = await mongo.getCollection('applicationusers')

  console.info('fetch users', { query })
  const users = await collection.find(query).toArray()
  console.info('users with daily shift report enabled', { count: users.length })

  const filteredUsers = filter(user => userMatchesTimezoneHour(user, datetime))(
    users,
  )
  console.info('filtered users with correct hour for timezone', {
    count: filteredUsers.length,
  })

  console.info('get user details')
  const userDetails = await BPromise.map(filteredUsers, user =>
    BPromise.delay(100).then(() => getShiftDetails({ user, datetime })),
  )

  console.info('build emails')
  const emails = await BPromise.map(compact(userDetails), user =>
    buildShiftEmail({ userDetails: user, datetime }),
  )

  console.info('send emails')
  const results = await BPromise.map(compact(emails), email => sendEmail(email))
  return results
}

export function userMatchesTimezoneHour(user: User, datetime: Date) {
  const channels = getOr([], 'preferences.notifications.channels', user)
  const dsrChannel = find(['name', 'daily-shift-report'], channels)
  const options = dsrChannel && dsrChannel.options

  if (!options || !options.hours || !options.timezone) return false

  const hourInTimezone = moment(datetime)
    .utc()
    .tz(options.timezone)
    .hours()

  if (options.hours !== hourInTimezone) return false

  return true
}
