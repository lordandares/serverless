import { CompositeArmTemplate } from "./compositeArmTemplate";
import { ArmResourceTemplate } from "../models/armTemplates";
declare class AppServiceEnvironmentTemplate extends CompositeArmTemplate {
    constructor();
    getTemplate(): ArmResourceTemplate;
}
declare const _default: AppServiceEnvironmentTemplate;
export default _default;
