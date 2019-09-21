/**
 * Called when you start dragging a dish. Sets the data that should be
 * transferred.
 */
function drag(ev: DragEvent, dishID: string, dayID?: DayID, mealID?: MealID): void {
    // always send dish id
    ev.dataTransfer.setData('dishID', dishID);

    // if coming from a specific meal, we set that as well, so it can be
    // trashed.
    if (dayID != null && mealID != null) {
        ev.dataTransfer.setData('dayID', dayID);
        ev.dataTransfer.setData('mealID', mealID);
    }

    // set what image is displayed. may drag the image itself, or the div surrounding
    // it, in which case we try to find it.
    let imgEl: Element = null;
    let el: Element = (ev.target as Element);
    if (el.nodeName == 'IMG' && el.hasAttribute('src')) {
        imgEl = el;
    } else {
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

function getHighlightEl(el: Element): Element {
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
function allowDrop(ev: DragEvent): void {
    ev.preventDefault();
    let highlightEl = getHighlightEl(ev.target as Element);
    if (highlightEl != null) {
        $(highlightEl).attr('drop-active', 'on');
    }
}

function dragLeave(ev: DragEvent): void {
    let highlightEl = getHighlightEl(ev.target as Element);
    if (highlightEl != null) {
        $(highlightEl).removeAttr('drop-active');
    }
    // $(ev.target).removeAttr('drop-active');
}


/**
 * Dropping a dish onto a meal.
 */
function mealDrop(dayID: DayID, mealID: MealID, ev: DragEvent): void {
    ev.preventDefault();
    $(ev.target).removeAttr('drop-active');

    // add the dish to the meal
    let dishID = ev.dataTransfer.getData('dishID');
    // console.log('got ' + dayID + ' ' + mealID + ' ' + dishID);
    DragNDropGlobals.weekData[dayID][mealID].push(dishID);

    // write out
    serialize(DragNDropGlobals.weekData, DragNDropGlobals.weekFN, () => { location.reload() });
}

/**
 * Dropping a dish onto a trash area.
 */
function trashDrop(ev: DragEvent): void {
    // this only does something if dragging from a particular meal
    let dayID = ev.dataTransfer.getData('dayID');
    let mealID = ev.dataTransfer.getData('mealID');
    if (dayID != '' && mealID != '') {
        let dishID = ev.dataTransfer.getData('dishID');
        let meal: string[] = DragNDropGlobals.weekData[dayID][mealID];
        let idx = meal.indexOf(dishID);
        if (idx > -1) {
            meal.splice(idx, 1);
        }
        serialize(DragNDropGlobals.weekData, DragNDropGlobals.weekFN, () => { location.reload() });
    }
}
