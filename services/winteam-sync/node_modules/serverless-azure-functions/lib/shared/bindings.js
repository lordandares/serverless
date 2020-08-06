"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var constants_1 = require("./constants");
var bindingsJson = require("./bindings.json"); // eslint-disable-line @typescript-eslint/no-var-requires
var BindingUtils = /** @class */ (function () {
    function BindingUtils() {
    }
    BindingUtils.getBindingsMetaData = function (serverless) {
        var bindingDisplayNames = [];
        var bindingTypes = [];
        var bindingSettings = [];
        var bindingSettingsNames = [];
        serverless.cli.log("Parsing Azure Functions Bindings.json...");
        for (var bindingsIndex = 0; bindingsIndex < bindingsJson[constants_1.constants.bindings].length; bindingsIndex++) {
            var settingsNames = [];
            bindingTypes.push(bindingsJson[constants_1.constants.bindings][bindingsIndex][constants_1.constants.type]);
            bindingDisplayNames.push(bindingsJson[constants_1.constants.bindings][bindingsIndex][constants_1.constants.displayName].toLowerCase());
            bindingSettings[bindingsIndex] = bindingsJson[constants_1.constants.bindings][bindingsIndex][constants_1.constants.settings];
            for (var bindingSettingsIndex = 0; bindingSettingsIndex < bindingSettings[bindingsIndex].length; bindingSettingsIndex++) {
                settingsNames.push(bindingSettings[bindingsIndex][bindingSettingsIndex][constants_1.constants.name]);
            }
            bindingSettingsNames[bindingsIndex] = settingsNames;
        }
        return {
            bindingDisplayNames: bindingDisplayNames,
            bindingTypes: bindingTypes,
            bindingSettings: bindingSettings,
            bindingSettingsNames: bindingSettingsNames
        };
    };
    BindingUtils.getBindingUserSettingsMetaData = function (azureSettings, bindingType, bindingTypeIndex, bindingDisplayNames) {
        var bindingDisplayNamesIndex = bindingTypeIndex;
        var bindingUserSettings = {};
        if (azureSettings) {
            var directionIndex = Object.keys(azureSettings).indexOf(constants_1.constants.direction);
            if (directionIndex >= 0) {
                var key = Object.keys(azureSettings)[directionIndex];
                var displayName = "$" + bindingType + azureSettings[key] + "_displayName";
                bindingDisplayNamesIndex = bindingDisplayNames.indexOf(displayName.toLowerCase());
                bindingUserSettings[constants_1.constants.direction] = azureSettings[key];
            }
        }
        var bindingUserSettingsMetaData = {
            index: bindingDisplayNamesIndex,
            userSettings: bindingUserSettings
        };
        return bindingUserSettingsMetaData;
    };
    BindingUtils.getHttpOutBinding = function () {
        var binding = {};
        binding[constants_1.constants.type] = "http";
        binding[constants_1.constants.direction] = constants_1.constants.outDirection;
        binding[constants_1.constants.name] = "res";
        return binding;
    };
    BindingUtils.getBinding = function (bindingType, bindingSettings, bindingUserSettings) {
        var binding = {};
        binding[constants_1.constants.type] = bindingType;
        if (bindingUserSettings && bindingUserSettings[constants_1.constants.direction]) {
            binding[constants_1.constants.direction] = bindingUserSettings[constants_1.constants.direction];
        }
        else if (bindingType.includes(constants_1.constants.trigger)) {
            binding[constants_1.constants.direction] = constants_1.constants.inDirection;
        }
        else {
            binding[constants_1.constants.direction] = constants_1.constants.outDirection;
        }
        for (var bindingSettingsIndex = 0; bindingSettingsIndex < bindingSettings.length; bindingSettingsIndex++) {
            var name_1 = bindingSettings[bindingSettingsIndex][constants_1.constants.name];
            if (bindingUserSettings && bindingUserSettings[name_1] !== undefined && bindingUserSettings[name_1] !== null) {
                binding[name_1] = bindingUserSettings[name_1];
                continue;
            }
            var value = bindingSettings[bindingSettingsIndex][constants_1.constants.value];
            var required = bindingSettings[bindingSettingsIndex][constants_1.constants.required];
            var resource = bindingSettings[bindingSettingsIndex][constants_1.constants.resource];
            if (required) {
                var defaultValue = bindingSettings[bindingSettingsIndex][constants_1.constants.defaultValue];
                if (defaultValue) {
                    binding[name_1] = defaultValue;
                }
                else if (name_1 === constants_1.constants.connection && resource.toLowerCase() === constants_1.constants.storage) {
                    binding[name_1] = "AzureWebJobsStorage";
                }
                else {
                    throw new Error("Required property " + name_1 + " is missing for binding:" + bindingType);
                }
            }
            if (value === constants_1.constants.enum && name_1 !== constants_1.constants.webHookType) {
                var enumValues = bindingSettings[bindingSettingsIndex][constants_1.constants.enum];
                binding[name_1] = enumValues[0][constants_1.constants.value];
            }
        }
        return binding;
    };
    return BindingUtils;
}());
exports.BindingUtils = BindingUtils;
