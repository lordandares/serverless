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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
var serverless_common_1 = require("@lighthouse/serverless-common");
var lodash_1 = require("lodash");
var handleSingleLoadEmployee_1 = __importDefault(require("./handleSingleLoadEmployee"));
var handleFullLoadEmployees_1 = __importDefault(require("./handleFullLoadEmployees"));
var validations_1 = require("../../helpers/validations");
var ChangeOperations;
(function (ChangeOperations) {
    ChangeOperations["F"] = "F";
    ChangeOperations["I"] = "I";
    ChangeOperations["U"] = "U";
})(ChangeOperations || (ChangeOperations = {}));
var Env;
(function (Env) {
    Env["TENANT_BASE_URL"] = "TENANT_BASE_URL";
    Env["TENANT_CODE"] = "TENANT_CODE";
})(Env || (Env = {}));
var employeeStrategies = (_a = {},
    _a[ChangeOperations.F] = handleFullLoadEmployees_1.default,
    _a[ChangeOperations.U] = handleSingleLoadEmployee_1.default,
    _a[ChangeOperations.I] = handleSingleLoadEmployee_1.default,
    _a);
function handleEmployeeEvent(_a) {
    var context = _a.context, data = _a.data;
    return __awaiter(this, void 0, void 0, function () {
        var employeeStrategyFn, winteamTenant, err;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    assertEnv();
                    validations_1.validateError({ context: context, data: data }, 'ChangeOperation');
                    validations_1.validateError({ context: context, data: data }, 'WinTeamDBName');
                    employeeStrategyFn = employeeStrategies[data.ChangeOperation];
                    return [4 /*yield*/, getWinteamTenant(data.WinTeamDBName)];
                case 1:
                    winteamTenant = _b.sent();
                    if (lodash_1.isEmpty(winteamTenant)) {
                        err = new Error('TenantNotFoundError');
                        context.log.error('handleEmployeeEvent: TenantNotFoundError', {
                            data: data,
                        });
                        throw err;
                    }
                    return [2 /*return*/, employeeStrategyFn({ context: context, data: data }, winteamTenant)];
            }
        });
    });
}
exports.default = handleEmployeeEvent;
function assertEnv() {
    for (var env in Env) {
        if (!process.env[env]) {
            throw handleError("ConfigurationError: Missing env '" + env + "'");
        }
    }
}
function getWinteamTenant(productDescription) {
    return __awaiter(this, void 0, void 0, function () {
        var apiClient, tenantBaseUrl, code, winteamTenant;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    apiClient = serverless_common_1.api.createClient();
                    tenantBaseUrl = process.env.TENANT_BASE_URL + "/tenants";
                    code = process.env.TENANT_CODE;
                    return [4 /*yield*/, apiClient.get(tenantBaseUrl, {
                            query: {
                                productDescription: productDescription,
                                code: code,
                            },
                        })];
                case 1:
                    winteamTenant = _a.sent();
                    return [2 /*return*/, winteamTenant];
            }
        });
    });
}
exports.getWinteamTenant = getWinteamTenant;
function handleError(message, data) {
    var err = new Error(message);
    console.error("handleEmployeeEventError: " + message, __assign({ err: err }, data));
    return err;
}
