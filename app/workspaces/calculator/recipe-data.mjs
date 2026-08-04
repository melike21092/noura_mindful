export const CALORIE_CLASSES = Object.freeze({
    purple: Object.freeze({ min: 250, max: 300, label: 'Purple / leicht' }),
    breakfast: Object.freeze({ min: 300, max: 400, label: 'Normales Frühstück' }),
    green: Object.freeze({ min: 350, max: 450, label: 'Leichte Hauptmahlzeit' }),
    yellow: Object.freeze({ min: 450, max: 550, label: 'Standard-Hauptmahlzeit' }),
    orange: Object.freeze({ min: 550, max: 650, label: 'Comfort-Hauptmahlzeit' }),
    red: Object.freeze({ min: 650, max: 700, label: 'Großes Comfort-Gericht' })
});

export function getCalorieClass(caloriesPerPortion, mealType) {
    if (!Number.isFinite(caloriesPerPortion)) throw new TypeError('Recipe calories must be finite');
    if (mealType === 'breakfast') {
        if (caloriesPerPortion >= 250 && caloriesPerPortion <= 300) return 'purple';
        if (caloriesPerPortion >= 300 && caloriesPerPortion <= 400) return 'breakfast';
    }
    if (caloriesPerPortion >= 350 && caloriesPerPortion <= 450) return 'green';
    if (caloriesPerPortion >= 450 && caloriesPerPortion <= 550) return 'yellow';
    if (caloriesPerPortion >= 550 && caloriesPerPortion <= 650) return 'orange';
    if (caloriesPerPortion >= 650 && caloriesPerPortion <= 700) return 'red';
    throw new RangeError(`No prototype calorie class for ${caloriesPerPortion} kcal`);
}

function createRecipe(metadata) {
    return Object.freeze({
        ...metadata,
        calorieClass: getCalorieClass(metadata.caloriesPerPortion, metadata.mealType)
    });
}

// Prototype-only metadata, manually curated from the workbook reference. No ingredients,
// preparation instructions or legacy Excel color markers are copied.
export const RECIPES = Object.freeze([
    {
        id: 'metabolism-shake',
        name: 'Stoffwechselshake',
        source: 'NOURA Prototyp',
        sourceType: 'own',
        pageOrLink: '',
        caloriesPerPortion: 260,
        proteinPerPortion: 25,
        mealType: 'breakfast',
        mealPrep: true,
        childFriendly: true,
        preparationType: 'Shake'
    },
    {
        id: 'mukis-porridge',
        name: 'Mukis Porridge',
        source: 'Nutrilize, eigenes Rezept',
        sourceType: 'own',
        pageOrLink: '',
        caloriesPerPortion: 339,
        proteinPerPortion: 26,
        mealType: 'breakfast',
        mealPrep: true,
        childFriendly: true,
        preparationType: 'Porridge'
    },
    {
        id: 'protein-pudding-oats',
        name: 'Protein-Pudding-Oats',
        source: 'Easy Meal Prep – Marc Berger',
        sourceType: 'book',
        pageOrLink: 'S. 28',
        caloriesPerPortion: 356,
        proteinPerPortion: 27,
        mealType: 'breakfast',
        mealPrep: true,
        childFriendly: true,
        preparationType: 'Overnight Oats'
    },
    {
        id: 'overnight-oats',
        name: 'Overnight Oats',
        source: 'Easy Meal Prep – Marc Berger',
        sourceType: 'book',
        pageOrLink: 'S. 46',
        caloriesPerPortion: 500,
        proteinPerPortion: 43,
        mealType: 'breakfast',
        mealPrep: true,
        childFriendly: true,
        preparationType: 'Overnight Oats'
    },
    {
        id: 'lentil-soup',
        name: 'Linsensuppe',
        source: 'Cookidoo',
        sourceType: 'cookidoo',
        pageOrLink: '',
        caloriesPerPortion: 360,
        proteinPerPortion: 30,
        mealType: 'main',
        mealPrep: true,
        childFriendly: true,
        preparationType: 'Suppe'
    },
    {
        id: 'peanut-udon',
        name: 'Erdnuss-Udon',
        source: 'Instagram-Rezept',
        sourceType: 'link',
        pageOrLink: 'https://www.instagram.com/reel/DOyTkCNDORY/',
        caloriesPerPortion: 486,
        proteinPerPortion: 39,
        mealType: 'main',
        mealPrep: true,
        childFriendly: true,
        preparationType: 'Pfanne'
    },
    {
        id: 'salmon-spinach-pasta',
        name: 'Lachs-Spinat-Pasta',
        source: 'QLF Abnehm Konzept',
        sourceType: 'book',
        pageOrLink: 'S. 148',
        caloriesPerPortion: 527,
        proteinPerPortion: 49,
        mealType: 'main',
        mealPrep: true,
        childFriendly: true,
        preparationType: 'One Pot'
    },
    {
        id: 'lasagna-stew',
        name: 'Lasagne-Eintopf',
        source: 'Instagram-Rezept',
        sourceType: 'link',
        pageOrLink: 'https://www.instagram.com/reel/DEpwkH-CSyS/',
        caloriesPerPortion: 585,
        proteinPerPortion: 32,
        mealType: 'main',
        mealPrep: true,
        childFriendly: true,
        preparationType: 'Eintopf'
    },
    {
        id: 'kung-pao-chicken',
        name: 'Kung Pao Chicken',
        source: 'Instagram-Rezept',
        sourceType: 'link',
        pageOrLink: 'https://www.instagram.com/reel/DG5wxGPtSDF/',
        caloriesPerPortion: 620,
        proteinPerPortion: 39,
        mealType: 'main',
        mealPrep: true,
        childFriendly: true,
        preparationType: 'Pfanne'
    },
    {
        id: 'pastitsio',
        name: 'Pastitsio',
        source: 'Kochbuch',
        sourceType: 'book',
        pageOrLink: '',
        caloriesPerPortion: 620,
        proteinPerPortion: 38,
        mealType: 'main',
        mealPrep: true,
        childFriendly: true,
        preparationType: 'Auflauf'
    },
    {
        id: 'maultaschen-pan',
        name: 'Maultaschen-Pfanne',
        source: 'Instagram-Rezept',
        sourceType: 'link',
        pageOrLink: 'https://www.instagram.com/reel/DGyXJgCstkH/',
        caloriesPerPortion: 680,
        proteinPerPortion: 43,
        mealType: 'main',
        mealPrep: true,
        childFriendly: true,
        preparationType: 'Pfanne'
    }
].map(createRecipe));

export function getRecipeById(id, recipes = RECIPES) {
    return recipes.find(recipe => recipe.id === id) ?? null;
}

export function getBreakfastRecipes(recipes = RECIPES) {
    return recipes.filter(recipe => recipe.mealType === 'breakfast');
}

export function getMainRecipes(recipes = RECIPES) {
    return recipes.filter(recipe => recipe.mealType === 'main');
}
