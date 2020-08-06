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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongodb_1 = __importDefault(require("mongodb"));
let cachedDb;
function connect(mongoDbUri) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (!mongoDbUri) {
                throw new Error('MongoConnectionError: mongoDbUri is not defined');
            }
            if (cachedDb) {
                return cachedDb;
            }
            console.info('mongo:connect');
            const db = yield mongodb_1.default.MongoClient.connect(mongoDbUri);
            console.info('mongo:connect:success');
            cachedDb = db;
            return cachedDb;
        }
        catch (err) {
            throw new Error(`MongoConnectionError: ${err.message}`);
        }
    });
}
exports.default = connect;
//# sourceMappingURL=index.js.map