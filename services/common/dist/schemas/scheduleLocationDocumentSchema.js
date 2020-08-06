"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@lighthouse/common");
const yup_1 = require("yup");
const actorSchema_1 = require("./actorSchema");
const constants_1 = require("./constants");
exports.scheduleLocationDocumentSchema = yup_1.object().shape({
    applicationId: yup_1.string().required(),
    createdAt: yup_1.string().required(),
    createdBy: actorSchema_1.actorSchema.required(),
    data: yup_1.object()
        .shape({
        name: yup_1.string().required(),
        serviceHours: common_1.serviceHours.schema.required(),
    })
        .required(),
    groupType: yup_1.string()
        .oneOf(constants_1.groupTypes)
        .required(),
    pk: yup_1.string().required(),
    schedules: yup_1.array(),
    sk: yup_1.string().required(),
    updatedAt: yup_1.string().notRequired(),
    updatedBy: actorSchema_1.actorSchema.notRequired(),
});
exports.default = exports.scheduleLocationDocumentSchema;
//# sourceMappingURL=scheduleLocationDocumentSchema.js.map