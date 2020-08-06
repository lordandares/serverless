import { mongo } from '@lighthouse/serverless-common'
import { getOr } from 'lodash/fp'

export default function parseWinTeamMessages(winteamResponse) {
  const messages = getOr([], 'Messages', winteamResponse)

  return messages.map(message => {
    const {
      _id = new mongo.ObjectId(),
      Id,
      IsGlobal,
      Message,
      Response1,
      Response2,
      Response1Id,
      Response2Id,
      PunchActionID,
    } = message

    return {
      _id,
      isGlobal: !!IsGlobal,
      message: Message,
      messageId: Id,
      punchActionId: PunchActionID,
      response1: Response1,
      response1Id: Response1Id,
      response2: Response2,
      response2Id: Response2Id,
    }
  })
}
