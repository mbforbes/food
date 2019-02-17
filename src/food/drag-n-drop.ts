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
}

/**
 * For some reason, this needs to be set on droppable zones when something is
 * dragged over them to allow something to be dropped onto them.
 */
function allowDrop(ev: DragEvent): void {
    ev.preventDefault();
    $(ev.target).attr('drop-active', 'on');
}

function dragLeave(ev: DragEvent): void {
    $(ev.target).removeAttr('drop-active');
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
