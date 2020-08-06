import { api, mongo, schemas, secrets } from '@lighthouse/serverless-common'

import { get } from 'lodash/fp'

enum Env {
  LIGHTHOUSE_BASE_URL = 'LIGHTHOUSE_BASE_URL',
  AZURE_KEY_VAULT = 'AZURE_KEY_VAULT',
  LIGHTHOUSE_API_SECRET = 'LIGHTHOUSE_API_SECRET',
}

interface ProcessEnv {
  env: { [env in Env]: string }
}

declare var process: ProcessEnv

export enum CreateUserStrategies {
  ResetOnNextLogin = 'via-password',
}

interface CreateUserPayload {
  email: string
  firstName: string
  lastName: string
  password: string
  username: string
  role: mongo.ObjectId
  type: CreateUserStrategies
  plugins: object
  auth: object
  preferences: object
}

// move to common schema?
export interface WinteamEmployee {
  EmployeeID: string
  EmployeeNumber: string
  FirstName: string
  LastName: string
  EmailAddress: string
}

interface Options {
  application: schemas.ApplicationSchema
  employee: WinteamEmployee
}

export interface Result {
  type: string
  data: object
}

export async function upsertUser(options: Options): Promise<Result | Error> {
  try {
    const { application, employee } = options

    assertEnv()

    if (!employee) {
      throw handleError('InputError: Missing "employee" option', {
        options,
      })
    }

    if (!application) {
      throw handleError('InputError: Missing "application" option', {
        options,
      })
    }

    const applicationId = application._id
    const defaultRole = get('settings.roles.default', application)
    const { EmailAddress, EmployeeNumber, FirstName, LastName } = employee

    if (!defaultRole) {
      throw new Error(
        'DefaultRoleError: Application must have a default role setting',
      )
    }

    const applicationUserCollection = await mongo.getCollection(
      'applicationusers',
    )

    const applicationUser = await applicationUserCollection.findOne({
      application: applicationId,
      $and: [
        { 'plugins.winteam.options.employeeNumber': EmployeeNumber },
        { deleted: false },
      ],
    })

    //if the application user was not found, let's check with the first name, last name, specific to apg
    let applicationUserRetry = null

    const authorization = await secrets.getSecret(
      process.env.AZURE_KEY_VAULT,
      'LIGHTHOUSE-API-SECRET',
    )
    const apiClient = api.createClient()
    const usersBaseUrl = `${
      process.env.LIGHTHOUSE_BASE_URL
    }/applications/${applicationId}/users`

    if (applicationUser) {
      // TODO define update fields
      const payload = {
        email: EmailAddress,
        firstName: FirstName,
        lastName: LastName,
        plugins: {
          // the winteam object is removed if it is not present on the update process
          winteam: {
            options: {
              employeeNumber: EmployeeNumber,
            },
            enabled: true,
          },
        },
      }

      const updatedUser = await apiClient.put(
        `${usersBaseUrl}/${applicationUser._id}`,
        {
          body: payload,
          headers: {
            authorization,
          },
        },
      )
      if (updatedUser.error) {
        const error = updatedUser.error
        throw new Error(
          `ApplicationUserUpdateError: ${error.code}, ${error.message}`,
        )
      }

      const result = {
        data: {
          id: updatedUser._id,
        },
        type: 'update',
      }

      console.info('upsertUser[Update]: success', result, updatedUser)

      return result
    }

    const payload: CreateUserPayload = {
      firstName: FirstName,
      lastName: LastName,
      plugins: {
        winteam: {
          options: {
            employeeNumber: EmployeeNumber,
          },
          enabled: true,
        },
      },
      email: EmailAddress,
      username: EmployeeNumber,
      auth: {},
      role: new mongo.ObjectId(defaultRole),
      password: `team${EmployeeNumber}`,
      preferences: {},
      type: CreateUserStrategies.ResetOnNextLogin,
    }

    const newUser = await apiClient.put(usersBaseUrl, {
      body: payload,
      headers: {
        authorization,
      },
    })

    if (newUser.error) {
      const error = newUser.error
      throw new Error(
        `ApplicationUserCreateError: ${error.code}, ${error.message}`,
      )
    }

    const result = {
      data: {
        id: newUser._id,
      },
      type: 'new',
    }

    console.info('upsertUser[Create]:  success', result, newUser)

    return result
  } catch (err) {
    console.error(err)
    throw err
  }
}

function assertEnv() {
  for (const env in Env) {
    if (!process.env[env]) {
      throw handleError(`ConfigurationError: Missing env '${env}'`)
    }
  }
}

function handleError(message: string, data?: object): Error {
  const err = new Error(message)

  console.error(`upsertUserError: ${message}`, {
    err,
    ...data,
  })

  return err
}
