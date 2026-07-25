export const ACTIVITY_RANGES = Object.freeze({
    low: { min: 1.3, max: 1.4 },
    mixed: { min: 1.4, max: 1.5 },
    active: { min: 1.5, max: 1.6 },
    high: { min: 1.65, max: 1.75 }
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
    family: 'Dein Plan muss auch am Familientisch funktionieren.',
    stress: 'Stressessen löst man nicht mit einer strengeren Zahl.',
    weekend: 'Ein guter Plan darf auch am Wochenende tragen.',
    consistency: 'Du brauchst keinen härteren Plan, sondern einen wiederholbaren.',
    unsure: 'Wenn du nicht weißt, wo es kippt, schauen wir gemeinsam auf die Muster.'
});

const MODE_CTA = Object.freeze({
    [RESULT_MODES.PREGNANCY]: {
        eyebrow: 'Ernährungscoaching in der Schwangerschaft',
        title: 'Gute Versorgung ist jetzt wichtiger als ein Kalorienziel.',
        copy: 'Gemeinsam entwickeln wir alltagstaugliche Mahlzeiten und passende Ernährungsbausteine. Medizinische Fragen und deine individuelle Versorgung bleiben Teil deiner Betreuung durch Hebamme oder Ärztin.',
        button: 'Meine Ernährung im Alltag besprechen'
    },
    [RESULT_MODES.EARLY_POSTPARTUM]: {
        eyebrow: 'Begleitung nach der Geburt',
        title: 'Gerade brauchst du vielleicht keine strengere Zahl, sondern mehr Entlastung.',
        copy: 'Wir schauen, wie einfache Mahlzeiten, erreichbare Proteinquellen und kleine Versorgungsanker in deinen neuen Alltag passen. Bei Beschwerden oder Komplikationen ersetzt das keine medizinische Rücksprache.',
        button: 'Meine Alltagssituation besprechen'
    },
    [RESULT_MODES.EXCLUSIVE_BREASTFEEDING]: {
        eyebrow: 'Stillfreundliches Ernährungscoaching',
        title: 'Eine Rechnerformel kennt deinen Stillalltag nicht.',
        copy: 'Gemeinsam betrachten wir Hunger, Energie, Mahlzeitenstruktur und die Anforderungen deines Alltags. NOURA ersetzt keine Stillberatung, hilft dir aber dabei, deine Ernährung stillfreundlich und alltagstauglich zu gestalten.',
        button: 'Stillfreundliche Ernährung besprechen'
    },
    [RESULT_MODES.PARTIAL_BREASTFEEDING]: {
        eyebrow: 'Persönliche Orientierung',
        title: 'Beim Teilstillen ist eine einzelne Kalorienzahl selten die ganze Antwort.',
        copy: 'Wir schauen gemeinsam, ob zunächst Stabilität, eine einfachere Mahlzeitenstruktur oder ein vorsichtiger persönlicher Abnahmestart zu deiner Situation passt.',
        button: 'Meine persönliche Orientierung besprechen'
    },
    [RESULT_MODES.POSTPARTUM_LOSS]: {
        eyebrow: 'Persönlicher Wiedereinstieg',
        title: 'Abnehmen nach der Geburt braucht keinen schnellen Neustart.',
        copy: 'Wir entwickeln einen vorsichtigen Start, der zu deiner Erholung, deinem Alltag und deiner aktuellen Belastung passt – ohne Druck oder starre Regeln.',
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
            copy: 'Im NOURA Coaching verbinden wir deinen Startwert mit deinem tatsächlichen Alltag. Wir schauen auf Hunger, Essdrang, Mahlzeitenstruktur, Stress und die Situationen, in denen dein Plan bisher nicht funktioniert.',
            button: 'Meinen persönlichen Start besprechen'
        };
    }
    return MODE_CTA[mode];
}

