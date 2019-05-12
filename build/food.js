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
    'fillets', 'bottle', 'bottles', 'bar', 'bars', 'cloves', 'clove', 'pack', 'packs',
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
    'rice (white, cooked)',
    'dried parsley leaves',
    'brown sugar',
    'balsamic vinegar',
    'ketchup',
    'red wine vinegar',
    'honey',
    'Worchestireshire sauce',
    'sake',
    'hondashi',
    'togarashi',
    'soy sauce',
    'sesame oil',
    'sugar',
    'rice vinegar',
    'rice wine vinegar',
    'vegetable oil',
    'garlic cloves',
    'water',
    'garlic',
    'ginger',
    'rice',
    'vanilla extract',
    'hoisin sauce',
    'pickled ginger',
    'pickled ginger (minced)',
    'ginger paste',
    'sesame seeds',
    'garlic',
    'instant coffee',
    'splenda (test this)',
    'salt',
    'oats',
    'apple pie spice',
    'cinnamon',
    'fish sauce',
]);
// things used as internal placeholders we don't need to add to any list
const IGNORE_THINGS = new Set([
    '[eat this much-ish]',
    '[chipotle burrito]',
]);
let EMPTY_WEEK = {
    monday: {
        breakfast: [],
        lunch: [],
        snack: [],
        dinner: [],
    },
    tuesday: {
        breakfast: [],
        lunch: [],
        snack: [],
        dinner: [],
    },
    wednesday: {
        breakfast: [],
        lunch: [],
        snack: [],
        dinner: [],
    },
    thursday: {
        breakfast: [],
        lunch: [],
        snack: [],
        dinner: [],
    },
    friday: {
        breakfast: [],
        lunch: [],
        snack: [],
        dinner: [],
    },
    saturday: {
        breakfast: [],
        lunch: [],
        snack: [],
        dinner: [],
    },
    sunday: {
        breakfast: [],
        lunch: [],
        snack: [],
        dinner: [],
    }
};
const AllMeals = ['breakfast', 'morningSnack', 'lunch', 'snack', 'afternoonSnack', 'dinner', 'eveningSnack'];
const AllDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
var View;
(function (View) {
    View[View["ShowWeek"] = 0] = "ShowWeek";
    View[View["ShowDay"] = 1] = "ShowDay";
    View[View["Dishes"] = 2] = "Dishes";
    View[View["Edit"] = 3] = "Edit";
})(View || (View = {}));
/**
 * Called when you start dragging a dish. Sets the data that should be
 * transferred.
 */
function drag(ev, dishID, dayID, mealID) {
    // always send dish id
    ev.dataTransfer.setData('dishID', dishID);
    // if coming from a specific meal, we set that as well, so it can be
    // trashed.
    if (dayID != null && mealID != null) {
        ev.dataTransfer.setData('dayID', dayID);
        ev.dataTransfer.setData('mealID', mealID);
    }
}
function getHighlightEl(el) {
    let maxTraverse = 5;
    let cur = el;
    while (cur.className != "editDayMeal" && maxTraverse > 0 && cur.parentElement != null) {
        cur = cur.parentElement;
        maxTraverse--;
    }
    return maxTraverse == 0 || cur.parentElement == null ? null : cur;
}
/**
 * For some reason, this needs to be set on droppable zones when something is
 * dragged over them to allow something to be dropped onto them.
 */
function allowDrop(ev) {
    ev.preventDefault();
    let highlightEl = getHighlightEl(ev.target);
    if (highlightEl != null) {
        $(highlightEl).attr('drop-active', 'on');
    }
}
function dragLeave(ev) {
    let highlightEl = getHighlightEl(ev.target);
    if (highlightEl != null) {
        $(highlightEl).removeAttr('drop-active');
    }
    // $(ev.target).removeAttr('drop-active');
}
/**
 * Dropping a dish onto a meal.
 */
