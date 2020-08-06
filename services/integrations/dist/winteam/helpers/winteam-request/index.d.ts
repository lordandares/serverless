interface WinteamPostRequest {
    baseUrl: string;
    body: object;
    endpoint: string;
    headers: {
        subscriptionKey: string;
        tenantId: string;
    };
    method: string;
}
interface WinteamGetRequest {
    baseUrl: string;
    endpoint: string;
    headers: {
        subscriptionKey: string;
        tenantId: string;
    };
    method: string;
}
export default function winteamRequest(request: WinteamPostRequest): Promise<any>;
export declare function winteamGetRequest(request: WinteamGetRequest): Promise<any>;
export {};
