"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fp_1 = require("lodash/fp");
const mongodb_1 = __importDefault(require("mongodb"));
const REGEX_OBJECT_ID = /^[0-9a-fA-F]{24}$/;
// @ts-ignore
const reduceWithKey = fp_1.reduce.convert({ cap: false });
function parseQueryParams(queryParams) {
    return reduceWithKey((accum, value, key) => {
        const paramValue = REGEX_OBJECT_ID.test(value)
            ? new mongodb_1.default.ObjectId(value)
            : value;
        accum[key] = paramValue;
        return accum;
    }, {})(queryParams);
}
exports.parseQueryParams = parseQueryParams;
exports.default = {
    parseQueryParams,
};
//# sourceMappingURL=index.js.map