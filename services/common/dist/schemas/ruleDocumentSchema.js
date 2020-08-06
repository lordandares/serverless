"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const yup_1 = require("yup");
exports.ruleDocumentSchema = yup_1.object().shape({
    id: yup_1.string(),
    name: yup_1.string().required(),
    value: yup_1.string().required(),
});
exports.default = exports.ruleDocumentSchema;
//# sourceMappingURL=ruleDocumentSchema.js.map