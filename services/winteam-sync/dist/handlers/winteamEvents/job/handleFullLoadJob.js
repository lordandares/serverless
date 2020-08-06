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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var serverless_common_1 = require("@lighthouse/serverless-common");
var fp_1 = require("lodash/fp");
var request_1 = __importDefault(require("request"));
var scramjet_1 = require("scramjet");
var upsertJob_1 = require("../../helpers/upsertJob");
var Env;
(function (Env) {
    Env["JOBS_ENDPOINT"] = "JOBS_ENDPOINT";
    Env["WINTEAM_BASE_URL"] = "WINTEAM_BASE_URL";
    Env["AZURE_KEY_VAULT"] = "AZURE_KEY_VAULT";
})(Env || (Env = {}));
var throttledLog = fp_1.throttle(5000, console.info);
function handleFullLoadJob(_a, winteamTenant) {
    var context = _a.context, data = _a.data;
    return __awaiter(this, void 0, void 0, function () {
        var dryRun_1, options, strategy, applicationId, stream, stats_1, applicationCollection, application_1, timeStreamStart, timeStreamEnd, timeStreamSpent, err_1;
        var _this = this;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 5, , 6]);
                    context.log.info('winteamTenant: ', winteamTenant);
                    dryRun_1 = data.dryRun, options = data.options, strategy = data.strategy;
                    applicationId = winteamTenant.mappings.filter(function (x) { return x['productId'] === 'lighthouse'; })[0]['tenantId'];
                    if (!applicationId) {
                        throw new Error('ApplicationId not found');
                    }
                    context.log.info('##APPLICATION ID:', applicationId);
                    return [4 /*yield*/, streamFromHttp(winteamTenant.mappings.filter(function (x) { return x['productId'] === 'winteam'; })[0]['tenantId'])];
                case 1:
                    stream = _b.sent();
                    stats_1 = {
                        processed: 0,
                        created: 0,
                        updated: 0,
                    };
                    return [4 /*yield*/, serverless_common_1.mongo.getCollection('applications')];
                case 2:
                    applicationCollection = _b.sent();
                    return [4 /*yield*/, applicationCollection.findOne({
                            _id: new serverless_common_1.mongo.ObjectId(applicationId),
                        })];
                case 3:
                    application_1 = _b.sent();
                    context.log.info("LH Application request completed: ");
                    context.log.info(application_1);
                    if (!application_1) {
                        throw new Error("ApplicationNotFoundError - applicationId:" + applicationId);
                    }
                    timeStreamStart = new Date().getTime();
                    return [4 /*yield*/, stream
                            .each(function (row) { return __awaiter(_this, void 0, void 0, function () {
                            var result, type;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        stats_1.processed += 1;
                                        if (!!dryRun_1) return [3 /*break*/, 2];
                                        return [4 /*yield*/, upsertJob_1.upsertJob({
                                                application: application_1,
                                                job: row,
                                            })];
                                    case 1:
                                        result = _a.sent();
                                        type = result.type;
                                        type && type === 'update'
                                            ? (stats_1.updated += 1)
                                            : (stats_1.created += 1);
                                        _a.label = 2;
                                    case 2:
                                        throttledLog("Processed " + stats_1.processed + " | Updated " + stats_1.updated);
                                        return [2 /*return*/, row];
                                }
                            });
                        }); })
                            .run()];
                case 4:
                    _b.sent();
                    timeStreamEnd = new Date().getTime();
                    timeStreamSpent = (timeStreamEnd - timeStreamStart) / 1000;
                    log("Processed " + stats_1.processed + " | Created " + stats_1.created + " | Updated " + stats_1.updated);
                    log('✅ SUCCESS');
                    log("Jobs import time: " + timeStreamSpent + " seconds.");
                    return [2 /*return*/, {
                            stats: stats_1,
                        }];
                case 5:
                    err_1 = _b.sent();
                    log('🚨 Error');
                    console.error(err_1);
                    throw err_1;
                case 6: return [2 /*return*/];
            }
        });
    });
}
exports.default = handleFullLoadJob;
function log(text) {
    var len = text.length;
    var divider = fp_1.padCharsEnd('-', len, '');
    console.info("\n\n" + divider + "\n" + text + "\n" + divider + "\n\n");
}
function streamFromHttp(winteamTenantId) {
    return __awaiter(this, void 0, void 0, function () {
        var subscriptionKey, url, headers, requestOptions;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, serverless_common_1.secrets.getSecret(process.env.AZURE_KEY_VAULT, 'WINTEAM-SUBSCRIPTION-KEY')];
                case 1:
                    subscriptionKey = _a.sent();
                    url = "" + process.env.WINTEAM_BASE_URL + process.env.JOBS_ENDPOINT;
                    headers = {
                        'Content-Type': 'application/json',
                        'Ocp-Apim-Subscription-Key': subscriptionKey,
                        tenantId: winteamTenantId,
                    };
                    requestOptions = {
                        url: url,
                        headers: headers,
                    };
                    return [2 /*return*/, scramjet_1.StringStream.from(request_1.default(requestOptions), {})
                            .JSONParse()
                            .flatMap(function (doc) { return doc; })];
            }
        });
    });
}
