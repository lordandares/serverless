"use strict";
// https://rclayton.silvrback.com/custom-errors-in-node-js
Object.defineProperty(exports, "__esModule", { value: true });
class DomainError extends Error {
    constructor(message) {
        super(message);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.default = DomainError;
//# sourceMappingURL=DomainError.js.map