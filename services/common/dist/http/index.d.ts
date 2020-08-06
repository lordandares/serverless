export declare const STATUS_CODES: {
    INFORMATIONAL: {
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/100}
         */
        CONTINUE: number;
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/101}
         */
        SWITCHING_PROTOCOLS: number;
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/102}
         */
        PROCESSING: number;
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/103}
         */
        EARLY_HINTS: number;
    };
    SUCCESSFUL: {
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/200}
         */
        OK: number;
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/201}
         */
        CREATED: number;
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/202}
         */
        ACCEPTED: number;
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/203}
         */
        NON_AUTHORITATIVE_INFORMATION: number;
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/204}
         */
        NO_CONTENT: number;
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/205}
         */
        RESET_CONTENT: number;
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/206}
         */
        PARTIAL_CONTENT: number;
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/207}
         */
        MULTI_STATUS: number;
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/208}
         */
        ALREADY_REPORTED: number;
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/226}
         */
        IM_USED: number;
    };
    REDIRECTS: {
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/300}
         */
        MULTIPLE_CHOICES: number;
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/301}
         */
        MOVED_PERMANENTLY: number;
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/302}
         */
        FOUND: number;
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/303}
         */
        SEE_OTHER: number;
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/304}
         */
        NOT_MODIFIED: number;
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/305}
         */
        USE_PROXY: number;
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/307}
         */
        TEMPORARY_REDIRECT: number;
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/308}
         */
        PERMANENT_REDIRECT: number;
    };
    CLIENT_ERRORS: {
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/400}
         */
        BAD_REQUEST: number;
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/401}
         */
        UNAUTHORIZED: number;
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/402}
         */
        PAYMENT_REQUIRED: number;
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/403}
         */
        FORBIDDEN: number;
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/404}
         */
        NOT_FOUND: number;
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/405}
         */
        METHOD_NOT_ALLOWED: number;
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/406}
         */
        NOT_ACCEPTABLE: number;
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/407}
         */
        PROXY_AUTHENTICATION_REQUIRED: number;
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/408}
         */
        REQUEST_TIMEOUT: number;
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/409}
         */
        CONFLICT: number;
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/410}
         */
        GONE: number;
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/411}
         */
        LENGTH_REQUIRED: number;
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/412}
         */
        PRECONDITION_FAILED: number;
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/413}
         */
        PAYLOAD_TOO_LARGE: number;
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/414}
         */
        URI_TOO_LONG: number;
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/415}
         */
        UNSUPPORTED_MEDIA_TYPE: number;
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/416}
         */
        RANGE_NOT_SATISFIABLE: number;
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/417}
         */
        EXPECTATION_FAILED: number;
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/418}
         */
        IM_A_TEAPOT: number;
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/421}
         */
        MISDIRECTED_REQUEST: number;
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/422}
         */
        UNPROCESSABLE_ENTITY: number;
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/423}
         */
        LOCKED: number;
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/424}
         */
        FAILED_DEPENDENCY: number;
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/425}
         */
        UNORDERED_COLLECTION: number;
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/426}
         */
        UPGRADE_REQUIRED: number;
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/428}
         */
        PRECONDITION_REQUIRED: number;
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/429}
         */
        TOO_MANY_REQUESTS: number;
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/431}
         */
        REQUEST_HEADER_FIELDS_TOO_LARGE: number;
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/451}
         */
        UNAVAILABLE_FOR_LEGAL_REASONS: number;
    };
    SERVER_ERRORS: {
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/500}
         */
        INTERNAL_SERVER_ERROR: number;
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/501}
         */
        NOT_IMPLEMENTED: number;
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/502}
         */
        BAD_GATEWAY: number;
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/503}
         */
        SERVICE_UNAVAILABLE: number;
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/504}
         */
        GATEWAY_TIMEOUT: number;
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/505}
         */
        HTTP_VERSION_NOT_SUPPORTED: number;
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/506}
         */
        VARIANT_ALSO_NEGOTIATES: number;
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/507}
         */
        INSUFFICIENT_STORAGE: number;
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/508}
         */
        LOOP_DETECTED: number;
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/509}
         */
        BANDWIDTH_LIMIT_EXCEEDED: number;
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/510}
         */
        NOT_EXTENDED: number;
        /**
         * Reference: {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/511}
         */
        NETWORK_AUTHENTICATION_REQUIRED: number;
    };
};
