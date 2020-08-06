import { createSnsEvent } from '../../../../../__test__/helpers'
import { deleteRuleHandler } from './deleteRuleHandler'

test('event error', async () => {
  expect.assertions(1)

  const result = await deleteRuleHandler(null)

  expect(result).toMatchInlineSnapshot(
    `[ApplicationError: DeleteRuleHandler: missing event]`,
  )
})

test('application error when id missing', async () => {
  expect.assertions(1)

  const result = await deleteRuleHandler(
    createSnsEvent({
      body: {
        // id: 'rule1',
      },
    }),
  )

  expect(result).toMatchInlineSnapshot(
    `[ApplicationError: The rule \`id\` of the resource to delete is missing]`,
  )
})

test('deletes and returns 204', async () => {
  expect.assertions(1)

  const result = await deleteRuleHandler(
    createSnsEvent({ body: { id: 'rule1' } }),
  )

  expect(result).toBeUndefined()
})
