"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const lodash_1 = require("lodash");
// NOTE This module is deprecated. Use the secrets module instead
function getAwsSecret(secretId, secretKey) {
    console.info('aws:get-secret', { secretId });
    if (!secretId) {
        return Promise.reject(new Error(`Missing required param: secretId:${secretId}`));
    }
    const region = process.env.AWS_REGION;
    const secretsClient = new aws_sdk_1.default.SecretsManager({ region });
    return secretsClient
        .getSecretValue({ SecretId: secretId })
        .promise()
        .then((payload) => {
        console.info('aws:get-secret:success', { secretId });
        const secret = parseSecretString(payload);
        // Return early if secretKey isn't defined (we want the full set of key/values)
        if (!secretKey)
            return secret;
        const secretValue = secret[secretKey];
        if (!secretValue) {
            throw new Error('Secret value could not be found');
        }
        return secretValue;
    })
        .catch(err => {
        throw new Error(`AWSSecretFetchError: ${err.code}, ${err.message}`);
    });
}
exports.getAwsSecret = getAwsSecret;
function parseSecretString(payload) {
    const secretString = payload.SecretString || '';
    const parsed = lodash_1.attempt(JSON.parse, secretString);
    return lodash_1.isError(parsed) ? {} : parsed;
}
exports.parseSecretString = parseSecretString;
//# sourceMappingURL=index.js.map