import { fetchApplications } from './index'

jest.mock('@lighthouse/serverless-common', () => ({
  mongo: {
    getCollection: () =>
      Promise.resolve({
        find: () => ({
          toArray: () => [
            { _id: 'app1', name: 'Application 1' },
            { _id: 'app2', name: 'Application 2' },
          ],
        }),
      }),
  },
}))

describe('helpers:fetchApplications', () => {
  beforeEach(() => {
    process.env.MONGODB_SECRET_ID = 'lio/application/service/environment'
  })

  it('should fetch applications', done => {
    expect.assertions(1)

    process.env.MONGODB_SECRET_ID = 'lio/application/service/environment'

    fetchApplications().then(applications => {
      expect(applications).toEqual([
        { _id: 'app1', name: 'Application 1' },
        { _id: 'app2', name: 'Application 2' },
      ])

      done()
    })
  })
})
