/**
 * Called when you start dragging a dish. Sets the data that should be
 * transferred.
 */
function drag(ev: DragEvent, dishID: string, dayID?: DayID, mealID?: MealID): void {
    // always send dish id
    ev.dataTransfer.setData('dishIDs', dishID);

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

function dragCombo(ev: DragEvent, dishList: string, comboCalories: number): void {
    // set data. this is vital
    ev.dataTransfer.setData('dishIDs', dishList);

    // draw a custom drag image
    let w = 200, h = 40;
    let canvas: HTMLCanvasElement = document.getElementById('comboDragImage') as HTMLCanvasElement;
    if (canvas == null) {
        canvas = document.createElement("canvas");
        canvas.setAttribute('id', 'comboDragImage');
        canvas.width = w;
        canvas.height = h;
        document.body.append(canvas);
    }

    let ctx = canvas.getContext("2d");
    ctx.fillStyle = '#fed530';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#000000';
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 16px Inter';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`combo (${comboCalories} calories)`, w / 2, h / 2);

    ev.dataTransfer.setDragImage(canvas, w / 2, h / 2);
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
    let dishIDs = ev.dataTransfer.getData('dishIDs');
    // console.log('got ' + dayID + ' ' + mealID + ' ' + dishID);
    for (let dishID of dishIDs.split(',')) {
        DragNDropGlobals.weekData[dayID][mealID].push(dishID);
    }

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
        // NOTE: assuming trash drop is only one dish. (dishIDs is just one DishID).
        let dishIDs = ev.dataTransfer.getData('dishIDs');
        let meal: string[] = DragNDropGlobals.weekData[dayID][mealID];
        let idx = meal.indexOf(dishIDs);
        if (idx > -1) {
            meal.splice(idx, 1);
        }
        serialize(DragNDropGlobals.weekData, DragNDropGlobals.weekFN, () => { location.reload() });
    }
}
