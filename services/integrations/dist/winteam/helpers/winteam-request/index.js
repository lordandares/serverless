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
const fp_1 = require("lodash/fp");
const node_fetch_1 = __importDefault(require("node-fetch"));
const genericError = {
    Errors: [
        {
            FieldName: '',
            AttemptedValue: '',
            ErrorMessage: 'Punch rejected.  Please contact your supervisor',
            ErrorType: 'BadRequest',
        },
    ],
    Result: null,
};
const requiredFields = [
    'baseUrl',
    'endpoint',
    'subscriptionKey',
    'tenantId',
];
function winteamRequest(request) {
    return __awaiter(this, void 0, void 0, function* () {
        const { baseUrl, body, endpoint, headers, method } = request;
        const { subscriptionKey, tenantId } = headers;
        const options = {
            baseUrl,
            endpoint,
            subscriptionKey,
            tenantId,
        };
        const missingFields = fp_1.reduce((accum, field) => {
            if (!options[field]) {
                return [...accum, field];
            }
            return accum;
        }, [])(requiredFields);
        if (missingFields && missingFields.length > 0) {
            throw new Error(`winteamPostRequest: Missing required vars: ${missingFields.join(', ')}`);
        }
        const url = `${baseUrl}${endpoint}`;
        const params = {
            body: JSON.stringify(body),
            headers: {
                'Content-Type': 'application/json',
                'Ocp-Apim-Subscription-Key': subscriptionKey,
                Tenantid: tenantId,
            },
            method,
        };
        const response = yield node_fetch_1.default(url, params);
        const responseText = yield response.text();
        const responseJson = fp_1.attempt(() => JSON.parse(responseText));
        const isJson = !fp_1.isError(responseJson);
        const result = isJson ? responseJson : responseText;
        /**
         * NOTE: Node-fetch does not throw exceptions for 3xx - 5xx responses.  We need to handle
         * this manually using the ok property
         *
         * https://www.npmjs.com/package/node-fetch#handling-client-and-server-errors
         */
        return response.ok
            ? // Return the actual response if a 2xx response is detected
                result
            : isJson
                ? // Return the JSON error if a 4xx or 5xx response is detected (with a valid error payload)
                    responseJson
                : // Fallback to a generic error if a non-JSON error is detected
                    genericError;
    });
}
exports.default = winteamRequest;
function winteamGetRequest(request) {
    return __awaiter(this, void 0, void 0, function* () {
        const { baseUrl, endpoint, headers, method } = request;
        const { subscriptionKey, tenantId } = headers;
        const options = {
            baseUrl,
            endpoint,
            subscriptionKey,
            tenantId,
        };
        const missingFields = fp_1.reduce((accum, field) => {
            if (!options[field]) {
                return [...accum, field];
            }
            return accum;
        }, [])(requiredFields);
        if (missingFields && missingFields.length > 0) {
            throw new Error(`winteamGetRequest: Missing required vars: ${missingFields.join(', ')}`);
        }
        const url = `${baseUrl}${endpoint}`;
        const params = {
            headers: {
                'Content-Type': 'application/json',
                'Ocp-Apim-Subscription-Key': subscriptionKey,
                Tenantid: tenantId,
            },
            method,
        };
        const response = yield node_fetch_1.default(url, params);
        const responseText = yield response.text();
        const responseJson = fp_1.attempt(() => JSON.parse(responseText));
        const isJson = !fp_1.isError(responseJson);
        const result = isJson ? responseJson : responseText;
        /**
         * NOTE: Node-fetch does not throw exceptions for 3xx - 5xx responses.  We need to handle
         * this manually using the ok property
         *
         * https://www.npmjs.com/package/node-fetch#handling-client-and-server-errors
         */
        return response.ok
            ? // Return the actual response if a 2xx response is detected
                result
            : isJson
                ? // Return the JSON error if a 4xx or 5xx response is detected (with a valid error payload)
                    responseJson
                : // Fallback to a generic error if a non-JSON error is detected
                    genericError;
    });
}
exports.winteamGetRequest = winteamGetRequest;
//# sourceMappingURL=index.js.map