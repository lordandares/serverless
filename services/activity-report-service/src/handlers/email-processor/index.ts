import * as moment from 'moment-timezone'
import {
  compact,
  filter,
  find,
  flow,
  getOr,
  isEmpty,
  map,
  memoize,
  pick,
  some,
} from 'lodash/fp'

import { mongo } from '@lighthouse/serverless-common'

import { buildEmail } from '../../helpers/build-email'
import { fetchApplications } from '../../helpers/fetch-applications'
import { getUserDetails } from '../../helpers/get-user-details'
import { sendEmail } from '../../helpers/send-email'

import { User, UserDetails } from '../../helpers/get-user-details'
import { BuildEmail } from '../../helpers/build-email'

interface EventJson {
  body: object | string
}

interface Event {
  [key: string]: string
}

export interface Location {
  _id: string
  name: string
  files: object // TODO
  properties?: {
    area?: string
  }
}

export async function emailProcessor(event: Event | EventJson) {
  const isString = typeof event.body === 'string'
  const payload = isString ? JSON.parse(event.body as string) : event
  const datetime = payload.datetime ? new Date(payload.datetime) : new Date()

  console.info('fetch applications')

  const applications = await fetchApplications()
  const applicationIds = map('_id')(applications)

  const query = {
    application: {
      $in: applicationIds,
    },
    deleted: { $ne: true },
    'preferences.notifications.channels': {
      $elemMatch: {
        name: 'daily-location-report',
        // add notification type check, e.g. 'email'
        enabled: true,
      },
    },
  }

  const collection = await mongo.getCollection('applicationusers')

  console.info('fetch users', { query })
  const users: User[] = await collection.find(query).toArray()
  console.info('users with dar enabled', { count: users.length })

  const filteredUsers = filter((user: User) =>
    userMatchesTimezoneHour(user, datetime),
  )(users)

  console.info('filtered users with correct hour for timezone', {
    count: filteredUsers.length,
  })

  // NOTE We're memoizing the fetch location function _inline_ so that multiple
  // calls for this single run are cached, but the memoization is reset over
  // each individual lambda execution
  const mFetchApplicationLocations = memoize(fetchApplicationLocations)

  for (const user of filteredUsers) {
    try {
      const userDetails: UserDetails | undefined = await getUserDetails(user)

      if (!userDetails) continue

      const userLocations: Location[] = await getUserLocations({
        user,
        fetchLocationsFn: mFetchApplicationLocations,
      })

      const buildEmailOptions: BuildEmail = {
        ...userDetails,
        locations: userLocations,
      }

      const email = await buildEmail(buildEmailOptions)

      if (!email) continue

      await sendEmail(email)
    } catch (err) {
      console.error('EmailProcessorError', {
        err: err.message,
        stack: err.stack,
        userId: String(user._id),
      })

      // NOTE continue to next iteration so not to skip entire batch
      continue
    }
  }
}

export async function fetchApplicationLocations(
  application: string,
): Promise<Location[]> {
  const locationCollection = await mongo.getCollection('locations')

  return locationCollection
    .find({
      application: new mongo.ObjectId(application),
      deleted: { $ne: true },
    })
    .sort({ name: 1 })
    .toArray()
}

interface getUserLocations {
  user: User
  fetchLocationsFn: (application: string) => Promise<Location[]>
}

export async function getUserLocations(
  options: getUserLocations,
): Promise<Location[]> {
  const {
    user: { application, permissions },
    fetchLocationsFn,
  } = options

  const locations = await fetchLocationsFn(application)
  const locationPermissions = filter(isLocationPermission)(permissions)
  const hasAllLocationPermissions = isEmpty(locationPermissions)

  const userLocations: Location[] = flow(
    filter((doc: Location) => {
      if (hasAllLocationPermissions) {
        return true
      }

      return some((permission: any) => {
        const areaId = getOr('', 'properties.area', doc)
        const locationId = doc._id.toString()
        const hasPermission =
          permission.value === locationId ||
          permission.value === areaId.toString()
        return hasPermission
      })(locationPermissions)
    }),
    map(pick(['_id', 'files', 'name'])),
  )(locations)

  return userLocations
}

interface Permission {
  type: string
  module: string
  id: string
}

function isLocationPermission(doc: Permission): boolean {
  // NOTE users can have either location permissions
  // or area permissions, never both
  return (
    doc.type === 'document' &&
    (doc.module === 'area' || doc.module === 'location')
  )
}

export function userMatchesTimezoneHour(user: User, datetime: Date) {
  const channels = getOr([], 'preferences.notifications.channels', user)
  const darChannel = find(['name', 'daily-location-report'], channels)
  const options = darChannel && darChannel.options

  if (!options || !options.hours || !options.timezone) return false

  // NOTE: we must account for daylight saving time in all timezones so
  // check current hour value for user timezone and then ensure it
  // matches the hours set on the user
  const hourInTimezone = moment(datetime)
    .utc()
    .tz(options.timezone)
    .hours()

  if (options.hours !== hourInTimezone) return false

  return true
}
