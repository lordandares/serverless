"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const identity_1 = require("@azure/identity");
const keyvault_secrets_1 = require("@azure/keyvault-secrets");
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const lodash_1 = require("lodash");
// TODO move up if shared in future
var Platforms;
(function (Platforms) {
    Platforms["AWS"] = "AWS";
    Platforms["AZURE"] = "AZURE";
})(Platforms || (Platforms = {}));
const strategies = {
    [Platforms.AWS]: getAwsSecret,
    [Platforms.AZURE]: getAzureSecret,
};
function getSecret(secretId, secretKey) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!secretId) {
            throw new Error(`Missing required param: secretId`);
        }
        const { PLATFORM } = process.env;
        const getSecretFn = strategies[PLATFORM];
        if (!getSecretFn) {
            throw new Error(`Could not determine strategy for getSecretFn: PLATFORM: ${PLATFORM}`);
        }
        return yield getSecretFn(secretId, secretKey);
    });
}
exports.getSecret = getSecret;
function getAwsSecret(secretId, secretKey) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const region = process.env.AWS_REGION;
            const secretsClient = new aws_sdk_1.default.SecretsManager({ region });
            const secretPayload = yield secretsClient
                .getSecretValue({ SecretId: secretId })
                .promise();
            const secret = parseSecretString(secretPayload);
            // Return early if secretKey isn't defined (we want the full set of key/values)
            if (!secretKey) {
                return secret;
            }
            const secretValue = secret[secretKey];
            if (!secretValue) {
                throw new Error('Secret value could not be found');
            }
            return secretValue;
        }
        catch (err) {
            throw new Error(`AwsGetSecretError: ${err.code}, ${err.message}`);
        }
    });
}
function getAzureSecret(secretVault, secretId) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!secretId) {
            throw new Error('Missing required secretId');
        }
        try {
            const credential = new identity_1.EnvironmentCredential();
            const url = `https://${secretVault}.vault.azure.net`;
            const client = new keyvault_secrets_1.SecretsClient(url, credential);
            const secret = yield client.getSecret(secretId);
            if (!secret) {
                throw new Error('Secret value could not be found');
            }
            return secret.value;
        }
        catch (err) {
            throw new Error(`AzureGetSecretError: ${err.code}, ${err.message}`);
        }
    });
}
function parseSecretString(payload) {
    const secretString = payload.SecretString || '';
    const parsed = lodash_1.attempt(JSON.parse, secretString);
    return lodash_1.isError(parsed) ? {} : parsed;
}
exports.parseSecretString = parseSecretString;
//# sourceMappingURL=secrets.js.map