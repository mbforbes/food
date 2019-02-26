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
            <p><b>${displayDay}</b> <i>${calories} calories</i></p>
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
            <p>${displayMeal} [${calories} calories]</p>
        </div>
        `
    }

    // display view for week or day
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
    ingredientsHTML: string,
    view: View,
    timeInfo?: TimeInfo,
): string {
    if (dishID == null) {
        console.error('Got null dish');
    }

    const calories = dishCalories < 0 ? '???' : dishCalories + '';

    if (view == View.Edit) {
        let dayID = timeInfo != null ? "'" + timeInfo.dayID + "'" : null;
        let mealID = timeInfo != null ? "'" + timeInfo.mealID + "'" : null;
        let recipe = dishRecipe != null ? '<a class="recipeLink" target="_blank" href="' + dishRecipe + '">recipe</a>' : '';
        // return pic if possible
        if (dishImg != null) {
            return `
            <div
                class="editDish"
                draggable="true"
                ondragstart="drag(event, '${dishID}', ${dayID}, ${mealID} )"
            >
                <img
                    src="${dishImg}"
                />
                <span class="calOverlay">${calories}</span>
                <span class="tooltip">
                <b>${dishTitle}</b> (${calories} cal)
                <br />
                <hr />
                ${ingredientsHTML}
                ${recipe}
                </span>
            </div>
            `
        }
        // otherwise return text rep
        return `
        <div class="editDish" draggable="true" ondragstart="drag(event, '${dishID}', ${dayID}, ${mealID} )">
        ${dishTitle}
        </div>
        `
    }

    // dishes only view, or view within a day plan.
    const cssClass = view == View.Dishes ? 'dishCard' : 'dish';
    const dishExtra = (dishGuests === 1 ? '' : ' <i>(cook x' + dishGuests + ')</i>');
    const dishIDDisplay = (view == View.Dishes) ? ' <h2><pre>[' + dishID + ']</pre></h2>' : '';

    return `
    <div class="${cssClass}">
        <h1>${dishTitle}${dishExtra}</h1>
        ${dishIDDisplay}
        <h2>${calories} calories</h2>

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
    const calories = ingredient[0] < 0 ? '???' : ingredient[0] + '';
    return `
    <tr>
        <td class="calorieCell">${calories}</td>
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
// rendering helpers
//

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

        // separate ingredients from things to check
        if (IGNORE_THINGS.has(thing)) {
            // noop
        } else if (BULK_THINGS.has(thing)) {
            checkListHTML += htmlGroceryIngredient(quantity, unit, thing);
        } else {
            ingredientDescHTML += htmlGroceryIngredient(quantity, unit, thing);
        }
    }

    // render all
    return htmlGroceryIngredientList(ingredientDescHTML, checkListHTML);
}

function renderEdit(dishes: Dishes, week: Week): string {
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
    return [weekHTML, weekIngredDescs];
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
 * @returns dishesHTML
 */
function renderDishes(dishes: Dishes, view: View): string {
    // first, map each dish to the meal it belongs to
    let mealMap = new Map<string, string[]>();
    for (let dishID in dishes) {
        let [html, calories, ingredients] = renderDish(dishes, dishID, view);

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
 * @returns [dishHTML, dishCalories, dishIngredients]
 */
function renderDish(
    dishes: Dishes,
    dishIDSpec: DishIDSpec,
    view: View,
    timeInfo?: TimeInfo,
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
        return [htmlDish(null, 'Unknown Dish: "' + dishID + '"', 1, 0, null, null, '', view, timeInfo), 0, []]
    }

    // to handle multiple guests, we keep recipe and calories display the same
    // (minus a little "(cook xN)" notification), but repeat each ingredient
    // for the ingredients bookkeeping.
    let ingredientsHTMLInner = '';
    let dishCalories = 0;
    let dishIngredDescs: string[] = [];
    for (let ingredient of dish.ingredients) {
        ingredientsHTMLInner += htmlIngredient(ingredient);
        // if any ingredient has unk (< 0) cals, make whole dish unk cals

        dishCalories = ingredient[0] < 0 ? -1 : dishCalories + ingredient[0];
        for (let i = 0; i < guests; i++) {
            dishIngredDescs.push(ingredient[1]);
        }
    }

    return [
        htmlDish(
            dishID,
            dish.title,
            guests,
            dishCalories,
            dish.img,
            dish.recipe,
            htmlIngredients(ingredientsHTMLInner),
            view,
            timeInfo,
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
