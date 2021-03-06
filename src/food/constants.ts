//
// constants
//

// http://unicodefractions.com/ for more. use hex w/o leading "&#x"
const FRAC_EIGHTH = '\u{215B}' // ⅛
const FRAC_THREE_EIGHTH = '\u{215C}' // ⅜
const FRAC_FIVE_EIGHTH = '\u{215D}' // ⅝
const FRAC_SEVEN_EIGHTH = '\u{215E}' // ⅞
const FRAC_ONE_FIFTH = '\u{2155}'  // ⅕
const FRAC_TWO_FIFTH = '\u{2156}'  // ⅖
const FRAC_THREE_FIFTH = '\u{2157}' // ⅗
const FRAC_FOUR_FIFTH = '\u{2158}' // ⅘
const FRAC_FOURTH = '\u{BC}' // ¼
const FRAC_THIRD = '\u{2153}' // ⅓
const FRAC_HALF = '\u{BD}'; // ½
const FRAC_TWO_THIRD = '\u{2154}' // ⅔
const FRAC_THREE_QUARTER = '\u{BE}' // ¾
const QUANT_MAP = new Map([
    [FRAC_EIGHTH, 1 / 8],
    [FRAC_THREE_EIGHTH, 3 / 8],
    [FRAC_FIVE_EIGHTH, 5 / 8],
    [FRAC_SEVEN_EIGHTH, 7 / 8],
    [FRAC_ONE_FIFTH, 1 / 5],
    [FRAC_TWO_FIFTH, 2 / 5],
    [FRAC_THREE_FIFTH, 3 / 5],
    [FRAC_FOUR_FIFTH, 4 / 5],
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
    'tbs', 'tbsp', 'tsp', 'fl-oz', 'lb', 'lbs', 'cup', 'cups', 'scoop',
    'scoops', 'pcs', 'psc', 'g', 'bag', 'bags', 'bunch', 'bunches', 'fillet',
    'fillets', 'bottle', 'bottles', 'bar', 'bars', 'cloves', 'clove', 'pack', 'packs',
    'x', 'head', 'heads', 'dab', 'dabs', 'slices', 'slice', 'cans', 'can', 'piece',
    'pieces', 'oz', 'boxes', 'box', 'packets', 'packet', 'inches', 'inch', 'sprigs',
    'sprig', 'pounds', 'pound', 'ml'
]);

const LOCATION_MAPPING = new Map<string, string>([
    ['produce', 'prod.'],
    ['intl', 'intl.'],
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
    'collagen powder',
    'quinoa (cooked)',
    'rice (white, cooked)',
    'dried parsley leaves',
    'brown sugar',
    'balsamic vinegar',
    'ketchup',
    'red wine vinegar',
    'honey',
    'Worcestershire sauce',
    'sake',
    'hondashi',
    'togarashi',
    'soy sauce',
    'sambal oelek',
    'sesame oil',
    'sugar',
    'rice vinegar',
    'rice wine vinegar',
    'vegetable oil',
    'garlic cloves',
    'water',
    'garlic',
    'ginger',
    'rice',
    'vanilla extract',
    'hoisin sauce',
    'pickled ginger',
    'pickled ginger (minced)',
    'ginger paste',
    'sesame seeds',
    'garlic',
    'instant coffee',
    'splenda (test this)',
    'salt',
    'oats',
    'apple pie spice',
    'cinnamon',
    'fish sauce',
    'siracha',
    'rice (brown, cooked)',
    'cornstarch',
    'ground ginger',
    'tomato paste',
    'coconut oil',
    'coriander',
    'cumin',
    'tumeric',
    'cayenne powder',
    'splenda',
])

// things used as internal placeholders we don't need to add to any list
const IGNORE_THINGS = new Set([
    'eat this much 200',
    'eat this much 500',
    'eat this much 600',
    'eat this much 700',
    'eat this much-ish',
    'chipotle burrito',
])

