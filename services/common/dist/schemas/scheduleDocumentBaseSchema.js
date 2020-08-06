"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const yup_1 = require("yup");
const actorSchema_1 = require("./actorSchema");
const constants_1 = require("./constants");
require("./customYupMethods");
exports.scheduleDocumentBaseSchema = yup_1.object().shape({
    applicationId: yup_1.string().requiredWhen('$isNew'),
    createdAt: yup_1.string().requiredWhen('$isNew'),
    createdBy: actorSchema_1.actorSchema.requiredWhen('$isNew'),
    endAt: yup_1.string().nullable(),
    groupType: yup_1.string()
        .oneOf(constants_1.groupTypes)
        .requiredWhen('$isNew'),
    pk: yup_1.string().required(),
    scheduleId: yup_1.string().requiredWhen('$isNew'),
    sk: yup_1.string().required(),
    startAt: yup_1.string().requiredWhen('$isNew'),
    updatedAt: yup_1.string().notRequired(),
    updatedBy: actorSchema_1.actorSchema.notRequired(),
});
exports.default = exports.scheduleDocumentBaseSchema;
//# sourceMappingURL=scheduleDocumentBaseSchema.js.map