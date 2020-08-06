"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const DomainError_1 = __importDefault(require("./DomainError"));
exports.DomainError = DomainError_1.default;
const UnknownError_1 = __importDefault(require("./UnknownError"));
exports.UnknownError = UnknownError_1.default;
var ApplicationError_1 = require("./ApplicationError");
exports.ApplicationError = ApplicationError_1.default;
var ResourceNotFoundError_1 = require("./ResourceNotFoundError");
exports.ResourceNotFoundError = ResourceNotFoundError_1.default;
var ValidationError_1 = require("./ValidationError");
exports.ValidationError = ValidationError_1.default;
function isKnownError(err) {
    return err instanceof DomainError_1.default;
}
exports.isKnownError = isKnownError;
function httpErrorHandler(err) {
    const error = isKnownError(err) ? err : new UnknownError_1.default();
    const body = JSON.stringify(Object.assign(Object.assign({}, error), { message: error.message }));
    const statusCode = error.status || 500;
    return {
        body,
        statusCode,
    };
}
exports.httpErrorHandler = httpErrorHandler;
//# sourceMappingURL=index.js.map