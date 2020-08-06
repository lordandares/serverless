import DomainError from './DomainError';
export default class UnknownError extends DomainError {
    data: object;
    status: number;
    constructor();
}
