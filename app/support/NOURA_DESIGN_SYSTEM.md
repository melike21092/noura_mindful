# NOURA Design System

Version 2.0 · Produktweite Regeln, keine Screen-Vorlage

NOURA ist ruhig, warm, präzise und fürsorglich. Das Interface fühlt sich eher wie ein aufgeräumter, heller Raum als wie ein Dashboard an. Es führt mit Hierarchie und Sprache; Dekoration bleibt leise. Die Referenz dient nur zur Extraktion dieser Design-DNA – Kompositionen, Maße und Screens werden nicht kopiert.

## 1. Designprinzipien

1. **Ruhe vor Dichte.** Pro View gibt es eine Hauptaufgabe, eine dominante Überschrift und eine primäre Aktion.
2. **Führung ohne Druck.** Klare nächste Schritte, freundliche Microcopy, keine Alarmfarben für neutrale Abweichungen und keine manipulative Dringlichkeit.
3. **Wärme durch Materialität.** Gebrochene Weißtöne, Braun als Markenakzent, pflanzliches Grün als positiver Status und sehr weiche Tiefe.
4. **Hierarchie vor Dekoration.** Größe, Position, Abstand und Textgewicht tragen die Ordnung. Farbe unterstützt, ersetzt sie aber nicht.
5. **Atmosphäre getrennt von Arbeit.** Bilder leben im Hero oder in kleinen unterstützenden Medienflächen. Formulare und Entscheidungen liegen auf kontrastsicheren Oberflächen.
6. **Eine Tieflogik.** Canvas → Section → Card → Nested Surface → Control. Jede Ebene ist nur minimal stärker als die vorherige.
7. **Progressive Offenlegung.** Komplexe Aufgaben werden in verständliche Schritte zerlegt. Sichtbar ist, was für die aktuelle Entscheidung nötig ist.
8. **Barrierefreiheit ist Stil.** 44 px Mindestziel, sichtbarer Fokus, semantische Zustände, verständliche Labels und mindestens WCAG-AA-Kontrast.

## 2. Design Tokens

### Farbe

| Rolle | Token | Wert | Einsatz |
|---|---|---:|---|
| App Canvas | `--noura-color-canvas` | `#F3F0EB` | globaler Hintergrund |
| warmer Canvas | `--noura-color-canvas-warm` | `#F8F5F0` | weiche Zonen, Verläufe |
| Standardfläche | `--noura-color-surface` | `#FCFAF7` | Cards und Panels |
| erhöhte Fläche | `--noura-color-surface-raised` | `#FFFFFF` | interaktive oder hervorgehobene Fläche |
| leise Fläche | `--noura-color-surface-subtle` | `#F3EFE9` | Hinweise und Nested Cards |
| Primärtext | `--noura-color-text` | `#1F211F` | Überschriften und wichtiger Inhalt |
| Sekundärtext | `--noura-color-text-muted` | `#555A56` | Beschreibung und Metadaten |
| Tertiärtext | `--noura-color-text-soft` | `#747872` | Hilfstext, nur auf hellen Flächen |
| Marke | `--noura-color-accent` | `#925126` | primäre Aktion, aktive Navigation |
| Marke Hover | `--noura-color-accent-hover` | `#783F1E` | Hover/Pressed-Abstufung |
| Grün | `--noura-color-positive` | `#668F57` | Erfolg, Freiraum, positiver Status |
| Gelb | `--noura-color-caution` | `#DDAA3D` | Hinweis, nicht Fehler |
| Fehler | `--noura-color-error` | `#A4473A` | ausschließlich Fehler und destruktiv |
| Linie | `--noura-color-border` | `rgba(31,33,31,.12)` | Standardtrennung |
| starke Linie | `--noura-color-border-strong` | `rgba(31,33,31,.22)` | Hover, Auswahl, strukturrelevant |

Regel: 80 % neutrale Flächen, 15 % Text/Linien, höchstens 5 % Akzent. Braun bedeutet Aktion oder aktive Marke. Grün bedeutet positiven Zustand. Akzentfarben werden nie als große Seitenhintergründe eingesetzt.

### Form, Tiefe und Bewegung

- Radius: `6 / 10 / 14 / 20 / 28 / pill`; Controls standardmäßig 14 px, Cards 20 px.
- Schatten sind breit, diffus und kontrastarm. Grenzen schaffen Struktur, Schatten nur räumliche Trennung.
- Maximal zwei Schattenebenen gleichzeitig sichtbar: Card und Floating Element.
- Bewegung: 120 ms für Pressed, 180 ms für Hover/Controls, 260 ms für Panels. Kurve `cubic-bezier(.2,.8,.2,1)`.
- Bewegung verändert bevorzugt Farbe, Opazität oder maximal 2 px Translation. Kein Bounce.

