
### Prototype menu editor
TD Suitcase → Meal Choices → Edit Menus & Options → Load Menus.
The TD can edit menu/restaurant names, course titles, option names and descriptions,
and add options, courses and menus. Single List — No Courses uses one choice list;
Divided Into Courses requires one choice per course. Choose the new menu deadline
in Hanoi time before saving. Existing IDs remain stable; existing courses/options
cannot be removed, so saved choices remain readable. Hide menus using Meals Shown
To Travelers. Renaming a dish changes its displayed label in saved choices/reports.
The catalog is stored under `meal-choices-v1/settings/catalog` using conditional
writes. All guest choice records remain separate. Guest forms, TD entry, paper
suggestions, summaries and exports use the same catalog. Menu writes require TD
session, same-origin request and the prototype site ID. Live is unchanged.
