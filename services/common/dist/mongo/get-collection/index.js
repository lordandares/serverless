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
Object.defineProperty(exports, "__esModule", { value: true });
const create_client_1 = require("../create-client");
function getCollection(collectionName) {
    return __awaiter(this, void 0, void 0, function* () {
        console.info('getCollection', { collectionName });
        const secretId = process.env.MONGODB_SECRET_ID;
        const client = yield create_client_1.createClient(secretId);
        const db = client.db();
        const collection = db.collection(collectionName);
        return collection;
    });
}
exports.getCollection = getCollection;
//# sourceMappingURL=index.js.map