## 3. CSS-Variablen

Die produktive Quelle ist [`noura-design-system.css`](./noura-design-system.css). Komponenten verwenden ausschließlich semantische Tokens. Hexwerte und Einzelabstände sind in Feature-CSS nicht erlaubt. Alias-Tokens dienen nur der Migration und dürfen nicht neu verwendet werden.

```css
.feature-card {
  padding: var(--noura-space-4);
  color: var(--noura-color-text);
  background: var(--noura-color-surface);
  border: 1px solid var(--noura-color-border);
  border-radius: var(--noura-radius-card);
  box-shadow: var(--noura-shadow-card);
}
```

## 4. Komponentenregeln

Jede Komponente besitzt genau definierte Ebenen: Container, Inhalt, optionale Metadaten, Zustand und Aktion. Komponenten übernehmen keine Außenabstände; der Parent steuert Layout und Rhythmus.

- **Navigation:** ruhige Fläche, 44 px Ziele, Icon plus Label. Aktiv = subtile Akzentfläche + dunkler Text; niemals nur Farbwechsel.
- **Section Header:** optionaler Eyebrow, Heading, höchstens zweizeilige Beschreibung, optionale Actions rechts.
- **Status/Badge:** pillförmig, kompakt, immer Text plus optionales Icon. Kein Badge für normale Metadaten.
- **Metric:** Label → tabellarische Zahl → Einheit → optionale Einordnung. Zahl ist dominant, Einheit nicht.
- **Progress:** Text `Schritt x von y` plus grafischer Zustand. Fortschritt nie nur durch Punkte kommunizieren.
- **Empty State:** klare Ursache, nächster sinnvoller Schritt, optional eine leise Illustration.
- **Feedback:** Inline am Entstehungsort. Toast nur für globale, bereits abgeschlossene Aktionen.

## 5. Grid-System

### Breakpoints und Container

| Bereich | Viewport | Spalten | Gutter | Außenrand |
|---|---:|---:|---:|---:|
| Compact | `< 640 px` | 4 | 16 px | 16 px |
| Medium | `640–1023 px` | 8 | 24 px | 32 px |
| Wide | `≥ 1024 px` | 12 | 24–32 px | 48–64 px |

- Lesebreite: 608 px. Formularbreite: 720 px. Breiter Arbeitsbereich: 928 px. App-Shell: maximal 1440 px.
- Hauptinhalte starten an einer konsistenten vertikalen Achse.
- Desktop: Sidebar 224–256 px; Content flexibel. Mobile: Bottom Navigation oder kompakter Header, nie beides dominant.
- Kartenraster: gleiche Höhe nur bei vergleichbaren Inhalten. Keine künstlich gestreckten Textkarten.
- Responsivität ordnet neu statt nur zu schrumpfen: 3 → 2 → 1 Spalte. Primäraktion bleibt nach der Aufgabe, nicht zwingend sticky.

## 6. Typografiesystem

NOURA verwendet eine moderne Humanist-Sans für UI und Display. Eine Serifenschrift ist optional für redaktionelle Inhalte, nicht für Produktnavigation oder Formulare. Empfohlen: `Inter`, `Manrope` oder eine metrisch ähnliche lokale Schrift.

| Stil | Größe / Zeilenhöhe | Gewicht | Verwendung |
|---|---|---:|---|
| Display | `clamp(40, 6vw, 64) / 1.05` | 500 | seltene Marken-Heros |
| H1 | `clamp(32, 4vw, 44) / 1.12` | 500 | eine pro View |
| H2 | `clamp(24, 3vw, 32) / 1.2` | 550 | Hauptabschnitt |
| H3 | `20 / 1.3` | 600 | Card-/Gruppentitel |
| Body L | `18 / 1.55` | 400 | Intro, Hero-Subline |
| Body | `16 / 1.6` | 400 | Standardtext |
| Small | `14 / 1.5` | 450 | Metadaten |
| Caption | `12 / 1.4` | 550 | Labels, Status |
| Eyebrow | `12 / 1.4` | 700 | uppercase, Tracking `.10em` |

