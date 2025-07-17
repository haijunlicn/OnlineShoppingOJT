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

        console.log(`Conditions (${conditions.length}):`, conditions);

        const results = conditions.map((condition, i) => {
            // console.log(`\n  ➡️ Condition ${i + 1} Evaluation Start`);
            // console.log("  Condition object:", condition);

            // ⛔ Skip evaluation if eligible is already set
            if (condition.eligible !== null && condition.eligible !== undefined) {
              //  console.log(`  🔁 Skipping evaluation, using cached eligible = ${condition.eligible}`);
                return condition.eligible === true;
            }

            const result = evaluateSingleCondition(condition, cart, shipping);
          //  console.log(`  Condition Result: [${condition.conditionType}:${condition.conditionDetail}] → ${result}`);
            return result;
        });

        const groupResult = group.logicOperator
            ? results.every(Boolean)   // AND logic
            : results.some(Boolean);   // OR logic

        // console.log(`\n🧮 Group ${groupIndex + 1} Final Result: ${groupResult}`);
        // console.log("🧩 Group Evaluation End\n");

        return groupResult;
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
        //console.warn(`⚠️ Failed to parse condition value for condition [${condition.conditionType}:${condition.conditionDetail}]:`, condition.value, e);
        return false;
    }

    const operator = condition.operator;
    const detail = condition.conditionDetail;

  //  console.log(`🔎 Evaluating condition type='${condition.conditionType}' detail='${detail}' operator='${operator}' with values=`, values);

    switch (condition.conditionType) {
        case "PRODUCT":
            return checkProductCondition(detail, values, operator, cartItems);

        case "ORDER":
            return checkOrderCondition(detail, values, operator, cartItems, shipping);

        default:
           // console.warn(`❓ Unknown condition type '${condition.conditionType}' — returning FALSE`);
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
        case 'IS_ONE_OF': return targetValues.map(v => v.trim()).includes(String(value));
        case 'GREATER_THAN': return parsedValue > parsedTarget;
        case 'LESS_THAN': return parsedValue < parsedTarget;
        case 'GREATER_THAN_OR_EQUAL': return parsedValue >= parsedTarget;
        case 'LESS_THAN_OR_EQUAL': return parsedValue <= parsedTarget;
        default:
          //  console.warn(`    ⚠️ Unknown operator '${operator}'. Returning FALSE.`);
            return false;
    }
}
