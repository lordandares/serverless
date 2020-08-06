import { find, getOr } from 'lodash/fp'

import { mongo } from '@lighthouse/serverless-common'

interface Application {
  name: string
}

interface NotificationChannel {
  enabled: boolean
  endpoints?: string[]
  name: string
  options: {
    timezone: string
    hours: number
  }
}

export interface UserDetails {
  applicationName: string
  email: string
  firstName: string
  lastName: string
  preferences?: {
    notifications: {
      channels: NotificationChannel[]
    }
  }
  timezone?: string
}

export interface User {
  _id: string
  application: string
  email: string
  lastName: string
  firstName: string
  preferences?: {
    notifications: {
      channels: NotificationChannel[]
    }
  }
  permissions: object[]
}

export async function getUserDetails(
  user: User,
): Promise<UserDetails | undefined> {
  try {
    const {
      application: applicationId,
      email,
      firstName,
      lastName,
      preferences,
    } = user

    const application = await fetchApplication(applicationId)

    const channels: NotificationChannel[] = getOr(
      [],
      'notifications.channels',
      preferences,
    )
    const darChannel: NotificationChannel | undefined = find(
      ['name', 'daily-location-report'],
      channels,
    )
    const timezone =
      darChannel && darChannel.options && darChannel.options.timezone

    return {
      applicationName: application.name,
      email,
      firstName,
      lastName,
      preferences,
      timezone,
    }
  } catch (error) {
    console.error('Error getting user details', { error, user })
    return undefined
  }
}

async function fetchApplication(applicationId: string): Promise<Application> {
  const applicationCollection = await mongo.getCollection('applications')

  const application = await applicationCollection.findOne({
    _id: new mongo.ObjectId(applicationId),
  })

  return application
}
