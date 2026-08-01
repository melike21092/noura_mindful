# NOURA: Langfristige Architektur für Validierung und Kalibrierung

Das folgende Konzept trennt strikt zwischen Datenerhebung, wissenschaftlicher Validierung, Kalibrierung und produktiver Berechnung.

Der wichtigste Widerspruch vorab: Für eine longitudinale Auswertung sind die Rohdaten zunächst nicht anonym, sondern pseudonymisiert. Gewichtsmessungen derselben Person müssen über mehrere Wochen verbunden werden. Pseudonymisierte Daten bleiben personenbezogene Daten; erst irreversibel entkoppelte Daten gelten als anonym. Das stellt auch der EDPB ausdrücklich klar. [EDPB: Anonymisierung und Pseudonymisierung](https://www.edpb.europa.eu/topics/ai-and-technology/anonymisationpseudonymisation_en)

## 1. Zielbild

NOURA sollte kein automatisch lernendes System betreiben. Stattdessen entsteht ein kontrollierter wissenschaftlicher Zyklus:

```text
Produktive Formel
       │
       ▼
Prospektive Datenerhebung mit Einwilligung
       │
       ▼
Qualitätsprüfung und eingefrorener Datensatz
       │
       ├──► Unabhängige Validierung des aktuellen Modells
       │
       ▼
Vordefinierte statistische Kalibrierung
       │
       ▼
Unabhängiger Holdout-Test
       │
       ▼
Wissenschaftlicher + technischer Review
       │
       ▼
Neue, unveränderliche Modellversion
       │
       ▼
Shadow-Betrieb → kontrollierte Freigabe → Monitoring
```

Es gibt keine kontinuierliche automatische Anpassung. Jede neue Version ist eine bewusste, dokumentierte Produktentscheidung.

## 2. Was überhaupt als „echter Bedarf“ gelten darf

Das größte wissenschaftliche Problem ist nicht die Kalibrierungsformel, sondern der Zielwert.

Aus folgenden Daten kann man den tatsächlichen Energieverbrauch nicht zuverlässig ableiten:

- ein oder zwei Gewichtsmessungen
- selbst geschätzte Kalorienaufnahme
- kurzfristige Gewichtsschwankungen
- Smartwatch-Kalorien
- die Aussage „Ich habe mich an den Plan gehalten“

Gewicht wird unter anderem durch Wasser, Glykogen, Darminhalt, Menstruationszyklus und Messbedingungen beeinflusst. Selbstberichtete Energieaufnahme besitzt systematische Fehler.

### Evidenzstufe A – externe Referenzdaten

- Doubly Labeled Water für Gesamtenergieverbrauch
- indirekte Kalorimetrie für Ruheenergieverbrauch
- wissenschaftliche Datensätze mit dokumentierter Messmethodik

Diese Daten sollten die wissenschaftliche Referenz bilden.

### Evidenzstufe B – hochwertige NOURA-Validierung

- 28–42 Tage Beobachtungsdauer
- möglichst tägliches morgendliches Gewicht
- standardisierte Messbedingungen
- gewogene oder anderweitig qualitätsgesicherte Ernährungsprotokolle
- dokumentierte Schritte und Trainingseinheiten
- stabile Lebensphase
- keine Schwangerschaft
- kein frühes Postpartum
- keine akute Erkrankung
- dokumentierte Änderungen bei Medikamenten oder Zyklusbedingungen

### Evidenzstufe C – normale Produktdaten

- selbstberichtete Kalorien
- unregelmäßige Gewichte
- manuell geschätzte Schritte
- unvollständige Trainingseinträge

Diese Daten eignen sich für Monitoring, Hypothesenbildung und Sensitivitätsanalysen, aber nicht als alleinige Grundlage einer Formeländerung.

### Primärer Validierungsendpunkt

Für die erste Ausbaustufe empfiehlt sich ausschließlich die Verwendung weitgehend gewichtsstabiler Zeitfenster:

```text
empirischer Tagesbedarf ≈ qualitätsgesicherte mittlere Energieaufnahme
```

Voraussetzung: Der robuste Gewichtstrend liegt innerhalb einer vorab definierten Stabilitätsgrenze.

Gewichtsverlustphasen sollten zunächst nur sekundär analysiert werden. Die populäre Rechnung `Gewichtsänderung × 7.700 kcal` ist für kurze Zeiträume und individuelle Personen zu grob und würde das Kalibrierungsmodell mit einer weiteren unvalidierten Annahme vermischen.

## 3. Datenschutzarchitektur

### Grundsatz

Die Nutzung des Rechners darf nicht von einer Teilnahme an der Validierungsstudie abhängen.

Erforderlich sind:

- eigenständige, informierte Einwilligung
- keine vorausgewählte Checkbox
- jederzeitiger Widerruf
- klare Trennung von Produktnutzung und Forschung
- präzise Zweckbindung
- festgelegte Aufbewahrungsfristen
- dokumentiertes Löschverfahren
- Datenschutz-Folgenabschätzung
- Prüfung durch Datenschutzbeauftragte und Fachjuristen

Gesundheits- und Körperdaten können besondere Kategorien personenbezogener Daten betreffen. Rechtsgrundlage, Informationspflichten und Verarbeitung müssen daher vor dem Start rechtlich geprüft werden. Maßgeblich sind unter anderem Datenminimierung, Zweckbindung und Speicherbegrenzung der [DSGVO](https://eur-lex.europa.eu/eli/reg/2016/679/oj).

### Datentrennung

| System | Inhalt | Zugriff |
|---|---|---|
| Consent Registry | Einwilligung, Widerruf, Kontaktmöglichkeit | sehr kleiner Datenschutzkreis |
| Identity Vault | Zuordnung Identität ↔ Studien-ID | getrennte Schlüssel und Administration |
| Research Store | pseudonymisierte Messwerte und Modelloutputs | Forschungsteam |
| Aggregate Store | freigegebene, ausreichend aggregierte Auswertungen | Produkt- und Reportingteams |
| Model Registry | Modellartefakte, Berichte, Versionen | Engineering und Review Board |

Die Research-Datenbank darf keine Namen, E-Mail-Adressen, IP-Adressen, Analytics-IDs oder Werbe-Identifier enthalten.

### Technische Maßnahmen

- zufällige, nicht ableitbare Studien-ID
- keine Hashes von E-Mail-Adressen als Pseudonym
- getrennte Verschlüsselungsschlüssel
- Verschlüsselung bei Speicherung und Transport
- rollenbasierter Zugriff
- Least-Privilege-Prinzip
- unveränderliche Zugriffsprotokolle
- regelmäßige Schlüsselrotation
- EU/EWR-Hosting als bevorzugte Ausgangsbasis
- Auftragsverarbeitungsverträge
- kein Zugriff aus Produktanalytics
- Löschung oder grobe Regionalisierung technischer Metadaten
- automatisierte Lösch- und Widerrufstests

### Anonymisierung

Nach Abschluss einer Studienkohorte kann ein anonymisierter Analysedatensatz erzeugt werden:

- Entfernung der Zuordnungsschlüssel
- Alter nur noch in Bändern
- keine exakten Datumsangaben
- keine seltenen Merkmalskombinationen
- Zusammenfassung dünn besetzter Gruppen
- Mindestgruppengrößen
- Unterdrückung extremer oder identifizierbarer Kombinationen
- dokumentierte Reidentifikations-Risikoanalyse

Ein bloßes Entfernen von Namen ist keine Anonymisierung.

## 4. Datenmodell

### Participant

- `study_participant_id`
- Einwilligungsversion
- Einschlussdatum als Studien-Tag, nicht zwingend Kalenderdatum
- Formelgeschlecht
- Altersband
- Größenwert
- definierte Analysegruppen
- relevante Ein-/Ausschlussflags

### Prediction

Jede ursprüngliche Berechnung wird unverändert gespeichert:

- kanonische Eingaben
- Ergebnis
- Ruheumsatz
- Basisfaktor
- Schrittaufschlag
- Trainingsaufschlag
- Erhaltung
- Unsicherheitsspanne
- Engine-Version
- Kalibrierungsversion
- Schemasversion
- Code-Commit
- Berechnungszeitpunkt als Studien-Tag

### Measurement

- Studien-Tag
- Gewicht
- Messzeitfenster
- Messqualität
- Energieaufnahme
- Erfassungsmethode der Energieaufnahme
- Schritte
- Schrittquelle: manuell, Smartphone, Wearable
- Trainingstyp, Dauer und Häufigkeit
- relevante Qualitätsflags

### Outcome Window

Ein analytisch abgeleitetes, versioniertes Zeitfenster:

- Start- und Endtag
- Anzahl gültiger Gewichtsmessungen
- Gewichtstrend und Unsicherheit
- mittlere Energieaufnahme
- Datenvollständigkeit
- empirischer Bedarfswert
- Ausschlussgrund
- Outcome-Algorithmusversion

Abgeleitete Werte dürfen niemals die Rohmessungen überschreiben.

## 5. Modellversionierung

Empfohlen werden drei getrennte Versionen:

```text
engine_version       = 3.0.0
calibration_version  = 2027.1
outcome_version      = 1.2.0
```

### Semantische Engine-Versionierung

- **MAJOR:** Formelstruktur oder benötigte Eingaben ändern sich.
- **MINOR:** Faktoren oder Kalibrierungskoeffizienten ändern Ergebnisse.
- **PATCH:** technische Korrektur ohne beabsichtigte numerische Änderung.

### Jede Modellversion enthält

- unveränderliche Konstanten
- genaue Formeln
- Ein- und Ausschlusskriterien
- Trainings- und Schrittannahmen
- Datensatz-Snapshot-ID
- SHA-256-Prüfsumme des Datensatzmanifests
- Analysecode-Commit
- Laufzeit- und Paketversionen
- deterministische Seeds
- statistischen Analyseplan
- Validierungsbericht
- Bias-Review
- Freigabeentscheidung
- bekannte Einschränkungen
- Vorgängerversion und Migrationshinweise

Eine Modellversion darf nach Freigabe niemals still verändert werden.

## 6. Rückwärtskompatibilität

Historische Ergebnisse müssen mit ihrer ursprünglichen Version reproduzierbar bleiben.

### Regeln

1. Jede Berechnung speichert ihre vollständige Versionskombination.
2. Alte Engine-Versionen bleiben als ausführbare, unveränderliche Module verfügbar.
3. Historische Ergebnisse werden nicht automatisch neu berechnet.
4. Bei einer gewünschten Neuberechnung werden beide Werte angezeigt:

   ```text
   Ursprüngliches Ergebnis – Engine 2.0
   Aktuelle Orientierung – Engine 3.1
   ```

5. APIs geben Version und Modellmetadaten explizit zurück.
6. Neue Pflichtfelder dürfen alte Datensätze nicht künstlich ergänzen.
7. Fehlt ein Feld für eine neue Engine, bleibt nur die alte Berechnung reproduzierbar.
8. Jede Version erhält Golden-Master-Testfälle.
9. Rollback auf die vorherige Version muss ohne Datenmigration möglich sein.

## 7. Statistisches Kalibrierungsmodell

### Phase 1: nur validieren

Vor jeder Anpassung wird das bestehende Modell unverändert geprüft:

```text
Fehler = empirischer Bedarf − vorhergesagter Bedarf
```

Erst wenn ein stabiler, relevanter systematischer Fehler vorliegt, darf kalibriert werden.

### Phase 2: globale Kalibrierung

Die erste zulässige Anpassung sollte möglichst einfach sein:

```text
kalibrierter Bedarf = α + β × ursprüngliche Vorhersage
```

Dabei stehen:

- `α` für einen systematischen Gesamtversatz
- `β` für Über- oder Unterspreizung des Modells

Das ist transparent, reproduzierbar und rückwärtskompatibel. Es verändert nicht sofort einzelne physiologische Komponenten.

### Phase 3: komponentenbezogene Anpassungen

Erst bei ausreichender Evidenz dürfen einzelne Komponenten geändert werden:

- Alltagsfaktor
- Schrittkoeffizient
- Trainingskoeffizient
- Unsicherheitsspanne

Pro Modellversion sollte möglichst nur eine klar begründete Hypothese geändert werden. Andernfalls lässt sich nicht mehr nachvollziehen, welche Änderung die Verbesserung verursacht hat.

### Was nicht geschehen sollte

- automatisches Nachtrainieren nach jeder neuen Person
- freie Suche nach beliebigen Untergruppen
- Optimieren auf denselben Daten, auf denen berichtet wird
- Entfernen von Ausreißern allein wegen großer Residuen
- Ersetzen des mechanistischen Modells durch eine undurchsichtige Regression
- Veröffentlichung einer neuen Version nur wegen besserem Gesamtdurchschnitt

## 8. Studiendesign und Datenteilung

Die Aufteilung erfolgt immer nach Person, niemals nach einzelnen Messungen.

Empfohlene Kohorten:

- 60 % Entwicklung beziehungsweise Kalibrierung
- 20 % interne Validierung
- 20 % unangetasteter Holdout

Zusätzlich:

- zeitlicher Holdout aus einer späteren Erhebungsperiode
- möglichst externe Kohorte
- unterschiedliche Jahreszeiten
- getrennte Auswertung nach Erfassungsmethode
- wiederholte Messungen derselben Person als Cluster behandeln

Der finale Holdout darf erst ausgewertet werden, nachdem Modell und Analyseplan eingefroren wurden.

Die TRIPOD-Leitlinie verlangt transparente Berichterstattung von Entwicklung, Validierung und Modellaktualisierung. PROBAST empfiehlt eine getrennte Bewertung von Teilnehmerauswahl, Prädiktoren, Outcome und Analyse. [TRIPOD](https://pmc.ncbi.nlm.nih.gov/articles/4297220/), [PROBAST](https://doi.org/10.7326/M18-1377)

## 9. Qualitätsmetriken

### Gesamtmodell

- mittlerer Fehler beziehungsweise Bias
- medianer Fehler
- MAE
- RMSE
- medianer absoluter Fehler
- relativer absoluter Fehler
- Kalibrierungsintercept
- Kalibrierungsslope
- Residuen über dem vorhergesagten Bedarf
- empirische Abdeckung der ausgegebenen Erhaltungsspanne
- Anteil innerhalb ±100, ±200 kcal und ±10 %
- Stabilität der Koeffizienten in Bootstrap-Stichproben

Bei kontinuierlichen Energievorhersagen ist die klassische Klassifikations-AUC nicht die relevante Hauptmetrik.

### Vorläufige Release-Gates

Diese Grenzen wären Produktanforderungen, keine Naturkonstanten:

- globaler mittlerer Bias höchstens ±50 kcal/Tag
- medianer absoluter Fehler höchstens 150 kcal/Tag
- mindestens 80 % empirische Abdeckung des ausgewiesenen Korridors
- kein Hauptsegment mit absolutem Bias über 100 kcal/Tag
- keine relevante Verschlechterung eines Schutzsegments
- stabile Koeffizienten in participant-level Bootstrap-Analysen
- Verbesserung auch im unangetasteten Holdout

Die endgültigen Grenzen sollten vor Studienbeginn durch Power- und Präzisionsplanung festgelegt werden.

## 10. Bias-Kontrolle

Zu untersuchen sind mindestens:

- Selbstselektion gesundheitsbewusster Nutzer
- Ausschluss weniger digital-affiner Personen
- höhere Abbruchrate bei schwierigen Verläufen
- Untererfassung der Energieaufnahme
- unterschiedliche Wearable-Genauigkeit
- saisonale Aktivitätsänderungen
- Menstruationszyklus und Wassergewicht
- Alter
- BMI-Bereiche
- Formelgeschlecht
- sehr hohe oder niedrige Körpergröße
- Aktivitätskategorie
- manuelle gegenüber automatischer Schrittzahl
- Trainingsart
- hohe Trainingsvolumina
- Postpartum-Historie
- Land, Sprache und sozioökonomische Erreichbarkeit

### Bias-Regeln

- Subgruppen vor der Analyse definieren.
- Keine Gruppen allein aufgrund interessanter Ergebnisse hinzufügen.
- Konfidenzintervalle und Gruppengröße immer mitberichten.
- Kleine Gruppen nicht durch instabile eigene Koeffizienten „personalisieren“.
- Fehlende Daten und Abbrüche separat analysieren.
- Outlier-Regeln vor Einsicht in die Residuen definieren.
- Complete-Case- und Sensitivitätsanalyse parallel berichten.
- Modellverbesserung darf nicht nur im Gesamtdurchschnitt bestehen.

## 11. Reproduzierbarkeit

Jeder Kalibrierungslauf erzeugt ein unveränderliches Paket:

```text
/calibration-releases/2027.1/
    protocol.pdf
    statistical-analysis-plan.pdf
    data-dictionary.json
    cohort-manifest.json
    exclusion-report.csv
    environment.lock
    analysis-source/
    validation-results.json
    subgroup-results.json
    calibration-report.pdf
    probast-review.pdf
    approval-record.json
    checksums.sha256
```

Weitere Anforderungen:

- deterministische Zufallsseeds
- festgeschriebene Softwareversionen
- containerisierte Analyseumgebung
- automatisierter Lauf vom Snapshot bis zum Bericht
- keine manuellen Excel-Zwischenschritte
- unveränderliches Rohdatenarchiv
- transformationsbasierter Audit-Trail
- unabhängige Reproduktion durch eine zweite Person
- Golden-Master-Ergebnisse
- öffentliches, nicht personenbezogenes Modellprotokoll

## 12. Freigabeprozess

Eine neue Kalibrierung durchläuft:

1. Hypothese und Analyseplan registrieren.
2. Kohorte und Outcome-Regeln einfrieren.
3. Aktuelle Engine validieren.
4. Kandidat nur auf Entwicklungskohorte kalibrieren.
5. Interne Validierung durchführen.
6. Bias- und Datenschutzreview durchführen.
7. Unangetasteten Holdout einmalig öffnen.
8. Ergebnis gegen Release-Gates prüfen.
9. Wissenschaftliches Review Board entscheidet.
10. Kandidat im Shadow-Modus berechnen.
11. Technische Regressionen und Sicherheitslogik prüfen.
12. Version kontrolliert ausrollen.
13. Alte Version rollbackfähig halten.
14. Nach Freigabe nur Drift überwachen, nicht automatisch nachkalibrieren.

### Review Board

Mindestens:

- Ernährungswissenschaft beziehungsweise Ernährungsmedizin
- Biostatistik
- Datenschutz
- Software Engineering
- QA
- Product
- unabhängige Person ohne direkten Release-Anreiz

## 13. Empfohlener Start

NOURA sollte nicht sofort Formeln aus Produktdaten verändern.

Die sinnvolle Reihenfolge wäre:

1. Messprotokoll und Outcome-Definition entwickeln.
2. Datenschutz-Folgenabschätzung durchführen.
3. Pilotstudie mit etwa 50–100 Personen zur Datenqualität.
4. Noch keine Kalibrierung veröffentlichen.
5. Ausfallraten, Trackingfehler und Messvarianz bestimmen.
6. Danach Stichprobengröße für die eigentliche Validierung planen.
7. Aktuelle Engine prospektiv validieren.
8. Erst anschließend entscheiden, ob eine Kalibrierung überhaupt gerechtfertigt ist.

Der wichtigste Architekturgrundsatz lautet:

> Nutzerdaten dürfen eine Formeländerung nicht direkt auslösen. Sie dürfen Evidenz erzeugen, auf deren Grundlage eine versionierte und überprüfbare Formeländerung beschlossen wird.
