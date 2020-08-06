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
Object.defineProperty(exports, "__esModule", { value: true });
var serverless_common_1 = require("@lighthouse/serverless-common");
var fp_1 = require("lodash/fp");
var Env;
(function (Env) {
    Env["LIGHTHOUSE_BASE_URL"] = "LIGHTHOUSE_BASE_URL";
    Env["AZURE_KEY_VAULT"] = "AZURE_KEY_VAULT";
    Env["LIGHTHOUSE_API_SECRET"] = "LIGHTHOUSE_API_SECRET";
})(Env || (Env = {}));
var CreateUserStrategies;
(function (CreateUserStrategies) {
    CreateUserStrategies["ResetOnNextLogin"] = "via-password";
})(CreateUserStrategies = exports.CreateUserStrategies || (exports.CreateUserStrategies = {}));
function upsertUser(options) {
    return __awaiter(this, void 0, void 0, function () {
        var application, employee, applicationId, defaultRole, EmailAddress, EmployeeNumber, FirstName, LastName, applicationUserCollection, applicationUser, applicationUserRetry, authorization, apiClient, usersBaseUrl, payload_1, updatedUser, error, result_1, payload, newUser, error, result, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 7, , 8]);
                    application = options.application, employee = options.employee;
                    assertEnv();
                    if (!employee) {
                        throw handleError('InputError: Missing "employee" option', {
                            options: options,
                        });
                    }
                    if (!application) {
                        throw handleError('InputError: Missing "application" option', {
                            options: options,
                        });
                    }
                    applicationId = application._id;
                    defaultRole = fp_1.get('settings.roles.default', application);
                    EmailAddress = employee.EmailAddress, EmployeeNumber = employee.EmployeeNumber, FirstName = employee.FirstName, LastName = employee.LastName;
                    if (!defaultRole) {
                        throw new Error('DefaultRoleError: Application must have a default role setting');
                    }
                    return [4 /*yield*/, serverless_common_1.mongo.getCollection('applicationusers')];
                case 1:
                    applicationUserCollection = _a.sent();
                    return [4 /*yield*/, applicationUserCollection.findOne({
                            application: applicationId,
                            $or: [
                                { 'plugins.winteam.options.employeeNumber': EmployeeNumber },
                                { username: 'apg' + EmployeeNumber },
                            ],
                        })
                        //if the application user was not found, let's check with the first name, last name, specific to apg
                    ];
                case 2:
                    applicationUser = _a.sent();
                    applicationUserRetry = null;
                    return [4 /*yield*/, serverless_common_1.secrets.getSecret(process.env.AZURE_KEY_VAULT, 'LIGHTHOUSE-API-SECRET')];
                case 3:
                    authorization = _a.sent();
                    apiClient = serverless_common_1.api.createClient();
                    usersBaseUrl = process.env.LIGHTHOUSE_BASE_URL + "/applications/" + applicationId + "/users";
                    if (!applicationUser) return [3 /*break*/, 5];
                    payload_1 = {
                        email: EmailAddress,
                        firstName: FirstName,
                        lastName: LastName,
                        plugins: {
                            // the winteam object is removed if it is not present on the update process
                            winteam: {
                                options: {
                                    employeeNumber: EmployeeNumber,
                                },
                                enabled: true,
                            },
                        },
                    };
                    return [4 /*yield*/, apiClient.put(usersBaseUrl + "/" + applicationUser._id, {
                            body: payload_1,
                            headers: {
                                authorization: authorization,
                            },
                        })];
                case 4:
                    updatedUser = _a.sent();
                    if (updatedUser.error) {
                        error = updatedUser.error;
                        throw new Error("ApplicationUserUpdateError: " + error.code + ", " + error.message);
                    }
                    result_1 = {
                        data: {
                            id: updatedUser._id,
                        },
                        type: 'update',
                    };
                    console.info('upsertUser[Update]: success', result_1, updatedUser);
                    return [2 /*return*/, result_1];
                case 5:
                    payload = {
                        firstName: FirstName,
                        lastName: LastName,
                        plugins: {
                            winteam: {
                                options: {
                                    employeeNumber: EmployeeNumber,
                                },
                                enabled: true,
                            },
                        },
                        email: EmailAddress,
                        username: EmployeeNumber,
                        auth: {},
                        role: new serverless_common_1.mongo.ObjectId(defaultRole),
                        password: "team" + EmployeeNumber,
                        preferences: {},
                        type: CreateUserStrategies.ResetOnNextLogin,
                    };
                    return [4 /*yield*/, apiClient.put(usersBaseUrl, {
                            body: payload,
                            headers: {
                                authorization: authorization,
                            },
                        })];
                case 6:
                    newUser = _a.sent();
                    if (newUser.error) {
                        error = newUser.error;
                        throw new Error("ApplicationUserCreateError: " + error.code + ", " + error.message);
                    }
                    result = {
                        data: {
                            id: newUser._id,
                        },
                        type: 'new',
                    };
                    console.info('upsertUser[Create]:  success', result, newUser);
                    return [2 /*return*/, result];
                case 7:
                    err_1 = _a.sent();
                    console.error(err_1);
                    throw err_1;
                case 8: return [2 /*return*/];
            }
        });
    });
}
exports.upsertUser = upsertUser;
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
