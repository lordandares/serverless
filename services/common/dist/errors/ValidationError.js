"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const yup_1 = require("yup");
const DomainError_1 = __importDefault(require("./DomainError"));
const DEFAULT_MESSAGE = 'The data you submitted was invalid. Please try again with valid data.';
class ValidationError extends DomainError_1.default {
    constructor({ data, message = DEFAULT_MESSAGE }) {
        // When the data object is a schema validation error, take its data
        // attributes and apply to our wrapped error
        if (data instanceof yup_1.ValidationError) {
            const { message: validationMessage, name } = data, other = __rest(data, ["message", "name"]);
            super(validationMessage);
            this.data = other;
            this.status = 400;
            return;
        }
        super(message);
        this.data = data;
        this.status = 400;
    }
}
exports.default = ValidationError;
//# sourceMappingURL=ValidationError.js.map