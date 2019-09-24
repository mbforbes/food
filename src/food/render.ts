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
function htmlAllDishesForMeal(meal: string, dishesHTML: string, view: View): string {
    let displayMeal = meal[0].toUpperCase() + meal.slice(1);

    if (view == View.Edit) {
        return `
        <h1>${displayMeal}</h1>
        <div class="editMealDishes">
            ${dishesHTML}
        </div>
        `
    }

    let displayClass = 'meal';

    return `
    <div class="${displayClass}">
        <h1>${displayMeal}</h1>

        ${dishesHTML}
    </div>
    `
}

// below are for the week / day / meal / dish view

function htmlDay(dayID: DayID, dayCalories: number, mealHTML: string, view: View): string {
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
        `
    }

    // week and day view
    let displayClass = view == View.ShowDay ? 'day solo' : 'day';
    return `
    <div class="${displayClass}">
        <h1>${displayDay}</h1>
        <h4>${calories} calories</h4>

        ${mealHTML}
    </div>
    `
}

function htmlMeal(dayID: DayID, mealID: MealID, mealCalories: number, dishesHTML: string, view: View): string {
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
        `
    }

    // display view for week or day. if the meal is empty, don't display.
    if (dishesHTML.length == 0) {
        return "";
    }
    return `
    <h2>${displayMeal}</h2>
    <h3>${calories} calories</h3>

    ${dishesHTML}
    `
}

