/// <reference path="../../lib/moment.d.ts" />
/// <reference path="../../lib/jquery.d.ts" />

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

let weekFN = getNextWeekFilename();
console.log(getThisWeekFilename());
console.log(getNextWeekFilename());

// Type explanation:
// a Week (Mon-Sun) has multiple Days
// each Day has a set of Meals (breakfast, lunch, dinner, etc.)
// each Meal has a set of Dishes (e.g., 1. chicken + rice, 2. beer)
// each Dish is keyed by a unique DishID, and has some data (title and ingredients)

type DishID = string
type MealID = 'breakfast' | 'morningSnack' | 'lunch' | 'afternoonSnack' | 'dinner' | 'eveningSnack';
type Ingredient = [number, string]
type DayID = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

type Dish = {
    title: string,
    mealHint: MealID,
    ingredients: Ingredient[]
}

/**
 * Found in meals.json. Map from DishID to Dish.
 */
type Meals = {
    [key: string]: Dish,
}

type Day = {
    [m in MealID]?: DishID[]
}

/**
 * Found in any week .json file.
 */
type Week = {
    [d in DayID]?: Day
}

// $.getJSON(weekFN,
