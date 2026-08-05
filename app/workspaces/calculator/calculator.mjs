// NOURA product mapping anchored to DGE PAL ranges and adult step-count categories.
// It describes everyday activity plus steps without structured training.
export const BASIS_ACTIVITY_RANGES = Object.freeze({
    sedentary: Object.freeze({
        under4000: { min: 1.35, max: 1.4 },
        from4000to7000: { min: 1.4, max: 1.45 },
        from7000to10000: { min: 1.45, max: 1.5 },
        over10000: { min: 1.5, max: 1.6 },
        unknown: { min: 1.4, max: 1.45 }
    }),
    mixed: Object.freeze({
        under4000: { min: 1.4, max: 1.45 },
        from4000to7000: { min: 1.4, max: 1.5 },
        from7000to10000: { min: 1.45, max: 1.55 },
        over10000: { min: 1.55, max: 1.65 },
        unknown: { min: 1.45, max: 1.5 }
    }),
    standing: Object.freeze({
        under4000: { min: 1.4, max: 1.44 },
        from4000to7000: { min: 1.44, max: 1.48 },
        from7000to10000: { min: 1.48, max: 1.52 },
        over10000: { min: 1.51, max: 1.56 },
        unknown: { min: 1.44, max: 1.48 }
    }),
    strenuous: Object.freeze({
        under4000: { min: 1.68, max: 1.74 },
        from4000to7000: { min: 1.72, max: 1.78 },
        from7000to10000: { min: 1.76, max: 1.82 },
        over10000: { min: 1.8, max: 1.88 },
        unknown: { min: 1.72, max: 1.78 }
    })
});

// Conservative ranges from the 2024 Adult Compendium of Physical Activities.
export const TRAINING_MET_RANGES = Object.freeze({
    strength: { min: 3.5, max: 6.0 },
    cardio: { min: 4.8, max: 9.0 },
    mixed: { min: 4.0, max: 7.0 }
});

export const RESULT_MODES = Object.freeze({
    STANDARD: 'standard',
    PREGNANCY: 'pregnancy',
    EARLY_POSTPARTUM: 'early_postpartum',
    EXCLUSIVE_BREASTFEEDING: 'exclusive_breastfeeding',
    PARTIAL_BREASTFEEDING: 'partial_breastfeeding',
    POSTPARTUM_LOSS: 'postpartum_loss',
    SAFETY: 'safety'
});

const STANDARD_CTA_TITLES = Object.freeze({
    hunger: 'Dein Plan sollte dich nicht den ganzen Tag hungrig lassen.',
    cravings: 'Dein Abend beginnt oft mit dem, was tagsüber gefehlt hat.',
    irregular: 'Eine Kalorienzahl hilft wenig, wenn im Alltag Mahlzeiten ausfallen.',
    family: 'Ein passender Plan sollte sich auch am Familientisch umsetzen lassen.',
    stress: 'Stressessen löst man nicht mit einer strengeren Zahl.',
    weekend: 'Ein guter Plan darf auch am Wochenende tragen.',
    consistency: 'Vielleicht hilft dir kein härterer, sondern ein besser wiederholbarer Plan.',
    unsure: 'Wenn du nicht weißt, wo es kippt, schaue ich gemeinsam mit dir auf die Muster.'
});

