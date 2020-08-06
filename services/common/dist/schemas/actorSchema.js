"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const yup_1 = require("yup");
exports.actorSchema = yup_1.object().shape({
    data: yup_1.object(),
    id: yup_1.string().required(),
    label: yup_1.string().required(),
    type: yup_1.string().required(),
});
exports.default = exports.actorSchema;
//# sourceMappingURL=actorSchema.js.map