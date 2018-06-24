/// <reference path="../../lib/moment.d.ts" />
/// <reference path="../../lib/jquery.d.ts" />
const AllMeals = ['breakfast', 'morningSnack', 'lunch', 'afternoonSnack', 'dinner', 'eveningSnack'];
const AllDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
//
// html templates
//
function htmlDay(dayID, dayCalories, mealHTML) {
    let displayDay = dayID[0].toUpperCase() + dayID.slice(1);
    return `
    <div class="day">
        <h1>${displayDay}</h1>
        <h4>${dayCalories} calories</h4>

        ${mealHTML}
    </div>
    `;
}
function htmlMeal(mealID, mealCalories, dishesHTML) {
    let displayMeal = mealID[0].toUpperCase() + mealID.slice(1);
    return `
    <h2>${displayMeal}</h2>
    <h3>${mealCalories} calories</h3>

    ${dishesHTML}
    `;
}
function htmlDish(dishTitle, dishCalories, ingredientsHTML) {
    return `
    <div class="dish">
        <h1>${dishTitle}</h1>
        <h2>${dishCalories} calories</h2>

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
    return `
    <tr>
        <td>${ingredient[0]}</td><td class="ingredientCell">${ingredient[1]}</td>
    </tr>
    `;
}
//
// funcs
//
function getWeekFilename(m) {
    return 'data/weeks/' + m.format('MMMDD-YYYY').toLowerCase() + '.json';
}
function getThisWeekFilename() {
    // strategy: check current day. subtract 1 day at a time until we reach
    // a monday.
    let cur = moment();
    while (cur.format('dddd') !== 'Monday') {
        cur = cur.subtract(1, 'days');
    }
    return getWeekFilename(cur);
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
function onDishesLoaded(dishes) {
    // NOTE: picking week to load here
    console.log('this week fn:', getThisWeekFilename());
    console.log('next week fn:', getNextWeekFilename());
    let weekFN = getNextWeekFilename();
    $.getJSON(weekFN, onWeekLoaded.bind(null, dishes));
}
function onWeekLoaded(dishes, week) {
    console.log('Got dishes');
    console.log(dishes);
    console.log('Got week');
    console.log(week);
    let weekHTML = renderWeek(dishes, week);
    $('body').append(weekHTML);
}
function renderWeek(dishes, week) {
    let dayHTML = '';
    for (let dayID of AllDays) {
        dayHTML += renderDay(dishes, dayID, week[dayID]);
    }
    return dayHTML;
}
function renderDay(dishes, dayID, day) {
    // if day not listed in json: nothing
    if (day == null) {
        return htmlDay(dayID, 0, '');
    }
    // render and sum calories for all meals
    let dayCalories = 0;
    let mealHTML = '';
    for (let mealID of AllMeals) {
        let [curMealHTML, curMealCalories] = renderMeal(dishes, mealID, day[mealID]);
        mealHTML += curMealHTML;
        dayCalories += curMealCalories;
    }
    return htmlDay(dayID, dayCalories, mealHTML);
}
function renderMeal(dishes, mealID, mealDishes) {
    // if meal not listed, or no meals provided, return nothing
    if (mealDishes == null || mealDishes.length === 0) {
        return ['', 0];
    }
    // iterate through dishes listed
    let mealCalories = 0;
    let dishesHTML = '';
    for (let dishID of mealDishes) {
        let [dishHTML, dishCalories] = renderDish(dishes[dishID], dishID);
        mealCalories += dishCalories;
        dishesHTML += dishHTML;
    }
    return [htmlMeal(mealID, mealCalories, dishesHTML), mealCalories];
}
function renderDish(dish, dishID) {
    if (dish == null) {
        return [htmlDish('Unknown Dish: "' + dishID + '"', 0, ''), 0];
    }
    let ingredientsHTMLInner = '';
    let dishCalories = 0;
    for (let ingredient of dish.ingredients) {
        dishCalories += ingredient[0];
        ingredientsHTMLInner += htmlIngredient(ingredient);
    }
    return [htmlDish(dish.title, dishCalories, htmlIngredients(ingredientsHTMLInner)), dishCalories];
}
//
// config
//
const dishesFN = 'data/dishes.json';
//
// execution
//
$.getJSON(dishesFN, onDishesLoaded);
