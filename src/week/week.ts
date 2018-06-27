/// <reference path="../../lib/moment.d.ts" />
/// <reference path="../../lib/jquery.d.ts" />

//
// constants
//

// http://unicodefractions.com/ for more. use hex w/o leading "&#x"
const FRAC_FOURTH = '\u{BC}' // ¼
const FRAC_THIRD = '\u{2153}' // ⅓
const FRAC_HALF = '\u{BD}'; // ½
const FRAC_TWO_THIRD = '\u{2154}' // ⅔
const FRAC_THREE_QUARTER = '\u{BE}' // ¾
const QUANT_MAP = new Map([
    [FRAC_FOURTH, 1/4],
    [FRAC_THIRD, 1/3],
    [FRAC_HALF, 1/2],
    [FRAC_TWO_THIRD, 2/3],
    [FRAC_THREE_QUARTER, 3/4],
])
function revMap<K,V>(m: Map<K, V>): Map<V,K> {
    let r = new Map<V,K>();
    for (let [key, val] of m.entries()) {
        r.set(val, key);
    }
    return r;
}
const QUANT_MAP_REV = revMap(QUANT_MAP);

const KNOWN_UNITS = new Set([
    'tbs', 'tbsp', 'tsp', 'oz', 'ozs', 'lb', 'lbs', 'cup', 'cups', 'scoop',
    'scoops', 'pcs', 'psc', 'g', 'bag', 'bags', 'bunch', 'bunches', 'fillet',
    'fillets',
]);

// things we probably don't have to buy, but should check that we have enough
// of
const BULK_THINGS = new Set([
    'butter',
    'jam',
    'maple syrup',
    'mayo',
    'olive oil',
    'pancake mix (TJ\'s pumpkin)',
    'parmesan',
    'peanut butter',
    'potato flakes',
    'protein powder',
    'quinoa (cooked)',
    'rice (white, cooked)'
])

//
// types
//

// Type explanation:
// a Week (Mon-Sun) has multiple Days
// each Day has a set of Meals (breakfast, lunch, dinner, etc.)
// each Meal has a set of Dishes (e.g., 1. chicken + rice, 2. beer)
// each Dish is keyed by a unique DishID, and has some data (title and ingredients)


