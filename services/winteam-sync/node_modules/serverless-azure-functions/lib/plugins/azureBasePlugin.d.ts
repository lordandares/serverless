import Serverless from "serverless";
import { ServerlessAzureConfig, ServerlessCliCommand, ServerlessCommandMap, ServerlessHookMap } from "../models/serverless";
export declare abstract class AzureBasePlugin<TOptions = Serverless.Options> {
    protected serverless: Serverless;
    protected options: TOptions;
    hooks: ServerlessHookMap;
    protected config: ServerlessAzureConfig;
    protected commands: ServerlessCommandMap;
    protected processedCommands: ServerlessCliCommand[];
    constructor(serverless: Serverless, options: TOptions);
    protected log(message: string): void;
    protected getOption(key: string, defaultValue?: any): string;
}
