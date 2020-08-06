"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const DomainError_1 = __importDefault(require("./DomainError"));
class ApplicationError extends DomainError_1.default {
    constructor({ data, message }) {
        super(message);
        this.status = 500;
        this.data = data;
    }
}
exports.default = ApplicationError;
//# sourceMappingURL=ApplicationError.js.map