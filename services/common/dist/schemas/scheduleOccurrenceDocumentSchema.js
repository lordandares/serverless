"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const yup_1 = require("yup");
const scheduleDocumentBaseSchema_1 = require("./scheduleDocumentBaseSchema");
require("./customYupMethods");
exports.scheduleOccurrenceDocumentSchema = scheduleDocumentBaseSchema_1.scheduleDocumentBaseSchema.shape({
    locationEndAtOccurrenceId: yup_1.string().requiredWhen('$isNew'),
    locationId: yup_1.string().requiredWhen('$isNew'),
    occurrenceId: yup_1.string().requiredWhen('$isNew'),
    // NOTE: schedules don't support user occurrence matching so not required
    userEndAtOccurrenceId: yup_1.string(),
});
exports.default = exports.scheduleOccurrenceDocumentSchema;
//# sourceMappingURL=scheduleOccurrenceDocumentSchema.js.map