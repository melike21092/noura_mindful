export const ACTIVITY_RANGES = Object.freeze({
    low: { min: 1.35, max: 1.45 },
    mixed: { min: 1.45, max: 1.6 },
    active: { min: 1.6, max: 1.75 },
    high: { min: 1.75, max: 1.9 }
});

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

const SPECIAL_PHASES = new Set(['pregnant', 'breastfeeding', 'postpartum', 'unsure']);

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
    if (!ACTIVITY_RANGES[input.activity]) {
        errors.activity = 'Bitte wähle die Beschreibung, die deinem typischen Alltag am nächsten kommt.';
    }
    if (!input.lifePhase) {
        errors.lifePhase = 'Bitte wähle deine aktuelle Lebensphase.';
    }
    if (!MISSIONS[input.obstacle]) {
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
    const resting = (10 * weightKg) + (6.25 * heightCm) - (5 * age) - 161;
    const activity = ACTIVITY_RANGES[input.activity];
    const maintenanceLow = roundTo(resting * activity.min, 50);
    const maintenanceHigh = roundTo(resting * activity.max, 50);
    const specialPhase = SPECIAL_PHASES.has(input.lifePhase);
    const medicallyLimited = Boolean(input.medicalFlag);
    const selectedMission = MISSIONS[input.obstacle];
    const mission = (specialPhase || medicallyLimited)
        ? {
            ...selectedMission,
            actions: selectedMission.actions.map(action =>
                action.includes('Abnahmebereich')
                    ? 'Verändere deine Energiezufuhr nicht allein auf Basis dieses Rechners.'
                    : action
            )
        }
        : selectedMission;
    const result = {
        ok: true,
        resting: roundTo(resting, 50),
        maintenance: { low: maintenanceLow, high: maintenanceHigh },
        specialPhase,
        medicallyLimited,
        mission
    };

    if (specialPhase || medicallyLimited) return result;

    const lossLow = roundTo(maintenanceLow * 0.85, 50);
    const lossHigh = roundTo(maintenanceHigh * 0.9, 50);
    const targetCalories = roundTo((lossLow + lossHigh) / 2, 50);
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
        loss: { low: lossLow, high: lossHigh },
        calculationWeight: roundTo(calculationWeight, 0.1),
        protein: { low: proteinLow, high: proteinHigh, target: proteinTarget },
        fat: { low: fatLow, high: fatHigh, target: fatTarget },
        carbs: { target: carbsTarget },
        fiber: 30,
        targetCalories
    };
}
