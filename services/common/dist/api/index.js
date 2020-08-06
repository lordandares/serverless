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
const node_fetch_1 = __importDefault(require("node-fetch"));
const querystring_1 = __importDefault(require("querystring"));
var Methods;
(function (Methods) {
    Methods["Get"] = "GET";
    Methods["Post"] = "POST";
    Methods["Put"] = "PUT";
    Methods["Delete"] = "DELETE";
})(Methods || (Methods = {}));
const JSON_REGEX = /json/;
function createClient() {
    const defaultHeaders = {
        'content-type': 'application/json',
    };
    const request = (method) => (url, requestOptions) => __awaiter(this, void 0, void 0, function* () {
        if (!url) {
            throw new Error('RequestError: missing url');
        }
        const { body, headers = {}, query } = requestOptions;
        const queryString = query ? querystring_1.default.stringify(query) : '';
        const fullUrl = queryString ? `${url}?${queryString}` : url;
        const fetchOptions = {
            body: JSON.stringify(body),
            headers: Object.assign(Object.assign({}, defaultHeaders), headers),
            method,
        };
        const response = yield node_fetch_1.default(fullUrl, fetchOptions);
        const contentType = response.headers.get('Content-Type');
        if (contentType && JSON_REGEX.test(contentType)) {
            return response.json();
        }
        // Support non-json responses, e.g. 204
        return {};
    });
    return {
        delete: request(Methods.Delete),
        get: request(Methods.Get),
        post: request(Methods.Post),
        put: request(Methods.Put),
    };
}
exports.createClient = createClient;
//# sourceMappingURL=index.js.map