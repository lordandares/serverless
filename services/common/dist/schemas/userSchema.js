"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const yup_1 = require("yup");
exports.userSchema = yup_1.object().shape({
    _id: yup_1.string(),
    anonymous: yup_1.boolean(),
    auth: yup_1.object().shape({
        anonymousId: yup_1.string(),
        failedLoginCount: yup_1.number(),
        inviteToken: yup_1.string(),
        password: yup_1.string(),
        token: yup_1.string(),
        resetPassword: yup_1.object().shape({
            expires: yup_1.string(),
            token: yup_1.string(),
        }),
        username: yup_1.string().required(),
    }),
    email: yup_1.string().required(),
    firstName: yup_1.string().required(),
    lastName: yup_1.string().required(),
    location: yup_1.string().nullable(),
    mobile: yup_1.string(),
    superadmin: yup_1.boolean(),
    tempPassword: yup_1.string(),
}, { strict: true, stripUnknown: false });
exports.default = exports.userSchema;
//# sourceMappingURL=userSchema.js.map