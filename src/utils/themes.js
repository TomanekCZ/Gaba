export const THEME_DEFINITIONS = [
    {
        id: 'travel',
        label: 'Cestování',
        keywords: [
            'airport', 'flight', 'plane', 'train', 'bus', 'station', 'ticket', 'passport', 'luggage', 'hotel', 'room',
            'departure', 'arrival', 'gate', 'platform', 'trip', 'travel', 'journey', 'map', 'reservation', 'check-in',
            'leti', 'vlak', 'autobus', 'jizden', 'pas', 'zavaz', 'ubytov', 'hotel', 'pokoj', 'odlet', 'prilet', 'cesta'
        ],
    },
    {
        id: 'food',
        label: 'Jidlo',
        keywords: [
            'food', 'drink', 'eat', 'meal', 'restaurant', 'cafe', 'coffee', 'tea', 'water', 'breakfast', 'lunch',
            'dinner', 'menu', 'bill', 'dessert', 'kitchen', 'cook', 'bread', 'milk', 'fruit', 'vegetable', 'meat',
            'jidlo', 'pit', 'snidan', 'obed', 'vecer', 'restaurac', 'kava', 'caj', 'voda', 'pecivo', 'ovoce', 'zelen'
        ],
    },
    {
        id: 'health',
        label: 'Zdravi',
        keywords: [
            'doctor', 'dentist', 'tooth', 'teeth', 'hospital', 'clinic', 'pain', 'ill', 'medicine', 'tablet',
            'headache', 'fever', 'healthy', 'sick', 'appointment', 'toothbrush', 'toothpaste', 'floss', 'gums',
            'lekar', 'zubar', 'zub', 'nemoc', 'bolest', 'lek', 'tablet', 'horecka', 'zdravi', 'nemocnice', 'dasen'
        ],
    },
    {
        id: 'work',
        label: 'Prace',
        keywords: [
            'work', 'job', 'office', 'project', 'meeting', 'email', 'client', 'manager', 'team', 'task', 'career',
            'salary', 'business', 'company', 'deadline', 'contract', 'report', 'presentation', 'school', 'lesson',
            'prace', 'zamestn', 'kancelar', 'projekt', 'schuz', 'tym', 'ukol', 'firma', 'plat', 'smlouv', 'skola', 'lekce'
        ],
    },
    {
        id: 'people',
        label: 'Lide a vztahy',
        keywords: [
            'family', 'friend', 'mother', 'father', 'sister', 'brother', 'wife', 'husband', 'boyfriend', 'girlfriend',
            'child', 'children', 'baby', 'people', 'person', 'relationship', 'love', 'married', 'single',
            'rodina', 'pritel', 'matka', 'otec', 'sestra', 'bratr', 'manzel', 'manzelka', 'dite', 'lidi', 'vztah', 'laska'
        ],
    },
    {
        id: 'home',
        label: 'Domacnost',
        keywords: [
            'home', 'house', 'flat', 'apartment', 'kitchen', 'bathroom', 'bedroom', 'door', 'window', 'table', 'chair',
            'bed', 'floor', 'wall', 'clean', 'wash', 'shower', 'towel', 'laundry', 'rent',
            'dum', 'domov', 'byt', 'kuchyn', 'koupeln', 'loznic', 'dvere', 'okno', 'stul', 'zidle', 'postel', 'sprcha'
        ],
    },
    {
        id: 'time',
        label: 'Cas a plan',
        keywords: [
            'today', 'tomorrow', 'yesterday', 'morning', 'afternoon', 'evening', 'night', 'week', 'month', 'year',
            'hour', 'minute', 'calendar', 'schedule', 'time', 'late', 'early', 'deadline',
            'dnes', 'zitra', 'vcera', 'rano', 'odpoledne', 'vecer', 'noc', 'tyden', 'mesic', 'rok', 'hodin', 'minut', 'cas'
        ],
    },
];

const FALLBACK_THEME = {
    id: 'general',
    label: 'Obecne',
};

function normalizeText(value) {
    return String(value || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

export function getThemeLabel(themeId) {
    const found = THEME_DEFINITIONS.find((theme) => theme.id === themeId);
    return found ? found.label : FALLBACK_THEME.label;
}

export function classifyCardTheme(card) {
    const haystack = [
        card?.en,
        card?.cz,
        ...(Array.isArray(card?.meanings) ? card.meanings : []),
        ...(Array.isArray(card?.tags) ? card.tags : []),
        card?.context,
        card?.contextCz,
    ]
        .map(normalizeText)
        .join(' ');

    for (const theme of THEME_DEFINITIONS) {
        if (theme.keywords.some((keyword) => haystack.includes(normalizeText(keyword)))) {
            return theme.id;
        }
    }

    return FALLBACK_THEME.id;
}

export const AVAILABLE_THEME_FILTERS = [
    { id: 'all', label: 'Vse' },
    ...THEME_DEFINITIONS.map((theme) => ({ id: theme.id, label: theme.label })),
    { id: FALLBACK_THEME.id, label: FALLBACK_THEME.label },
];