- Überschriften: leicht negatives Tracking, maximal 18–22 Wörter, `text-wrap: balance`.
- Fließtext: maximal 65–72 Zeichen pro Zeile.
- Zahlen in Metriken: `font-variant-numeric: tabular-nums`.
- Nicht mehr als drei Schriftgewichte in einem View.
- Reines Versal nur für Eyebrows und sehr kurze Kategorien.

## 7. Spacing-System

Basisraster: 4 px. Produkt-Rhythmus: 8 px.

| Token | Wert | Typischer Einsatz |
|---|---:|---|
| `--noura-space-0-5` | 4 px | Icon-Feinkorrektur |
| `--noura-space-1` | 8 px | eng verbundene Elemente |
| `--noura-space-1-5` | 12 px | Control-Innenabstand |
| `--noura-space-2` | 16 px | Standard-Gap |
| `--noura-space-3` | 24 px | Card-Gruppen |
| `--noura-space-4` | 32 px | Card-Padding Desktop |
| `--noura-space-5` | 48 px | Section-Gap kompakt |
| `--noura-space-6` | 64 px | Section-Gap Desktop |
| `--noura-space-8` | 96 px | große Kapiteltrennung |

Nähe codiert Beziehung: Label → Feld 8 px; Heading → Beschreibung 8–12 px; Beschreibung → Inhalt 24 px; Inhaltsgruppe → Aktion 24–32 px; Section → Section 48–96 px.

## 8. Card-System

### Ebenen

1. **Section Surface:** selten; gruppiert einen ganzen Arbeitsbereich, Radius 28 px, kein oder minimaler Schatten.
2. **Card:** Standardinhalt, Radius 20 px, 1 px Linie, 24/32 px Padding, Card-Schatten.
3. **Nested Card:** innerhalb einer Card, Radius 14 px, erhöhte weiße Fläche, minimaler Schatten.
4. **Interactive Row:** Radius 14 px, 12–16 px Padding, klarer Hover/Selected/Focus-Zustand.
5. **Floating:** Menüs, Popover, Sticky Actions; Radius 16–20 px, stärkster Schatten.

Cards brauchen einen semantischen Grund. Nicht jeder Abschnitt wird umrahmt. Verschachtelung endet nach einer Nested-Ebene. Klickbare Cards zeigen die Interaktion über Cursor, Fokus, Hover und eindeutige Beschriftung. Keine Hover-Translation für statische Cards.

## 9. Hero-System

Es gibt drei Hero-Typen:

- **Atmospheric Hero:** für Einstieg oder emotionalen Übergang. Bild, kontrastsicherndes Overlay, Eyebrow, kurze Headline, Subline und höchstens eine primäre Aktion.
- **Product Hero:** für Arbeitsseiten. Kein großes Bild; Heading, Erklärung, optional Status und Actions.
- **Editorial Hero:** für Wissen/Rezepte. Bild darf stärker sein, Inhalt bleibt auf eigener lesbarer Fläche.

Atmospheric-Hero-Regeln:

- Desktop Höhe 420–620 px, Mobile 360–520 px; Inhalt in der optisch ruhigsten Bildzone.
- Motiv liefert Atmosphäre, nicht notwendige Information. `object-fit: cover`; Fokuspunkt explizit festlegen.
- Overlay bevorzugt gerichteter Verlauf statt pauschaler Abdunklung. Zielkontrast 4.5:1.
- Headline maximal zwei Zeilen, Textbreite 10–14 Wörter pro Zeile.
- Kein Text direkt über detailreichen Motivbereichen. Kein Glassmorphism ohne Kontrastnachweis.

## 10. Button-System

| Variante | Einsatz | Darstellung |
|---|---|---|
| Primary | eine nächste Hauptaktion | braune Vollfläche, inverser Text |
| Secondary | alternative Aktion | helle Fläche, Linie, dunkler Text |
| Tertiary | Navigation/leichte Aktion | transparent, Text/Icon |
| Destructive | bestätigte destruktive Aktion | Rot, nie als Standard-Primary |
| Icon | bekannte kompakte Aktion | 44 × 44 px, Tooltip |

- Höhen: 44 px compact, 52 px default, 56 px prominent. Pills sind reserviert für Filter/Chips; normale Buttons nutzen 14 px Radius.
- Label beginnt mit einem Verb. Pfeil rechts signalisiert Fortsetzung; Check signalisiert Abschluss.
- Ein Action-Cluster enthält maximal eine Primary Action.
- Disabled ist nicht die einzige Erklärung: Grund oder fehlende Eingabe sichtbar machen.
- Loading hält Breite und Labelkontext; Spinner ersetzt nur das Icon oder ergänzt `Wird …`.
- Zustände: default, hover, active, focus-visible, loading, disabled. Hover ist nie Voraussetzung für Verständnis.