const MODE_CTA = Object.freeze({
    [RESULT_MODES.PREGNANCY]: {
        eyebrow: 'Ernährungscoaching in der Schwangerschaft',
        title: 'Gute Versorgung ist jetzt wichtiger als ein Kalorienziel.',
        copy: 'Ich entwickle mit dir alltagstaugliche Mahlzeiten und passende Ernährungsbausteine. Medizinische Fragen und deine individuelle Versorgung bleiben Teil deiner Betreuung durch Hebamme oder Ärztin.',
        button: 'Meine Ernährung im Alltag besprechen'
    },
    [RESULT_MODES.EARLY_POSTPARTUM]: {
        eyebrow: 'Begleitung nach der Geburt',
        title: 'Gerade brauchst du vielleicht keine strengere Zahl, sondern mehr Entlastung.',
        copy: 'Ich schaue mit dir, wie einfache Mahlzeiten, erreichbare Proteinquellen und kleine Versorgungsanker in deinen neuen Alltag passen. Bei Beschwerden oder Komplikationen ersetzt das keine medizinische Rücksprache.',
        button: 'Meine Alltagssituation besprechen'
    },
    [RESULT_MODES.EXCLUSIVE_BREASTFEEDING]: {
        eyebrow: 'Stillfreundliches Ernährungscoaching',
        title: 'Eine Rechnerformel kennt deinen Stillalltag nicht.',
        copy: 'Ich betrachte mit dir Hunger, Energie, Mahlzeitenstruktur und die Anforderungen deines Alltags. NOURA ersetzt keine Stillberatung, hilft dir aber dabei, deine Ernährung stillfreundlich und alltagstauglich zu gestalten.',
        button: 'Stillfreundliche Ernährung besprechen'
    },
    [RESULT_MODES.PARTIAL_BREASTFEEDING]: {
        eyebrow: 'Persönliche Orientierung',
        title: 'Beim Teilstillen ist eine einzelne Kalorienzahl selten die ganze Antwort.',
        copy: 'Ich schaue gemeinsam mit dir, ob zunächst Stabilität, eine einfachere Mahlzeitenstruktur oder ein vorsichtiger persönlicher Abnahmestart zu deiner Situation passt.',
        button: 'Meine persönliche Orientierung besprechen'
    },
    [RESULT_MODES.POSTPARTUM_LOSS]: {
        eyebrow: 'Persönlicher Wiedereinstieg',
        title: 'Ein ruhiger Wiedereinstieg kann nach der Geburt passender sein als ein schneller Neustart.',
        copy: 'Ich entwickle mit dir einen vorsichtigen Start, der zu deiner Erholung, deinem Alltag und deiner aktuellen Belastung passt – ohne Druck oder starre Regeln.',
        button: 'Meinen passenden Wiedereinstieg besprechen'
    },
    [RESULT_MODES.SAFETY]: {
        eyebrow: 'Der passende nächste Schritt',
        title: 'Deine Situation verdient eine persönliche und fachlich passende Einordnung.',
        copy: 'Bitte kläre zunächst, ob und in welcher Form eine Gewichtsabnahme aktuell sinnvoll ist. NOURA ersetzt keine medizinische, psychologische oder ernährungstherapeutische Betreuung.',
        button: 'Geeigneten nächsten Schritt klären'
    }
});

export function getCtaContent(mode, obstacle) {
    if (mode === RESULT_MODES.STANDARD) {
        return {
            eyebrow: 'Persönliche Begleitung',
            title: STANDARD_CTA_TITLES[obstacle] || STANDARD_CTA_TITLES.unsure,
            copy: 'Im NOURA Coaching verbinde ich deinen Startwert mit deinem tatsächlichen Alltag. Ich schaue mit dir auf Hunger, Essdrang, Mahlzeitenstruktur, Stress und die Situationen, in denen dein Plan bisher nicht funktioniert.',
            button: 'Meinen persönlichen Start besprechen'
        };
    }
    return MODE_CTA[mode];
}

function isPositiveSafetyValue(value) {
    if (value === true) return true;
    return ['yes', 'true', 'positive'].includes(String(value ?? '').trim().toLowerCase());
}

export function normalizeInput(input = {}) {
    const normalized = { ...input };
    const lifeStage = String(input.lifeStage ?? '').trim().toLowerCase();

    normalized.medicalFlag =
        isPositiveSafetyValue(input.medicalFlag) ||
        isPositiveSafetyValue(input.medicalStatus) ||
        isPositiveSafetyValue(input.eatingDisorder);

    if (['pregnant', 'pregnancy'].includes(lifeStage)) {
        normalized.pregnant = 'yes';
    }
    if (['exclusive', 'exclusive_breastfeeding'].includes(lifeStage)) {
        if (normalized.pregnant !== 'yes') normalized.pregnant = 'no';
        normalized.breastfeeding = 'exclusive';
    }
    if (['partial', 'partial_breastfeeding'].includes(lifeStage)) {
        if (normalized.pregnant !== 'yes') normalized.pregnant = 'no';
        normalized.breastfeeding = 'partial';
    }
    if (['postpartum', 'early_postpartum'].includes(lifeStage)) {
        if (normalized.pregnant !== 'yes') normalized.pregnant = 'no';
        normalized.birthWithin12Months = 'yes';
        if (!['exclusive', 'partial'].includes(normalized.breastfeeding)) {
            normalized.breastfeeding = 'no';
        }
    }

    if (String(input.weeksPostpartum ?? '').trim() !== '') {
        normalized.weeksPostpartum = parseGermanNumber(input.weeksPostpartum);
    }

    return normalized;
}

