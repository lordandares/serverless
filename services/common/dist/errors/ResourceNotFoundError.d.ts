import DomainError from './DomainError';
interface Options {
    data?: object;
    id?: string | null;
    resource: string;
}
export default class ResourceNotFoundError extends DomainError {
    data: object;
    status: number;
    constructor({ id, data, resource }: Options);
}
export {};
