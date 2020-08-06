import * as BPromise from 'bluebird'
import {
  filter,
  find,
  flow,
  get,
  getOr,
  isEmpty,
  reject,
  toUpper,
  trim,
} from 'lodash/fp'
import * as moment from 'moment-timezone'

interface Env {
  env: {
    STAGE: string
    SES_CONFIGURATION_SET_NAME: string
  }
}

declare var process: Env

import { Location } from '../../handlers/email-processor'
import { getLocationReportLinks } from '../get-location-report-links'
import { UserDetails } from '../get-user-details'

const getFormSubmissionOption = flow(
  get('notifications.channels'),
  find({ name: 'daily-location-report' }),
  getOr(true, 'options.formSubmissions'),
)

const getNoActivityOption = flow(
  get('notifications.channels'),
  find({ name: 'daily-location-report' }),
  getOr(false, 'options.skipNoActivity'),
)

export interface BuildEmail extends UserDetails {
  locations: Location[]
}

export async function buildEmail(options: BuildEmail) {
  try {
    const {
      applicationName,
      email,
      firstName,
      locations,
      preferences,
      timezone,
    } = options

    const isProduction = process.env.STAGE === 'production'
    const stage = toUpper(process.env.STAGE)
    const template = isProduction
      ? 'daily-location-reports'
      : 'daily-location-reports-test'

    const ConfigurationSetName = process.env.SES_CONFIGURATION_SET_NAME

    const mStartDate = moment()
      .utc()
      .tz(timezone)
      .subtract(1, 'day')

    const dateText = mStartDate.format('dddd Do MMMM')
    const shortDateText = mStartDate.format('MMMM D')

    const withFormSubmissions = getFormSubmissionOption(preferences)
    const skipNoActivity = getNoActivityOption(preferences)

    const links = await BPromise.map(locations, location =>
      getLocationReportLinks({
        location,
        withFormSubmissions,
      }),
    )

    const activeLocations = filter('link')(links)
    const inactiveLocations = reject('link')(links)

    const hasNoLocations =
      isEmpty(activeLocations) && isEmpty(inactiveLocations)

    if (
      isEmpty(activeLocations) &&
      !isEmpty(inactiveLocations) && skipNoActivity
    ) {
      console.info('skipping activity report', {
        activeLocations: activeLocations.length,
        inactiveLocations: inactiveLocations.length,
        skipNoActivity,
      })
      return false
    }

    const name = trim(firstName)

    const data = JSON.stringify({
      activeLocations,
      applicationName,
      date: dateText,
      hasNoLocations,
      inactiveLocations,
      isProduction,
      name,
      sendInactive: !skipNoActivity,
      shortDate: shortDateText,
      stage,
    })

    return {
      ...(ConfigurationSetName && { ConfigurationSetName }),
      Destination: {
        CcAddresses: [],
        ToAddresses: [email],
      },
      ReplyToAddresses: ['notifications@lighthouse.io'],
      Source: 'notifications@lighthouse.io',
      Template: template,
      TemplateData: data,
    }
  } catch (error) {
    console.error('Error building email', { error, options })
    return false
  }
}