export function determineResultMode(input) {
    const normalized = normalizeInput(input);
    if (normalized.medicalFlag) return RESULT_MODES.SAFETY;
    if (normalized.pregnant === 'yes') return RESULT_MODES.PREGNANCY;

    const recentBirth = normalized.birthWithin12Months === 'yes';
    const weeksPostpartum = parseGermanNumber(normalized.weeksPostpartum);
    if (recentBirth && Number.isFinite(weeksPostpartum) && weeksPostpartum < 6) {
        return RESULT_MODES.EARLY_POSTPARTUM;
    }
    if (normalized.breastfeeding === 'exclusive') return RESULT_MODES.EXCLUSIVE_BREASTFEEDING;
    if (normalized.breastfeeding === 'partial') return RESULT_MODES.PARTIAL_BREASTFEEDING;

    if (recentBirth) {
        const warning =
            normalized.recovered !== 'yes' ||
            normalized.complications !== 'no' ||
            normalized.advisedAgainstLoss !== 'no';
        return warning ? RESULT_MODES.SAFETY : RESULT_MODES.POSTPARTUM_LOSS;
    }

    return RESULT_MODES.STANDARD;
}

export const MISSIONS = Object.freeze({
    hunger: {
        lever: 'Sättigung über den Tag',
        title: 'Mehr Struktur für ruhigeren Hunger.',
        intro: 'Teste zunächst, ob verlässliche und sättigende Mahlzeiten deinen Hunger im Tagesverlauf verändern.',
        actions: [
            'Plane drei verlässliche Hauptmahlzeiten.',
            'Ergänze zu jeder Hauptmahlzeit eine Proteinquelle.',
            'Baue jeweils einen ballaststoffreichen Bestandteil ein.'
        ],
        question: 'Wird dein Hunger dadurch ruhiger – besonders am Nachmittag oder Abend?'
    },
    cravings: {
        lever: 'Abendlichen Essdrang verstehen',
        title: 'Mehr Sicherheit vor dem Abend.',
        intro: 'Abendlicher Essdrang beginnt oft früher am Tag. Teste eine verlässlichere Tagesstruktur, bevor du den Abend veränderst.',
        actions: [
            'Plane eine verlässliche Mahlzeit am Nachmittag.',
            'Kombiniere sie mit Protein und einem sättigenden Bestandteil.',
            'Bereite dein Abendessen ohne Zeitdruck vor.'
        ],
        question: 'Wird der Essdrang am Abend an diesen Tagen leichter?'
    },
    irregular: {
        lever: 'Verlässliche Mahlzeiten',
        title: 'Ein verlässlicher Rhythmus für volle Tage.',
        intro: 'Teste eine einfache Mahlzeitenstruktur, die auch an engen Tagen umsetzbar bleibt. Perfekte Planung ist dafür nicht nötig.',
        actions: [
            'Lege zwei Mahlzeiten als feste Tagesanker fest.',
            'Halte eine einfache Option für hektische Tage bereit.',
            'Plane einen Snack für lange Pausen ein.'
        ],
        question: 'Welche Mahlzeiten bleiben mit diesem Rhythmus auch an vollen Tagen verlässlich?'
    },
    family: {
        lever: 'Familienessen passend bauen',
        title: 'Familienessen ohne Extra-Küche.',
        intro: 'Das Familiengericht darf bleiben. Teste eine kleine Anpassung an deinem eigenen Teller.',
        actions: [
            'Richte dir bewusst einen eigenen Teller an.',
            'Ergänze eine sichtbare Proteinquelle.',
            'Stelle Gemüse, Salat oder Hülsenfrüchte dazu.'
        ],
        question: 'Welche kleine Telleranpassung passt am besten zu eurem Familienessen?'
    },
    stress: {
        lever: 'Stress und Essen entkoppeln',
        title: 'Ein kurzer Zwischenraum bei Stress.',
        intro: 'Stressessen kann eine verständliche Reaktion auf Belastung sein. Ein kurzer Moment vor dem Essen schafft mehr Orientierung.',
        actions: [
            'Halte vor dem Essen zehn Sekunden inne.',
            'Frage dich: Hunger, Essdrang oder beides?',
            'Wähle danach bewusst eine Mahlzeit, einen Snack oder eine kurze Pause.'
        ],
        question: 'Hilft dir der kurze Zwischenraum, deine nächste Handlung bewusster zu wählen?'
    },
    weekend: {
        lever: 'Wochenenden strukturieren',
        title: 'Ein kleiner Rahmen für dein Wochenende.',
        intro: 'Am Wochenende kann ein kleiner Rahmen hilfreicher sein als ein strenger Plan. Teste zwei verlässliche Anker.',
        actions: [
            'Behalte eine gewohnte erste Mahlzeit bei.',
            'Plane vor längeren Unternehmungen eine passende Mahlzeit.',
            'Lege eine Mahlzeit fest, die flexibel bleiben darf.'
        ],
        question: 'Welche zwei Anker geben deinem Wochenende Halt, ohne es einzuengen?'
    },
    consistency: {
        lever: 'Den Plan kleiner machen',
        title: 'Ein Plan, den du wiederholen kannst.',
        intro: 'Wenn ein Plan nur wenige Tage funktioniert, darf er kleiner werden. Teste eine Veränderung, die auch an schwierigen Tagen möglich ist.',
        actions: [
            'Wähle nur eine Veränderung für sieben Tage.',
            'Plane unperfekte Tage von Anfang an mit ein.',
            'Kehre nach einer Abweichung bei der nächsten Mahlzeit zurück.'
        ],
        question: 'Welche eine Veränderung kannst du auch an einem schwierigen Tag wiederholen?'
    },
    unsure: {
        lever: 'Beobachten statt raten',
        title: 'Ein kleines Experiment statt weiterer Vermutungen.',
        intro: 'Du darfst die Ursache zunächst offenlassen. Sammle sieben Tage lang wenige, aber hilfreiche Beobachtungen.',
        actions: [
            'Notiere abends Hunger und Essdrang kurz.',
            'Halte die schwierigste Alltagssituation fest.',
            'Bewerte am Ende wiederkehrende Situationen statt einzelner Tage.'
        ],
        question: 'Welche Situation oder welcher Zeitpunkt kehrt in dieser Woche wieder?'
    }
});

