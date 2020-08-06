import * as crypto from 'crypto'

export function verifySignature({ body, secret, signature }) {
  const hmac = crypto.createHmac('sha1', secret)
  const digest = 'sha1=' + hmac.update(body).digest('hex')

  return signature === digest
}

export default verifySignature
