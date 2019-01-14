//
// constants
//
// http://unicodefractions.com/ for more. use hex w/o leading "&#x"
const FRAC_FOURTH = '\u{BC}'; // ¼
const FRAC_THIRD = '\u{2153}'; // ⅓
const FRAC_HALF = '\u{BD}'; // ½
const FRAC_TWO_THIRD = '\u{2154}'; // ⅔
const FRAC_THREE_QUARTER = '\u{BE}'; // ¾
const QUANT_MAP = new Map([
    [FRAC_FOURTH, 1 / 4],
    [FRAC_THIRD, 1 / 3],
    [FRAC_HALF, 1 / 2],
    [FRAC_TWO_THIRD, 2 / 3],
    [FRAC_THREE_QUARTER, 3 / 4],
]);
function revMap(m) {
    let r = new Map();
    for (let [key, val] of m.entries()) {
        r.set(val, key);
    }
    return r;
}
const QUANT_MAP_REV = revMap(QUANT_MAP);
const KNOWN_UNITS = new Set([
    'tbs', 'tbsp', 'tsp', 'oz', 'ozs', 'lb', 'lbs', 'cup', 'cups', 'scoop',
    'scoops', 'pcs', 'psc', 'g', 'bag', 'bags', 'bunch', 'bunches', 'fillet',
    'fillets', 'bottle', 'bottles', 'bar', 'bars',
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
]);
// things used as internal placeholders we don't need to add to any list
const IGNORE_THINGS = new Set([
    '[eat this much-ish]',
    '[chipotle burrito]',
]);
const AllMeals = ['breakfast', 'morningSnack', 'lunch', 'afternoonSnack', 'dinner', 'eveningSnack'];
const AllDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
//
// html templates
//
// below are for the what-dishes-do-we-have AKA "dishes" view
/**
 * Function for rendering all meal options for a given meal. E.g. "Breakfast":
 * (all breakfast dishes entered in json file).
 *
 * @param meal name of meal (like "breakfast")
 * @param dishesHTML html of all dishes, including their separators.
 */