## 11. Formular-System

- Label steht immer sichtbar über dem Control. Placeholder ist Beispiel, niemals Label.
- Standardhöhe 52 px, Radius 14 px, 16 px horizontaler Innenabstand.
- Hilfe steht zwischen Label und Feld oder direkt darunter; Fehler ersetzt Hilfe nicht unerwartet und darf Layout nicht stark verschieben.
- Pflichtfelder werden sprachlich oder mit `*` plus Legende gekennzeichnet. Optional kann sparsamer markiert werden, wenn die Mehrheit Pflicht ist.
- Auswahlzeilen: gesamter Bereich klickbar, Text links, Control rechts; Titel plus höchstens eine Metazeile.
- Radio = genau eine Auswahl, Checkbox = mehrere, Switch = sofort wirksame Einstellung, Select = kompakte Liste ab etwa sechs Optionen.
- Fokus: 3 px Akzentring mit Abstand. Fehler: Text + Icon + rote Linie; Erfolg nur anzeigen, wenn es Nutzwert hat.
- Felder werden nach Bedeutung gruppiert. Lange Formulare in Schritte teilen, wenn mentale Modelle oder Entscheidungen wechseln.
- Autofill, Tastatur, Screenreader, Zoom bis 200 % und Fehlermeldungszuordnung sind Pflicht.

## 12. Regeln für zukünftige Screens

### Aufbau

1. Formuliere die eine Nutzeraufgabe des Views.
2. Setze eine H1 und höchstens eine dominante Primary Action.
3. Ordne Inhalte: Orientierung → Entscheidung/Information → Ergebnis → nächste Aktion.
4. Wähle erst dann Surface-Level und Grid. Nicht automatisch alles in Cards setzen.
5. Nutze semantische Tokens und vorhandene Komponenten; neue Primitive werden im Designsystem ergänzt.

### Blickführung und Informationsdichte

- Dominant: H1, Kernmetrik oder aktuelle Entscheidung – nie alle drei zugleich.
- Unterstützend: Beschreibung, Status, Section Heading.
- Leise: Metadaten, Hinweise, sekundäre Navigation.
- Pro Card idealerweise eine Aussage und eine Handlung. Scannbare Labels statt erklärender Absatzwände.
- Desktop darf parallelisieren; Mobile sequenziert. Die semantische Reihenfolge bleibt im DOM erhalten.

### Micro-Details

- Icons 16/20/24 px, optisch 1.75–2 px Strichstärke, ein konsistenter Stil.
- Pfeile zeigen echte Richtung oder Fortsetzung; dekorative Chevrons vermeiden.
- Trenner nur, wenn Weißraum die Beziehung nicht klar genug macht.
- Bildradien folgen dem Elternradius minus dessen Paddinglogik.
- Einheiten kleiner als Werte, niemals hochgestellt wenn die Lesbarkeit leidet.
- Daten und Uhrzeiten lokalisiert; Zahlen nicht durch zufällige Breiten springen lassen.
- Leere, Lade-, Fehler-, Offline- und Erfolgssituationen werden bereits beim Screen-Entwurf definiert.

### Qualitätsprüfung vor Freigabe

- Ist innerhalb von drei Sekunden klar, worum es geht und was als Nächstes zu tun ist?
- Gibt es nur eine visuell dominante Aktion?
- Funktioniert der Screen ohne Farbe, Bild und Hover weiterhin verständlich?
- Sind alle Abstände, Farben, Radien, Schatten und Typostile tokenisiert?
- Erreichen Text und Controls WCAG AA und mindestens 44 px Touchfläche?
- Funktioniert die Reihenfolge bei 320 px, 200 % Zoom und Tastaturbedienung?
- Hat jede Card einen Zweck und jede Akzentfarbe eine Bedeutung?
- Wurde Atmosphäre eingesetzt, ohne Inhalt oder Kontrast zu schwächen?

## Nicht verhandelbar

Keine reinen Weiß-Schwarz-Kontraste als Grundästhetik, keine lauten Gradients, keine harten Schatten, kein übermäßiges Glassmorphism, keine konkurrierenden Primary Buttons, keine Icon-only-Navigation ohne Beschriftung, keine neue Farbe oder neuer Einzelabstand im Feature-Code und keine 1:1-Wiederholung bestehender Screen-Kompositionen.
