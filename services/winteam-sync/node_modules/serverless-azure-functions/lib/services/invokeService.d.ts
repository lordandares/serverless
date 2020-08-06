import { BaseService } from "./baseService";
import Serverless from "serverless";
import { FunctionAppService } from "./functionAppService";
export declare class InvokeService extends BaseService {
    functionAppService: FunctionAppService;
    private local;
    constructor(serverless: Serverless, options: Serverless.Options, local?: boolean);
    /**
     * Invoke an Azure Function
     * @param method HTTP method
     * @param functionName Name of function to invoke
     * @param data Data to use as body or query params
     */
    invoke(method: string, functionName: string, data?: any): Promise<import("axios").AxiosResponse<any>>;
    private getUrl;
    private getLocalHost;
    private getConfiguredFunctionRoute;
    private getQueryString;
    /**
     * Get options object
     * @param method The method used (POST or GET)
     * @param data Data to use as body or query params
     */
    private getRequestOptions;
}
