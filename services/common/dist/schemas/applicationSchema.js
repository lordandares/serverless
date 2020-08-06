"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const yup_1 = require("yup");
exports.applicationSchema = yup_1.object().shape({
    _id: yup_1.string(),
    authenticationStrategies: yup_1.mixed(),
    flags: yup_1.mixed(),
    name: yup_1.string().required(),
    plugins: yup_1.mixed(),
    settings: yup_1.mixed(),
    speakerbox: yup_1.object().shape({
        consumerId: yup_1.string(),
        token: yup_1.string(),
    }),
    theme: yup_1.object().shape({
        logos: yup_1.object(),
    }),
}, { strict: true, stripUnknown: false });
exports.default = exports.applicationSchema;
//# sourceMappingURL=applicationSchema.js.map