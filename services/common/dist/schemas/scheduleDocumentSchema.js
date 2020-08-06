"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@lighthouse/common");
const lodash_1 = require("lodash");
const yup_1 = require("yup");
const scheduleDocumentBaseSchema_1 = require("./scheduleDocumentBaseSchema");
require("./customYupMethods");
exports.scheduleDocumentSchema = scheduleDocumentBaseSchema_1.scheduleDocumentBaseSchema.shape({
    data: yup_1.object({
        areas: yup_1.array(),
        enabled: yup_1.boolean().requiredWhen('$isNew'),
        included: yup_1.object({
            locations: yup_1.object(),
        }).requiredWhen('$isNew'),
        locations: yup_1.array().requiredWhen('$isNew'),
        name: yup_1.string().requiredWhen('$isNew'),
        serviceHours: common_1.serviceHours.schema.notRequired(),
        strategy: yup_1.object({
            options: yup_1.object({
                duration: yup_1.object({
                    unit: yup_1.string()
                        .oneOf(lodash_1.values(common_1.scheduling.Unit))
                        .requiredWhen('$isNew'),
                    value: yup_1.number().required(),
                }).requiredWhen('$isNew'),
                frequency: yup_1.object({
                    unit: yup_1.string()
                        .oneOf(lodash_1.values(common_1.scheduling.Unit))
                        .requiredWhen('$isNew'),
                    value: yup_1.number().requiredWhen('$isNew'),
                }),
            }).requiredWhen('$isNew'),
            type: yup_1.string()
                .oneOf(lodash_1.values(common_1.scheduling.StrategyTypes))
                .requiredWhen('$isNew'),
        }).requiredWhen('$isNew'),
    }).requiredWhen('$isNew'),
});
exports.default = exports.scheduleDocumentSchema;
//# sourceMappingURL=scheduleDocumentSchema.js.map