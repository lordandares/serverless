import { Schema, ValidateOptions } from 'yup';
import { ValidationError } from '../errors';
import * as constants from './constants';
export { constants, ValidationError };
export * from './actionSchema';
export * from './actorSchema';
export * from './applicationSchema';
export * from './ruleDocumentSchema';
export * from './scheduleDocumentBaseSchema';
export * from './scheduleDocumentSchema';
export * from './scheduleLocationDocumentSchema';
export * from './scheduleOccurrenceDocumentSchema';
export * from './schedulePayloadSchema';
export * from './shiftSchema';
interface Validate {
    schema: Schema<any>;
    data: object;
    options?: ValidateOptions;
}
export declare function validate({ schema, data, options }: Validate): Promise<void>;
