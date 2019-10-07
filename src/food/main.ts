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
        } else if ($(el).hasClass('up') && elSize.bottom + elSize.height - imgH + buffer < maxY) {
            // similar logic here to that described in onResize().
            $(el).removeClass('up');
        }
    }
}

function onResize() {
    const els = $('.tooltip');
    const bodySize = document.body.getBoundingClientRect()
    const buffer = 10;
    const imgW = 80;

    for (let el of els) {
        const elSize = el.getBoundingClientRect();
        if (elSize.right + buffer > bodySize.right) {
            $(el).addClass('left');
        } else if ($(el).hasClass('left') && elSize.right + imgW + elSize.width + buffer < bodySize.right) {
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
function clone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
}

async function loadDishes(
    displayURL: string,
    otherURLs: string[],
    combos: Combos,
    templates: Templates,
    next: (displayDishes: Dishes, allDishes: Dishes, combos: Combos, templates: Templates) => void,
): Promise<void> {
    // these are the dishes we display in the dishes and edit views
    let displayDishes = await $.getJSON(displayURL);

    // we create the complete bank for lookups later
    let mergedDishes: Dishes = { ...displayDishes };
    for (let url of otherURLs) {
        let dishes: Dishes = await $.getJSON(url);
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
    combos: Combos,
    templates: Templates,
): void {
    let displayDishes = preprocessDishes(displayDishesRaw);
    let allDishes = preprocessDishes(allDishesRaw);

    console.log('Rendering time-based view.');
    $.getJSON(weekFN, onWeekLoaded.bind(null, view, displayDishes, allDishes, combos, templates))
        .fail(onWeekFail.bind(null, weekFN, view, displayDishes, allDishes, combos, templates));
}

/**
 * Callback for once dishes are loaded and rendering dishes-only view.
 */
function onDishesLoadedDishes(
    displayDishesRaw: Dishes,
    allDishesRaw: Dishes,
    combos: Combos,
    templates: Templates
): void {
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
    combos: Combos,
    templates: Templates,
): void {
    if (view == View.Edit) {
        // write default week to path and try again
        serialize(
            EMPTY_WEEK,
            weekFN,
            onDishesLoadedTime.bind(null, weekFN, view, displayDishes, allDishes, combos, templates),
        );
    } else {
        $('body').append("week didn't exist uh oh. Click 'edit' to make current week.");
    }
}

function onWeekLoaded(
    view: View,
    displayDishes: Dishes,
    allDishes: Dishes,
    combos: Combos,
    templates: Templates,
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
        $('body').append(renderWeekView(allDishes, week));
    } else if (view == View.Edit) {
        // render full-week edit view.
        $('body').append(renderEditView(displayDishes, allDishes, week, combos, templates));
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
const combosFN = 'data/combos.json';
const templatesFN = 'data/templates.json';

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

function prettyTemplateName(raw: string): string {
    let words = raw.replace('.json', '').replace(/-/g, ' ').replace(/_/g, ' ').split(' ');
    let capWords = [];
    words.forEach((word) => {
        capWords.push(word.substr(0, 1).toUpperCase() + word.substr(1));
    })
    return capWords.join(' ');
}

async function loadTemplates(): Promise<Templates> {
    // load the template index file
    const tree_template_index: TreeTemplateIndex = await $.getJSON(templatesFN);
    const tree_template_dir = tree_template_index[0];
    const prefix = tree_template_dir.name;

    // load each of the template files
    let templates: Template[] = [];
    for (let tree_template_file of tree_template_dir.contents) {
        let path = prefix + tree_template_file.name;
        try {
            let week: Week = await $.getJSON(path);
            templates.push({
                name: prettyTemplateName(tree_template_file.name),
                path: path,
                week: week,
            });
        } catch (e) {
            // Just ignore template if it doesn't exist.
        }
    }
    return Promise.resolve(templates);
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

/**
 * Copies the week in sourcePath and overwrites the current week data with its contents.
 *
 * @param sourcePath week to copy FROM. (The destination is the current week.)
 */
async function copyWeek(sourcePath: string) {
    let destPath = DragNDropGlobals.weekFN;
    // confirm because this would change a lot of data.
    if (!confirm(`Are you sure?

This will overwrite the selected week (${destPath}) with the contents
of the week at "${sourcePath}".`)) {
        return;
    };

    // do the overwrite. load the data fresh because we don't have the week here as a
    // global.
    let sourceWeek: Week = await $.getJSON(sourcePath);
    serialize(sourceWeek, destPath, () => { location.reload() });
}

async function main(calorieFile: CalorieFile) {
    // set calorie bank globally
    CALORIE_BANK = buildBank(calorieFile);

    // get config
    let url = new URL(window.location.href);
    let weekFN = getWeekFN(url);
    let view = getView(url);

    // set global config for drag'n'drop
    DragNDropGlobals.weekFN = weekFN;

    // load combos (won't be grounded yet)
    let combos: Combos = await $.getJSON(combosFN);

    // load templates
    let templates: Templates = await loadTemplates();

    // perform the page requested action
    if (view == View.Dishes) {
        // display dishes
        loadDishes(displayDishesFN, otherDishesFNs, combos, templates, onDishesLoadedDishes);
    } else if (view == View.ShowDay || view == View.ShowWeek || view == View.Edit) {
        // display time-based rendering (week, day, or edit)
        loadDishes(
            displayDishesFN,
            otherDishesFNs,
            combos,
            templates,
            onDishesLoadedTime.bind(null, weekFN, view)
        );
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
window.addEventListener("scroll", onScroll);
