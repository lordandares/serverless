"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const yup_1 = require("yup");
yup_1.addMethod(yup_1.mixed, 'requiredWhen', function (property, value = true) {
    return this.when(property, {
        is: value,
        then: s => s.required(),
    });
});
//# sourceMappingURL=customYupMethods.js.map