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
function htmlAllDishesForMeal(meal: string, dishesHTML: string): string {
    let displayMeal = meal[0].toUpperCase() + meal.slice(1);
    let displayClass = 'day solo';

    return `
    <div class="${displayClass}">
        <h1>${displayMeal}</h1>

        ${dishesHTML}
    </div>
    `
}

// below are for the week / day / meal / dish view

function htmlDay(dayID: DayID, dayCalories: number, mealHTML: string, solo: boolean): string {
    let displayDay = dayID[0].toUpperCase() + dayID.slice(1);
    let displayClass = solo ? 'day solo' : 'day';

    return `
    <div class="${displayClass}">
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

function htmlDish(dishID: string | null, dishTitle: string, dishGuests: number, dishCalories: number, ingredientsHTML: string): string {
    let dishExtra = (dishGuests === 1 ? '' : ' <i>(cook x' + dishGuests + ')</i>');
    let dishIDDisplay = (dishID == null) ? '' : ' <h2><pre>[' + dishID + ']</pre></h2>';

    return `
    <div class="dish">
        <h1>${dishTitle}${dishExtra}</h1>
        ${dishIDDisplay}
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

function renderWeek(dishes: Dishes, week: Week): [string, string[]] {
    let weekHTML = '';
    let weekIngredDescs: string[] = [];
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
function renderDay(dishes: Dishes, dayID: DayID, day: Day, solo: boolean): [string, string[]] {
    // if day not listed in json: nothing
    if (day == null) {
        return [htmlDay(dayID, 0, '', solo), []];
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
    return [htmlDay(dayID, dayCalories, mealHTML, solo), dayIngredDescs];
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
        let [dishHTML, dishCalories, dishIngredDescs] = renderDish(dishes, dishID, false);
        mealCalories += dishCalories;
        dishesHTML += dishHTML;
        mealIngredDescs.push(...dishIngredDescs);
    }
    return [htmlMeal(mealID, mealCalories, dishesHTML), mealCalories, mealIngredDescs];
}

/**
 * @returns [dishHTML, dishCalories, dishIngredients]
 */
function renderDish(dishes: Dishes, dishIDSpec: DishIDSpec, displayID: boolean): [string, number, string[]] {

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
        return [htmlDish(null, 'Unknown Dish: "' + dishID + '"', 1, 0, ''), 0, []]
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

    let providedDishID = displayID ? dishID : null;
    return [
        htmlDish(providedDishID, dish.title, guests, dishCalories, htmlIngredients(ingredientsHTMLInner)),
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
