import { CartItem } from "../models/cart.model";
import { DiscountConditionEA_D, DiscountConditionGroupEA_C, Operator } from "../models/discount";

export function evaluateCartConditions(
    groups: DiscountConditionGroupEA_C[],
    cart: CartItem[],
    shipping: { city: string; cost: number }
): boolean {
    if (!groups || groups.length === 0) {
        // console.log("🚫 No discount groups provided. Returning FALSE.");
        return false;
    }

    // console.log("🔍 Evaluating Discount Groups:", groups);

    return groups.every((group, groupIndex) => {
        // console.log(`\n🧩 Group ${groupIndex + 1} Evaluation Start`);
        // console.log("Group object:", group);

        const logicOperatorStr = group.logicOperator ? "AND" : "OR";
        // console.log(`Logic Operator: '${logicOperatorStr}'`);

        const conditions = group.conditions ?? [];
        if (!Array.isArray(conditions)) {
            // console.warn(`⚠️ Group ${groupIndex + 1} conditions invalid or missing — returning FALSE`);
            return false;
        }

        // console.log(`Conditions (${conditions.length}):`, conditions);

        if (group.logicOperator) {
            // AND group logic with PRODUCT filter propagation

            const productConditions = conditions.filter(c => c.conditionType === "PRODUCT");
            const orderConditions = conditions.filter(c => c.conditionType === "ORDER");
            const otherConditions = conditions.filter(c => c.conditionType !== "PRODUCT" && c.conditionType !== "ORDER");

            // Step 1: Filter cart items using ALL PRODUCT conditions
            let filteredCart = [...cart];
            for (const pc of productConditions) {
                const parsedValues = parseValue(pc.value);
                filteredCart = filteredCart.filter(item =>
                    checkProductCondition(pc.conditionDetail, parsedValues, pc.operator, [item])
                );
            }

            // Step 2: Evaluate PRODUCT conditions on full cart (to check they exist)
            const productResults = productConditions.map(pc => {
                const parsedValues = parseValue(pc.value);
                return checkProductCondition(pc.conditionDetail, parsedValues, pc.operator, cart);
            });

            // Step 3: Evaluate ORDER conditions on filtered cart
            const orderResults = orderConditions.map(oc => {
                const parsedValues = parseValue(oc.value);
                return checkOrderCondition(oc.conditionDetail, parsedValues, oc.operator, filteredCart, shipping);
            });

            // Step 4: Evaluate other conditions on full cart
            const otherResults = otherConditions.map(oc => evaluateSingleCondition(oc, cart, shipping));

            const allResults = [...productResults, ...orderResults, ...otherResults];
            return allResults.every(Boolean);

        } else {
            // OR logic - evaluate normally
            const results = conditions.map(c => evaluateSingleCondition(c, cart, shipping));
            return results.some(Boolean);
        }

    });
}

function evaluateSingleCondition(
    condition: DiscountConditionEA_D,
    cartItems: CartItem[],
    shipping: { city?: string; cost?: number }
): boolean {
    let values: string[] = [];

    try {
        values = Array.isArray(condition.value)
            ? condition.value
            : JSON.parse(condition.value);
    } catch (e) {
        console.warn(`⚠️ Failed to parse condition value for condition [${condition.conditionType}:${condition.conditionDetail}]:`, condition.value, e);
        return false;
    }

    const operator = condition.operator;
    const detail = condition.conditionDetail;

    // console.log(`🔎 Evaluating condition type='${condition.conditionType}' detail='${detail}' operator='${operator}' with values=`, values);

    switch (condition.conditionType) {
        case "PRODUCT":
            return checkProductCondition(detail, values, operator, cartItems);

        case "ORDER":
            return checkOrderCondition(detail, values, operator, cartItems, shipping);

        case "CUSTOMER_GROUP":
            // console.log(`👥 Using backend-calculated eligibility: ${condition.eligible}`);
            return condition.eligible === true;

        default:
            console.warn(`❓ Unknown condition type '${condition.conditionType}' — returning FALSE`);
            return false;
    }
}

