"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const yup_1 = require("yup");
exports.shiftEventSchema = yup_1.object().shape({
    area: yup_1.object().shape({
        location: yup_1.object().shape({
            id: yup_1.string(),
        }),
    }),
    time: yup_1.string().required(),
}, { strict: true, stripUnknown: false });
exports.shiftMessageSchema = yup_1.object().shape({
    _id: yup_1.string(),
    isGlobal: yup_1.boolean(),
    message: yup_1.string().required(),
    messageId: yup_1.number().required(),
    punchActionId: yup_1.number().required(),
    response1: yup_1.string().required(),
    response1Id: yup_1.number(),
    response2: yup_1.string().required(),
    response2Id: yup_1.number(),
    responseText: yup_1.string(),
    responseTime: yup_1.string(),
}, { strict: true, stripUnknown: false });
exports.shiftBreakSchema = yup_1.object().shape({
    end: exports.shiftEventSchema,
    start: exports.shiftEventSchema.required(),
}, { strict: true, stripUnknown: false });
exports.shiftSchema = yup_1.object().shape({
    _id: yup_1.string(),
    application: yup_1.string().required(),
    breaks: yup_1.array().of(exports.shiftBreakSchema),
    end: exports.shiftEventSchema.nullable(),
    location: yup_1.string().nullable(),
    messages: yup_1.array().of(exports.shiftMessageSchema),
    start: exports.shiftEventSchema.required(),
    user: yup_1.string().required(),
}, { strict: true, stripUnknown: false });
exports.default = exports.shiftSchema;
//# sourceMappingURL=shiftSchema.js.map