type DishID = string
type DishIDObj = {
    dishID: DishID,
    guests: number,
}
type DishIDSpec = DishID | DishIDObj
type MealID = 'breakfast' | 'morningSnack' | 'lunch' | 'afternoonSnack' | 'dinner' | 'eveningSnack';
const AllMeals: MealID[] = ['breakfast', 'morningSnack', 'lunch', 'afternoonSnack', 'dinner', 'eveningSnack']
type Ingredient = [number, string]
type DayID = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
const AllDays: DayID[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

type Dish = {
    title: string,
    mealHint: MealID,
    ingredients: Ingredient[]
}

/**
 * Found in dishes.json. Map from DishID to Dish.
 */
type Dishes = {
    [key: string]: Dish,
}

type Day = {
    [m in MealID]?: DishIDSpec[]
}

/**
 * Found in any week .json file.
 */
type Week = {
    [d in DayID]?: Day
}

//
// html templates
//

// below are for the week / day / meal / dish view

function htmlDay(dayID: DayID, dayCalories: number, mealHTML: string): string {
    let displayDay = dayID[0].toUpperCase() + dayID.slice(1);

    return `
    <div class="day">
        <h1>${displayDay}</h1>
        <h4>${dayCalories} calories</h4>

        ${mealHTML}
    </div>
    `
}

function htmlMeal(mealID: MealID, mealCalories: number, dishesHTML: string): string {
    let displayMeal = mealID[0].toUpperCase() + mealID.slice(1);

    return `
    <h2>${displayMeal}</h2>
    <h3>${mealCalories} calories</h3>

    ${dishesHTML}
    `
}

function htmlDish(dishTitle: string, dishGuests: number, dishCalories: number, ingredientsHTML: string): string {
    let dishExtra = (dishGuests === 1 ? '' : ' <i>(cook x' + dishGuests + ')</i>');
    return `
    <div class="dish">
        <h1>${dishTitle}${dishExtra}</h1>
        <h2>${dishCalories} calories</h2>

        ${ingredientsHTML}
    </div>
    `
}

function htmlIngredients(ingredientsHTML: string): string {

    return `
    <table>
        <!-- Header has been disabled (for now at least) -->
        <!-- <tr>
            <th>cal</th><th class="ingredientCell">ingredient</th>
        </tr> -->
        ${ingredientsHTML}
    </table>
    `
}

function htmlIngredient(ingredient: Ingredient): string {
    return `
    <tr>
        <td class="calorieCell">${ingredient[0]}</td>
        <td class="ingredientCell">${ingredient[1]}</td>
    </tr>
    `
}

// below are for the grocery list

function htmlGroceryIngredientList(ingredientListHTML: string, checkListHTML: string): string {
    return `
    <div class="groceryListOuter">
        <div class="groceryListInner">
            <h1>Grocery List</h1>
                <h2>Buy</h2>
                <table>
                    ${ingredientListHTML}
                </table>
                <h2>Check on Hand</h2>
                <table>
                    ${checkListHTML}
                </table>
        </div>
    </div>
    `
}

function htmlGroceryIngredient(quantity: string, unit: string, thing: string): string {
    return `
    <tr>
        <td class="quantity">${quantity}</td><td>${unit}</td><td>${thing}</td>
    </tr>
    `
}

//
// funcs
//

function getWeekFilename(m: moment.Moment): string {
    return 'data/weeks/' + m.format('MMMDD-YYYY').toLowerCase() + '.json';
}

function getThisWeekFilename(): string {
    // strategy: check current day. subtract 1 day at a time until we reach
    // a monday.
    let cur = moment();
    while (cur.format('dddd') !== 'Monday') {
        cur = cur.subtract(1, 'days');
    }
    return getWeekFilename(cur);
}

function getNextWeekFilename(): string {
    // strategy: starting with tomorrow, continue adding 1 day at a time until
    // we reach a monday.
    let candidate = moment().add(1, 'days');
    while (candidate.format('dddd') != 'Monday') {
        candidate = candidate.add(1, 'days');
    }
    return getWeekFilename(candidate);
}

function onDishesLoaded(dishes: Dishes): void {
    // NOTE: picking week to load here
    console.log('this week fn:', getThisWeekFilename());
    console.log('next week fn:', getNextWeekFilename());
    let weekFN = getThisWeekFilename();
    // let weekFN = getNextWeekFilename();

    $.getJSON(weekFN, onWeekLoaded.bind(null, dishes));
}

function onWeekLoaded(dishes: Dishes, week: Week): void {
    console.log('Got dishes');
    console.log(dishes);

    console.log('Got week');
    console.log(week);

    let [weekHTML, weekIngredDescs] = renderWeek(dishes, week);
    let groceryList = renderGroceryList(weekIngredDescs);
    $('body').append(weekHTML + groceryList);
}

function addIngred(m: Map<string, number>, quantity: number, unit: string, thing: string): void {
    let key = JSON.stringify({
        thing: thing,
        unit: unit,
    })
    let cur = 0;
    if (m.has(key)) {
        cur = m.get(key);
    }
    m.set(key, cur + quantity);
}

/**
 * @returns a number OR null if the quantity could not be parsed
 */
function getQuantity(s: string): number {
    if (QUANT_MAP.has(s)) {
        return QUANT_MAP.get(s);
    }
    let candidate = parseFloat(s);
    if (isNaN(candidate)) {
        return null;
    }
    return candidate;
}

function renderQuantity(raw: number): string {
    let prec = 2;
    let inpPrec = raw.toPrecision(prec);
    for (let [num, str] of QUANT_MAP_REV.entries()) {
        if (inpPrec === num.toPrecision(prec)) {
            return str;
        }
    }
    return '' + raw;
}

/**
 * @returns a unit string OR null if unit not recognized
 */
function getUnit(s: string): string {
    if (KNOWN_UNITS.has(s)) {
        return s;
    }
    return null;
}

/**
 * @returns [quantity, unit, thing]
 */
function getQUT(pieces: string[]): [number, string, string] {
    // edge case: not enough (just one str)
    if (pieces.length < 2) {
        return [1, 'x', pieces.join(' ')];
    }

    // edge case: only two things: can't have unit
    if (pieces.length == 2) {
        let quantity = getQuantity(pieces[0]);
        if (quantity == null) {
            // if no quantity specified, return the whole name
            return [1, 'x', pieces.join(' ')];
        } else {
            // good quantity specified; use it
            return [quantity, 'x', pieces[1]];
        }
    }

    // "normal" case: possibly quantity, possibly unit
    let quantity = getQuantity(pieces[0]);
    if (quantity == null) {
        // if no quantity specified, return the whole name
        return [1, 'x', pieces.join(' ')];
    }
    // we have a quantity. see whether a unit.
    let unit = getUnit(pieces[1])
    if (unit == null) {
        // unit not known, but we have a quantity. include index 1 in name.
        return [quantity, 'x', pieces.slice(1).join(' ')];
    }
    // we have quantity AND unit. woohoo!
    return [quantity, unit, pieces.slice(2).join(' ')];
}

function sortedMapKeys(m: Map<string, number>): string[] {
    let flattened: string[] = [];

    for (let key of m.keys()) {
        flattened.push(key);
    }

    return flattened.sort((a, b) => {
        return JSON.parse(a).thing.localeCompare(JSON.parse(b).thing)
    });
}

function mergeIngredDescs(ingredDescs: string[]): string[][] {
    // first, we break descriptions out according to number, unit, and thing,
    // and merge them where units are equal. keys are stored as JSON strings
    // because only object equality is supported for map key comparison.
    let m = new Map<string, number>();
    for (let ingredDesc of ingredDescs) {
        let pieces = ingredDesc.split(' ');
        let [quantity, unit, thing] = getQUT(pieces);
        addIngred(m, quantity, unit, thing);
    }

    // now we alphabetize (could do "grocery order" or something) the
    // ingredient list.
    let res: string[][] = [];
    for (let key of sortedMapKeys(m)) {
        let quantity = m.get(key);
        let keyObj = JSON.parse(key);
        res.push([renderQuantity(quantity), keyObj.unit, keyObj.thing]);
    }

    return res;
}

function renderGroceryList(rawIngredDescs: string[]): string {
    // sort and merge
    let ingredDescs = mergeIngredDescs(rawIngredDescs)

    // render each
    let checkListHTML = '';
    let ingredientDescHTML = '';
    for (let ingredDesc of ingredDescs) {
        let [quantity, unit, thing] = ingredDesc;

        // separate ingredients from things to check
        if (BULK_THINGS.has(thing)) {
            checkListHTML += htmlGroceryIngredient(quantity, unit, thing);
        } else {
            ingredientDescHTML += htmlGroceryIngredient(quantity, unit, thing);
        }

    }

    // render all
    return htmlGroceryIngredientList(ingredientDescHTML, checkListHTML);
}

function renderWeek(dishes: Dishes, week: Week): [string, string[]] {
    let weekHTML = '';
    let weekIngredDescs: string[] = [];
    for (let dayID of AllDays) {
        let [dayHTML, dayIngredDescs] = renderDay(dishes, dayID, week[dayID]);
        weekHTML += dayHTML;
        weekIngredDescs.push(...dayIngredDescs);
    }
    return [weekHTML, weekIngredDescs];
}

/**
 * @returns [dayHTML, list of ingredient descriptions for day]
 */
function renderDay(dishes: Dishes, dayID: DayID, day?: Day): [string, string[]] {
    // if day not listed in json: nothing
    if (day == null) {
        return [htmlDay(dayID, 0, ''), []];
    }

    // render and sum calories for all meals
    let dayCalories = 0;
    let mealHTML = '';
    let dayIngredDescs: string[] = [];
    for (let mealID of AllMeals) {
        let [curMealHTML, mealCalories, mealIngredDescs] = renderMeal(dishes, mealID, day[mealID]);
        mealHTML += curMealHTML;
        dayCalories += mealCalories;
        dayIngredDescs.push(...mealIngredDescs);
    }
    return [htmlDay(dayID, dayCalories, mealHTML), dayIngredDescs];
}

/**
 * @returns [mealHTML, mealCalories, list of ingredient descriptions for meal]
 */
function renderMeal(dishes: Dishes, mealID: MealID, mealDishes?: DishIDSpec[]): [string, number, string[]] {
    // if meal not listed, or no meals provided, return nothing
    if (mealDishes == null || mealDishes.length === 0) {
        return ['', 0, []];
    }

    // iterate through dishes listed
    let mealCalories = 0;
    let dishesHTML = '';
    let mealIngredDescs: string[] = [];
    for (let dishID of mealDishes) {
        let [dishHTML, dishCalories, dishIngredDescs] = renderDish(dishes, dishID);
        mealCalories += dishCalories;
        dishesHTML += dishHTML;
        mealIngredDescs.push(...dishIngredDescs);
    }
    return [htmlMeal(mealID, mealCalories, dishesHTML), mealCalories, mealIngredDescs];
}

/**
 * @returns [dishHTML, dishCalories, dishIngredients]
 */
function renderDish(dishes: Dishes, dishIDSpec: DishIDSpec): [string, number, string[]] {

    // figure out dish spec type
    let dishID: DishID = '';
    let guests = 1;
    if (typeof dishIDSpec === 'string') {
        dishID = dishIDSpec;
    } else {
        dishID = dishIDSpec.dishID;
        guests = dishIDSpec.guests;
    }

    let dish = dishes[dishID];
    if (dish == null) {
        return [htmlDish('Unknown Dish: "' + dishID + '"', 1, 0, ''), 0, []]
    }

    // to handle multiple guests, we keep recipe and calories display the same
    // (minus a little "(cook xN)" notification), but repeat each ingredient
    // for the ingredients bookkeeping.
    let ingredientsHTMLInner = '';
    let dishCalories = 0;
    let dishIngredDescs: string[] = [];
    for (let ingredient of dish.ingredients) {
        ingredientsHTMLInner += htmlIngredient(ingredient);
        dishCalories += ingredient[0];
        for (let i = 0; i < guests; i++) {
            dishIngredDescs.push(ingredient[1]);
        }
    }

    return [
        htmlDish(dish.title, guests, dishCalories, htmlIngredients(ingredientsHTMLInner)),
        dishCalories,
        dishIngredDescs,
    ];
}

//
// config
//

const dishesFN = 'data/dishes.json';

//
// execution
//

$.getJSON(dishesFN, onDishesLoaded);
