import { APIGatewayProxyResult } from 'aws-lambda';
import DomainError from './DomainError';
import UnknownError from './UnknownError';
interface CustomError extends Error {
    data?: object;
    message: string;
    status?: number;
}
export { DomainError, UnknownError };
export { default as ApplicationError } from './ApplicationError';
export { default as ResourceNotFoundError } from './ResourceNotFoundError';
export { default as ValidationError } from './ValidationError';
export declare function isKnownError(err: Error): boolean;
export declare function httpErrorHandler(err: CustomError): APIGatewayProxyResult;