function htmlAllDishesForMeal(meal, dishesHTML) {
    let displayMeal = meal[0].toUpperCase() + meal.slice(1);
    let displayClass = 'meal';
    return `
    <div class="${displayClass}">
        <h1>${displayMeal}</h1>

        ${dishesHTML}
    </div>
    `;
}
// below are for the week / day / meal / dish view
function htmlDay(dayID, dayCalories, mealHTML, solo) {
    let displayDay = dayID[0].toUpperCase() + dayID.slice(1);
    let displayClass = solo ? 'day solo' : 'day';
    return `
    <div class="${displayClass}">
        <h1>${displayDay}</h1>
        <h4>${dayCalories} calories</h4>

        ${mealHTML}
    </div>
    `;
}
function htmlMeal(mealID, mealCalories, dishesHTML) {
    let displayMeal = mealID[0].toUpperCase() + mealID.slice(1);
    const calories = mealCalories < 0 ? '???' : mealCalories + '';
    return `
    <h2>${displayMeal}</h2>
    <h3>${calories} calories</h3>

    ${dishesHTML}
    `;
}
function htmlDish(dishID, dishTitle, dishGuests, dishCalories, cssClass, ingredientsHTML) {
    let dishExtra = (dishGuests === 1 ? '' : ' <i>(cook x' + dishGuests + ')</i>');
    let dishIDDisplay = (dishID == null) ? '' : ' <h2><pre>[' + dishID + ']</pre></h2>';
    const calories = dishCalories < 0 ? '???' : dishCalories + '';
    return `
    <div class="${cssClass}">
        <h1>${dishTitle}${dishExtra}</h1>
        ${dishIDDisplay}
        <h2>${calories} calories</h2>

        ${ingredientsHTML}
    </div>
    `;
}
function htmlIngredients(ingredientsHTML) {
    return `
    <table>
        <!-- Header has been disabled (for now at least) -->
        <!-- <tr>
            <th>cal</th><th class="ingredientCell">ingredient</th>
        </tr> -->
        ${ingredientsHTML}
    </table>
    `;
}
function htmlIngredient(ingredient) {
    const calories = ingredient[0] < 0 ? '???' : ingredient[0] + '';
    return `
    <tr>
        <td class="calorieCell">${calories}</td>
        <td class="ingredientCell">${ingredient[1]}</td>
    </tr>
    `;
}
// below are for the grocery list
function htmlGroceryIngredientList(ingredientListHTML, checkListHTML) {
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
    `;
}
function htmlGroceryIngredient(quantity, unit, thing) {
    return `
    <tr>
        <td class="quantity">${quantity}</td><td>${unit}</td><td>${thing}</td>
    </tr>
    `;
}
//
// rendering helpers
//
function addIngred(m, quantity, unit, thing) {
    let key = JSON.stringify({
        thing: thing,
        unit: unit,
    });
    let cur = 0;
    if (m.has(key)) {
        cur = m.get(key);
    }
    m.set(key, cur + quantity);
}
function mergeIngredDescs(ingredDescs) {
    // first, we break descriptions out according to number, unit, and thing,
    // and merge them where units are equal. keys are stored as JSON strings
    // because only object equality is supported for map key comparison.
    let m = new Map();
    for (let ingredDesc of ingredDescs) {
        let pieces = ingredDesc.split(' ');
        let [quantity, unit, thing] = getQUT(pieces);
        addIngred(m, quantity, unit, thing);
    }
    // now we alphabetize (could do "grocery order" or something) the
    // ingredient list.
    let res = [];
    for (let key of sortedMapKeys(m)) {
        let quantity = m.get(key);
        let keyObj = JSON.parse(key);
        res.push([renderQuantity(quantity), keyObj.unit, keyObj.thing]);
    }
    return res;
}
//
// rendering funcs
//
function renderGroceryList(rawIngredDescs) {
    // sort and merge
    let ingredDescs = mergeIngredDescs(rawIngredDescs);
    // render each
    let checkListHTML = '';
    let ingredientDescHTML = '';
    for (let ingredDesc of ingredDescs) {
        let [quantity, unit, thing] = ingredDesc;
        // separate ingredients from things to check
        if (IGNORE_THINGS.has(thing)) {
            // noop
        }
        else if (BULK_THINGS.has(thing)) {
            checkListHTML += htmlGroceryIngredient(quantity, unit, thing);
        }
        else {
            ingredientDescHTML += htmlGroceryIngredient(quantity, unit, thing);
        }
    }
    // render all
    return htmlGroceryIngredientList(ingredientDescHTML, checkListHTML);
}
function renderWeek(dishes, week) {
    let weekHTML = '';
    let weekIngredDescs = [];
    for (let dayID of AllDays) {
        let [dayHTML, dayIngredDescs] = renderDay(dishes, dayID, week[dayID], false);
        weekHTML += dayHTML;
        weekIngredDescs.push(...dayIngredDescs);
    }
    return [weekHTML, weekIngredDescs];
}
/**
 * @returns [dayHTML, list of ingredient descriptions for day]
 */
function renderDay(dishes, dayID, day, solo) {
    // if day not listed in json: nothing
    if (day == null) {
        return [htmlDay(dayID, 0, '', solo), []];
    }
    // render and sum calories for all meals
    let dayCalories = 0;
    let mealHTML = '';
    let dayIngredDescs = [];
    for (let mealID of AllMeals) {
        let [curMealHTML, mealCalories, mealIngredDescs] = renderMeal(dishes, mealID, day[mealID]);
        mealHTML += curMealHTML;
        // if any meal has unk (< 0) cals, make whole day unk cals
        dayCalories = mealCalories < 0 ? -1 : dayCalories + mealCalories;
        dayCalories += mealCalories;
        dayIngredDescs.push(...mealIngredDescs);
    }
    return [htmlDay(dayID, dayCalories, mealHTML, solo), dayIngredDescs];
}
/**
 * @returns [mealHTML, mealCalories, list of ingredient descriptions for meal]
 */
function renderMeal(dishes, mealID, mealDishes) {
    // if meal not listed, or no meals provided, return nothing
    if (mealDishes == null || mealDishes.length === 0) {
        return ['', 0, []];
    }
    // iterate through dishes listed
    let mealCalories = 0;
    let dishesHTML = '';
    let mealIngredDescs = [];
    for (let dishID of mealDishes) {
        let [dishHTML, dishCalories, dishIngredDescs] = renderDish(dishes, dishID, false, 'dish');
        // if any dish has unk (< 0) cals, make whole meal unk cals
        mealCalories = dishCalories < 0 ? -1 : mealCalories + dishCalories;
        dishesHTML += dishHTML;
        mealIngredDescs.push(...dishIngredDescs);
    }
    return [htmlMeal(mealID, mealCalories, dishesHTML), mealCalories, mealIngredDescs];
}
/**
 * @returns [dishHTML, dishCalories, dishIngredients]
 */
function renderDish(dishes, dishIDSpec, displayID, cssClass) {
    // figure out dish spec type
    let dishID = '';
    let guests = 1;
    if (typeof dishIDSpec === 'string') {
        dishID = dishIDSpec;
    }
    else {
        dishID = dishIDSpec.dishID;
        guests = dishIDSpec.guests;
    }
    let dish = dishes[dishID];
    if (dish == null) {
        return [htmlDish(null, 'Unknown Dish: "' + dishID + '"', 1, 0, cssClass, ''), 0, []];
    }
    // to handle multiple guests, we keep recipe and calories display the same
    // (minus a little "(cook xN)" notification), but repeat each ingredient
    // for the ingredients bookkeeping.
    let ingredientsHTMLInner = '';
    let dishCalories = 0;
    let dishIngredDescs = [];
    for (let ingredient of dish.ingredients) {
        ingredientsHTMLInner += htmlIngredient(ingredient);
        // if any ingredient has unk (< 0) cals, make whole dish unk cals
        dishCalories = ingredient[0] < 0 ? -1 : dishCalories + ingredient[0];
        for (let i = 0; i < guests; i++) {
            dishIngredDescs.push(ingredient[1]);
        }
    }
    let providedDishID = displayID ? dishID : null;
    return [
        htmlDish(providedDishID, dish.title, guests, dishCalories, cssClass, htmlIngredients(ingredientsHTMLInner)),
        dishCalories,
        dishIngredDescs,
    ];
}
function renderQuantity(raw) {
    // whole numbers
    if (raw % 1 === 0) {
        return '' + raw;
    }
    let whole = raw < 1.0 ? '' : Math.floor(raw) + '';
    let remainder = raw % 1;
    let prec = 2;
    let inpPrec = remainder.toPrecision(prec);
    for (let [num, str] of QUANT_MAP_REV.entries()) {
        if (inpPrec === num.toPrecision(prec)) {
            return whole + str;
        }
    }
    return '' + raw;
}
function sortedMapKeys(m) {
    let flattened = [];
    for (let key of m.keys()) {
        flattened.push(key);
    }
    return flattened.sort((a, b) => {
        return JSON.parse(a).thing.localeCompare(JSON.parse(b).thing);
    });
}
/**
 * @returns a number OR null if the quantity could not be parsed
 */
function getQuantity(s) {
    if (QUANT_MAP.has(s)) {
        return QUANT_MAP.get(s);
    }
    let candidate = parseFloat(s);
    if (isNaN(candidate)) {
        return null;
    }
    return candidate;
}
/**
 * @returns a unit string OR null if unit not recognized
 */
function getUnit(s) {
    if (KNOWN_UNITS.has(s)) {
        return s;
    }
    return null;
}
/**
 * @returns [quantity, unit, thing]
 */
function getQUT(pieces) {
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
        }
        else {
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
    let unit = getUnit(pieces[1]);
    if (unit == null) {
        // unit not known, but we have a quantity. include index 1 in name.
        return [quantity, 'x', pieces.slice(1).join(' ')];
    }
    // we have quantity AND unit. woohoo!
    return [quantity, unit, pieces.slice(2).join(' ')];
}
/// <reference path="../../lib/moment.d.ts" />
/// <reference path="../../lib/jquery.d.ts" />
/// <reference path="render.ts" />
/// <reference path="constants.ts" />
/// <reference path="util.ts" />
/// <reference path="parse.ts" />
//
// pick filenames
//
function getWeekFilename(m) {
    return 'data/weeks/' + m.format('MMMDD-YYYY').toLowerCase() + '.json';
}
function getThisWeekFilename(start = moment()) {
    // strategy: check current day. subtract 1 day at a time until we reach
    // a monday.
    let cur = start;
    while (cur.format('dddd') !== 'Monday') {
        cur = cur.subtract(1, 'days');
    }
    return getWeekFilename(cur);
}
function getLastWeekFilename() {
    return getThisWeekFilename(moment().subtract(7, 'days'));
}
function getNextWeekFilename() {
    // strategy: starting with tomorrow, continue adding 1 day at a time until
    // we reach a monday.
    let candidate = moment().add(1, 'days');
    while (candidate.format('dddd') != 'Monday') {
        candidate = candidate.add(1, 'days');
    }
    return getWeekFilename(candidate);
}
//
// process data
//
/**
 * Callback for once dishes are loaded and rendering time-based (day/week)
 * view.
 */
function onDishesLoadedTime(dishes) {
    console.log('Rendering time-based view.');
    $.getJSON(weekFN, onWeekLoaded.bind(null, dishes));
}
/**
 * Callback for once dishes are loaded and rendering dishes-only view.
 */
function onDishesLoadedDishes(dishes) {
    console.log('Rendering dishes view.');
    console.log('Got dishes');
    console.log(dishes);
    // render all dishes
    let mealMap = new Map();
    for (let dishID in dishes) {
        let [html, calories, ingredients] = renderDish(dishes, dishID, true, 'dishCard');
        let mealHint = dishes[dishID].mealHint;
        if (!mealMap.has(mealHint)) {
            mealMap.set(mealHint, []);
        }
        mealMap.get(mealHint).push(html);
    }
    for (let mealID of AllMeals) {
        if (!mealMap.has(mealID)) {
            continue;
        }
        $('body').append(htmlAllDishesForMeal(mealID, mealMap.get(mealID).join('\n')));
    }
}
function onWeekLoaded(dishes, week) {
    console.log('Got dishes');
    console.log(dishes);
    console.log('Got week');
    console.log(week);
    console.log('viewType: ' + view);
    if (view == 'week') {
        let [weekHTML, weekIngredDescs] = renderWeek(dishes, week);
        let groceryList = renderGroceryList(weekIngredDescs);
        $('body').append(weekHTML + groceryList);
    }
    else {
        // day view. assumes current day the one to render.
        let dayID = moment().format('dddd').toLowerCase();
        let [dayHTML, _] = renderDay(dishes, dayID, week[dayID], true);
        $('body').append(dayHTML);
    }
}
//
// config
//
const dishesFN = 'data/dishes.json';
// parse url to pick week
let weekFN;
let url = new URL(window.location.href);
let week = url.searchParams.get('week');
switch (week) {
    case 'prev':
    case 'previous':
    case 'last':
        weekFN = getLastWeekFilename();
        break;
    case 'next':
        weekFN = getNextWeekFilename();
        break;
    default:
        weekFN = getThisWeekFilename();
        break;
}
// this would be a manual override:
// const weekFN = 'data/weeks/jun25-2018.json'
console.log('Using weekFN: ' + weekFN);
// day view really only makes sense with current week, though hitting 'prev'
// can let you check out what you ate last week on the same day, so i guess
// that's cool too.
let view;
let viewRaw = url.searchParams.get('view');
switch (viewRaw) {
    case 'day':
        view = 'day';
        break;
    case 'dishes':
        view = 'dishes';
        break;
    default:
        view = 'week';
        break;
}
console.log('Using view: ' + view);
//
// execution
//
if (view == 'dishes') {
    $.getJSON(dishesFN, onDishesLoadedDishes);
}
else {
    $.getJSON(dishesFN, onDishesLoadedTime);
}