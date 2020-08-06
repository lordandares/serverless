"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const yup_1 = require("yup");
exports.actionSchema = yup_1.object().shape({
    type: yup_1.string().required(),
    endpoint: yup_1.string().required(),
    data: yup_1.object(),
});
exports.default = exports.actionSchema;
//# sourceMappingURL=actionSchema.js.map