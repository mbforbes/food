//
// constants
//

// http://unicodefractions.com/ for more. use hex w/o leading "&#x"
const FRAC_FOURTH = '\u{BC}' // ¼
const FRAC_THIRD = '\u{2153}' // ⅓
const FRAC_HALF = '\u{BD}'; // ½
const FRAC_TWO_THIRD = '\u{2154}' // ⅔
const FRAC_THREE_QUARTER = '\u{BE}' // ¾
const QUANT_MAP = new Map([
    [FRAC_FOURTH, 1 / 4],
    [FRAC_THIRD, 1 / 3],
    [FRAC_HALF, 1 / 2],
    [FRAC_TWO_THIRD, 2 / 3],
    [FRAC_THREE_QUARTER, 3 / 4],
])
function revMap<K, V>(m: Map<K, V>): Map<V, K> {
    let r = new Map<V, K>();
    for (let [key, val] of m.entries()) {
        r.set(val, key);
    }
    return r;
}
const QUANT_MAP_REV = revMap(QUANT_MAP);

const KNOWN_UNITS = new Set([
    'tbs', 'tbsp', 'tsp', 'oz', 'ozs', 'lb', 'lbs', 'cup', 'cups', 'scoop',
    'scoops', 'pcs', 'psc', 'g', 'bag', 'bags', 'bunch', 'bunches', 'fillet',
    'fillets', 'bottle', 'bottles', 'bar', 'bars',
]);

// things we probably don't have to buy, but should check that we have enough
// of
const BULK_THINGS = new Set([
    'butter',
    'jam',
    'maple syrup',
    'mayo',
    'olive oil',
    'pancake mix (TJ\'s pumpkin)',
    'parmesan',
    'peanut butter',
    'potato flakes',
    'protein powder',
    'quinoa (cooked)',
    'rice (white, cooked)'
])

// things used as internal placeholders we don't need to add to any list
const IGNORE_THINGS = new Set([
    '[eat this much-ish]',
    '[chipotle burrito]',
])

//
// types
//

// Type explanation:
// a Week (Mon-Sun) has multiple Days
// each Day has a set of Meals (breakfast, lunch, dinner, etc.)
// each Meal has a set of Dishes (e.g., 1. chicken + rice, 2. beer)
// each Dish is keyed by a unique DishID, and has some data (title and ingredients)


type DishID = string
type DishIDObj = {
    dishID: DishID,
    guests: number,
}
type DishIDSpec = DishID | DishIDObj
type MealID = 'breakfast' | 'morningSnack' | 'lunch' | 'afternoonSnack' | 'dinner' | 'eveningSnack';
const AllMeals: MealID[] = ['breakfast', 'morningSnack', 'lunch', 'afternoonSnack', 'dinner', 'eveningSnack']
type Ingredient = [number, string]
type DayID = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
const AllDays: DayID[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

type Dish = {
    title: string,
    mealHint: MealID,
    ingredients: Ingredient[]
}

/**
 * Found in dishes.json. Map from DishID to Dish.
 */
type Dishes = {
    [key: string]: Dish,
}

type Day = {
    [m in MealID]?: DishIDSpec[]
}

/**
 * Found in any week .json file.
 */
type Week = {
    [d in DayID]?: Day
}
