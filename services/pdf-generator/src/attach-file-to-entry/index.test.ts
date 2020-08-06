import { mongo } from '@lighthouse/serverless-common'
import * as fn from './index'

const { attachFileToEntry, collectionMatcher, findAndUpdateDocument } = fn

const FIND_UPDATE_ERROR = /findAndUpdateDocument:/
const VALID_AWS_SECRET_ID = 'lio/serverless/dar-service/local'

mongo.createClient = jest.fn().mockResolvedValue({
  db: () => ({
    collection: () => ({
      findOneAndUpdate: jest.fn().mockResolvedValue({
        'files.pdf.path': 'folder/abc.pdf',
        'files.pdf.timestamp': 1234,
      }),
    }),
  }),
})

describe('pdf-generator :: attachFileToEntry', () => {
  describe('attachFileToEntry', () => {
    beforeEach(() => {
      process.env.AWS_SECRET_ID = 'lio/serverless/test/secret'
    })

    it('should resolve if applicationId is not defined', async () => {
      const result = {
        applicationId: '',
        entityId: '5c04afadfc13ae2ae5000001',
        filename: 'file.pdf',
        key: 'folder/file.pdf',
        type: 'audit',
        url: 'https://s3.co/bucket/folder/abc.pdf',
      }

      const response = await attachFileToEntry(result)

      expect(response).toBeUndefined()
    })

    it('should attach a file to the mongo document', async () => {
      const result = {
        applicationId: '5c04afadfc13ae2ae5000000',
        entityId: '5c04afadfc13ae2ae5000001',
        filename: 'abc.pdf',
        key: 'folder/abc.pdf',
        type: 'audit',
        url: 'https://s3.co/bucket/folder/abc.pdf',
      }

      const response = await attachFileToEntry(result)

      expect(response).toEqual({
        'files.pdf.path': 'folder/abc.pdf',
        'files.pdf.timestamp': 1234,
      })
    })
  })

  describe('collectionMatcher', () => {
    it('should return auditentries for events that match audits', () => {
      expect.assertions(1)

      const matched = collectionMatcher('audit-entry-new')

      expect(matched).toEqual('auditentries')
    })

    it('should return issues for events that match issues', () => {
      expect.assertions(1)

      const matched = collectionMatcher('issue-new')

      expect(matched).toEqual('issues')
    })

    it('should return taskentries for events that match tasks', () => {
      expect.assertions(1)

      const matched = collectionMatcher('task-entry-new')

      expect(matched).toEqual('taskentries')
    })

    it('should return null when the event does not match a collection', () => {
      expect.assertions(1)

      const matched = collectionMatcher('shift-start')

      expect(matched).toBeNull()
    })
  })

  describe('findAndUpdateDocument', () => {
    it('should error if AWS_SECRET_ID environment variable is missing', () => {
      expect.assertions(1)

      process.env.AWS_SECRET_ID = ''

      const document = {
        query: {
          _id: '5c04afadfc13ae2ae5000000',
          application: '5c04afadfc13ae2ae5000001',
        },
        type: 'audit',
        update: {
          $set: {
            'files.pdf.path': 'folder/abc.pdf',
            'files.pdf.timestamp': new Date(),
          },
        },
      }

      expect(() => findAndUpdateDocument(document)).toThrowError(
        FIND_UPDATE_ERROR,
      )
    })

    it('should error if query _id param is missing', () => {
      expect.assertions(1)

      process.env.AWS_SECRET_ID = VALID_AWS_SECRET_ID

      const document = {
        query: {
          _id: '',
          application: '5c04afadfc13ae2ae5000003',
        },
        type: 'audit',
        update: {
          $set: {
            'files.pdf.path': 'folder/abc.pdf',
            'files.pdf.timestamp': new Date(),
          },
        },
      }

      expect(() => findAndUpdateDocument(document)).toThrowError(
        FIND_UPDATE_ERROR,
      )
    })

    it('should error if query application param is missing', () => {
      expect.assertions(1)

      process.env.AWS_SECRET_ID = VALID_AWS_SECRET_ID

      const document = {
        query: {
          _id: '5c04afadfc13ae2ae5000004',
          application: '',
        },
        type: 'audit',
        update: {
          $set: {
            'files.pdf.path': 'folder/abc.pdf',
            'files.pdf.timestamp': new Date(),
          },
        },
      }

      expect(() => findAndUpdateDocument(document)).toThrowError(
        FIND_UPDATE_ERROR,
      )
    })

    it('should error if a collection cannot be matched', () => {
      expect.assertions(1)

      process.env.AWS_SECRET_ID = VALID_AWS_SECRET_ID

      const document = {
        query: {
          _id: '5c04afadfc13ae2ae5000005',
          application: '5c04afadfc13ae2ae5000006',
        },
        type: 'shift-new',
        update: {
          $set: {
            'files.pdf.path': 'folder/abc.pdf',
            'files.pdf.timestamp': new Date(),
          },
        },
      }

      expect(() => findAndUpdateDocument(document)).toThrowError(
        FIND_UPDATE_ERROR,
      )
    })

    it('should successfully find and update a document', done => {
      expect.assertions(1)

      process.env.AWS_SECRET_ID = VALID_AWS_SECRET_ID

      const document = {
        query: {
          _id: '5c04afadfc13ae2ae5000005',
          application: '5c04afadfc13ae2ae5000006',
        },
        type: 'audit-entry-new',
        update: {
          $set: {
            'files.pdf.path': 'folder/abc.pdf',
            'files.pdf.timestamp': new Date(),
          },
        },
      }

      findAndUpdateDocument(document).then(response => {
        expect(response).toEqual({
          'files.pdf.path': 'folder/abc.pdf',
          'files.pdf.timestamp': 1234,
        })

        done()
      })
    })
  })
})
