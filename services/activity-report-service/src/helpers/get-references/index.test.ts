import { getFormS3Paths } from './'

describe('helpers:getReferences', () => {
  const MOCK_DATA = {
    audits: [
      {
        createdAt: '2000-01-01T15:00:00.000Z',
        files: {
          pdf: {
            path: '123456789/pdfs/2018-11-26/1543450822683-audit-12345.pdf',
          },
        },
      },
    ],
    issues: [
      {
        createdAt: '2000-01-01T16:00:00.000Z',
        files: {
          pdf: {
            path: '123456789/pdfs/2018-11-26/1543450822683-issue-12345.pdf',
          },
        },
      },
    ],
    tasks: [
      {
        createdAt: '2000-01-01T09:00:00.000Z',
        files: {
          pdf: {
            path: '123456789/pdfs/2018-11-26/1543450822683-tasks-12345.pdf',
          },
        },
      },
    ],
  }

  afterEach(() => jest.clearAllMocks())

  it('returns sorted references', async () => {
    const formS3Paths = await getFormS3Paths(MOCK_DATA)

    expect(formS3Paths).toEqual([
      '123456789/pdfs/2018-11-26/1543450822683-tasks-12345.pdf',
      '123456789/pdfs/2018-11-26/1543450822683-audit-12345.pdf',
      '123456789/pdfs/2018-11-26/1543450822683-issue-12345.pdf',
    ])
  })

  it('removes pdfs with no file pdf path', async () => {
    const formS3Paths = await getFormS3Paths({
      ...MOCK_DATA,
      tasks: [
        {
          createdAt: '2000-01-01T09:00:00.000Z',
          files: { pdf: {} },
        },
        {
          createdAt: '2000-01-01T09:00:00.000Z',
        },
      ],
    })

    expect(formS3Paths).toEqual([
      '123456789/pdfs/2018-11-26/1543450822683-audit-12345.pdf',
      '123456789/pdfs/2018-11-26/1543450822683-issue-12345.pdf',
    ])
  })
})