let EMPTY_WEEK: Week = {
    monday: {
        breakfast: [],
        lunch: [],
        dinner: [],
    },
    tuesday: {
        breakfast: [],
        lunch: [],
        dinner: [],
    },
    wednesday: {
        breakfast: [],
        lunch: [],
        dinner: [],
    },
    thursday: {
        breakfast: [],
        lunch: [],
        dinner: [],
    },
    friday: {
        breakfast: [],
        lunch: [],
        dinner: [],
    },
    saturday: {
        breakfast: [],
        lunch: [],
        dinner: [],
    },
    sunday: {
        breakfast: [],
        lunch: [],
        dinner: [],
    }
}

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
type MealID = 'breakfast' | 'morningSnack' | 'lunch' | 'snack' | 'afternoonSnack' | 'dinner' | 'eveningSnack';
const AllMeals: MealID[] = ['breakfast', 'morningSnack', 'lunch', 'snack', 'afternoonSnack', 'dinner', 'eveningSnack']
type IngredientQUT = string;
type DayID = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
const AllDays: DayID[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

// These types are for interpreting the template index file generated by `tree` (the
// unix program)
type TreeTemplateIndex = TreeTemplateDirectory[]

type TreeTemplateDirectory = {
    type: string,
    name: string,
    contents: TreeTemplateFile[],
}

type TreeTemplateFile = {
    type: string,
    name: string,
}

// These types are for using the template data in the program.

/**
 * Template data as stored on disk, plus a path that we add on.
 */
type Template = {
    name: string,
    week: Week,
    path: string,
}

type Templates = Template[]

// Summaries for showing template views, and doing meal prep planning

/**
 * MealPrep aggregates preparation across multiple dishes and meals, if "mealPrep" tags
 * are provided on dishes. Otherwise, it simply treats each unique dish as its own thing
 * to be prepared.
 *
 * Examples:
 *
 *  - 500-calorie breakfast burritos appearing four times across the week
 *    => 1 MealPrep object ~= {name, ["breakfast"], [500], <"brtos": 5>}
 *
 * - several pulled pork dishes appearing across lunch and dinner, such as
 *    * lunch A: pulled pork sandwich (452 cals)
 *    * lunch A: BBQ sauce (48 cals)
 *    * dinner B: pulled pork, rice, slaw -- dinner serving (651 cals)
 *    * dinner B: BBQ sauce (48 cals)
 *    * lunch C: pulled pork, rice, slaw -- lunch serving (514 cals)
 *    * lunch C: BBQ sauce (48 cals)
 *    * lunch D: pulled pork sandwich (452 cals)
 *    * lunch D: BBQ sauce (48 cals)
 *   these 8 dishes across 4 meals really are one "meal prep group", so if they all have
 *   the same meal prep tag, then
 *   => 1 MealPrep object ~= {
 *        name,
 *        ["lunch", "dinner", "lunch", "lunch"],
 *        [500, 699, 562, 500]
 *        <BBQ sauce: 4, pp sand: 2, pp/r/s dinner: 1, pp/r/s lunch: 1>,
 *    }
 */
type MealPrep = {
    name: string,
    meals: string[],
    calories: number[],
    dishCounts: Map<DishID, number>,
}

/**
 * Estimate of recipes that need to be prepared.
 */
type WeekPrep = MealPrep[]

// Meal types

type Dish = {
    title: string,
    mealHint: MealID,
    ingredients: IngredientQUT[],
    img?: string,
    recipe?: string,
    recipeServings?: number,
    mealPrep?: false | string,
}

/**
 * Found in dishes.json. Map from DishID to Dish (which Typescript won't allow, so we
 * use string instead of DishID).
 */
type Dishes = {
    [key: string]: Dish,
}

type Day = {
    [m in MealID]?: DishIDSpec[]
}

type Combo = {
    dishes: DishID[],
}

type Combos = Combo[];

/**
 * Found in any week .json file.
 */
type Week = {
    [d in DayID]?: Day
}

enum View {
    ShowWeek = 0,
    ShowDay = 1,
    Dishes = 2,
    Edit = 3,
    EditCombo = 4,
}

type TimeInfo = {
    dayID: DayID,
    mealID: MealID,
}

//
// Found in calories.json file
//

/**
 * calories, "quantity unit"
 */
type CalorieSpec = [number, string]

type CalorieFile = {
    [ingredient: string]: CalorieSpec[]
}

//
// In-memory representation of calories we load into.
//

type CalorieUnitData = {
    calories: number,
    quantity: number,
}

type CalorieData = {
    [unit: string]: CalorieUnitData,
}

type IngredientData = {
    calorieData: CalorieData,
    location: string | null,
}

type CalorieBank = {
    [ingredient: string]: IngredientData
}
