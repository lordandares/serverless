import { compact, flow, getOr, map, sortBy } from 'lodash/fp'

export async function getFormS3Paths(data) {
  const { audits, issues, tasks } = data
  const entries = [...audits, ...issues, ...tasks]

  const formS3Paths = flow(
    sortBy('createdAt'),
    map(document => getOr(undefined, 'files.pdf.path', document)),
    compact,
  )(entries)

  return formS3Paths
}