export const SPECIAL_GUIDANCE = Object.freeze({
    [RESULT_MODES.PREGNANCY]: {
        eyebrow: 'Deine Schwangerschafts-Orientierung',
        title: 'Für zwei denken heißt nicht doppelt essen.',
        copy: 'Dein Körper versorgt gerade nicht nur dich. Deshalb berechnet NOURA während der Schwangerschaft bewusst kein Kaloriendefizit. Du bekommst stattdessen hilfreiche Ernährungsbausteine und eine vorsichtige Versorgungsorientierung.',
        insights: [
            {
                title: 'Nährstoffdichte ist jetzt wichtiger als größere Portionen.',
                copy: 'Ergänze das, was du gut verträgst, möglichst häufig um eine Proteinquelle und nährstoffreiche pflanzliche Lebensmittel.'
            },
            {
                title: 'Mehr Supplemente sind nicht automatisch besser.',
                copy: 'Folsäure und Jod brauchen besondere Aufmerksamkeit. Eisen und weitere Präparate gehören passend zu deinen Befunden und deiner Situation abgeklärt.'
            },
            {
                title: 'Bei der Lebensmittelauswahl hilft eine differenzierte Orientierung mehr als pauschale Verbote.',
                copy: 'Achte besonders auf gut durcherhitzte tierische Lebensmittel, pasteurisierte Produkte, saubere Zubereitung und eine sichere Lagerung.'
            }
        ],
        reflection: 'Was ist gerade schwieriger: Verträglichkeit, regelmäßige Versorgung oder Unsicherheit bei der Lebensmittelauswahl?'
    },
    [RESULT_MODES.EXCLUSIVE_BREASTFEEDING]: {
        eyebrow: 'Deine stillfreundliche Orientierung',
        title: 'Gute Versorgung kann ohne pauschale Stilldiät gelingen.',
        copy: 'Wie viel Energie du brauchst, hängt unter anderem von Stillintensität, Regeneration, Schlaf und Hunger ab. NOURA legt deshalb kein automatisches Kaloriendefizit fest.',
        insights: [
            {
                title: 'Die DGE nennt ungefähr +500 kcal – als Richtwert, nicht als Garantie.',
                copy: 'Dieser Richtwert bezieht sich auf ausschließliches Stillen während der ersten vier bis sechs Monate. Dein persönlicher Mehrbedarf kann davon abweichen.'
            },
            {
                title: 'Ein vorsorglicher Verzicht auf blähende Lebensmittel ist häufig nicht nötig.',
                copy: 'Kohl, Hülsenfrüchte oder säurehaltige Lebensmittel müssen nicht pauschal verschwinden. Beobachte individuell, was dir und deinem Baby bekommt.'
            },
            {
                title: 'Mehr trinken macht nicht automatisch mehr Milch.',
                copy: 'Trinke regelmäßig nach deinem Durst. Ein Getränk am Stillplatz kann helfen – große Mengen über deinen Bedarf hinaus sind nicht notwendig.'
            },
            {
                title: 'Stilltee ist keine Garantie für mehr Milch.',
                copy: 'Für typische Milchbildungstees ist eine steigernde Wirkung nicht zuverlässig belegt. Bei Sorge um die Milchmenge helfen Hebamme oder qualifizierte Stillberatung gezielter.'
            },
            {
                title: 'Deine Jodversorgung erreicht dein Baby über die Muttermilch.',
                copy: 'Jod gehört deshalb in der Stillzeit besonders in den Blick. Lass ein passendes Supplement bei Schilddrüsenerkrankungen oder Unsicherheit bitte ärztlich abklären.'
            }
        ],
        reflection: 'Wann fühlst du dich gut versorgt – und in welchen Situationen fehlen dir Zeit, Energie oder passende Lebensmittel?'
    },
    [RESULT_MODES.PARTIAL_BREASTFEEDING]: {
        eyebrow: 'Deine Orientierung beim Teilstillen',
        title: 'Eine einzelne Zuschlagszahl wäre nur Scheingenauigkeit.',
        copy: 'Stillhäufigkeit und Milchmenge unterscheiden sich stark. NOURA zeigt dir deshalb deinen regulären Orientierungsbereich getrennt von stillfreundlichen Ernährungsbausteinen.',
        insights: [
            {
                title: 'Stabilisieren darf ein sinnvoller erster Schritt sein.',
                copy: 'Beobachte Energie, Hunger, Wohlbefinden und Stillverlauf, bevor du deine Energiezufuhr bewusst veränderst.'
            },
            {
                title: 'Versorgung lässt sich ohne Kalorienziel verbessern.',
                copy: 'Proteinquelle, sättigende Kohlenhydrate, Gemüse oder Obst und eine passende Fettquelle ergeben einen flexiblen Mahlzeitenbaukasten.'
            },
            {
                title: 'Dein zusätzlicher Bedarf ist individuell.',
                copy: 'Wenn du abnehmen möchtest, lässt sich ein vorsichtiger Start persönlicher besser einordnen als mit einem pauschalen Stillzuschlag.'
            }
        ],
        reflection: 'Was würde dir gerade mehr helfen: Stabilität, einfachere Mahlzeiten oder eine persönliche Einordnung?'
    },
    [RESULT_MODES.EARLY_POSTPARTUM]: {
        eyebrow: 'Deine Orientierung nach der Geburt',
        title: 'Regeneration ist kein Stillstand.',
        copy: 'Du bist noch mitten in der körperlichen Erholung. NOURA setzt dir deshalb aktuell kein Abnehmziel. Ich kann dir aber helfen, dich ausreichend zu versorgen und wieder eine flexible Struktur in deinen Alltag zu bringen.',
        insights: [
            {
                title: 'Sechs Wochen sind hier eine vorsichtige NOURA-Produktgrenze.',
                copy: 'Sie sind keine allgemeine medizinische Freigabe für eine Gewichtsabnahme danach. Wie passend ein Wiedereinstieg ist, hängt auch von deiner persönlichen Erholung ab.'
            },
            {
                title: 'Einfach versorgt ist besser als perfekt geplant.',
                copy: 'Gut erreichbare, sättigende Lebensmittel und passende Proteinquellen können dich entlasten, auch wenn gerade keine klassische Mahlzeit möglich ist.'
            },
            {
                title: 'Unterstützung ist Teil deiner Versorgung.',
                copy: 'Einkauf, Vorbereitung oder eine fertige Mahlzeit abzugeben ist keine Nebensache, sondern kann echte Regeneration ermöglichen.'
            },
            {
                title: 'Hunger und Erschöpfung brauchen keine Bewertung.',
                copy: 'Beobachte, was dir Energie gibt und was gut verträglich ist. Bei Beschwerden oder starker Erschöpfung hole dir bitte fachliche Unterstützung.'
            }
        ],
        reflection: 'Wo würde eine einfachere Lösung oder konkrete Unterstützung dich gerade am meisten entlasten?'
    },
    [RESULT_MODES.SAFETY]: {
        eyebrow: 'Deine sichere Orientierung',
        title: 'Persönliche Einordnung vor Zielzahl.',
        copy: 'Deine Angaben brauchen mehr persönliche Einordnung, als dieser Rechner leisten kann. Deshalb zeigt NOURA dir bewusst kein automatisches Abnehmziel.',
        insights: [
            {
                title: 'Du darfst dir Zeit für die nächste Einordnung nehmen.',
                copy: 'Eine verlässliche Versorgung und eine persönliche fachliche Einordnung sind der sinnvollere nächste Schritt.'
            }
        ],
        reflection: 'Welche Information würde dir helfen, deine aktuelle Situation besser einzuordnen?'
    }
});

