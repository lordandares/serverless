import * as helpers from './helpers';
interface WinteamApplication {
    _id: string;
    name: string;
    plugins: {
        winteam?: {
            enabled: boolean;
            options?: object;
        };
    };
}
interface WinteamParams {
    endpoint: string;
    message?: object;
    method?: string;
}
interface WinteamError {
    FieldName: string;
    AttemptedValue: string;
    ErrorMessage: string;
    ErrorType: string;
}
interface WinteamResult {
    JobNumber: string;
    PunchStatus: string;
    PunchTime: string;
    StatusReason: string;
}
interface WinteamResponse {
    Errors?: WinteamError[];
    Result?: WinteamResult;
}
declare function request(application: WinteamApplication, params: WinteamParams): Promise<WinteamResponse>;
export { helpers, request };
