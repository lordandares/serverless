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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var serverless_common_1 = require("@lighthouse/serverless-common");
var serverless_integrations_1 = require("@lighthouse/serverless-integrations");
var upsertJob_1 = require("../../helpers/upsertJob");
var validations_1 = require("../../helpers/validations");
var Env;
(function (Env) {
    Env["JOBS_ENDPOINT"] = "JOBS_ENDPOINT";
    Env["WINTEAM_BASE_URL"] = "WINTEAM_BASE_URL";
    Env["AZURE_KEY_VAULT"] = "AZURE_KEY_VAULT";
})(Env || (Env = {}));
function handleSingleLoadJob(_a, winteamTenant) {
    var context = _a.context, data = _a.data;
    return __awaiter(this, void 0, void 0, function () {
        var jobId, job, err, applicationId, applicationCollection, application;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    validations_1.validateError({ context: context, data: data }, 'jobId');
                    jobId = data.jobId;
                    return [4 /*yield*/, getJob(jobId, winteamTenant.mappings.filter(function (x) { return x['productId'] === 'winteam'; })[0]['tenantId'])];
                case 1:
                    job = _b.sent();
                    context.log.info("Winteam Job request completed: ");
                    context.log.info(job);
                    if (!job) {
                        err = new Error('JobNotFoundError');
                        context.log.error('handleJobEvent: JobNotFoundError', {
                            data: data,
                        });
                        throw err;
                    }
                    applicationId = winteamTenant.mappings.filter(function (x) { return x['productId'] === 'lighthouse'; })[0]['tenantId'];
                    return [4 /*yield*/, serverless_common_1.mongo.getCollection('applications')];
                case 2:
                    applicationCollection = _b.sent();
                    return [4 /*yield*/, applicationCollection.findOne({
                            _id: new serverless_common_1.mongo.ObjectId(applicationId),
                        })];
                case 3:
                    application = _b.sent();
                    context.log.info("LH Application request completed: ");
                    context.log.info(application);
                    if (!application) {
                        throw new Error("ApplicationNotFoundError - applicationId:" + applicationId);
                    }
                    return [2 /*return*/, upsertJob_1.upsertJob({
                            application: application,
                            job: job,
                        })];
            }
        });
    });
}
exports.default = handleSingleLoadJob;
function getJob(jobId, winteamTenantId) {
    return __awaiter(this, void 0, void 0, function () {
        var subscriptionKey, request, job;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, serverless_common_1.secrets.getSecret(process.env.AZURE_KEY_VAULT, 'subscriptionKey')];
                case 1:
                    subscriptionKey = _a.sent();
                    request = {
                        baseUrl: process.env.WINTEAM_BASE_URL,
                        endpoint: process.env.JOBS_ENDPOINT + "/" + jobId,
                        headers: {
                            subscriptionKey: subscriptionKey,
                            tenantId: 'tenantId',
                        },
                        method: 'GET',
                    };
                    return [4 /*yield*/, serverless_integrations_1.winteam.helpers.winteamGetRequest(request)];
                case 2:
                    job = _a.sent();
                    return [2 /*return*/, job];
            }
        });
    });
}
