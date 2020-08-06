import { mongo } from '@lighthouse/serverless-common'

export async function getApplication({ db, applicationId }) {
  console.info('getApplication')

  const application = await db
    .collection('applications')
    .findOne({ _id: new mongo.ObjectId(applicationId) })

  return application
}

export async function getEntries({
  applicationId,
  collection,
  db,
  end,
  start,
  userId,
}) {
  console.info('getEntries', { collection })

  const query = {
    application: new mongo.ObjectId(applicationId),
    createdAt: {
      $gte: new Date(start),
      $lte: new Date(end),
    },
    user: new mongo.ObjectId(userId),
  }

  console.info('getEntries query', { query: JSON.stringify(query) })

  const data = await db
    .collection(collection)
    .find(query)
    .toArray()

  return data
}

export async function getEvents({ db, applicationId, end, start, userId }) {
  console.info('getEvents')

  const query = {
    application: new mongo.ObjectId(applicationId),
    timestamp: {
      $gte: new Date(start),
      $lte: new Date(end),
    },
    type: 'enter',
    user: new mongo.ObjectId(userId),
  }

  console.info('getEvents query', { query: JSON.stringify(query) })

  const data = await db
    .collection('events')
    .find(query)
    .toArray()

  return data
}

export async function getLocation({ db, locationId }) {
  console.info('getLocation')
  const location = await db
    .collection('locations')
    .findOne({ _id: new mongo.ObjectId(locationId) })

  if (!location) {
    throw new Error(`Location missing: ${locationId}`)
  }
  if (!location.timezone) {
    throw new Error(`Location missing timezone: ${locationId}`)
  }

  return location
}

export async function getLocations({ db, applicationId }) {
  console.info('getLocations')

  const locations = await db
    .collection('locations')
    .find({ application: new mongo.ObjectId(applicationId) })
    .toArray()

  return locations
}

export async function getShift({ db, shiftId }) {
  console.info('getShift')
  const shift = await db
    .collection('shifts')
    .findOne({ _id: new mongo.ObjectId(shiftId) })

  if (!shift) {
    throw new Error(`Shift missing: ${shiftId}`)
  }

  return shift
}

export async function getUser({ db, userId }) {
  console.info('getUser')
  const user = await db
    .collection('users')
    .findOne({ _id: new mongo.ObjectId(userId) })

  if (!user) {
    throw new Error(`User missing: ${userId}`)
  }

  return user
}

export async function getZones({ db, applicationId }) {
  console.info('getZones')

  const zones = await db
    .collection('zones')
    .find({ application: new mongo.ObjectId(applicationId) })
    .toArray()

  return zones
}