function htmlDish(
    dishID: string | null,
    dishTitle: string,
    dishGuests: number,
    dishCalories: number,
    dishImg: string | null,
    dishRecipe: string | null,
    dishRecipeServings: number | null,
    ingredientsHTML: string,
    view: View,
    timeInfo?: TimeInfo,
    tooltipDirection?: string,
): string {
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
            `
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

/**
 * - Breaks unit down to bare  (tsp, g)
 * - Builds unit up to larger quantity as needed (tbsp, cup, lb)
 * - Renders quantity nicely (fractions, cutoff decimal, etc. etc.)
 * - Joins up pieces and returns.
 * @param ingredientQUT
 */
function reprocessIngredient(ingredientQUT: IngredientQUT): string {
    let [qRaw, uRaw, t] = getQUT(ingredientQUT.split(' '));
    let uStandard = UnitStandardize.has(uRaw) ? UnitStandardize.get(uRaw) : uRaw;
    if (UnitConversion.has(uStandard)) {
        let [scaleQuantity, scaleUnit] = UnitConversion.get(uStandard);
        qRaw *= scaleQuantity
        uStandard = scaleUnit;
    }

    const [qSimple, uFinal] = simplifyUnits(qRaw, uStandard);
    const qFinal = renderQuantity(qSimple);
    return [qFinal, uFinal, t].join(' ')
}

function htmlIngredient(caloriesRaw: number, ingredientQUT: IngredientQUT): string {
    const calories = caloriesRaw < 0 ? '???' : caloriesRaw + '';
    const ingredient = reprocessIngredient(ingredientQUT);
    return `
    <tr>
        <td class="calorieCell">${calories}</td>
        <td class="ingredientCell">${ingredient}</td>
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

function htmlGroceryIngredient(quantity: string, unit: string, thing: string, location: string | null): string {
    let locStr = location == null ? '' : location;
    if (LOCATION_MAPPING.has(locStr)) {
        locStr = LOCATION_MAPPING.get(locStr);
    }

    return `
    <tr>
       <td>[${locStr}]</td><td class="quantity">${quantity}</td><td>${unit}</td><td>${thing}</td>
    </tr>
    `
}

//
// rendering helpers
//

function addIngred(m: Map<string, number>, origQuantity: number, origUnit: string, thing: string): void {
    // translate and store as base unit.
    let quantity = origQuantity;
    let unit = UnitStandardize.has(origUnit) ? UnitStandardize.get(origUnit) : origUnit;
    if (UnitConversion.has(origUnit)) {
        let [scaleQuantity, scaleUnit] = UnitConversion.get(unit);
        quantity *= scaleQuantity
        unit = scaleUnit;
    }

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
 * Assumes "base" units passed in (tsp or g).
 */
function simplifyUnits(origQuantity: number, origUnit: string): [number, string] {
    if (origUnit == 'tsp') {
        if (origQuantity < 3) {
            return [origQuantity, origUnit];
        } else if (origQuantity < 12) {
            return [origQuantity / UnitConversion.get('tbsp')[0], 'tbsp'];
        } else {
            return [origQuantity / UnitConversion.get('cup')[0], 'cup'];
        }
    } else if (origUnit == 'g') {
        if (origQuantity < 155) {
            return [origQuantity, origUnit];
        } else if (origQuantity <= 453) {
            return [origQuantity / UnitConversion.get('oz')[0], 'oz'];
        } else {
            return [origQuantity / UnitConversion.get('lb')[0], 'lb'];
        }
    }
    return [origQuantity, origUnit];
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

    // now we alphabetize based on ingredient. note that when we import this into
    // reminders, apple alphabetizes, so we've added a location section (not included
    // here)  to the display. so we could potentially sort by that instead. alphabetical
    // by ingredient might be nice here to easily check whether something is on there.
    let res: string[][] = [];
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

function renderGroceryList(rawIngredDescs: string[]): string {
    // sort and merge
    let ingredDescs = mergeIngredDescs(rawIngredDescs)

    // render each
    let checkListHTML = '';
    let ingredientDescHTML = '';
    for (let ingredDesc of ingredDescs) {
        let [quantity, unit, thing] = ingredDesc;

        let location = getLocation(CALORIE_BANK, thing);

        // separate ingredients from things to check
        if (IGNORE_THINGS.has(thing)) {
            // noop
        } else if (BULK_THINGS.has(thing)) {
            checkListHTML += htmlGroceryIngredient(quantity, unit, thing, location);
        } else {
            ingredientDescHTML += htmlGroceryIngredient(quantity, unit, thing, location);
        }
    }

    // render all
    return htmlGroceryIngredientList(ingredientDescHTML, checkListHTML);
}

function renderEdit(displayDishes: Dishes, allDishes: Dishes, week: Week): string {
    let [weekHTML, weekIngredDescs] = renderWeek(allDishes, week, View.Edit);
    let dishesHTML = renderDishes(displayDishes, View.Edit);
    // uncomment to instead render ALL dishes in bank
    // dishesHTML = renderDishes(allDishes, View.Edit);
    let groceryList = renderGroceryList(weekIngredDescs);
    return `
    <div class="editContainer">
        <div class="editTime">
            ${weekHTML}
        </div>
        <div id="editDishes" class="editDishes" ondragover="allowDrop(event)" ondrop="trashDrop(event)" onscroll="onScroll()">
            ${dishesHTML}
            <!--
                For ensuring tooltips don't expand / contract the overall size of the div
                when they discover they're offscreen, move up (with .up class applied),
                shrink the div, no longer become off screen, and then start jittering
                around.
            -->
            <div class="editDishesSpacer"></div>
        </div>
    </div>
    ${groceryList}
    `
}

function renderWeek(dishes: Dishes, week: Week, view: View): [string, string[]] {
    let weekHTML = '';
    let weekIngredDescs: string[] = [];
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
function renderDay(dishes: Dishes, dayID: DayID, day: Day, view: View): [string, string[]] {
    // if day not listed in json: nothing
    if (day == null) {
        return [htmlDay(dayID, 0, '', view), []];
    }

    // render and sum calories for all meals
    let dayCalories = 0;
    let mealHTML = '';
    let dayIngredDescs: string[] = [];
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
function renderMeal(dishes: Dishes, dayID: DayID, mealID: MealID, mealDishes: DishIDSpec[] | null, view: View): [string, number, string[]] {
    // if meal not listed, we can't render it. otherwise, we assume that the
    // meal is listed for some reason, even if it is empty (e.g., an empty zone
    // for drang'n'drop), so we render it.
    if (mealDishes == null) {
        return ['', 0, []];
    }

    // iterate through dishes listed
    let mealCalories = 0;
    let dishesHTML = '';
    let mealIngredDescs: string[] = [];
    for (let dishID of mealDishes) {
        let [dishHTML, dishCalories, dishIngredDescs] = renderDish(
            dishes, dishID, view, { dayID: dayID, mealID: mealID });
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
function renderDishes(dishes: Dishes, view: View, tooltipDirection?: string): string {
    // first, map each dish to the meal it belongs to
    let mealMap = new Map<string, string[]>();
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
        res += htmlAllDishesForMeal(mealID, mealMap.get(mealID).join('\n'), view)
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
function renderDish(
    dishes: Dishes,
    dishIDSpec: DishIDSpec,
    view: View,
    timeInfo?: TimeInfo,
    tooltipDirection?: string,
): [string, number, string[]] {
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
        return [htmlDish(null, 'Unknown Dish: "' + dishID + '"', 1, 0, null, null, null, '', view, timeInfo, tooltipDirection), 0, []]
    }

    // to handle multiple guests, we keep recipe and calories display the same
    // (minus a little "(cook xN)" notification), but repeat each ingredient
    // for the ingredients bookkeeping.
    let ingredientsHTMLInner = '';
    let dishCalories = 0;
    let dishIngredDescs: string[] = [];
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

    return [
        htmlDish(
            dishID,
            dish.title,
            guests,
            dishCalories,
            dish.img,
            dish.recipe,
            dish.recipeServings,
            htmlIngredients(ingredientsHTMLInner),
            view,
            timeInfo,
            tooltipDirection,
        ),
        dishCalories,
        dishIngredDescs,
    ];
}

function renderQuantity(raw: number): string {
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
