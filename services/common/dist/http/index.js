"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.STATUS_CODES = {
    INFORMATIONAL: {
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/100}
         */
        CONTINUE: 100,
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/101}
         */
        SWITCHING_PROTOCOLS: 101,
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/102}
         */
        PROCESSING: 102,
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/103}
         */
        EARLY_HINTS: 103,
    },
    SUCCESSFUL: {
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/200}
         */
        OK: 200,
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/201}
         */
        CREATED: 201,
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/202}
         */
        ACCEPTED: 202,
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/203}
         */
        NON_AUTHORITATIVE_INFORMATION: 203,
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/204}
         */
        NO_CONTENT: 204,
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/205}
         */
        RESET_CONTENT: 205,
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/206}
         */
        PARTIAL_CONTENT: 206,
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/207}
         */
        MULTI_STATUS: 207,
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/208}
         */
        ALREADY_REPORTED: 208,
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/226}
         */
        IM_USED: 226,
    },
    REDIRECTS: {
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/300}
         */
        MULTIPLE_CHOICES: 300,
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/301}
         */
        MOVED_PERMANENTLY: 301,
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/302}
         */
        FOUND: 302,
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/303}
         */
        SEE_OTHER: 303,
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/304}
         */
        NOT_MODIFIED: 304,
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/305}
         */
        USE_PROXY: 305,
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/307}
         */
        TEMPORARY_REDIRECT: 307,
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/308}
         */
        PERMANENT_REDIRECT: 308,
    },
    CLIENT_ERRORS: {
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/400}
         */
        BAD_REQUEST: 400,
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/401}
         */
        UNAUTHORIZED: 401,
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/402}
         */
        PAYMENT_REQUIRED: 402,
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/403}
         */
        FORBIDDEN: 403,
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/404}
         */
        NOT_FOUND: 404,
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/405}
         */
        METHOD_NOT_ALLOWED: 405,
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/406}
         */
        NOT_ACCEPTABLE: 406,
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/407}
         */
        PROXY_AUTHENTICATION_REQUIRED: 407,
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/408}
         */
        REQUEST_TIMEOUT: 408,
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/409}
         */
        CONFLICT: 409,
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/410}
         */
        GONE: 410,
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/411}
         */
        LENGTH_REQUIRED: 411,
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/412}
         */
        PRECONDITION_FAILED: 412,
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/413}
         */
        PAYLOAD_TOO_LARGE: 413,
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/414}
         */
        URI_TOO_LONG: 414,
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/415}
         */
        UNSUPPORTED_MEDIA_TYPE: 415,
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/416}
         */
        RANGE_NOT_SATISFIABLE: 416,
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/417}
         */
        EXPECTATION_FAILED: 417,
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/418}
         */
        IM_A_TEAPOT: 418,
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/421}
         */
        MISDIRECTED_REQUEST: 421,
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/422}
         */
        UNPROCESSABLE_ENTITY: 422,
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/423}
         */
        LOCKED: 423,
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/424}
         */
        FAILED_DEPENDENCY: 424,
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/425}
         */
        UNORDERED_COLLECTION: 425,
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/426}
         */
        UPGRADE_REQUIRED: 426,
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/428}
         */
        PRECONDITION_REQUIRED: 428,
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/429}
         */
        TOO_MANY_REQUESTS: 429,
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/431}
         */
        REQUEST_HEADER_FIELDS_TOO_LARGE: 431,
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/451}
         */
        UNAVAILABLE_FOR_LEGAL_REASONS: 451,
    },
    SERVER_ERRORS: {
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/500}
         */
        INTERNAL_SERVER_ERROR: 500,
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/501}
         */
        NOT_IMPLEMENTED: 501,
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/502}
         */
        BAD_GATEWAY: 502,
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/503}
         */
        SERVICE_UNAVAILABLE: 503,
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/504}
         */
        GATEWAY_TIMEOUT: 504,
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/505}
         */
        HTTP_VERSION_NOT_SUPPORTED: 505,
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/506}
         */
        VARIANT_ALSO_NEGOTIATES: 506,
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/507}
         */
        INSUFFICIENT_STORAGE: 507,
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/508}
         */
        LOOP_DETECTED: 508,
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/509}
         */
        BANDWIDTH_LIMIT_EXCEEDED: 509,
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/510}
         */
        NOT_EXTENDED: 510,
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/511}
         */
        NETWORK_AUTHENTICATION_REQUIRED: 511,
    },
};
//# sourceMappingURL=index.js.map