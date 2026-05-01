# NOURA | Brain Context & Rules

## 0. DAS OBERSTE GEBOT (UR-REGEL)
*   **IMMER CHIRURGISCH:** Keine radikalen Redesigns oder komplettes Umschreiben von Dateien ohne explizite Anweisung. Änderungen werden präzise, punktuell und unter Erhalt der bestehenden Struktur vorgenommen.

## 1. Vision & Identität
*   **Brand:** NOURA (nourish your mind. trust your body.)
*   **Rolle:** Exklusives Coaching-Tool für Mamas, kein technischer Tracker.
*   **Vibe:** Mindful, Premium, Edel, Ruhig, Magazin-Ästhetik.
*   **Coach:** Mukaddes Mandirali (Die "Stimme" der App).

## 2. Design-Gesetze (Styleguide)
*   **Farben:**
    *   `--sage`: #8ba88e (Wachstum, Ruhe)
    *   `--sand`: #fdfaf7 (Hintergrund, Geborgenheit)
    *   `--terracotta`: #a68b7c (Akzent, Labels)
    *   `--charcoal`: #2d3748 (Kontrast, Struktur)
*   **Typografie:**
    *   **Emotion (Soul):** Playfair Display (Serif). Wird für Headlines (`h1`, `h2`) und Sprüche genutzt. Oft kursiv (`italic`).
    *   **Struktur (Function):** Inter (Sans-Serif). Wird für Labels, Buttons und Navigation genutzt.
*   **Hierarchie-Regel:** `label-caps` (Terracotta, Inter, Fett) steht IMMER **über** der Headline (Playfair Display).
*   **Layout:** Konsequent **linksbündig** (Left-aligned). Keine Zentrierung von Inhalten. 8px-Grid System nutzen.
*   **Cards:** `noura-card` mit `bg-white/60` und `backdrop-blur`. Sanfter `noura-glow`.

## 3. Feature-Logik
*   **Heiliger Moment:** Ein 10-sekündiges Atem-Ritual (Bismillah) direkt nach dem Login. Muss Vorrang vor allem haben.
*   **Dashboard-Flow:** 
    1. Login -> Name eingeben (Onboarding).
    2. Erste Sicht: Nur die "14-Tage-Reset" Karte im Grid.
    3. Klick auf Karte -> Tour startet direkt als Overlay auf dem Dashboard.
    4. Nach Tour (`tourSeen`): Karte unten verschwindet, intelligente **Focus-Card** oben erscheint.
*   **Focus-Card:** Das Herzstück. Zeigt heutige Mission, erlaubt direktes Journaling ("Kleiner Sieg" & "Erkenntnis") und zeigt den "Rhythmus-Pfad" (14 Punkte).
*   **Exklusivität (Admin-Lock):** 
    *   `isAdmin: true` (Mukaddes) -> Alle Tools (Protokoll, Anamnese) sind offen.
    *   `isAdmin: false` (Klienten) -> Tools sind sichtbar, aber **ausgegraut (Locked)** mit Schloss-Icon.

## 4. Technische Basis
*   **Frameworks:** Tailwind CSS (Styling), Alpine.js (Logik), Alpine Persist (LocalStorage).
*   **Icons:** Lucide Icons.
*   **Navigation:** Floating Bottom Dock (Übersicht, Nähren, Wegweiser). Deutsch benannt.
*   **Daten:** Alle Fortschritte (Checklist, TinyWin, Journal) werden im `noura_storage` Objekt verwaltet.

## 5. Coach-Logik (The Detective Brain)
*   **Prinzip:** "Sjard-Präzision trifft Mama-Alltag". Die App nutzt wissenschaftliche Metriken (Makros, Bio-Feedback), übersetzt sie aber in einfache Fitness-Sprache.
*   **Detektiv-Kategorien (Anomaly Detection):**
    *   **Heißhunger-Check:** Protein-Mangel wird als Vorbote für Heißhunger-Attacken gewertet.
    *   **Stoffwechsel-Alarm:** Fokus auf Bio-Feedback (Frieren, Hunger). Indikator für notwendige Diet Breaks (Erhaltungskalorien).
    *   **Versteckte Kalorien:** Erkennt Plateaus durch ungenaues Tracking (z.B. Reste-Essen) statt biologischer Stagnation.
    *   **Stress-Stopp:** Verknüpft Journal-Stress mit stagnierendem Gewicht (Cortisol-Wasser-Effekt). Fokus: Pause vor Defizit.
*   **Quick-Actions:** Jede Anomalie muss eine direkte Lösung (Action) bieten, die via Telegram an die Klientin kommuniziert werden kann.
*   **Tonfall:** Professionell, aber verständlich. Weg von medizinischen Fachbegriffen, hin zu klaren Coaching-Anweisungen.

## 6. Eiserne Kooperations-Regeln (WICHTIG)
*   **Code-Integrität:** Code NIEMALS eigenmächtig kürzen oder Platzhalter verwenden. Immer die vollständigen Dateien/Blöcke liefern.
*   **Kommunikation:** Bei jeder Änderung (außer minimalen Fixes) IMMER vorher fragen und Ideen validieren.
*   **Sicherung:** Vor größeren Änderungen oder Umstrukturierungen IMMER nach einem Commit fragen.
*   **Layout-Stabilität:** Niemals funktionierende Layouts/Container-Größen ohne explizite Anweisung ändern.

## 6. Was wir niemals tun:
*   Standard-HTML-Elemente (Slider, Checkboxen) ungestylt lassen.
*   Inhalte in Karten zentrieren.
*   Labels in einer anderen Farbe als Terracotta setzen.
*   Dateien komplett überschreiben, wenn eine chirurgische Änderung möglich ist.