const CALCULATED_MODES = new Set([
    RESULT_MODES.STANDARD,
    RESULT_MODES.EXCLUSIVE_BREASTFEEDING,
    RESULT_MODES.PARTIAL_BREASTFEEDING,
    RESULT_MODES.POSTPARTUM_LOSS
]);
const DEFICIT_MODES = new Set([RESULT_MODES.STANDARD, RESULT_MODES.POSTPARTUM_LOSS]);

export function parseGermanNumber(value) {
    if (typeof value === 'number') return value;
    return Number(String(value).trim().replace(',', '.'));
}

export function roundTo(value, step = 1) {
    return Math.round(value / step) * step;
}

export function getStepBand(stepBand, exactSteps) {
    const steps = parseGermanNumber(exactSteps);
    if (String(exactSteps ?? '').trim() !== '' && Number.isFinite(steps)) {
        if (steps < 4000) return 'under4000';
        if (steps < 7000) return 'from4000to7000';
        if (steps <= 10000) return 'from7000to10000';
        return 'over10000';
    }
    return stepBand;
}

export function calculateDailyTrainingRange(weightKg, sessionsPerWeek, minutesPerSession, trainingType) {
    const sessions = parseGermanNumber(sessionsPerWeek);
    if (sessions === 0) return { low: 0, high: 0 };
    const minutes = parseGermanNumber(minutesPerSession);
    const met = TRAINING_MET_RANGES[trainingType];
    const weeklyHours = sessions * minutes / 60;
    return {
        low: ((met.min - 1) * weightKg * weeklyHours) / 7,
        high: ((met.max - 1) * weightKg * weeklyHours) / 7
    };
}

