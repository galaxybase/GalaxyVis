import { RuleOptions } from '../types'
import { StyleRule } from './styleRule'

/**
 * @class StyleClass
 * @constructor
 * @param galaxyvis
 * @param name
 * @param options
 * @param stylesAddRule
 * @param RuleOrClass
 */
export class StyleClass<T, K> extends StyleRule<T, K> {
    constructor(
        galaxyvis: any,
        name: string,
        options: RuleOptions,
        stylesAddRule: any,
        RuleOrClass = 2,
    ) {
        super(galaxyvis, name, options, stylesAddRule, RuleOrClass)
    }
}
