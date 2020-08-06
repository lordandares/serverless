import { ArmResourceTemplate } from "../models/armTemplates";
import { CompositeArmTemplate } from "./compositeArmTemplate";
declare class PremiumPlanTemplate extends CompositeArmTemplate {
    constructor();
    getTemplate(): ArmResourceTemplate;
}
declare const _default: PremiumPlanTemplate;
export default _default;
