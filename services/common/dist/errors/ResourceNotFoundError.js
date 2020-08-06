"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const DomainError_1 = __importDefault(require("./DomainError"));
class ResourceNotFoundError extends DomainError_1.default {
    constructor({ id, data, resource }) {
        super(`The Resource "${resource}" with ID of "${id ||
            'Unknown'}" could not be found`);
        this.status = 404;
        this.data = Object.assign({ resource, id }, data);
    }
}
exports.default = ResourceNotFoundError;
//# sourceMappingURL=ResourceNotFoundError.js.map