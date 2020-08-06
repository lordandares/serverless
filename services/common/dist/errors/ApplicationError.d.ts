import DomainError from './DomainError';
interface Options {
    data?: object;
    message: string;
}
export default class ApplicationError extends DomainError {
    data: object | undefined;
    status: number;
    constructor({ data, message }: Options);
}
export {};
