"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var config_1 = __importDefault(require("../config"));
var AzureProvider = /** @class */ (function () {
    function AzureProvider(serverless) {
        this.serverless = serverless;
        this.serverless.setProvider(config_1.default.providerName, this);
    }
    AzureProvider.getProviderName = function () {
        return config_1.default.providerName;
    };
    return AzureProvider;
}());
exports.default = AzureProvider;
