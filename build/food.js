//
// constants
//
// http://unicodefractions.com/ for more. use hex w/o leading "&#x"
const FRAC_EIGHTH = '\u{215B}'; // ⅛
const FRAC_THREE_EIGHTH = '\u{215C}'; // ⅜
const FRAC_FIVE_EIGHTH = '\u{215D}'; // ⅝
const FRAC_SEVEN_EIGHTH = '\u{215E}'; // ⅞
const FRAC_ONE_FIFTH = '\u{2155}'; // ⅕
const FRAC_TWO_FIFTH = '\u{2156}'; // ⅖
const FRAC_THREE_FIFTH = '\u{2157}'; // ⅗
const FRAC_FOUR_FIFTH = '\u{2158}'; // ⅘
const FRAC_FOURTH = '\u{BC}'; // ¼
const FRAC_THIRD = '\u{2153}'; // ⅓
const FRAC_HALF = '\u{BD}'; // ½
const FRAC_TWO_THIRD = '\u{2154}'; // ⅔
const FRAC_THREE_QUARTER = '\u{BE}'; // ¾
const QUANT_MAP = new Map([
    [FRAC_EIGHTH, 1 / 8],
    [FRAC_THREE_EIGHTH, 3 / 8],
    [FRAC_FIVE_EIGHTH, 5 / 8],
    [FRAC_SEVEN_EIGHTH, 7 / 8],
    [FRAC_ONE_FIFTH, 1 / 5],
    [FRAC_TWO_FIFTH, 2 / 5],
    [FRAC_THREE_FIFTH, 3 / 5],
    [FRAC_FOUR_FIFTH, 4 / 5],
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
    'tbs', 'tbsp', 'tsp', 'fl-oz', 'lb', 'lbs', 'cup', 'cups', 'scoop',
    'scoops', 'pcs', 'psc', 'g', 'bag', 'bags', 'bunch', 'bunches', 'fillet',
    'fillets', 'bottle', 'bottles', 'bar', 'bars', 'cloves', 'clove', 'pack', 'packs',
    'x', 'head', 'heads', 'dab', 'dabs', 'slices', 'slice', 'cans', 'can', 'piece',
    'pieces', 'oz', 'boxes', 'box', 'packets', 'packet', 'inches', 'inch', 'sprigs',
    'sprig', 'pounds', 'pound', 'ml'
]);
const LOCATION_MAPPING = new Map([
    ['produce', 'prod.'],
    ['intl', 'intl.'],
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
    'collagen powder',
    'quinoa (cooked)',
    'rice (white, cooked)',
    'dried parsley leaves',
    'brown sugar',
    'balsamic vinegar',
    'ketchup',
    'red wine vinegar',
    'honey',
    'Worcestershire sauce',
    'sake',
    'hondashi',
    'togarashi',
    'soy sauce',
    'sambal oelek',
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
    'siracha',
    'rice (brown, cooked)',
    'cornstarch',
    'ground ginger',
    'tomato paste',
    'coconut oil',
    'coriander',
    'cumin',
    'tumeric',
    'cayenne powder',
    'splenda',
]);
// things used as internal placeholders we don't need to add to any list
const IGNORE_THINGS = new Set([
    'eat this much 200',
    'eat this much 500',
    'eat this much 600',
    'eat this much 700',
    'eat this much-ish',
    'chipotle burrito',
]);
let EMPTY_WEEK = {
    monday: {
        breakfast: [],
        lunch: [],
        dinner: [],
    },
    tuesday: {
        breakfast: [],
        lunch: [],
        dinner: [],
    },
    wednesday: {
        breakfast: [],
        lunch: [],
        dinner: [],
    },
    thursday: {
        breakfast: [],
        lunch: [],
        dinner: [],
    },
    friday: {
        breakfast: [],
        lunch: [],
        dinner: [],
    },
    saturday: {
        breakfast: [],
        lunch: [],
        dinner: [],
    },
    sunday: {
        breakfast: [],
        lunch: [],
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
    View[View["EditCombo"] = 4] = "EditCombo";
})(View || (View = {}));
/**
 * @returns a number OR null if the quantity could not be parsed
 */