function checkProductCondition(
    detail: string,
    values: string[],
    operator: Operator,
    cartItems: CartItem[]
): boolean {
    const matched = cartItems.some(item => {
        const target = detail === 'brand' ? item.brandId
            : detail === 'category' ? item.categoryId
                : item.productId;

        const res = compareValues(target, values, operator);
        //console.log(`  🛒 Product condition check for target='${target}': ${res}`);
        return res;
    });

    // console.log(`  🛒 Overall PRODUCT condition result: ${matched}`);
    return matched;
}

function checkOrderCondition(
    detail: string,
    values: string[],
    operator: Operator,
    cartItems: CartItem[],
    shipping: { city?: string; cost?: number }
): boolean {
    const totalQty = cartItems.reduce((sum, i) => sum + i.quantity, 0);
    const totalAmount = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

    let targetValue: string | number;

    switch (detail) {
        case 'order_total':
            targetValue = totalAmount;
            // console.log(`  📦 ORDER TOTAL = ${targetValue}`);
            break;
        case 'item_count':
            targetValue = totalQty;
            // console.log(`  🧾 ITEM COUNT = ${targetValue}`);
            break;
        case 'shipping_cost':
            targetValue = shipping.cost ?? 0;
            //  console.log(`  🚚 SHIPPING COST = ${targetValue}`);
            break;
        case 'shipping_city':
            targetValue = shipping.city ?? '';
            //  console.log(`  🌆 SHIPPING CITY = "${targetValue}"`);
            break;
        default:
            targetValue = 0;
        //  console.warn(`  ⚠️ Unknown ORDER condition detail '${detail}'. Defaulting to 0.`);
    }

    //console.log(`  🔍 Comparing ORDER condition: targetValue='${targetValue}' operator='${operator}' against values=`, values);

    const result = compareValues(targetValue, values, operator);
    // console.log(`  ✅ ORDER condition result: ${result}`);

    return result;
}

function compareValues(value: any, targetValues: string[], operator: Operator): boolean {
    const rawTarget = targetValues?.[0];

    if (rawTarget === undefined) {
        //   console.warn("⚠️ No target value provided for comparison.");
        return false;
    }

    const parsedTarget = parseFloat(String(rawTarget).trim());
    const parsedValue = typeof value === 'number' ? value : parseFloat(String(value).trim());

    //console.log(`    📊 Comparing '${parsedValue}' ${operator} '${parsedTarget}'`);

    if (isNaN(parsedValue) || isNaN(parsedTarget)) {
        // console.warn(`    ❌ Comparison failed due to NaN → value: ${parsedValue}, target: ${parsedTarget}`);
        return false;
    }

    switch (operator) {
        case 'EQUAL': return parsedValue === parsedTarget;
        case 'IS_ONE_OF':
            return targetValues.some(v => String(v).trim() === String(value));
        // return targetValues.map(v => v.trim()).includes(String(value));
        case 'GREATER_THAN': return parsedValue > parsedTarget;
        case 'LESS_THAN': return parsedValue < parsedTarget;
        case 'GREATER_THAN_OR_EQUAL': return parsedValue >= parsedTarget;
        case 'LESS_THAN_OR_EQUAL': return parsedValue <= parsedTarget;
        default:
            console.warn(`    ⚠️ Unknown operator '${operator}'. Returning FALSE.`);
            return false;
    }
}

function parseValue(val: any): string[] {
    try {
        return Array.isArray(val) ? val : JSON.parse(val);
    } catch {
        return [];
    }
}

export function parseStringArray(raw: string | string[]): string[] {
    if (Array.isArray(raw)) {
        return raw.map(v => String(v));
    }

    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.map(v => String(v)) : [String(parsed)];
    } catch {
        return [String(raw)];
    }
}

export function buildPlaceholderList(type: string, count: number): string {
    if (count === 1) return `{{${type}}}`;

    // For multiple, generate numbered placeholders
    const placeholders = [];
    for (let i = 1; i <= count; i++) {
        placeholders.push(`{{${type}${i}}}`);
    }

    if (count === 2) {
        // Join with ' or '
        return placeholders.join(" or ");
    }

    // For 3 or more: join with commas and 'or' before last
    return placeholders.slice(0, -1).join(", ") + ", or " + placeholders.slice(-1);
}


// export function parseStringArray(raw: string): string[] {
//     try {
//         const parsed = JSON.parse(raw);
//         return Array.isArray(parsed) ? parsed : [parsed];
//     } catch {
//         return [raw];
//     }
// }
