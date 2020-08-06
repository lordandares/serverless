"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var circle_1 = __importDefault(require("@turf/circle"));
var helpers_1 = require("@turf/helpers");
var Env;
(function (Env) {
    Env["LIGHTHOUSE_BASE_URL"] = "LIGHTHOUSE_BASE_URL";
    Env["AZURE_KEY_VAULT"] = "AZURE_KEY_VAULT";
    Env["LIGHTHOUSE_API_SECRET"] = "LIGHTHOUSE_API_SECRET";
})(Env || (Env = {}));
var defaultGeofenceRadius = 0.1; // km
function upsertJob(options) {
    return __awaiter(this, void 0, void 0, function () {
        var application, job, applicationId, areaLocation, authorization, apiClient, areasBaseUrl, matchedLocations, matchedLocation, putUrl, updatedLocation, newLocation, result, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 6, , 7]);
                    application = options.application, job = options.job;
                    assertEnv();
                    if (!job) {
                        throw handleError('InputError: Missing "job" option', {
                            options: options,
                        });
                    }
                    if (!application) {
                        throw handleError('InputError: Missing "application" option', {
                            options: options,
                        });
                    }
                    applicationId = application._id;
                    areaLocation = mapJobToArea(job);
                    return [4 /*yield*/, serverless_common_1.secrets.getSecret(process.env.LIGHTHOUSE_API_SECRET, 'authorization')];
                case 1:
                    authorization = _a.sent();
                    apiClient = serverless_common_1.api.createClient();
                    areasBaseUrl = process.env.LIGHTHOUSE_BASE_URL + "/applications/" + applicationId + "/areas";
                    return [4 /*yield*/, apiClient.get(areasBaseUrl, {
                            headers: {
                                authorization: authorization,
                            },
                            query: {
                                'plugins.winteam.options.jobId': job.JobID,
                            },
                        })];
                case 2:
                    matchedLocations = _a.sent();
                    matchedLocation = matchedLocations[0];
                    if (!matchedLocation) return [3 /*break*/, 4];
                    putUrl = areasBaseUrl + "/" + matchedLocation._id;
                    return [4 /*yield*/, apiClient.put(putUrl, {
                            body: areaLocation,
                            headers: {
                                authorization: authorization,
                            },
                        })];
                case 3:
                    updatedLocation = _a.sent();
                    return [2 /*return*/, updatedLocation];
                case 4: return [4 /*yield*/, apiClient.post(areasBaseUrl, {
                        body: areaLocation,
                        headers: {
                            authorization: authorization,
                        },
                    })];
                case 5:
                    newLocation = _a.sent();
                    result = {
                        data: {
                            id: newLocation._id,
                        },
                        type: 'new',
                    };
                    console.info('upsertJob[Create]:  success', result, newLocation);
                    return [2 /*return*/, result];
                case 6:
                    err_1 = _a.sent();
                    console.error(err_1);
                    throw err_1;
                case 7: return [2 /*return*/];
            }
        });
    });
}
exports.upsertJob = upsertJob;
function assertEnv() {
    for (var env in Env) {
        if (!process.env[env]) {
            throw handleError("ConfigurationError: Missing env '" + env + "'");
        }
    }
}
function handleError(message, data) {
    var err = new Error(message);
    console.error("upsertUserError: " + message, __assign({ err: err }, data));
    return err;
}
function mapJobToArea(job) {
    var lat = parseFloat(job.Address.Latitude);
    var lng = parseFloat(job.Address.Longitude);
    var pointGeoJson = helpers_1.point([lng, lat]);
    // NOTE where does the radius come from on a job?
    var circleGeoJson = circle_1.default(pointGeoJson, defaultGeofenceRadius);
    return {
        // TODO application
        name: job.JobDescription,
        type: 'location',
        geometry: circleGeoJson.geometry,
        timezone: 'America/Los_Angeles',
        plugins: {
            winteam: {
                options: {
                    jobId: job.JobID,
                    jobNumber: job.JobNumber,
                },
            },
        },
        address: {
            street: job.Address.Address1,
            street2: job.Address.Address2,
            city: job.Address.City,
            state: job.Address.State,
            postalCode: job.Address.Zip,
            country: '',
        },
    };
}
