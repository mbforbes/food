/// <reference path="../../lib/moment.d.ts" />
/// <reference path="../../lib/jquery.d.ts" />
/// <reference path="render.ts" />
/// <reference path="constants.ts" />
/// <reference path="util.ts" />
/// <reference path="parse.ts" />

//
// pick filenames
//

function getWeekFilename(m: moment.Moment): string {
    return 'data/weeks/' + m.format('MMMDD-YYYY').toLowerCase() + '.json';
}

function getThisWeekFilename(start: moment.Moment = moment()): string {
    // strategy: check current day. subtract 1 day at a time until we reach
    // a monday.
    let cur = start;
    while (cur.format('dddd') !== 'Monday') {
        cur = cur.subtract(1, 'days');
    }
    return getWeekFilename(cur);
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
    return getWeekFilename(candidate);
}

//
// process data
//

/**
 * Callback for once dishes are loaded and rendering time-based (day/week)
 * view.
 */
function onDishesLoadedTime(dishes: Dishes): void {
    console.log('Rendering time-based view.');
    $.getJSON(weekFN, onWeekLoaded.bind(null, dishes)).fail(onWeekFail.bind(null, dishes));
}

/**
 * Callback for once dishes are loaded and rendering dishes-only view.
 */
function onDishesLoadedDishes(dishes: Dishes): void {
    console.log('Rendering dishes view.');

    console.log('Got dishes');
    console.log(dishes);

    // render all dishes
    let mealMap = new Map<string, string[]>();
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

        $('body').append(
            htmlAllDishesForMeal(
                mealID,
                mealMap.get(mealID).join('\n'),
            )
        );
    }
}

function onWeekFail(dishes: Dishes): void {
    if (view == 'edit') {
        // write default week to path and try again
        serialize(EMPTY_WEEK, weekFN, onDishesLoadedTime.bind(null, dishes));
    } else {
        $('body').append("week didn't exist uh oh. Click 'edit' to make current week.");
    }
}

function onWeekLoaded(dishes: Dishes, week: Week): void {
    console.log('Got dishes');
    console.log(dishes);

    console.log('Got week');
    console.log(week);

    console.log('viewType: ' + view);
    if (view == 'week') {
        // render full-week display-only view.
        let [weekHTML, weekIngredDescs] = renderWeek(dishes, week);
        let groceryList = renderGroceryList(weekIngredDescs);
        $('body').append(weekHTML + groceryList);
    } else if (view == 'edit') {
        // TODO: render full-week edit view.
        $('body').append('going to render edits here');
    } else if (view == 'day') {
        // render day view. assumes current day is the one to render.
        let dayID = moment().format('dddd').toLowerCase() as DayID;
        let [dayHTML, _] = renderDay(dishes, dayID, week[dayID], true);
        $('body').append(dayHTML);
    }
}



//
// config
//

const dishesFN = 'data/dishes.json';

// parse url to pick week
let weekFN: string;
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

// day view really only makes sense with current week, though hitting 'prev'
// can let you check out what you ate last week on the same day, so i guess
// that's cool too.
let view: string;
let viewRaw = url.searchParams.get('view');
switch (viewRaw) {
    case 'day':
        view = 'day';
        break;
    case 'dishes':
        view = 'dishes';
        break;
    case 'edit':
        view = 'edit';
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
    // display dishes
    $.getJSON(dishesFN, onDishesLoadedDishes);
} else if (view == 'day' || view == 'week' || view == 'edit') {
    // display time-based rendering (week, day, or edit)
    $.getJSON(dishesFN, onDishesLoadedTime);
} else {
    console.error('Unknown view: ' + view);
}