function getQuantity(s) {
    if (QUANT_MAP.has(s)) {
        return QUANT_MAP.get(s);
    }
    let candidate = parseFloat(s);
    if (isNaN(candidate)) {
        console.error('Unknown quantity: "' + s + '".');
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
function getQU(pieces) {
    if (pieces.length != 2) {
        console.error('Cannot parse quantity and unit from string[]: ' + pieces.join(' '));
        return [1, 'unk'];
    }
    return [getQuantity(pieces[0]), getUnit(pieces[1])];
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
const UnitConversion = new Map([
    // volume: to tsp
    ['tsp', [1, 'tsp']],
    ['tbsp', [3, 'tsp']],
    ['cup', [48, 'tsp']],
    ['fl-oz', [6, 'tsp']],
    ['ml', [0.202884, 'tsp']],
    // weight: to g
    ['g', [1, 'g']],
    ['oz', [28.3495, 'g']],
    ['lb', [453.59237, 'g']],
]);
/**
 * Converts JSON data from calories.json file to CalorieBank.
 */
function buildBank(cf) {
    let bank = {};
    for (let ingredientFull in cf) {
        // pull off ingredient name and location if povided.
        let ingredientName = ingredientFull;
        let ingredientLoc = null;
        if (ingredientFull.search(/\[.*\]/i) == 0) {
            let endLoc = ingredientFull.search(/\]/i);
            ingredientLoc = ingredientFull.slice(1, endLoc);
            ingredientName = ingredientFull.slice(endLoc + 1).trim();
        }
        let calorieData = {};
        for (let calorieSpec of cf[ingredientFull]) {
            let [calories, quantityAndunitRaw] = calorieSpec;
            let [quantity, unitRaw] = getQU(quantityAndunitRaw.split(' '));
            // standardize alternate spellings
            let unit = UnitStandardize.has(unitRaw) ? UnitStandardize.get(unitRaw) : unitRaw;
            // pre-convert if possible
            if (UnitConversion.has(unit)) {
                let [scaleQuantity, scaleUnit] = UnitConversion.get(unit);
                quantity *= scaleQuantity;
                unit = scaleUnit;
            }
            // save
            let calorieUnitData = {
                calories: calories,
                quantity: quantity,
            };
            calorieData[unit] = calorieUnitData;
        }
        bank[ingredientName] = {
            "calorieData": calorieData,
            "location": ingredientLoc,
        };
    }
    return bank;
}
function getLocation(bank, ingredient) {
    if ((!(ingredient in bank))) {
        return null;
    }
    return bank[ingredient].location;
}
/**
 * Gets calories for the provided ingredient QUT (quantity unit thing) string.
 */
function getCalories(bank, ingredientQUT) {
    let [quantity, unitRaw, ingredient] = getQUT(ingredientQUT.split(' '));
    if (!(ingredient in bank)) {
        console.error('Ingredient "' + ingredient + '" not found in calorie bank.');
        return -1;
    }
    // standardize input unit reference
    let unit = UnitStandardize.has(unitRaw) ? UnitStandardize.get(unitRaw) : unitRaw;
    let calorieData = bank[ingredient].calorieData;
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
/**
 * Called when you start dragging a dish. Sets the data that should be
 * transferred.
 */
function drag(ev, dishID, dayID, mealID) {
    // always send dish id
    ev.dataTransfer.setData('dishIDs', dishID);
    // if coming from a specific meal, we set that as well, so it can be
    // trashed.
    if (dayID != null && mealID != null) {
        ev.dataTransfer.setData('dayID', dayID);
        ev.dataTransfer.setData('mealID', mealID);
    }
    // set what image is displayed. may drag the image itself, or the div surrounding
    // it, in which case we try to find it.
    let imgEl = null;
    let el = ev.target;
    if (el.nodeName == 'IMG' && el.hasAttribute('src')) {
        imgEl = el;
    }
    else {
        for (let child of el.children) {
            if (child.nodeName == 'IMG' && child.hasAttribute('src')) {
                imgEl = child;
                break;
            }
        }
    }
    if (imgEl != null) {
        ev.dataTransfer.setDragImage(imgEl, 0, 0);
    }
}
function dragCombo(ev, dishList, comboCalories) {
    // set data. this is vital
    ev.dataTransfer.setData('dishIDs', dishList);
    // draw a custom drag image
    let w = 200, h = 40;
    let canvas = document.getElementById('comboDragImage');
    if (canvas == null) {
        canvas = document.createElement("canvas");
        canvas.setAttribute('id', 'comboDragImage');
        canvas.width = w;
        canvas.height = h;
        document.body.append(canvas);
    }
    let ctx = canvas.getContext("2d");
    ctx.fillStyle = '#fed530';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#000000';
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 16px Inter';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`combo (${comboCalories} calories)`, w / 2, h / 2);
    ev.dataTransfer.setDragImage(canvas, w / 2, h / 2);
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
    let dishIDs = ev.dataTransfer.getData('dishIDs');
    // console.log('got ' + dayID + ' ' + mealID + ' ' + dishID);
    for (let dishID of dishIDs.split(',')) {
        DragNDropGlobals.weekData[dayID][mealID].push(dishID);
    }
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
        // NOTE: assuming trash drop is only one dish. (dishIDs is just one DishID).
        let dishIDs = ev.dataTransfer.getData('dishIDs');
        let meal = DragNDropGlobals.weekData[dayID][mealID];
        let idx = meal.indexOf(dishIDs);
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
    // display view for week or day. if the meal is empty, don't display.
    if (dishesHTML.length == 0) {
        return "";
    }
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
                    <b>${dishTitle}</b> (${calories}&nbsp;cal)
                    <br />
                    <hr />
                    ${ingredientsHTML}
                    ${recipe}
                </span>
            </div>
            `;
    }
    if (view == View.EditCombo) {
        let dayID = timeInfo != null ? "'" + timeInfo.dayID + "'" : null;
        let mealID = timeInfo != null ? "'" + timeInfo.mealID + "'" : null;
        return `
            <div class="editComboDish">
                <img src="${dishImg}" />
                <span class="calOverlay">${calories}</span>
                <span class="${tooltipClass}">
                    <b>${dishTitle}</b> (${calories}&nbsp;cal)
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
        <div class="txtHeader">
            <h1>${dishTitle}${dishExtra}</h1>
            <h2>${calories} calories</h2>
        </div>
        <img src="${dishImg}" />

        <span class="${tooltipClass}" onresize="tooltipResize">
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
/**
 * - Breaks unit down to bare  (tsp, g)
 * - Builds unit up to larger quantity as needed (tbsp, cup, lb)
 * - Renders quantity nicely (fractions, cutoff decimal, etc. etc.)
 * - Joins up pieces and returns.
 * @param ingredientQUT
 */
function reprocessIngredient(ingredientQUT) {
    let [qRaw, uRaw, t] = getQUT(ingredientQUT.split(' '));
    let uStandard = UnitStandardize.has(uRaw) ? UnitStandardize.get(uRaw) : uRaw;
    if (UnitConversion.has(uStandard)) {
        let [scaleQuantity, scaleUnit] = UnitConversion.get(uStandard);
        qRaw *= scaleQuantity;
        uStandard = scaleUnit;
    }
    const [qSimple, uFinal] = simplifyUnits(qRaw, uStandard);
    const qFinal = renderQuantity(qSimple);
    return [qFinal, uFinal, t].join(' ');
}
function htmlIngredient(caloriesRaw, ingredientQUT) {
    const calories = caloriesRaw < 0 ? '???' : caloriesRaw + '';
    const ingredient = reprocessIngredient(ingredientQUT);
    return `
    <tr>
        <td class="calorieCell">${calories}</td>
        <td class="ingredientCell">${ingredient}</td>
    </tr>
    `;
}
// below are for the grocery list
function htmlGroceryIngredientList(ingredientListHTML, checkListHTML) {
    return `
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
    `;
}
function htmlGroceryIngredient(quantity, unit, thing, location) {
    let locStr = location == null ? '' : location;
    if (LOCATION_MAPPING.has(locStr)) {
        locStr = LOCATION_MAPPING.get(locStr);
    }
    return `
    <tr>
       <td>[${locStr}]</td><td class="quantity">${quantity}</td><td>${unit}</td><td>${thing}</td>
    </tr>
    `;
}
//
// rendering helpers
//
function addIngred(m, origQuantity, origUnit, thing) {
    // translate and store as base unit.
    let quantity = origQuantity;
    let unit = UnitStandardize.has(origUnit) ? UnitStandardize.get(origUnit) : origUnit;
    if (UnitConversion.has(origUnit)) {
        let [scaleQuantity, scaleUnit] = UnitConversion.get(unit);
        quantity *= scaleQuantity;
        unit = scaleUnit;
    }
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
/**
 * Assumes "base" units passed in (tsp or g).
 */
function simplifyUnits(origQuantity, origUnit) {
    if (origUnit == 'tsp') {
        if (origQuantity < 3) {
            return [origQuantity, origUnit];
        }
        else if (origQuantity < 12) {
            return [origQuantity / UnitConversion.get('tbsp')[0], 'tbsp'];
        }
        else {
            return [origQuantity / UnitConversion.get('cup')[0], 'cup'];
        }
    }
    else if (origUnit == 'g') {
        if (origQuantity < 155) {
            return [origQuantity, origUnit];
        }
        else if (origQuantity <= 453) {
            return [origQuantity / UnitConversion.get('oz')[0], 'oz'];
        }
        else {
            return [origQuantity / UnitConversion.get('lb')[0], 'lb'];
        }
    }
    return [origQuantity, origUnit];
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
    // now we alphabetize based on ingredient. note that when we import this into
    // reminders, apple alphabetizes, so we've added a location section (not included
    // here)  to the display. so we could potentially sort by that instead. alphabetical
    // by ingredient might be nice here to easily check whether something is on there.
    let res = [];
    for (let key of sortedMapKeys(m)) {
        let quantity = m.get(key);
        let keyObj = JSON.parse(key);
        // we try to render the quantity as nicely as we can.
        let [finalQuantity, finalUnit] = simplifyUnits(quantity, keyObj.unit);
        res.push([renderQuantity(finalQuantity), finalUnit, keyObj.thing]);
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
        let location = getLocation(CALORIE_BANK, thing);
        // separate ingredients from things to check
        if (IGNORE_THINGS.has(thing)) {
            // noop
        }
        else if (BULK_THINGS.has(thing)) {
            checkListHTML += htmlGroceryIngredient(quantity, unit, thing, location);
        }
        else {
            ingredientDescHTML += htmlGroceryIngredient(quantity, unit, thing, location);
        }
    }
    // render all
    return htmlGroceryIngredientList(ingredientDescHTML, checkListHTML);
}
function renderEditView(displayDishes, allDishes, week, combos, templates) {
    let [weekHTML, weekIngredDescs] = renderWeek(allDishes, week, View.Edit);
    // uncomment to instead render ALL dishes in bank
    // dishesHTML = renderDishes(allDishes, View.Edit);
    let dishesHTML = renderDishes(displayDishes, View.Edit);
    let combosHTML = renderCombos(allDishes, combos);
    let templatesHTML = renderTemplates(allDishes, templates);
    let groceryList = renderGroceryList(weekIngredDescs);
    let mealPrep = renderWeekPrep(allDishes, getWeekPrep(allDishes, week, true));
    return `
    <div class="editContainer">
        <div class="editTime">
            ${weekHTML}
        </div>
        <div id="editDishes" class="editDishes" ondragover="allowDrop(event)" ondrop="trashDrop(event)" onscroll="onScroll()">
            <details>
                <summary class="foodSection">Templates</summary>
                ${templatesHTML}
            </details>
            <details>
                <summary class="foodSection">Combos</summary>
                ${combosHTML}
                </details>
            <details open>
                <summary class="foodSection">Dishes</summary>
                ${dishesHTML}
                <!--
                    For ensuring tooltips don't expand / contract the overall size of the div
                    when they discover they're offscreen, move up (with .up class applied),
                    shrink the div, no longer become off screen, and then start jittering
                    around.
                -->
                <div class="editDishesSpacer"></div>
            </details>
        </div>
    </div>
    <div class="appendixOuter">
        ${groceryList}
        <div class="mealPrepInner">
            <h1>Meal Prep</h1>
            ${mealPrep}
        </div>
    </div>
    `;
}
function renderWeekView(allDishes, week) {
    let [weekHTML, weekIngredDescs] = renderWeek(allDishes, week, View.ShowWeek);
    let groceryList = renderGroceryList(weekIngredDescs);
    let mealPrep = renderWeekPrep(allDishes, getWeekPrep(allDishes, week, true));
    return `
    ${weekHTML}
    <div class="appendixOuter">
        ${groceryList}
        <div class="mealPrepInner">
            <h1>Meal Prep</h1>
            ${mealPrep}
        </div>
    </div>
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
    let fullWeekHTML = '<div class="weekContainer">' + weekHTML + '</div>';
    return [fullWeekHTML, weekIngredDescs];
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
 * Get MealID for the provided combo.
 *
 * Very simple right now, but can add more rules if need be.
 */
function getMealID(dishes, combo) {
    if (combo.dishes.length == 0) {
        console.error("Combo w/ no dishes in it:");
        console.error(combo);
        return 'snack';
    }
    let dishID = combo.dishes[0];
    let dish = dishes[dishID];
    if (dish == null) {
        console.error('unknown dish: ' + dishID);
        return 'snack';
    }
    return dish.mealHint;
}
/**
 * @param skipFalse Whether to skip entries marked with `mealPrep: false`.
 */
function getWeekPrep(dishes, week, skipFalse) {
    // as we go, aggregate by meal prep groups and/or dishes
    let aggregate = new Map();
    for (let dayID in week) {
        let day = week[dayID];
        for (let mealID in day) {
            let mealDishes = day[mealID];
            // let mealCalorieTotal = 0;
            for (let dishIDSpec of mealDishes) {
                let [dishID, guests] = unpackDishIDSpec(dishIDSpec);
                let dish = dishes[dishID];
                if (dish == null || (skipFalse && dish.mealPrep == false)) {
                    // unknown dish, or we're skipping no prep and it's no prep.
                    continue;
                }
                // aggregate by meal prep group if provided, or just use dishID. set
                // default.
                let groupID = dish.mealPrep || dish.title;
                if (!aggregate.has(groupID)) {
                    aggregate.set(groupID, {
                        name: groupID,
                        meals: [],
                        calories: [],
                        dishCounts: new Map(),
                    });
                }
                let mealPrep = aggregate.get(groupID);
                // add this dish's info.
                let [dishCalories, _, __] = computeDishInfo(dish, guests);
                mealPrep.meals.push(dayID + '-' + mealID);
                // this is wrong (not summing calories within meal) but we'll worry
                // about this later.
                mealPrep.calories.push(dishCalories);
                incrementCounter(mealPrep.dishCounts, dishID);
            }
        }
    }
    return Array.from(aggregate.values());
}
function renderWeekPrep(dishes, weekPrep) {
    let res = '';
    for (let mealPrep of weekPrep) {
        let nMeals = (new Set(mealPrep.meals)).size;
        let mealStr = nMeals == 1 ? '1 meal' : nMeals + ' meals';
        // if eating out, don't render these as separate dishes.
        let nDishes = mealPrep.name == '[Eating Out!]' ? 1 : mealPrep.dishCounts.size;
        let dishStr = nDishes == 1 ? '' : '(' + nDishes + ' dishes)';
        let dishDetails = '';
        if (nDishes > 1) {
            dishDetails = '<ul style="margin-top: 0px;">';
            for (let dishID of mealPrep.dishCounts.keys()) {
                let dish = dishes[dishID];
                if (dish == null) {
                    continue;
                }
                dishDetails += `<li class="weekPrepDishList">${dish.title}</li>`;
            }
            dishDetails += '</ul>';
        }
        res += `
        <p class="mealPrepTitle">${mealPrep.name}</p>
        <p class="mealPrepInfo">${mealStr} ${dishStr}</p>
        <div class="mealPrepDishDetails">
        ${dishDetails}
        </div>
        `;
    }
    return res;
}
function renderTemplates(dishes, templates) {
    let templateHTML = '';
    for (let template of templates) {
        templateHTML += `
        <div class="template">
            <p class="title">${template.name}</p>
            ${renderWeekPrep(dishes, getWeekPrep(dishes, template.week, false))}
            <a href="/?view=edit&week=${template.path}"><button>View/Edit</button></a>
            <button onclick="copyWeek('${template.path}');">Copy in</button>
        </div>
        `;
    }
    return `
    <div class="templates">
        ${templateHTML}
    </div>
    `;
}
/**
 * Round to a rounder number for easier planning.
 *
 * Mostly to stop me from tweaking grams to hit exact numbers.
 */
function massageCalories(raw, epsilon = 10, step = 100, recurse = true) {
    // test by tweaking the raw value up and down by epsilon. if it crosses a step
    // value, then it's near a step, so we round to the nearest step.
    const lowMult = Math.floor((raw - epsilon) / step);
    const highMult = Math.floor((raw + epsilon) / step);
    if (lowMult != highMult) {
        return highMult * step;
    }
    if (recurse) {
        return massageCalories(raw, 5, 10, false);
    }
    return raw;
}
/**
 * C-C-C-C-COMBOOOOOOOO
 */
function renderCombos(dishes, combos) {
    let combosHTML = new Map();
    for (let combo of combos) {
        let mealID = getMealID(dishes, combo);
        let dishesHTML = '';
        let comboCalories = 0;
        for (let dishID of combo.dishes) {
            let [dishHTML, dishCalories, _] = renderDish(dishes, dishID, View.EditCombo);
            dishesHTML += dishHTML;
            comboCalories += dishCalories;
        }
        let dishList = combo.dishes.join(',');
        // add to the meal set
        let cur = '';
        if (combosHTML.has(mealID)) {
            cur = combosHTML.get(mealID);
        }
        cur += `
        <div
            class="combo"
            draggable="true"
            ondragstart="dragCombo(event, '${dishList}', ${comboCalories})"
        >
            <div class="comboDishes">
                ${dishesHTML}
            </div>
            <p class="comboFooter">~${massageCalories(comboCalories)} calories</p>
        </div>
        `;
        combosHTML.set(mealID, cur);
    }
    let comboMenuHTML = '';
    for (let mealID of AllMeals) {
        if (!combosHTML.has(mealID)) {
            continue;
        }
        let displayMeal = mealID[0].toUpperCase() + mealID.slice(1);
        comboMenuHTML += `
        <h1>${displayMeal}</h1>
        <div class="combosForMeal">
            ${combosHTML.get(mealID)}
        </div>
        `;
    }
    return `<div id="combos">
        ${comboMenuHTML}
    </div>
    `;
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
 * Returns [dishID, guests].
 */
function unpackDishIDSpec(dishIDSpec) {
    if (typeof dishIDSpec === 'string') {
        return [dishIDSpec, 1];
    }
    else {
        return [dishIDSpec.dishID, dishIDSpec.guests];
    }
}
/**
 * @returns [calories, ingredient descriptions, ingredients HTML]
 */
function computeDishInfo(dish, guests) {
    // to handle multiple guests, we keep recipe and calories display the same
    // (minus a little "(cook xN)" notification), but repeat each ingredient
    // for the ingredients bookkeeping.
    let ingredientsHTMLInner = '';
    let dishCalories = 0;
    let dishIngredDescs = [];
    for (let ingredient of dish.ingredients) {
        // if any ingredient has unk (< 0) cals, make whole dish unk cals
        let ingredientQUT = ingredient;
        let ingredCals = getCalories(CALORIE_BANK, ingredientQUT);
        dishCalories = ingredCals < 0 || dishCalories < 0 ? -1 : dishCalories + ingredCals;
        for (let i = 0; i < guests; i++) {
            dishIngredDescs.push(ingredient);
        }
        // add to ingredients html
        ingredientsHTMLInner += htmlIngredient(ingredCals, ingredientQUT);
    }
    return [dishCalories, dishIngredDescs, ingredientsHTMLInner];
}
/**
 * @param timeInfo is provided if this dish is being rendered as part of a day's
 * meal. (For drag'n'drop info.) Otherwise (as part of dish view) it's just null.
 *
 * @param tooltipDirection is optionally provided to help customize what direction the
 * tooltip hangs off of the element so as to not go off-screen on elements on the border
 *
 * @returns [dishHTML, dishCalories, dishIngredients]
 */
function renderDish(dishes, dishIDSpec, view, timeInfo, tooltipDirection) {
    let [dishID, guests] = unpackDishIDSpec(dishIDSpec);
    let dish = dishes[dishID];
    if (dish == null) {
        return [htmlDish(null, 'Unknown Dish: "' + dishID + '"', 1, 0, null, null, null, '', view, timeInfo, tooltipDirection), 0, []];
    }
    let [dishCalories, dishIngredDescs, ingredientsHTMLInner] = computeDishInfo(dish, guests);
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
    let wholeNum = raw < 1.0 ? 0 : Math.floor(raw);
    let wholeStr = wholeNum === 0 ? '' : wholeNum + '';
    let remainder = raw % 1;
    // close-to-whole numbers
    const epsilon = 0.02;
    if (remainder < epsilon) {
        // remainder close to zero; just return whole
        return wholeStr;
    }
    if (remainder + epsilon >= 1) {
        // remainder close to one; just return next whole number
        return '' + (wholeNum + 1);
    }
    // large numbers where we don't care about fractions
    if (raw > 25) {
        return wholeStr;
    }
    // fractional pieces
    let prec = 2;
    // let inpPrec = remainder.toPrecision(prec);
    for (let [num, str] of QUANT_MAP_REV.entries()) {
        if (Math.abs(remainder - num) < epsilon) {
            return wholeStr + str;
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
function incrementCounter(map, key) {
    let val = 1;
    if (map.has(key)) {
        val = map.get(key) + 1;
    }
    map.set(key, val);
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
let CALORIE_BANK;
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
// finishing up
//
let scrollTimer = null;
/**
 * Don't want to adjust stuff constantly while scrolling is happening. Better to wait
 * until ~done.
 */
function onScroll() {
    if (scrollTimer != null) {
        clearTimeout(scrollTimer);
    }
    scrollTimer = setTimeout(adjustScroll, 150);
}
function adjustScroll() {
    const els = $('.tooltip');
    let maxY = window.innerHeight + window.scrollY;
    const buffer = 5;
    const imgH = 80;
    // for edit view, we do a check for being buried outside the container
    const container = $('#editDishes');
    if (container != null && container.length > 0) {
        let rect = container[0].getBoundingClientRect();
        maxY = Math.min(maxY, rect.bottom);
    }
    for (let el of els) {
        const elSize = el.getBoundingClientRect();
        if (elSize.bottom + buffer > maxY) {
            $(el).addClass('up');
        }
        else if ($(el).hasClass('up') && elSize.bottom + elSize.height - imgH + buffer < maxY) {
            // similar logic here to that described in onResize().
            $(el).removeClass('up');
        }
    }
}
function onResize() {
    const els = $('.tooltip');
    const bodySize = document.body.getBoundingClientRect();
    const buffer = 10;
    const imgW = 80;
    for (let el of els) {
        const elSize = el.getBoundingClientRect();
        if (elSize.right + buffer > bodySize.right) {
            $(el).addClass('left');
        }
        else if ($(el).hasClass('left') && elSize.right + imgW + elSize.width + buffer < bodySize.right) {
            // note: the math here is gross. we're trying to calculate what whould
            // happen if it were to swap positions, which includes wapping which side of
            // the image it is on. (also note the hasClass check doesn't really matter,
            // but for me it helps my brain grasp the logic here a bit quicker.)
            $(el).removeClass('left');
        }
    }
    adjustScroll();
}
function finish() {
    onResize();
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
async function loadDishes(displayURL, otherURLs, combos, templates, next) {
    // these are the dishes we display in the dishes and edit views
    let displayDishes = await $.getJSON(displayURL);
    // we create the complete bank for lookups later
    let mergedDishes = { ...displayDishes };
    for (let url of otherURLs) {
        let dishes = await $.getJSON(url);
        mergedDishes = { ...mergedDishes, ...dishes };
    }
    next(displayDishes, mergedDishes, combos, templates);
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
                let [origQuantity, unit, thing] = getQUT(ingredient.split(' '));
                let newQuantity = (origQuantity / servings).toFixed(2);
                newDish.ingredients.push([newQuantity + '', unit, thing].join(' '));
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
function onDishesLoadedTime(weekFN, view, displayDishesRaw, allDishesRaw, combos, templates) {
    let displayDishes = preprocessDishes(displayDishesRaw);
    let allDishes = preprocessDishes(allDishesRaw);
    console.log('Rendering time-based view.');
    $.getJSON(weekFN, onWeekLoaded.bind(null, view, displayDishes, allDishes, combos, templates))
        .fail(onWeekFail.bind(null, weekFN, view, displayDishes, allDishes, combos, templates));
}
/**
 * Callback for once dishes are loaded and rendering dishes-only view.
 */
function onDishesLoadedDishes(displayDishesRaw, allDishesRaw, combos, templates) {
    let displayDishes = preprocessDishes(displayDishesRaw);
    console.log('Rendering dishes view.');
    // console.log('Got dishes');
    // console.log(allDishes);
    $('body').append(renderDishes(displayDishes, View.Dishes));
    finish();
}
function onWeekFail(weekFN, view, displayDishes, allDishes, combos, templates) {
    if (view == View.Edit) {
        // write default week to path and try again
        serialize(EMPTY_WEEK, weekFN, onDishesLoadedTime.bind(null, weekFN, view, displayDishes, allDishes, combos, templates));
    }
    else {
        $('body').append("week didn't exist uh oh. Click 'edit' to make current week.");
    }
}
function onWeekLoaded(view, displayDishes, allDishes, combos, templates, week) {
    // console.log('Got dishes');
    // console.log(dishes);
    // Save week data for drag'n'drop.
    // console.log('Got week');
    // console.log(week);
    DragNDropGlobals.weekData = week;
    console.log('viewType: ' + View[view]);
    if (view == View.ShowWeek) {
        // render full-week display-only view.
        $('body').append(renderWeekView(allDishes, week));
    }
    else if (view == View.Edit) {
        // render full-week edit view.
        $('body').append(renderEditView(displayDishes, allDishes, week, combos, templates));
    }
    else if (view == View.ShowDay) {
        // render day view. assumes current day is the one to render.
        let dayID = moment().format('dddd').toLowerCase();
        let [dayHTML, _] = renderDay(allDishes, dayID, week[dayID], View.ShowDay);
        $('body').append(dayHTML);
    }
    finish();
}
//
// core execution
//
const displayDishesFN = 'data/dishes/dishes.json';
const otherDishesFNs = [
    'data/dishes/mom-dishes.json',
    'data/dishes/customization.json',
    'data/dishes/treats.json',
    'data/dishes/graveyard.json',
];
const caloriesFN = 'data/calories.json';
const combosFN = 'data/combos.json';
const templatesFN = 'data/templates.json';
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
function prettyTemplateName(raw) {
    let words = raw.replace('.json', '').replace(/-/g, ' ').replace(/_/g, ' ').split(' ');
    let capWords = [];
    words.forEach((word) => {
        capWords.push(word.substr(0, 1).toUpperCase() + word.substr(1));
    });
    return capWords.join(' ');
}
async function loadTemplates() {
    // load the template index file
    const tree_template_index = await $.getJSON(templatesFN);
    const tree_template_dir = tree_template_index[0];
    const prefix = tree_template_dir.name;
    // load each of the template files
    let templates = [];
    for (let tree_template_file of tree_template_dir.contents) {
        let path = prefix + tree_template_file.name;
        try {
            let week = await $.getJSON(path);
            templates.push({
                name: prettyTemplateName(tree_template_file.name),
                path: path,
                week: week,
            });
        }
        catch (e) {
            // Just ignore template if it doesn't exist.
        }
    }
    return Promise.resolve(templates);
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
    console.log('Using view: ' + View[view]);
    return view;
}
/**
 * Copies the week in sourcePath and overwrites the current week data with its contents.
 *
 * @param sourcePath week to copy FROM. (The destination is the current week.)
 */
async function copyWeek(sourcePath) {
    let destPath = DragNDropGlobals.weekFN;
    // confirm because this would change a lot of data.
    if (!confirm(`Are you sure?

This will overwrite the selected week (${destPath}) with the contents
of the week at "${sourcePath}".`)) {
        return;
    }
    ;
    // do the overwrite. load the data fresh because we don't have the week here as a
    // global.
    let sourceWeek = await $.getJSON(sourcePath);
    serialize(sourceWeek, destPath, () => { location.reload(); });
}
async function main(calorieFile) {
    // set calorie bank globally
    CALORIE_BANK = buildBank(calorieFile);
    // get config
    let url = new URL(window.location.href);
    let weekFN = getWeekFN(url);
    let view = getView(url);
    // set global config for drag'n'drop
    DragNDropGlobals.weekFN = weekFN;
    // load combos (won't be grounded yet)
    let combos = await $.getJSON(combosFN);
    // load templates
    let templates = await loadTemplates();
    // perform the page requested action
    if (view == View.Dishes) {
        // display dishes
        loadDishes(displayDishesFN, otherDishesFNs, combos, templates, onDishesLoadedDishes);
    }
    else if (view == View.ShowDay || view == View.ShowWeek || view == View.Edit) {
        // display time-based rendering (week, day, or edit)
        loadDishes(displayDishesFN, otherDishesFNs, combos, templates, onDishesLoadedTime.bind(null, weekFN, view));
    }
    else {
        console.error('Unknown view: ' + view);
    }
}
function preload() {
    $.getJSON(caloriesFN, main);
}
preload();
// swap around tooltips as window is resized!
window.addEventListener("resize", onResize);
window.addEventListener("scroll", onScroll);
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