export function distributeProteinAnchors(target) {
    const breakfast = roundTo(target * 0.26, 5);
    const lunch = roundTo(target * 0.32, 5);
    const snack = roundTo(target * 0.16, 5);
    return {
        breakfast,
        lunch,
        snack,
        dinner: target - breakfast - lunch - snack
    };
}

export function validateInputs(input) {
    input = normalizeInput(input);
    const age = parseGermanNumber(input.age);
    const heightCm = parseGermanNumber(input.heightCm);
    const weightKg = parseGermanNumber(input.weightKg);
    const errors = {};

    if (!Number.isFinite(age) || age < 18 || age > 80) {
        errors.age = 'Der Rechner ist für Erwachsene zwischen 18 und 80 Jahren gedacht.';
    }
    if (!Number.isFinite(heightCm) || heightCm < 130 || heightCm > 220) {
        errors.heightCm = 'Bitte prüfe deine Größenangabe.';
    }
    if (!Number.isFinite(weightKg) || weightKg < 35 || weightKg > 300) {
        errors.weightKg = 'Bitte prüfe deine Gewichtsangabe.';
    }
    if (!['yes', 'no'].includes(input.pregnant)) {
        errors.pregnant = 'Bitte gib an, ob du aktuell schwanger bist.';
    }
    if (input.pregnant === 'yes' && !['first', 'second', 'third', 'unsure'].includes(input.trimester)) {
        errors.trimester = 'Bitte wähle dein aktuelles Trimester oder „unsicher“.';
    }
    if (input.pregnant === 'no' && !['yes', 'no'].includes(input.birthWithin12Months)) {
        errors.birthWithin12Months = 'Bitte gib an, ob du innerhalb der letzten zwölf Monate entbunden hast.';
    }
    if (input.pregnant === 'no' && input.birthWithin12Months === 'yes') {
        const weeks = parseGermanNumber(input.weeksPostpartum);
        if (!Number.isFinite(weeks) || weeks < 0 || weeks > 52) {
            errors.weeksPostpartum = 'Bitte gib die Anzahl der Wochen seit der Geburt zwischen 0 und 52 an.';
        }
    }
    if (input.pregnant === 'no' && !['exclusive', 'partial', 'no'].includes(input.breastfeeding)) {
        errors.breastfeeding = 'Bitte wähle aus, ob und wie du aktuell stillst.';
    }

    const needsRecoveryCheck =
        input.pregnant === 'no' &&
        input.birthWithin12Months === 'yes' &&
        parseGermanNumber(input.weeksPostpartum) >= 6 &&
        input.breastfeeding === 'no';
    if (needsRecoveryCheck) {
        if (!['yes', 'no', 'unsure'].includes(input.recovered)) errors.recovered = 'Bitte schätze deine körperliche Erholung ein.';
        if (!['yes', 'no'].includes(input.complications)) errors.complications = 'Bitte triff eine Auswahl.';
        if (!['yes', 'no', 'unsure'].includes(input.advisedAgainstLoss)) errors.advisedAgainstLoss = 'Bitte triff eine Auswahl.';
    }
    const mode = Object.keys(errors).length ? null : determineResultMode(input);
    if (mode && CALCULATED_MODES.has(mode)) {
        const activityRange = Object.hasOwn(BASIS_ACTIVITY_RANGES, input.dailyActivity)
            ? BASIS_ACTIVITY_RANGES[input.dailyActivity]
            : null;
        const exactStepsProvided = String(input.exactSteps ?? '').trim() !== '';
        const exactSteps = parseGermanNumber(input.exactSteps);
        const stepBand = getStepBand(input.stepBand, input.exactSteps);
        const sessions = parseGermanNumber(input.trainingSessions);
        const minutes = parseGermanNumber(input.trainingMinutes);

        if (!activityRange) {
            errors.dailyActivity = 'Bitte wähle die Beschreibung, die deinem normalen Alltag am nächsten kommt.';
        }
        if (exactStepsProvided && (!Number.isFinite(exactSteps) || exactSteps < 0 || exactSteps > 50000)) {
            errors.exactSteps = 'Bitte gib eine durchschnittliche Schrittzahl zwischen 0 und 50.000 an.';
        } else if (!activityRange || !Object.hasOwn(activityRange, stepBand)) {
            errors.stepBand = 'Bitte wähle deinen ungefähren täglichen Schrittbereich.';
        }
        if (!Number.isInteger(sessions) || sessions < 0 || sessions > 7) {
            errors.trainingSessions = 'Bitte gib eine ganze Zahl zwischen 0 und 7 an.';
        } else if (sessions > 0) {
            if (!Object.hasOwn(TRAINING_MET_RANGES, input.trainingType)) {
                errors.trainingType = 'Bitte wähle die Trainingsart, die am besten passt.';
            }
            if (!Number.isFinite(minutes) || minutes < 10 || minutes > 180) {
                errors.trainingMinutes = 'Bitte gib eine durchschnittliche Dauer zwischen 10 und 180 Minuten an.';
            }
        }
    }
    if (mode && DEFICIT_MODES.has(mode) && !Object.hasOwn(MISSIONS, input.obstacle)) {
        errors.obstacle = 'Bitte wähle die Herausforderung, die dich aktuell am meisten beschäftigt.';
    }

    return { valid: Object.keys(errors).length === 0, errors, values: { age, heightCm, weightKg }, input };
}

