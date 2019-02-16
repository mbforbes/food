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
// process data
//

/**
 * Callback for once dishes are loaded and rendering time-based (day/week)
 * view.
 */
function onDishesLoadedTime(weekFN: string, view: View, dishes: Dishes): void {
    console.log('Rendering time-based view.');
    $.getJSON(weekFN, onWeekLoaded.bind(null, view, dishes))
        .fail(onWeekFail.bind(null, weekFN, view, dishes));
}

/**
 * Callback for once dishes are loaded and rendering dishes-only view.
 */
function onDishesLoadedDishes(dishes: Dishes): void {
    console.log('Rendering dishes view.');

    console.log('Got dishes');
    console.log(dishes);

    $('body').append(renderDishes(dishes, View.Dishes));
}

function onWeekFail(weekFN: string, view: View, dishes: Dishes): void {
    if (view == View.Edit) {
        // write default week to path and try again
        serialize(EMPTY_WEEK, weekFN, onDishesLoadedTime.bind(null, weekFN, view, dishes));
    } else {
        $('body').append("week didn't exist uh oh. Click 'edit' to make current week.");
    }
}

function onWeekLoaded(view: View, dishes: Dishes, week: Week): void {
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
    } else if (view == View.Edit) {
        // render full-week edit view.
        $('body').append(renderEdit(dishes, week));
    } else if (view == View.ShowDay) {
        // render day view. assumes current day is the one to render.
        let dayID = moment().format('dddd').toLowerCase() as DayID;
        let [dayHTML, _] = renderDay(dishes, dayID, week[dayID], View.ShowDay);
        $('body').append(dayHTML);
    }
}


//
// core execution
//

const dishesFN = 'data/dishes.json';

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
    } else if (view == View.ShowDay || view == View.ShowWeek || view == View.Edit) {
        // display time-based rendering (week, day, or edit)
        $.getJSON(dishesFN, onDishesLoadedTime.bind(null, weekFN, view));
    } else {
        console.error('Unknown view: ' + view);
    }
}

main();
