import { filter, flow, get, map, pick, some } from 'lodash/fp'

import { mongo } from '@lighthouse/serverless-common'
import { getUserDetails } from '../get-user-details'

export async function getShiftDetails({ user, datetime }) {
  try {
    const shifts = await getUserShifts({ user, datetime })
    const userDetails = await getUserDetails(user)

    return {
      ...userDetails,
      shifts,
    }
  } catch (error) {
    console.error('Error getting shift details', { error, user })
    return false
  }
}

async function getUserShifts({ user, datetime }) {
  const { application, permissions } = user

  const shiftCollection = await mongo.getCollection('shifts')
  const shifts = await fetchApplicationShifts({
    application,
    datetime,
    shiftCollection,
  })

  const locationPermissions = filter(isLocationPermission)(permissions)
  const locationIds = map('value')(locationPermissions)

  if (!locationIds.length) {
    return map(pick(['_id', 'files', 'user']))(shifts)
  }

  const shiftsWithPermissions = flow(
    filter((shift: any) => {
      const startLocationId = get('start.area.location.id', shift) || ''
      const endLocationId = get('end.area.location.id', shift) || ''
      const legacyLocationId = get('location', shift) || ''

      return some((locationId: any) => {
        const shiftMatchesLocation =
          locationId === startLocationId.toString() ||
          locationId === endLocationId.toString() ||
          locationId === legacyLocationId.toString()
        return shiftMatchesLocation
      })(locationIds)
    }),
    map(pick(['_id', 'files', 'user'])),
  )(shifts)

  return shiftsWithPermissions
}

function isLocationPermission(doc) {
  return (
    doc.type === 'document' &&
    (doc.module === 'area' || doc.module === 'location')
  )
}

function fetchApplicationShifts({ application, datetime, shiftCollection }) {
  const date = new Date(datetime)
  const startDay = date.setDate(date.getDate() - 2)

  return shiftCollection
    .find({
      application: new mongo.ObjectId(application),
      deleted: { $ne: true },
      'end.time': { $gte: new Date(startDay), $lt: new Date() },
    })
    .sort({ 'end.time': -1 })
    .toArray()
}
