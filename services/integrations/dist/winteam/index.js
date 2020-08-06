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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const serverless_common_1 = require("@lighthouse/serverless-common");
const fp_1 = require("lodash/fp");
const helpers = __importStar(require("./helpers"));
exports.helpers = helpers;
function request(application, params) {
    return __awaiter(this, void 0, void 0, function* () {
        const { _id: applicationId } = application;
        const { endpoint, message: body, method = 'POST' } = params;
        const baseSecretsId = process.env.WINTEAM_SECRET_ID;
        if (!applicationId || !baseSecretsId) {
            throw new Error(`WinteamRequest: missing required values applicationId:${applicationId} / WINTEAM_SECRET_ID:${baseSecretsId}`);
        }
        // TODO update to use shared secrets module
        const awsSecrets = yield serverless_common_1.AWS.getAwsSecret(baseSecretsId);
        if (fp_1.isEmpty(awsSecrets)) {
            throw new Error('WinteamRequest: AWS secret does not contain any values');
        }
        const tenantIdPath = `TENANT_ID_${applicationId}`;
        const baseUrl = awsSecrets.WINTEAM_BASE_URL;
        const subscriptionKey = awsSecrets.WINTEAM_SUBSCRIPTION_KEY;
        const tenantId = awsSecrets[tenantIdPath];
        if (!baseUrl || !subscriptionKey || !tenantId) {
            console.info('WinteamRequest: Missing required params', {
                baseUrl,
                subscriptionKey,
                tenantId,
            });
            throw new Error('WinteamRequest: Missing required params');
        }
        const payload = {
            baseUrl,
            body,
            endpoint,
            headers: {
                subscriptionKey,
                tenantId,
            },
            method: method.toUpperCase(),
        };
        const response = yield helpers.winteamRequest(payload);
        return response;
    });
}
exports.request = request;
//# sourceMappingURL=index.js.map