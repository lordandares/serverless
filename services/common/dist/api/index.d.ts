declare type ClientRequest = (url: string, options: RequestOptions) => Promise<any>;
interface RequestOptions {
    body?: any;
    headers?: object;
    query?: {
        [key: string]: any;
    };
}
interface Client {
    post: ClientRequest;
    get: ClientRequest;
    put: ClientRequest;
    delete: ClientRequest;
}
export declare function createClient(): Client;
export {};
