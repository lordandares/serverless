"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const DomainError_1 = __importDefault(require("./DomainError"));
/*
 * Generic error for when we don't have a catch for a specific problem
 */
class UnknownError extends DomainError_1.default {
    constructor() {
        super('Something went wrong! Try again or contact support if the problem persists.');
        this.status = 500;
    }
}
exports.default = UnknownError;
//# sourceMappingURL=UnknownError.js.map