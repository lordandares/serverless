"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var guard_1 = require("../shared/guard");
var utils_1 = require("../shared/utils");
var AzureBasePlugin = /** @class */ (function () {
    function AzureBasePlugin(serverless, options) {
        this.serverless = serverless;
        this.options = options;
        guard_1.Guard.null(serverless);
        this.config = serverless.service;
        this.processedCommands = serverless.processedInput.commands;
    }
    AzureBasePlugin.prototype.log = function (message) {
        this.serverless.cli.log(message);
    };
    AzureBasePlugin.prototype.getOption = function (key, defaultValue) {
        return utils_1.Utils.get(this.options, key, defaultValue);
    };
    return AzureBasePlugin;
}());
exports.AzureBasePlugin = AzureBasePlugin;
