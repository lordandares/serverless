"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const errors_1 = require("../errors");
exports.ValidationError = errors_1.ValidationError;
const constants = __importStar(require("./constants"));
exports.constants = constants;
__export(require("./actionSchema"));
__export(require("./actorSchema"));
__export(require("./applicationSchema"));
__export(require("./ruleDocumentSchema"));
__export(require("./scheduleDocumentBaseSchema"));
__export(require("./scheduleDocumentSchema"));
__export(require("./scheduleLocationDocumentSchema"));
__export(require("./scheduleOccurrenceDocumentSchema"));
__export(require("./schedulePayloadSchema"));
__export(require("./shiftSchema"));
const defaultValidateOptions = {
    strict: true,
    stripUnknown: true,
};
function validate({ schema, data, options = {} }) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const result = yield schema.validate(data, Object.assign(Object.assign({}, defaultValidateOptions), options));
        }
        catch (err) {
            throw new errors_1.ValidationError({
                data: err,
            });
        }
    });
}
exports.validate = validate;
//# sourceMappingURL=index.js.map