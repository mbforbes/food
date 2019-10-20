# food

A simple, ugly, desktop-only web app for meal prepping to lose weight.

![preview of food app edit page](media/preview-edit.png)

## About

This is a web app I made to count calories while cooking my own meals.

It is simple, stupid, and is full of rough edges. I made it feature by feature only so
that it would be useful for me personally. You have to edit `.json` files to add
ingredients, calories, dishes, and combos. The UI is ugly and updates only through page
refreshes. And to use it, you have to run a server locally on your desktop, because
there's no login, no accounts, and not even a mobile UI.

And it works. Well, at least it worked for me. I lost a bunch of weight, saved money by
cooking, saved time by meal prepping (and then spent it working on this app 😊), and
improved my cooking. I hope to write more about why I think this is a good approach, at
least for me, which I'll link to here.

## Notes

### Taxonomy

- **ingredient**: item with specific calories (e.g., chicken breast)

- **dish**: composed from ingredients; produced from one recipe (e.g., chicken pita
  wrap); to use other dishes as components (e.g., chicken pita wraps that use chicken
  marinade), must turn a dish into an ingredient; simpler composing is to use multiple
  dishes.

- **combo**: composed from dishes; aimed to reach a specific calorie goal (e.g., chicken
  pita wrap + baked Brussels sprouts).

- **meal**: composed from dishes; linked to a particular day and time; abstractly,
  identical to a combo in that it is simply a set of dishes, but semantically a combo is
  an abstract collection of dishes, and a meal is a set of dishes set to a particular
  day and time of eating; note that a combo can be dragged onto a meal, but this simply
  transfers the set of dishes, not the concept of a "combo."

Combos fill the gap between turning recipes into ingredients and dishes (low level), but
doing my weekly meal planning by caloric goals and how much meal prep I need to do (high
level).


### Combo organization

Thought: I could sort combos by meal and then by calorie ranges. E.g., have a ~500 +/-
50 cals region. Could stratify by 100s or by 50s

- by 100s: 450 -- 549 ~= 500
- by 50s: 475 -- 524 ~= 500


### Why menus?

Doing a full week of meal planning takes a long time because of trying to
- re-use ingredients throughout the week
- account for ingredients I already have
- account for packaging (e.g., 1 lb beef, 2 chicken breasts, loaf of bread, 6-pack buns)
- account for timing (climbing mornings w/o cook time, leftover save lengths)
- account for saving (meats, many vegetables, and premade salads don't last the week if
  bought on saturday beforehand)

Plus, you can try more time saving strategies:
- cooking in bulk so I'm not cooking dinner from scratch every day (e.g., stew)
- having to-go or premade breakfasts or lunches (or both), so I don't have to prep both

Overall, I'd like to keep meals healthy and cheap, but I don't want to spend a ton of
time cooking all 3 meals per day. I'd rather have some repeats _and then spend longer on
one weeknight or a weekend cooking a new and interesting recipe_.

It can be useful to try to pre-design some week plans ahead of time around themes
(e.g., mexican, asian, american, etc.) to encourage ingredient reuse, and take into
account ingredient quantities, some bulk prep, and faster breakfasts or lunches. Can
also plan in 1–2 new meals to try. **Helpful to do this on paper / text form to figure
out the high level plan, and then work out the actual recipes, ingredients, and calories
later.** I think figuring out both the high level and low level plans at the same time
is what makes this exhausting, and makes being creative difficult.