export function calculateOrientation(input) {
    const validation = validateInputs(input);
    if (!validation.valid) {
        return { ok: false, errors: validation.errors };
    }

    const { age, heightCm, weightKg } = validation.values;
    input = validation.input;
    const mode = determineResultMode(input);
    if (!CALCULATED_MODES.has(mode)) {
        return {
            ok: true,
            mode,
            guidance: SPECIAL_GUIDANCE[mode],
            cta: getCtaContent(mode, input.obstacle)
        };
    }

    const resting = (10 * weightKg) + (6.25 * heightCm) - (5 * age) - 161;
    const stepBand = getStepBand(input.stepBand, input.exactSteps);
    const activity = BASIS_ACTIVITY_RANGES[input.dailyActivity][stepBand];
    const training = calculateDailyTrainingRange(
        weightKg,
        input.trainingSessions,
        input.trainingMinutes,
        input.trainingType
    );
    const maintenanceLowRaw = (resting * activity.min) + training.low;
    const maintenanceHighRaw = (resting * activity.max) + training.high;
    const maintenanceLow = roundTo(maintenanceLowRaw, 50);
    const maintenanceHigh = roundTo(maintenanceHighRaw, 50);
    const result = {
        ok: true,
        mode,
        resting: roundTo(resting, 50),
        maintenance: { low: maintenanceLow, high: maintenanceHigh },
        activity: {
            dailyActivity: input.dailyActivity,
            stepBand,
            exactSteps: String(input.exactSteps ?? '').trim() === '' ? null : parseGermanNumber(input.exactSteps),
            basisFactor: activity,
            trainingType: parseGermanNumber(input.trainingSessions) > 0 ? input.trainingType : null,
            trainingSessions: parseGermanNumber(input.trainingSessions),
            trainingMinutes: parseGermanNumber(input.trainingSessions) > 0
                ? parseGermanNumber(input.trainingMinutes)
                : 0,
            trainingDaily: {
                low: roundTo(training.low),
                high: roundTo(training.high)
            }
        },
        guidance: SPECIAL_GUIDANCE[mode],
        cta: getCtaContent(mode, input.obstacle)
    };

    if (!DEFICIT_MODES.has(mode)) return result;

    const maintenanceMidpointRaw = (maintenanceLowRaw + maintenanceHighRaw) / 2;
    const targetCaloriesRaw = maintenanceMidpointRaw * 0.85;
    const targetCalories = roundTo(targetCaloriesRaw, 50);
    const lossLow = roundTo(targetCaloriesRaw - 50, 50);
    const lossHigh = roundTo(targetCaloriesRaw + 50, 50);
    const heightM = heightCm / 100;
    const calculationWeight = Math.min(weightKg, 30 * heightM * heightM);
    const proteinLow = roundTo(calculationWeight * 1.2, 5);
    const proteinHigh = roundTo(calculationWeight * 1.6, 5);
    const proteinTarget = roundTo(calculationWeight * 1.4, 5);
    const fatLow = roundTo(calculationWeight * 0.8, 5);
    const fatHigh = roundTo(calculationWeight, 5);
    const fatByWeight = calculationWeight * 0.9;
    const fatTarget = roundTo(
        Math.max(targetCaloriesRaw * 0.25 / 9, Math.min(fatByWeight, targetCaloriesRaw * 0.35 / 9)),
        5
    );
    const carbsTarget = roundTo(
        Math.max(0, (targetCaloriesRaw - (proteinTarget * 4) - (fatTarget * 9)) / 4),
        5
    );

    return {
        ...result,
        mission: MISSIONS[input.obstacle],
        loss: { low: lossLow, high: lossHigh },
        calculationWeight: roundTo(calculationWeight, 0.1),
        protein: { low: proteinLow, high: proteinHigh, target: proteinTarget },
        fat: { low: fatLow, high: fatHigh, target: fatTarget },
        carbs: { target: carbsTarget },
        fiber: 30,
        targetCalories
    };
}
