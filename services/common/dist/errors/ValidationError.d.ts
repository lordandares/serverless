import DomainError from './DomainError';
interface Options {
    data?: any;
    message?: string;
}
export default class ValidationError extends DomainError {
    data: object;
    message: string;
    status: number;
    constructor({ data, message }: Options);
}
export {};
