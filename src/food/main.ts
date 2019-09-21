/// <reference path="../../lib/moment.d.ts" />
/// <reference path="../../lib/jquery.d.ts" />
/// <reference path="render.ts" />
/// <reference path="constants.ts" />
/// <reference path="util.ts" />
/// <reference path="parse.ts" />

//
// Globals set per page load
//

type DNDG = {
    weekFN: string,
    weekData: Week,
}

/**
 * These are set for drag and drop purposes. They're not used elsewhere to keep
 * functions pure for ease of debugging.
 */
let DragNDropGlobals: DNDG = {
    weekFN: null,
    weekData: null,
}

let CALORIE_BANK: CalorieBank;

//
// pick filenames
//

function getWeekPath(m: moment.Moment): string {
    return 'data/weeks/' + m.format('MMMDD-YYYY').toLowerCase() + '.json';
}

function getThisWeekFilename(start: moment.Moment = moment()): string {
    // strategy: check current day. subtract 1 day at a time until we reach
    // a monday.
    let cur = start;
    while (cur.format('dddd') !== 'Monday') {
        cur = cur.subtract(1, 'days');
    }
    return getWeekPath(cur);
}

function getLastWeekFilename(): string {
    return getThisWeekFilename(moment().subtract(7, 'days'));
}

function getNextWeekFilename(): string {
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

function onResize() {
    const els = $('.tooltip');
    const bodySize = document.body.getBoundingClientRect()
    const buffer = 20;

    for (let el of els) {
        const elSize = el.getBoundingClientRect();
        if (elSize.right + buffer > bodySize.right) {
            $(el).addClass('left');
            console.log('adding left');
        } else {
            $(el).removeClass('left');
        }
    }
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
function clone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
}

async function loadDishes(
    displayURL: string,
    otherURLs: string[],
    next: (displayDishes: Dishes, allDishes: Dishes) => void,
): Promise<void> {
    // these are the dishes we display in the dishes and edit views
    let displayDishes = await $.getJSON(displayURL);

    // we create the complete bank for lookups later
    let mergedDishes: Dishes = { ...displayDishes };
    for (let url of otherURLs) {
        let dishes: Dishes = await $.getJSON(url);
        mergedDishes = { ...mergedDishes, ...dishes };
    }
    next(displayDishes, mergedDishes);
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
function preprocessDishes(dishes: Dishes): Dishes {
    console.log('Preprocessing dishes...');
    let result: Dishes = {};
    for (let dishID in dishes) {
        let origDish = dishes[dishID];
        if (origDish.recipeServings == null || origDish.recipeServings == 1) {
            // no transformation needed
            result[dishID] = origDish;
        } else {
            // we have recipe servings that need to be taken into account. First off, we
            // copy over the dish info, remove the ingredients, and then build them back
            // up using the multiplier.
            let servings = origDish.recipeServings;
            let newDish = clone(origDish);
            newDish.ingredients = [];
            for (let ingredient of origDish.ingredients) {
                let [origQuantity, unit, thing] = getQUT(ingredient.split(' '));
                let newQuantity = (origQuantity / servings).toFixed(2);
                newDish.ingredients.push([newQuantity + '', unit, thing].join(' '))
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
function onDishesLoadedTime(
    weekFN: string,
    view: View,
    displayDishesRaw: Dishes,
    allDishesRaw: Dishes,
): void {
    let displayDishes = preprocessDishes(displayDishesRaw);
    let allDishes = preprocessDishes(allDishesRaw);

    console.log('Rendering time-based view.');
    $.getJSON(weekFN, onWeekLoaded.bind(null, view, displayDishes, allDishes))
        .fail(onWeekFail.bind(null, weekFN, view, displayDishes, allDishes));
}

/**
 * Callback for once dishes are loaded and rendering dishes-only view.
 */
function onDishesLoadedDishes(displayDishesRaw: Dishes, allDishesRaw: Dishes): void {
    let displayDishes = preprocessDishes(displayDishesRaw);

    console.log('Rendering dishes view.');
    // console.log('Got dishes');
    // console.log(allDishes);

    $('body').append(renderDishes(displayDishes, View.Dishes));
    finish();
}

function onWeekFail(
    weekFN: string,
    view: View,
    displayDishes: Dishes,
    allDishes: Dishes,
): void {
    if (view == View.Edit) {
        // write default week to path and try again
        serialize(
            EMPTY_WEEK,
            weekFN,
            onDishesLoadedTime.bind(null, weekFN, view, displayDishes, allDishes),
        );
    } else {
        $('body').append("week didn't exist uh oh. Click 'edit' to make current week.");
    }
}

function onWeekLoaded(
    view: View,
    displayDishes: Dishes,
    allDishes: Dishes,
    week: Week,
): void {
    // console.log('Got dishes');
    // console.log(dishes);

    // Save week data for drag'n'drop.
    // console.log('Got week');
    // console.log(week);
    DragNDropGlobals.weekData = week;

    console.log('viewType: ' + View[view]);
    if (view == View.ShowWeek) {
        // render full-week display-only view.
        let [weekHTML, weekIngredDescs] = renderWeek(allDishes, week, View.ShowWeek);
        let groceryList = renderGroceryList(weekIngredDescs);
        $('body').append(weekHTML + groceryList);
    } else if (view == View.Edit) {
        // render full-week edit view.
        $('body').append(renderEdit(displayDishes, allDishes, week));
    } else if (view == View.ShowDay) {
        // render day view. assumes current day is the one to render.
        let dayID = moment().format('dddd').toLowerCase() as DayID;
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

function getWeekFN(url: URL): string {
    // parse url to pick week
    let weekFN: string;
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

function getView(url: URL): View {
    // day view really only makes sense with current week, though hitting 'prev'
    // can let you check out what you ate last week on the same day, so i guess
    // that's cool too.
    let view: View = null;
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

function main(calorieFile: CalorieFile) {
    // set calorie bank globally
    CALORIE_BANK = buildBank(calorieFile);

    // get config
    let url = new URL(window.location.href);
    let weekFN = getWeekFN(url);
    let view = getView(url);

    // set global config for drag'n'drop
    DragNDropGlobals.weekFN = weekFN;

    // perform the page requested action
    if (view == View.Dishes) {
        // display dishes
        loadDishes(displayDishesFN, otherDishesFNs, onDishesLoadedDishes);
    } else if (view == View.ShowDay || view == View.ShowWeek || view == View.Edit) {
        // display time-based rendering (week, day, or edit)
        loadDishes(displayDishesFN, otherDishesFNs, onDishesLoadedTime.bind(null, weekFN, view));
    } else {
        console.error('Unknown view: ' + view);
    }
}

function preload() {
    $.getJSON(caloriesFN, main);
}

preload();

// swap around tooltips as window is resized!
window.addEventListener("resize", onResize);