export function determineResultMode(input) {
    if (input.medicalFlag) return RESULT_MODES.SAFETY;
    if (input.pregnant === 'yes') return RESULT_MODES.PREGNANCY;

    const recentBirth = input.birthWithin12Months === 'yes';
    const weeksPostpartum = parseGermanNumber(input.weeksPostpartum);
    if (recentBirth && Number.isFinite(weeksPostpartum) && weeksPostpartum <= 6) {
        return RESULT_MODES.EARLY_POSTPARTUM;
    }
    if (input.breastfeeding === 'exclusive') return RESULT_MODES.EXCLUSIVE_BREASTFEEDING;
    if (input.breastfeeding === 'partial') return RESULT_MODES.PARTIAL_BREASTFEEDING;

    if (recentBirth) {
        const warning =
            input.recovered !== 'yes' ||
            input.complications !== 'no' ||
            input.advisedAgainstLoss !== 'no';
        return warning ? RESULT_MODES.SAFETY : RESULT_MODES.POSTPARTUM_LOSS;
    }

    return RESULT_MODES.STANDARD;
}

export const MISSIONS = Object.freeze({
    hunger: {
        lever: 'Sättigung über den Tag',
        title: 'Nicht tiefer starten – stabiler essen.',
        intro: 'Starker Hunger ist kein Beweis für fehlende Disziplin. Teste zuerst, ob mehr Struktur deinen Tag ruhiger macht.',
        actions: [
            'Starte im oberen Teil deines Abnahmebereichs.',
            'Plane drei verlässliche Hauptmahlzeiten.',
            'Setze zu jeder Hauptmahlzeit einen Proteinanker.',
            'Ergänze täglich mindestens zwei ballaststoffreiche Bausteine.'
        ],
        question: 'Wird dein Hunger dadurch ruhiger – besonders am Nachmittag und Abend?'
    },
    cravings: {
        lever: 'Abendlichen Essdrang verstehen',
        title: 'Wir stabilisieren den Tag, nicht nur den Abend.',
        intro: 'Abendlicher Essdrang entsteht häufig nicht erst am Abend. Beobachte, was deinem Körper vorher gefehlt hat.',
        actions: [
            'Lass Frühstück oder Mittagessen nicht bewusst aus.',
            'Plane mittags einen klaren Proteinanker.',
            'Halte einen passenden Nachmittagssnack bereit.',
            'Halte dein Abendessen nicht künstlich klein.'
        ],
        question: 'An welchen Tagen wird der Essdrang stärker – und was hat vorher gefehlt?'
    },
    irregular: {
        lever: 'Verlässliche Mahlzeiten',
        title: 'Noch nicht perfekt – zuerst verlässlich.',
        intro: 'Dein erster Hebel ist nicht die perfekte Lebensmittelauswahl, sondern eine Struktur, die auch an engen Tagen trägt.',
        actions: [
            'Bestimme zwei Mahlzeiten als feste Tagesanker.',
            'Lege die Proteinquelle möglichst am Vorabend fest.',
            'Halte einen Rettungssnack griffbereit.',
            'Ersetze eine Mahlzeit nicht nur durch Kaffee.'
        ],
        question: 'Welche beiden Mahlzeiten lassen sich in deinem Alltag am zuverlässigsten schützen?'
    },
    family: {
        lever: 'Familienessen passend bauen',
        title: 'Kein separates Diätessen.',
        intro: 'Das Familiengericht darf bleiben. Verändere zuerst nur die Bausteine auf deinem eigenen Teller.',
        actions: [
            'Plane eine sichtbare Proteinquelle ein.',
            'Ergänze Gemüse, Salat oder Hülsenfrüchte.',
            'Richte dir bewusst einen eigenen Teller an.',
            'Beobachte das nebenbei Essen von Kinderresten.'
        ],
        question: 'Welches Familiengericht kannst du diese Woche mit einem Proteinanker ergänzen?'
    },
    stress: {
        lever: 'Stress und Essen entkoppeln',
        title: 'Erst verstehen, dann entscheiden.',
        intro: 'Stressessen ist keine Charakterschwäche. Ein kurzer Zwischenraum hilft dir zu erkennen, was du gerade brauchst.',
        actions: [
            'Halte vor dem Essen zehn Sekunden inne.',
            'Frage dich: Hunger, Essdrang oder beides?',
            'Bei Hunger: Iss eine richtige Mahlzeit oder einen geplanten Snack.',
            'Bei Essdrang: Teste eine kurze Safety-Strategie – ohne anschließendes Verbot.'
        ],
        question: 'Welche kurze Handlung beruhigt dich, ohne dass sie sich wie eine weitere Aufgabe anfühlt?'
    },
    weekend: {
        lever: 'Wochenenden strukturieren',
        title: 'Flexibilität braucht einen kleinen Rahmen.',
        intro: 'Du brauchst am Wochenende keinen strengen Plan. Zwei verlässliche Anker reichen für den ersten Test.',
        actions: [
            'Behalte eine gewohnte erste Mahlzeit bei.',
            'Plane vor längeren Unternehmungen einen Proteinanker.',
            'Entscheide bewusst, welche Mahlzeit flexibel sein darf.',
            'Kehre bei der nächsten Mahlzeit normal zurück.'
        ],
        question: 'Welche zwei Anker geben deinem Wochenende Halt, ohne es einzuengen?'
    },
    consistency: {
        lever: 'Den Plan kleiner machen',
        title: 'Du brauchst einen Plan, den du wiederholen kannst.',
        intro: 'Wenn ein Plan nur wenige Tage funktioniert, war er möglicherweise zu groß – nicht deine Motivation zu klein.',
        actions: [
            'Starte im oberen Teil deines Abnahmebereichs.',
            'Wähle nur eine Veränderung für sieben Tage.',
            'Plane unperfekte Tage von Anfang an mit ein.',
            'Kehre nach Abweichungen bei der nächsten Mahlzeit zurück.'
        ],
        question: 'Welche eine Veränderung würdest du auch an einem schwierigen Tag schaffen?'
    },
    unsure: {
        lever: 'Beobachten statt raten',
        title: 'Dein erster Schritt ist ein kleines Experiment.',
        intro: 'Du musst die Ursache heute noch nicht kennen. Sammle sieben Tage lang wenige, aber hilfreiche Beobachtungen.',
        actions: [
            'Nutze den oberen Teil deines Abnahmebereichs.',
            'Plane drei Proteinanker über den Tag.',
            'Notiere abends Hunger, Essdrang und größtes Hindernis.',
            'Bewerte nicht einzelne Tage, sondern wiederkehrende Situationen.'
        ],
        question: 'Was fällt nach sieben Tagen häufiger auf als erwartet?'
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
                title: 'Sicher essen heißt nicht, pauschal alles zu verbieten.',
                copy: 'Achte besonders auf gut durcherhitzte tierische Lebensmittel, pasteurisierte Produkte, saubere Zubereitung und eine sichere Lagerung.'
            }
        ],
        reflection: 'Was ist gerade schwieriger: Verträglichkeit, regelmäßige Versorgung oder Unsicherheit bei der Lebensmittelauswahl?'
    },
    [RESULT_MODES.EXCLUSIVE_BREASTFEEDING]: {
        eyebrow: 'Deine stillfreundliche Orientierung',
        title: 'Gute Versorgung braucht keine Stilldiät.',
        copy: 'Wie viel Energie du brauchst, hängt unter anderem von Stillintensität, Regeneration, Schlaf und Hunger ab. NOURA legt deshalb kein automatisches Kaloriendefizit fest.',
        insights: [
            {
                title: 'Die DGE nennt ungefähr +500 kcal – als Richtwert, nicht als Garantie.',
                copy: 'Dieser Richtwert bezieht sich auf ausschließliches Stillen während der ersten vier bis sechs Monate. Dein persönlicher Mehrbedarf kann davon abweichen.'
            },
            {
                title: 'Du musst nicht vorsorglich auf blähende Lebensmittel verzichten.',
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
        copy: 'Du bist noch mitten in der körperlichen Erholung. NOURA setzt dir deshalb aktuell kein Abnehmziel. Wir können dir aber helfen, dich ausreichend zu versorgen und wieder eine flexible Struktur in deinen Alltag zu bringen.',
        insights: [
            {
                title: 'Sechs Wochen sind hier eine vorsichtige NOURA-Produktgrenze.',
                copy: 'Sie sind keine allgemeine medizinische Freigabe für eine Gewichtsabnahme danach. Deine persönliche Erholung bleibt entscheidend.'
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
                title: 'Du musst heute nichts erzwingen.',
                copy: 'Eine verlässliche Versorgung und eine persönliche fachliche Einordnung sind der sinnvollere nächste Schritt.'
            }
        ],
        reflection: 'Welche Information fehlt dir, um deine aktuelle Situation sicher einordnen zu können?'
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

export function validateInputs(input) {
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
        parseGermanNumber(input.weeksPostpartum) > 6 &&
        input.breastfeeding === 'no';
    if (needsRecoveryCheck) {
        if (!['yes', 'no', 'unsure'].includes(input.recovered)) errors.recovered = 'Bitte schätze deine körperliche Erholung ein.';
        if (!['yes', 'no'].includes(input.complications)) errors.complications = 'Bitte triff eine Auswahl.';
        if (!['yes', 'no', 'unsure'].includes(input.advisedAgainstLoss)) errors.advisedAgainstLoss = 'Bitte triff eine Auswahl.';
    }
    const mode = Object.keys(errors).length ? null : determineResultMode(input);
    if (mode && CALCULATED_MODES.has(mode) && !ACTIVITY_RANGES[input.activity]) {
        errors.activity = 'Bitte wähle die Beschreibung, die deinem typischen Alltag am nächsten kommt.';
    }
    if (mode && DEFICIT_MODES.has(mode) && !MISSIONS[input.obstacle]) {
        errors.obstacle = 'Bitte wähle die Herausforderung, die dich aktuell am meisten beschäftigt.';
    }

    return { valid: Object.keys(errors).length === 0, errors, values: { age, heightCm, weightKg } };
}

export function calculateOrientation(input) {
    const validation = validateInputs(input);
    if (!validation.valid) {
        return { ok: false, errors: validation.errors };
    }

    const { age, heightCm, weightKg } = validation.values;
    const mode = determineResultMode(input);
    if (!CALCULATED_MODES.has(mode)) {
        return {
            ok: true,
            mode,
            guidance: SPECIAL_GUIDANCE[mode],
            cta: getCtaContent(mode, input.obstacle),
            trimesterGuideline: mode === RESULT_MODES.PREGNANCY
                ? { first: 0, second: 250, third: 500, unsure: null }[input.trimester]
                : undefined
        };
    }

    const resting = (10 * weightKg) + (6.25 * heightCm) - (5 * age) - 161;
    const activity = ACTIVITY_RANGES[input.activity];
    const maintenanceLow = roundTo(resting * activity.min, 50);
    const maintenanceHigh = roundTo(resting * activity.max, 50);
    const result = {
        ok: true,
        mode,
        resting: roundTo(resting, 50),
        maintenance: { low: maintenanceLow, high: maintenanceHigh },
        guidance: SPECIAL_GUIDANCE[mode],
        cta: getCtaContent(mode, input.obstacle)
    };

    if (!DEFICIT_MODES.has(mode)) return result;

    const maintenanceMidpoint = (maintenanceLow + maintenanceHigh) / 2;
    const targetCalories = roundTo(maintenanceMidpoint * 0.85, 50);
    const lossLow = targetCalories - 50;
    const lossHigh = targetCalories + 50;
    const heightM = heightCm / 100;
    const calculationWeight = Math.min(weightKg, 30 * heightM * heightM);
    const proteinLow = roundTo(calculationWeight * 1.2, 5);
    const proteinHigh = roundTo(calculationWeight * 1.6, 5);
    const proteinTarget = roundTo(calculationWeight * 1.4, 5);
    const fatLow = roundTo(calculationWeight * 0.8, 5);
    const fatHigh = roundTo(calculationWeight, 5);
    const fatByWeight = calculationWeight * 0.9;
    const fatTarget = roundTo(
        Math.max(targetCalories * 0.25 / 9, Math.min(fatByWeight, targetCalories * 0.35 / 9)),
        5
    );
    const carbsTarget = roundTo(
        Math.max(0, (targetCalories - (proteinTarget * 4) - (fatTarget * 9)) / 4),
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
