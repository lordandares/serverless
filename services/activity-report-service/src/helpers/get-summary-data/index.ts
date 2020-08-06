import { mongo } from '@lighthouse/serverless-common'
import { map } from 'lodash/fp'

interface Env {
  env: {
    MONGODB_SECRET_ID: string
  }
}

declare var process: Env

export async function getSummaryData(payload) {
  const { end, locationId, start } = payload

  if (!end || !locationId || !start) {
    throw new Error('Missing required params')
  }

  console.info('connecting to mongo...')

  const secretId = process.env.MONGODB_SECRET_ID
  const client = await mongo.createClient(secretId)
  const db = client.db()

  console.info('connected to mongo')

  const location = await getLocation({ db, locationId })
  const locations = await getLocations({ db, location })
  const application = await getApplication({ db, location })
  const applicationUsers = await getApplicationUsers({ db, location })
  const area = await getArea({ db, location })
  const audits = await getEntries({
    area,
    collection: 'auditentries',
    db,
    end,
    location,
    start,
  })

  const events = await getEvents({ /*area,*/ db, location, start, end })
  const issues = await getEntries({
    area,
    collection: 'issues',
    db,
    end,
    location,
    start,
  })
  const tasks = await getEntries({
    area,
    collection: 'taskentries',
    db,
    end,
    location,
    start,
  })
  const zones = await getZones({ db, location })

  const users = await getUsers({ db, applicationUsers })

  return {
    application,
    audits,
    end,
    events,
    issues,
    location,
    locations,
    start,
    tasks,
    timestamp: start,
    timezone: location.timezone,
    users,
    zones,
  }
}

async function getApplication({ db, location }) {
  console.info('getApplication')
  const { application: applicationId } = location

  const application = await db
    .collection('applications')
    .findOne({ _id: new mongo.ObjectId(applicationId) })

  return application
}

async function getApplicationUsers({ db, location }) {
  console.info('getApplicationUsers')
  const { application: applicationId } = location

  const applicationUsers = await db
    .collection('applicationusers')
    .find({ application: new mongo.ObjectId(applicationId) })
    .toArray()

  return applicationUsers
}

async function getArea({ db, location }) {
  console.info('getArea')
  const {
    _id: locationId,
    application: applicationId,
    properties = {},
  } = location

  if (!properties.area) {
    console.info(`Location missing properties.area: ${locationId}`)
    return
  }

  const area = await db.collection('areas').findOne({
    _id: new mongo.ObjectId(properties.area),
    application: new mongo.ObjectId(applicationId),
    deleted: false,
  })

  return area
}

async function getEntries({ area, collection, db, end, location, start }) {
  console.info('getEntries', { collection })
  const { _id: locationId, application: applicationId } = location

  const locationQuery = {
    application: new mongo.ObjectId(applicationId),
    createdAt: {
      $gte: new Date(start),
      $lte: new Date(end),
    },
    location: new mongo.ObjectId(locationId),
  }

  const hasArea = area && area.geometry
  const areaQuery = hasArea && {
    application: new mongo.ObjectId(applicationId),
    createdAt: {
      $gte: new Date(start),
      $lte: new Date(end),
    },
    'gps.geometry': {
      $geoWithin: {
        $geometry: area && area.geometry,
      },
    },
    location: null,
  }

  const query = hasArea ? { $or: [areaQuery, locationQuery] } : locationQuery
  console.info('getEntries query', { query: JSON.stringify(query) })

  const data = await db
    .collection(collection)
    .find(query)
    .toArray()

  return data
}

async function getEvents({ /*area,*/ db, end, location, start }) {
  console.info('getEvents')
  const { _id: locationId, application: applicationId } = location

  const locationQuery = {
    application: new mongo.ObjectId(applicationId),
    timestamp: {
      $gte: new Date(start),
      $lte: new Date(end),
    },
    location: new mongo.ObjectId(locationId),
    type: 'enter',
  }

  //const hasArea = area && area.geometry
  //const areaQuery = hasArea && {
  //  application: new mongo.ObjectId(applicationId),
  //  geo: {
  //    $geoWithin: {
  //      $geometry: area.geometry,
  //    },
  //  },
  //  timestamp: {
  //    $gte: new Date(start),
  //    $lte: new Date(end),
  //  },
  //  type: 'geo',
  //}

  //const query = hasArea ? { $or: [areaQuery, locationQuery] } : locationQuery
  const query = locationQuery
  console.info('getEvents query', { query: JSON.stringify(query) })

  const data = await db
    .collection('events')
    .find(query)
    .toArray()

  return data
}

async function getLocation({ db, locationId }) {
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

async function getLocations({ db, location }) {
  console.info('getLocations')
  const { application: applicationId } = location

  const locations = await db
    .collection('locations')
    .find({ application: new mongo.ObjectId(applicationId) })
    .toArray()

  return locations
}

async function getUsers({ db, applicationUsers }) {
  console.info('getUsers')
  // TODO add type for application users
  const userIds = map((doc: any) => doc.user)(applicationUsers)

  const conditions = { _id: { $in: userIds } }
  const options = {
    projection: {
      firstName: 1,
      lastName: 1,
    },
  }
  const users = await db
    .collection('users')
    .find(conditions, options)
    .toArray()

  return users
}

async function getZones({ db, location }) {
  console.info('getZones')
  const { _id: locationId, application: applicationId } = location

  const zones = await db
    .collection('zones')
    .find({
      application: new mongo.ObjectId(applicationId),
      location: new mongo.ObjectId(locationId),
    })
    .toArray()

  return zones
}
