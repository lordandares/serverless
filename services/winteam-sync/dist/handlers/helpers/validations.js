"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var serverless_common_1 = require("@lighthouse/serverless-common");
exports.validateError = function (_a, fieldName) {
    var context = _a.context, data = _a.data;
    if (!data[fieldName]) {
        var err = new serverless_common_1.errors.ValidationError({
            message: fieldName + ' is required',
        });
        context.log.error(err.message, {
            data: data,
        });
        throw err;
    }
};