function mealDrop(dayID, mealID, ev) {
    ev.preventDefault();
    $(ev.target).removeAttr('drop-active');
    // add the dish to the meal
    let dishID = ev.dataTransfer.getData('dishID');
    // console.log('got ' + dayID + ' ' + mealID + ' ' + dishID);
    DragNDropGlobals.weekData[dayID][mealID].push(dishID);
    // write out
    serialize(DragNDropGlobals.weekData, DragNDropGlobals.weekFN, () => { location.reload(); });
}
/**
 * Dropping a dish onto a trash area.
 */
function trashDrop(ev) {
    // this only does something if dragging from a particular meal
    let dayID = ev.dataTransfer.getData('dayID');
    let mealID = ev.dataTransfer.getData('mealID');
    if (dayID != '' && mealID != '') {
        let dishID = ev.dataTransfer.getData('dishID');
        let meal = DragNDropGlobals.weekData[dayID][mealID];
        let idx = meal.indexOf(dishID);
        if (idx > -1) {
            meal.splice(idx, 1);
        }
        serialize(DragNDropGlobals.weekData, DragNDropGlobals.weekFN, () => { location.reload(); });
    }
}
/// <reference path="constants.ts" />
/// <reference path="drag-n-drop.ts" />
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
function htmlAllDishesForMeal(meal, dishesHTML, view) {
    let displayMeal = meal[0].toUpperCase() + meal.slice(1);
    if (view == View.Edit) {
        return `
        <h1>${displayMeal}</h1>
        <div class="editMealDishes">
            ${dishesHTML}
        </div>
        `;
    }
    let displayClass = 'meal';
    return `
    <div class="${displayClass}">
        <h1>${displayMeal}</h1>

        ${dishesHTML}
    </div>
    `;
}
// below are for the week / day / meal / dish view
function htmlDay(dayID, dayCalories, mealHTML, view) {
    const calories = dayCalories < 0 ? '???' : dayCalories + '';
    let displayDay = dayID[0].toUpperCase() + dayID.slice(1);
    if (view == View.Edit) {
        return `
        <div class="editDay">
            <p>
                <span class="editDayName">${displayDay}</span>
                &nbsp;
                <span class="editDayCalories">${calories} calories</span>
            </p>
            <div class="editDayMeals">
                ${mealHTML}
            </div>
        </div>
        `;
    }
    // week and day view
    let displayClass = view == View.ShowDay ? 'day solo' : 'day';
    return `
    <div class="${displayClass}">
        <h1>${displayDay}</h1>
        <h4>${calories} calories</h4>

        ${mealHTML}
    </div>
    `;
}
function htmlMeal(dayID, mealID, mealCalories, dishesHTML, view) {
    let displayMeal = mealID[0].toUpperCase() + mealID.slice(1);
    const calories = mealCalories < 0 ? '???' : mealCalories + '';
    if (view == View.Edit) {
        return `
        <div
            class="editDayMeal"
            ondragover="allowDrop(event)"
            ondragleave="dragLeave(event)"
            ondrop="mealDrop('${dayID}', '${mealID}', event)"
        >
            <div class="editDayMealsDishes">
                ${dishesHTML}
            </div>
            <p>
                <span class="meal">${displayMeal}</span>
                &nbsp;
                <span class="calories">${calories} calories</span></p>
        </div>
        `;
    }
    // display view for week or day
    return `
    <h2>${displayMeal}</h2>
    <h3>${calories} calories</h3>

    ${dishesHTML}
    `;
}
function htmlDish(dishID, dishTitle, dishGuests, dishCalories, dishImg, dishRecipe, dishRecipeServings, ingredientsHTML, view, timeInfo, tooltipDirection) {
    if (dishID == null) {
        console.error('Got null dish');
    }
    const calories = dishCalories < 0 ? '???' : dishCalories + '';
    const recipeText = dishRecipeServings != null ? 'recipe (' + dishRecipeServings + ' servings)' : 'recipe';
    const recipe = dishRecipe != null ? '<a class="recipeLink" target="_blank" href="' + dishRecipe + '">' + recipeText + '</a>' : '';
    let tooltipClass = tooltipDirection != null ? 'tooltip ' + tooltipDirection : 'tooltip';
    if (view == View.Edit) {
        let dayID = timeInfo != null ? "'" + timeInfo.dayID + "'" : null;
        let mealID = timeInfo != null ? "'" + timeInfo.mealID + "'" : null;
        return `
            <div
                class="editDish"
                draggable="true"
                ondragstart="drag(event, '${dishID}', ${dayID}, ${mealID} )"
            >
                <img src="${dishImg}" />
                <span class="calOverlay">${calories}</span>
                <span class="${tooltipClass}">
                    <b>${dishTitle}</b> (${calories} cal)
                    <br />
                    <hr />
                    ${ingredientsHTML}
                    ${recipe}
                </span>
            </div>
            `;
    }
    // dishes only view, or view within a day plan.
    const cssClass = view == View.Dishes ? 'dishCard' : 'dish';
    const dishExtra = (dishGuests === 1 ? '' : ' <i>(cook x' + dishGuests + ')</i>');
    // const dishIDDisplay = (view == View.Dishes) ? ' <h2><pre>[' + dishID + ']</pre></h2>' : '';
    return `
    <div class="${cssClass}">
        <h1>${dishTitle}${dishExtra}</h1>
        <h2>${calories} calories</h2>
        <img src="${dishImg}" />

        <span class="${tooltipClass}">
            ${ingredientsHTML}
            ${recipe}
        </span>
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
function renderEdit(dishes, week) {
    let [weekHTML, weekIngredDescs] = renderWeek(dishes, week, View.Edit);
    let dishesHTML = renderDishes(dishes, View.Edit);
    let groceryList = renderGroceryList(weekIngredDescs);
    return `
    <div class="editContainer">
        <div class="editTime">
            ${weekHTML}
        </div>
        <div class="editDishes" ondragover="allowDrop(event)" ondrop="trashDrop(event)">
            ${dishesHTML}
        </div>
    </div>
    ${groceryList}
    `;
}
function renderWeek(dishes, week, view) {
    let weekHTML = '';
    let weekIngredDescs = [];
    for (let dayID of AllDays) {
        let [dayHTML, dayIngredDescs] = renderDay(dishes, dayID, week[dayID], view);
        weekHTML += dayHTML;
        weekIngredDescs.push(...dayIngredDescs);
    }
    return [weekHTML, weekIngredDescs];
}
/**
 * @returns [dayHTML, list of ingredient descriptions for day]
 */
function renderDay(dishes, dayID, day, view) {
    // if day not listed in json: nothing
    if (day == null) {
        return [htmlDay(dayID, 0, '', view), []];
    }
    // render and sum calories for all meals
    let dayCalories = 0;
    let mealHTML = '';
    let dayIngredDescs = [];
    for (let mealID of AllMeals) {
        let [curMealHTML, mealCalories, mealIngredDescs] = renderMeal(dishes, dayID, mealID, day[mealID], view);
        mealHTML += curMealHTML;
        // if any meal has unk (< 0) cals, make whole day unk cals
        dayCalories = mealCalories < 0 ? -1 : dayCalories + mealCalories;
        dayIngredDescs.push(...mealIngredDescs);
    }
    return [htmlDay(dayID, dayCalories, mealHTML, view), dayIngredDescs];
}
/**
 * @returns [mealHTML, mealCalories, list of ingredient descriptions for meal]
 */
function renderMeal(dishes, dayID, mealID, mealDishes, view) {
    // if meal not listed, we can't render it. otherwise, we assume that the
    // meal is listed for some reason, even if it is empty (e.g., an empty zone
    // for drang'n'drop), so we render it.
    if (mealDishes == null) {
        return ['', 0, []];
    }
    // iterate through dishes listed
    let mealCalories = 0;
    let dishesHTML = '';
    let mealIngredDescs = [];
    for (let dishID of mealDishes) {
        let [dishHTML, dishCalories, dishIngredDescs] = renderDish(dishes, dishID, view, { dayID: dayID, mealID: mealID });
        // if any dish has unk (< 0) cals, make whole meal unk cals
        mealCalories = dishCalories < 0 ? -1 : mealCalories + dishCalories;
        dishesHTML += dishHTML;
        mealIngredDescs.push(...dishIngredDescs);
    }
    return [htmlMeal(dayID, mealID, mealCalories, dishesHTML, view), mealCalories, mealIngredDescs];
}
/**
 *
 * @param tooltipDirection is optionally provided to help customize what direction the
 * tooltip hangs off of the element so as to not go off-screen on elements on the border
 * (edit view only).
 *
 * @returns dishesHTML
 */
function renderDishes(dishes, view, tooltipDirection) {
    // first, map each dish to the meal it belongs to
    let mealMap = new Map();
    for (let dishID in dishes) {
        let [html, calories, ingredients] = renderDish(dishes, dishID, view, null, tooltipDirection);
        let mealHint = dishes[dishID].mealHint;
        if (!mealMap.has(mealHint)) {
            mealMap.set(mealHint, []);
        }
        mealMap.get(mealHint).push(html);
    }
    // then, iterate through meals, and render all dishes for each meal
    let res = '';
    for (let mealID of AllMeals) {
        if (!mealMap.has(mealID)) {
            continue;
        }
        res += htmlAllDishesForMeal(mealID, mealMap.get(mealID).join('\n'), view);
    }
    return res;
}
/**
 * @param timeInfo is provided if this dish is being rendered as part of a day's
 * meal. (For drag'n'drop info.) Otherwise (as part of dish view) it's just.
 * null
 *
 * @param tooltipDirection is optionally provided to help customize what direction the
 * tooltip hangs off of the element so as to not go off-screen on elements on the border
 *
 * @returns [dishHTML, dishCalories, dishIngredients]
 */
function renderDish(dishes, dishIDSpec, view, timeInfo, tooltipDirection) {
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
        return [htmlDish(null, 'Unknown Dish: "' + dishID + '"', 1, 0, null, null, null, '', view, timeInfo, tooltipDirection), 0, []];
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
    return [
        htmlDish(dishID, dish.title, guests, dishCalories, dish.img, dish.recipe, dish.recipeServings, htmlIngredients(ingredientsHTMLInner), view, timeInfo, tooltipDirection),
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
    return '' + raw.toPrecision(2);
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
/**
 * These are set for drag and drop purposes. They're not used elsewhere to keep
 * functions pure for ease of debugging.
 */
let DragNDropGlobals = {
    weekFN: null,
    weekData: null,
};
//
// pick filenames
//
function getWeekPath(m) {
    return 'data/weeks/' + m.format('MMMDD-YYYY').toLowerCase() + '.json';
}
function getThisWeekFilename(start = moment()) {
    // strategy: check current day. subtract 1 day at a time until we reach
    // a monday.
    let cur = start;
    while (cur.format('dddd') !== 'Monday') {
        cur = cur.subtract(1, 'days');
    }
    return getWeekPath(cur);
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
    return getWeekPath(candidate);
}
//
// process data
//
/**
 * Super general util function.
 */
function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
}
/**
 * Perform preprocessing on dishes.
 *
 * The main function here is to allow recipes to be entered as written on the recipe for
 * a full dish with many servings (e.g., 6 servings), but then in the food app, to only
 * display the calories for a single serving.
 *
 * To accomplish this, we immediately divide the calories and quantities for a dish by
 * the number of `recipeServings` it lists, if any.
 */
function preprocessDishes(dishes) {
    console.log('Preprocessing dishes...');
    let result = {};
    for (let dishID in dishes) {
        let origDish = dishes[dishID];
        if (origDish.recipeServings == null || origDish.recipeServings == 1) {
            // no transformation needed
            result[dishID] = origDish;
        }
        else {
            // we have recipe servings that need to be taken into account. First off, we
            // copy over the dish info, remove the ingredients, and then build them back
            // up using the multiplier.
            let servings = origDish.recipeServings;
            let newDish = clone(origDish);
            newDish.ingredients = [];
            for (let ingredient of origDish.ingredients) {
                let [origCals, origDesc] = ingredient;
                let [origQuantity, unit, thing] = getQUT(origDesc.split(' '));
                let newCals = Math.round(origCals / servings);
                let newQuantity = (origQuantity / servings).toFixed(2);
                newDish.ingredients.push([newCals, [newQuantity + '', unit, thing].join(' ')]);
            }
            result[dishID] = newDish;
        }
    }
    return result;
}
/**
 * Callback for once dishes are loaded and rendering time-based (day/week)
 * view.
 */
function onDishesLoadedTime(weekFN, view, rawDishes) {
    let dishes = preprocessDishes(rawDishes);
    console.log('Rendering time-based view.');
    $.getJSON(weekFN, onWeekLoaded.bind(null, view, dishes))
        .fail(onWeekFail.bind(null, weekFN, view, dishes));
}
/**
 * Callback for once dishes are loaded and rendering dishes-only view.
 */
function onDishesLoadedDishes(rawDishes) {
    let dishes = preprocessDishes(rawDishes);
    console.log('Rendering dishes view.');
    console.log('Got dishes');
    console.log(dishes);
    $('body').append(renderDishes(dishes, View.Dishes));
}
function onWeekFail(weekFN, view, dishes) {
    if (view == View.Edit) {
        // write default week to path and try again
        serialize(EMPTY_WEEK, weekFN, onDishesLoadedTime.bind(null, weekFN, view, dishes));
    }
    else {
        $('body').append("week didn't exist uh oh. Click 'edit' to make current week.");
    }
}
function onWeekLoaded(view, dishes, week) {
    console.log('Got dishes');
    console.log(dishes);
    // Save week data for drag'n'drop.
    console.log('Got week');
    console.log(week);
    DragNDropGlobals.weekData = week;
    console.log('viewType: ' + view);
    if (view == View.ShowWeek) {
        // render full-week display-only view.
        let [weekHTML, weekIngredDescs] = renderWeek(dishes, week, View.ShowWeek);
        let groceryList = renderGroceryList(weekIngredDescs);
        $('body').append(weekHTML + groceryList);
    }
    else if (view == View.Edit) {
        // render full-week edit view.
        $('body').append(renderEdit(dishes, week));
    }
    else if (view == View.ShowDay) {
        // render day view. assumes current day is the one to render.
        let dayID = moment().format('dddd').toLowerCase();
        let [dayHTML, _] = renderDay(dishes, dayID, week[dayID], View.ShowDay);
        $('body').append(dayHTML);
    }
}
//
// core execution
//
const dishesFN = 'data/dishes.json';
function getWeekFN(url) {
    // parse url to pick week
    let weekFN;
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
        case 'current':
        case 'cur':
        case 'this':
        case null:
            weekFN = getThisWeekFilename();
            break;
        default:
            // NOTE: unsafe
            weekFN = week;
            break;
    }
    // this would be a manual override:
    // const weekFN = 'data/weeks/jun25-2018.json'
    console.log('Using weekFN: ' + weekFN);
    return weekFN;
}
function getView(url) {
    // day view really only makes sense with current week, though hitting 'prev'
    // can let you check out what you ate last week on the same day, so i guess
    // that's cool too.
    let view = null;
    let viewRaw = url.searchParams.get('view');
    switch (viewRaw) {
        case 'day':
            view = View.ShowDay;
            break;
        case 'dishes':
            view = View.Dishes;
            break;
        case 'edit':
            view = View.Edit;
            break;
        default:
            view = View.ShowWeek;
            break;
    }
    console.log('Using view: ' + view);
    return view;
}
function main() {
    // get config
    let url = new URL(window.location.href);
    let weekFN = getWeekFN(url);
    let view = getView(url);
    // set global config for drag'n'drop
    DragNDropGlobals.weekFN = weekFN;
    // perform the page requested action
    if (view == View.Dishes) {
        // display dishes
        $.getJSON(dishesFN, onDishesLoadedDishes);
    }
    else if (view == View.ShowDay || view == View.ShowWeek || view == View.Edit) {
        // display time-based rendering (week, day, or edit)
        $.getJSON(dishesFN, onDishesLoadedTime.bind(null, weekFN, view));
    }
    else {
        console.error('Unknown view: ' + view);
    }
}
main();
/// <reference path="constants.ts" />
function serialize(week, path, success) {
    // NOTE: unsafe
    $.ajax(path, {
        type: 'PUT',
        data: JSON.stringify(week, null, 4),
        success: function (response) {
            console.log('Successfully wrote week to ' + path);
            success();
        }
    });
}
