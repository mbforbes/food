/// <reference path="constants.ts" />
/// <reference path="parse.ts" />

// Units we have (at time of writing):
//
// volume
// - 'tbs', 'tbsp', 'tsp', 'cup', 'cups', 'fl-oz',
//
// weight
// - 'lb', 'lbs', 'g'
//
// string matching
// - 'scoop', 'scoops', 'pcs', 'psc', 'bag', 'bags', 'bunch', 'bunches', 'fillet',
//   'fillets', 'bottle', 'bottles', 'bar', 'bars', 'cloves', 'clove', 'pack', 'packs',

/**
 * Standardize unit references w/ alt spellings, misspellings, and plurals. If a unit
 * isn't in here, it's used as written.
 */
const UnitStandardize = new Map([
    // volume
    ['tbs', 'tbsp'],
    ['cups', 'cup'],

    // weight
    ['lbs', 'lb'],
    ['pounds', 'lb'],
    ['pound', 'lb'],

    // string matching
    ['scoops', 'scoop'],
    ['pieces', 'psc'],
    ['piece', 'psc'],
    ['pcs', 'psc'],
    ['bags', 'bag'],
    ['bunches', 'bunch'],
    ['fillets', 'fillet'],
    ['bottles', 'bottle'],
    ['bars', 'bar'],
    ['boxes', 'box'],
    ['cloves', 'clove'],
    ['packs', 'pack'],
    ['packets', 'pack'],
    ['packet', 'pack'],
    ['heads', 'head'],
    ['dabs', 'dab'],
    ['slices', 'slice'],
    ['cans', 'can'],
    ['fillets', 'fillet'],
    ['inches', 'inch'],
    ['sprigs', 'sprig'],
]);

/**
 * Convert units of the same type (volume, weight, etc.) to a common denominator so they
 * are comparable.
 */
const UnitConversion: Map<string, [number, string]> = new Map([
    // volume: to tsp
    ['tsp', [1, 'tsp']],
    ['tbsp', [3, 'tsp']],
    ['cup', [48, 'tsp']],
    ['fl-oz', [6, 'tsp']],
    ['ml', [0.202884, 'tsp']],

    // weight: to g
    ['g', [1, 'g']],
    ['lb', [453.59237, 'g']],
    ['oz', [28.3495, 'g']],
]);


/**
 * Converts JSON data from calories.json file to CalorieBank.
 */
function buildBank(cf: CalorieFile): CalorieBank {
    let bank: CalorieBank = {};
    for (let ingredient in cf) {

        let calorieData = {};
        for (let calorieSpec of cf[ingredient]) {
            let [calories, quantityAndunitRaw] = calorieSpec;
            let [quantity, unitRaw] = getQU(quantityAndunitRaw.split(' '));

            // standardize alternate spellings
            let unit = UnitStandardize.has(unitRaw) ? UnitStandardize.get(unitRaw) : unitRaw;

            // pre-convert if possible
            if (UnitConversion.has(unit)) {
                let [scaleQuantity, scaleUnit] = UnitConversion.get(unit);
                quantity *= scaleQuantity
                unit = scaleUnit;
            }

            // save
            let calorieUnitData: CalorieUnitData = {
                calories: calories,
                quantity: quantity,
            }
            calorieData[unit] = calorieUnitData;
        }

        bank[ingredient] = calorieData;
    }
    return bank;
}

/**
 * Gets calories for the provided ingredient QUT (quantity unit thing) string.
 */
function getCalories(bank: CalorieBank, ingredientQUT: string): number {
    let [quantity, unitRaw, ingredient] = getQUT(ingredientQUT.split(' '));

    if (!(ingredient in bank)) {
        console.error('Ingredient "' + ingredient + '" not found in calorie bank.');
        return -1;
    }

    // standardize input unit reference
    let unit = UnitStandardize.has(unitRaw) ? UnitStandardize.get(unitRaw) : unitRaw;

    let calorieData = bank[ingredient];
    if (unit in calorieData) {
        // we have a direct unit match. scale quantities and go.
        let calorieUnitData = calorieData[unit];
        return Math.round(calorieUnitData.calories * (quantity / calorieUnitData.quantity));
    }

    // no direct match. try scaling w/ conversion table.

    if (!UnitConversion.has(unit)) {
        // if we can't scale the unit, give up
        console.error('Ingredient "' + ingredient + '" has unmatched unit "' + unit +
            '", unconvertible and not found in calorie bank.');
        return -1;
    }

    // scale to `newQuantity` of `newUnit`
    let [scaleQuantity, newUnit] = UnitConversion.get(unit);
    let newQuantity = scaleQuantity * quantity;
    if (!(newUnit in calorieData)) {
        console.error('Converted ingredient "' + ingredient + '" from unit "' + unit +
            '" to unit "' + newUnit + '", but "' + newUnit + '" not found in calorie ' +
            'data for ingredient. Available units: ' +
            Object.keys(calorieData).join(', '));
        return -1;
    }

    // converted unit match! scale.
    let calorieUnitData = calorieData[newUnit];
    return Math.round(calorieUnitData.calories * (newQuantity / calorieUnitData.quantity));
}
