function nouraApp() {
    return {
        scroll: 0, 
        showSOS: false, 
        tourStep: 1, 
        welcomeStep: 1,
        selectedDay: null,
        sparklingDays: [],
        saved: false,
        accessCode: '',
        showPassword: false,
        loginError: false,
        activeImpulse: null, 
        impulseContent: {
            soul: { title: 'Daily Soul', text: 'Vertraue dem Prozess. Dein Körper braucht Zeit, um zu heilen. Sei heute besonders gütig zu dir selbst.', icon: 'mic', color: 'sage' },
            insight: { title: 'Noura Insight', text: 'Protein am Morgen stabilisiert deinen Blutzucker für den gesamten Tag und senkt Heißhunger am Abend.', icon: 'lightbulb', color: 'terracotta' },
            ritual: { title: 'Dein Ritual', text: 'Halte kurz inne. Atme 4 Sekunden ein, halte 4 Sekunden, atme 4 Sekunden aus. Spüre die Ruhe.', icon: 'waves', color: 'charcoal' },
            community: { title: 'Noura Community', text: 'Du bist nicht allein. Aktuell gehen 142 andere Frauen diesen Weg der Achtsamkeit mit dir.', icon: 'users', color: 'sage' }
        },
        openImpulse(id) { this.activeImpulse = this.impulseContent[id]; document.body.style.overflow = 'hidden'; },
        closeImpulse() { this.activeImpulse = null; document.body.style.overflow = 'auto'; },
        challenges: [
            { id: 'reset-14', title: '14-Tage-Reset Wegweiser', label: 'Aktuelle Challenge', description: 'Dein täglicher Begleiter für mehr Achtsamkeit, regulierte Blutzuckerwerte und ein entspanntes Nervensystem.', icon: 'milestone', url: 'reset.html', color: 'sage', active: true }
        ],
        get visibleChallenges() { return this.challenges.filter(c => this.state.unlockedChallenges.includes(c.id) && c.id !== 'reset-14'); },
        startTour() { this.state.tourSeen = true; },
        get greeting() {
            const h = this.state.testHour !== null ? this.state.testHour : new Date().getHours();
            let timeStr = 'Guten Tag';
            if (h < 11) timeStr = 'Guten Morgen';
            else if (h < 15) timeStr = 'Guten Mittag';
            else if (h < 18) timeStr = 'Guten Nachmittag';
            else if (h < 22) timeStr = 'Guten Abend';
            else timeStr = 'Gute Nacht';
            return `${timeStr}, ${this.state.name}`;
        },
        get personalNote() {
            const h = this.state.testHour !== null ? this.state.testHour : new Date().getHours();
            if (h >= 22 || h < 5) return 'Dein Körper braucht Erholung. Zeit für Schlaf. Vertraue dem Morgen.';
            const notes = {
                'Ebru': 'Dieser Moment gehört nur dir. Der Rest darf kurz warten.',
                'Rana': 'Genieße die Struktur. Ein Schritt nach dem anderen.',
                'Rebecca': 'Du darfst wachsen. Fehler sind Teil deines Weges.',
                'Merve': 'Fang einfach an. Die Motivation folgt deinem Tun.',
                'Masooma': 'Nähre dich gut. Dein Körper leistet Großartiges.',
                'Cem': 'Cem, danke für deine Kraft. Auch du darfst hier ankommen.',
                'Mukaddes': 'Deine Vision wird lebendig. Vertraue dir.'
            };
            return notes[this.state.name] || 'Schön, dass du dir diesen Raum für dich nimmst.';
        },
        get sleepReminder() {
            const h = this.state.testHour !== null ? this.state.testHour : new Date().getHours();
            if (h >= 21 && h < 22) return 'Zeit zum Runterfahren. Dimme das Licht.';
            if (h >= 22 || h < 5) return 'Dein Körper braucht Erholung. Zeit für Schlaf.';
            return null;
        },
        get progress() {
            let pts = 0;
            if (this.state.why) pts += 5;
            this.state.nourish.forEach(v => { if(v) pts += 2; });
            if (this.state.pivot) pts += 2;
            if (this.state.safety) pts += 2;
            this.state.checklist.forEach(day => { if(day.done) pts += 6; });
            return Math.min(Math.round((pts / 100) * 100), 100);
        },
        state: Alpine.$persist({
            hasAccess: false, isAdmin: false, isCoaching: false, isLocked: false, lastActivity: null,
            testHour: null, testDayOffset: 0, startDate: null, tourSeen: false, welcomeComplete: false,
            holyMomentSeen: false, reduceMotion: false, todayMood: '', name: '', why: '', 
            unlockedChallenges: [], nourish: ['', '', ''], pivot: '', safety: '',
            anamnese: { schlaf: '', energie: '', zyklus: '', stress: '', verdauung: '', ziele: '' },
            protocol: {}, checklist: Array.from({length: 14}, () => ({ done: false, journal: '' }))
        }).as('noura_storage'),
        checkInactivity() {
            if (!this.state.hasAccess || this.state.isLocked) return;
            if (!this.state.lastActivity) { this.state.lastActivity = Date.now(); return; }
            const diffDays = (Date.now() - this.state.lastActivity) / (1000 * 60 * 60 * 24);
            if (diffDays > 3) this.state.isLocked = true;
        },
        updateActivity() { this.state.lastActivity = Date.now(); },
        checkAccessCode() {
            this.loginError = false;
            const codeMap = {
                'NOURA-MERVE-26': { name: 'Merve', coaching: false, challenges: ['reset-14'], admin: false },
                'NOURA-MASOOMA-26': { name: 'Masooma', coaching: false, challenges: ['reset-14'], admin: false },
                'NOURA-RANA-26': { name: 'Rana', coaching: false, challenges: ['reset-14'], admin: false },
                'NOURA-REBECCA-26': { name: 'Rebecca', coaching: false, challenges: ['reset-14'], admin: false },
                'NOURA-EBRU-26': { name: 'Ebru', coaching: false, challenges: ['reset-14'], admin: false },
                'NOURA-MUKADDES-26': { name: 'Mukaddes', coaching: true, challenges: ['reset-14'], admin: true },
                'NOURA-CEM-26': { name: 'Cem', coaching: false, challenges: ['reset-14'], admin: false }
            };
            const enteredCode = this.accessCode.toUpperCase().trim();
            if (codeMap[enteredCode]) {
                const user = codeMap[enteredCode];
                this.state.name = user.name; this.state.isCoaching = user.coaching; this.state.isAdmin = user.admin;
                this.state.unlockedChallenges = user.challenges || []; this.state.hasAccess = true;
                if (!this.state.startDate) this.state.startDate = new Date().toISOString();
            } else { this.loginError = true; this.accessCode = ''; }
        },
        completeWelcome() { this.state.welcomeComplete = true; this.state.holyMomentSeen = false; },
        completeHolyMoment() { this.state.holyMomentSeen = true; },
        get isBeforeStart() {
            if (this.state.isAdmin) return false;
            const start = new Date('2026-04-27T09:00:00');
            return new Date() < start;
        },
        get currentDayIndex() {
            if (this.state.isAdmin && this.state.testDayOffset !== 0) return parseInt(this.state.testDayOffset);
            const start = new Date('2026-04-27T09:00:00');
            const now = new Date();
            if (now < start) return 0;
            const diff = Math.floor((now - start) / 86400000);
            return Math.max(0, Math.min(13, diff));
        },
        days: [
            { title: 'Teller-Hoheit', label: 'DER AUFBRUCH', mission: "Iss heute keine Reste. Deck dir einen eigenen Teller. In <a href='https://t.me/+ZaOT7m-1ZykwYjAy' target='_blank' class='text-sage underline'>Telegram</a> erkläre ich dir, warum das dein wichtigster Sieg ist.", prompt: "Wie hat es sich angefühlt, heute nur für dich einen Teller anzurichten?", quote: "Du bist es wert, dass du dir selbst mit der gleichen Liebe begegnest, die du anderen schenkst." },
            { title: 'Protein-Anker', label: 'DEINE BASIS', mission: "Zu jeder Mahlzeit heute eine Faustgröße Protein. Schau in <a href='https://t.me/+ZaOT7m-1ZykwYjAy' target='_blank' class='text-sage underline'>Telegram</a> für meine Liste der besten Quellen!", prompt: "Welche Proteinquelle hat dir heute am meisten Energie gegeben?", quote: "Energie folgt der Aufmerksamkeit – nähre deine Basis." },
            { title: 'Liquid Gold', label: 'IM FLUSS', mission: "Trinke 500ml Wasser vor dem ersten Kaffee. In <a href='https://t.me/+ZaOT7m-1ZykwYjAy' target='_blank' class='text-sage underline'>Telegram</a> erfährst du, wie Wasser deinen Heißhunger steuert.", prompt: "Was hat sich durch das Wasser am Morgen in deinem Körper verändert?", quote: "Klarheit beginnt mit Reinheit. Fließe mit dem Leben." },
            { title: 'Dein Atem-Anker', label: 'STILLE FINDEN', mission: "Halte kurz inne, bevor du isst. Atme 3x tief. Hör dir dazu meinen Quick-Reset Audio-Impuls in <a href='https://t.me/+ZaOT7m-1ZykwYjAy' target='_blank' class='text-sage underline'>Telegram</a> an.", prompt: "Welcher Gedanke kam dir in der Stille vor dem Essen?", quote: "Ein Atemzug ist eine Brücke zurück zu dir selbst." },
            { title: 'Familien-Harmonie', label: 'DEIN RHYTHMUS', mission: "Pass dein Essen dem Familien-Flow an, ohne extra zu kochen. In <a href='https://t.me/+ZaOT7m-1ZykwYjAy' target='_blank' class='text-sage underline'>Telegram</a> zeige ich dir heute meine 3 besten Flow-Hacks.", prompt: "Wie hast du es heute geschafft, flexibel zu bleiben?", quote: "In der Ruhe deiner Mitte findest du die Kraft für das Ganze." },
            { title: 'Body Respect', label: 'KÖRPERLIEBE', mission: "Nenne eine Sache, für die du deinem Körper heute dankbar bist. Teile sie mit uns in der <a href='https://t.me/+ZaOT7m-1ZykwYjAy' target='_blank' class='text-sage underline'>Gruppe</a>!", prompt: "Wofür bist du deinem Körper heute besonders dankbar?", quote: "Dein Körper ist ein Wunderwerk. Ehre seine Geschichte." },
            { title: 'Dein Seelen-Gepäck', label: 'LOSLASSEN', mission: "Sonntags-Reset: Was darf heute gehen? Du hast Woche 1 gemeistert! Schau in <a href='https://t.me/+ZaOT7m-1ZykwYjAy' target='_blank' class='text-sage underline'>Telegram</a> für unsere gemeinsam Reflektions-Runde.", prompt: "Was darfst du heute loslassen, um leichter in die neue Woche zu starten?", quote: "Loslassen schafft Raum für das, was wirklich zählt." },
            { title: 'Die goldene Reihenfolge', label: 'STRUKTUR', mission: "Achte auf die Reihenfolge: Erst Gemüse, dann Protein. Warum das alles ändert, erkläre ich dir heute in <a href='https://t.me/+ZaOT7m-1ZykwYjAy' target='_blank' class='text-sage underline'>Telegram</a>.", prompt: "Wie hat dein Körper auf die neue Reihenfolge beim Essen reagiert?", quote: "Struktur gibt deinem Körper die Sicherheit, die er zum Heilen braucht." },
            { title: 'Intuitive Wahl', label: 'INTUITION', mission: "Hunger oder Emotion? Halte inne vor dem ersten Bissen: Was brauche ich gerade wirklich? In <a href='https://t.me/+ZaOT7m-1ZykwYjAy' target='_blank' class='text-sage underline'>Telegram</a> gehen wir heute tief.", prompt: "Was war heute der Unterschied zwischen emotionalem und körperlichem Hunger?", quote: "Hör auf die leise Stimme deines Körpers, bevor sie laut werden muss." },
            { title: 'Dein heiliger Morgen', label: 'MORGENTAU', mission: "2 Minuten Stille vor dem Handy. Starte bei dir, nicht bei den anderen. Tipps für Morgen-Rituale findest du in <a href='https://t.me/+ZaOT7m-1ZykwYjAy' target='_blank' class='text-sage underline'>Telegram</a>.", prompt: "Wie hat die Stille am Morgen deinen Tag beeinflusst?", quote: "Wie du deinen Morgen beginnst, so antwortet dir dein Tag." },
            { title: 'Sanfter Flow', label: 'BEWEGUNG', mission: "Bewege deinen Körper für 5 Minuten so, wie es sich gut anfühlt. In <a href='https://t.me/+ZaOT7m-1ZykwYjAy' target='_blank' class='text-sage underline'>Telegram</a> teile ich heute eine sanfte Routine mit dir.", prompt: "Welche Bewegung hat dein Körper heute am meisten gebraucht?", quote: "Bewegung ist das Gebet deines Körpers an das Leben." },
            { title: 'Echtzeit-Genuss', label: 'ACHTSAMKEIT', mission: "Iss die ersten 3 Bissen in voller Stille. Was schmeckst du? In <a href='https://t.me/+ZaOT7m-1ZykwYjAy' target='_blank' class='text-sage underline'>Telegram</a> besprechen wir heute das Thema Achtsamkeit.", prompt: "Was hast du bei den ersten drei Bissen heute bewusst wahrgenommen?", quote: "Genuss ist die höchste Form der Wertschätzung für den Moment." },
            { title: 'Dein Schutzschild', label: 'SCHUTZSCHILD', mission: "Bereite heute Abend deinen Rettungsanker für morgen vor. In <a href='https://t.me/+ZaOT7m-1ZykwYjAy' target='_blank' class='text-sage underline'>Telegram</a> zeige ich dir, wie mein Schutzschild aussieht.", prompt: "Was ist dein persönlicher 'Rettungsanker' für stressige Momente?", quote: "Sorge gut für dich vor, damit du in deiner Kraft bleiben kannst." },
            { title: 'Dein Licht', label: 'DEIN LICHT', mission: "Tag 14! Du hast dir vertraut. Schau in <a href='https://t.me/+ZaOT7m-1ZykwYjAy' target='_blank' class='text-sage underline'>Telegram</a> für das große Finale. Vergiss nicht, dein Reisebuch als PDF zu sichern!", prompt: "Was ist die wichtigste Erkenntnis, die du aus den letzten 14 Tagen mitnimmst?", quote: "Dein Licht leuchtet von innen. Vertraue deinem Weg." }
        ],
        deferredPrompt: null,
        showInstallBtn: false,
        get isIOS() { return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream; },
        get isAndroid() { return /Android/.test(navigator.userAgent); },
        get isStandalone() {
            return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true || window.location.search.includes('pwa=true');
        },
        init() {
            if ('serviceWorker' in navigator) { window.addEventListener('load', () => { navigator.serviceWorker.register('./sw.js').catch(err => console.log('SW failed', err)); }); }
            window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); this.deferredPrompt = e; this.showInstallBtn = true; });
            if (this.isStandalone && !this.state.welcomeComplete) { this.welcomeStep = 3; }
            if (window.location.search.includes('reset=true')) { localStorage.removeItem('noura_storage'); window.location.href = window.location.pathname; }
            this.$nextTick(() => lucide.createIcons());
            this.$watch('state', () => { this.saved = true; setTimeout(() => this.saved = false, 2000); this.$nextTick(() => lucide.createIcons()); });
            setInterval(() => { if (this.isBeforeStart === false) {} }, 60000);
        },
        async installApp() {
            if (!this.deferredPrompt) return;
            this.deferredPrompt.prompt();
            const { outcome } = await this.deferredPrompt.userChoice;
            if (outcome === 'accepted') { this.showInstallBtn = false; this.welcomeStep = 2; }
            this.deferredPrompt = null;
        },
        addProteinTag(tag) {
            const emptyIndex = this.state.nourish.findIndex(v => v === '');
            if (emptyIndex !== -1) { this.state.nourish[emptyIndex] = tag; } else { this.state.nourish[2] = tag; }
        },
        addFlowTag(tag) {
            if (!this.state.pivot) this.state.pivot = tag;
            else if (!this.state.pivot.includes(tag)) this.state.pivot += ', ' + tag;
        },
        addSafetyTag(tag) {
            if (!this.state.safety) this.state.safety = tag;
            else if (!this.state.safety.includes(tag)) this.state.safety += ', ' + tag;
        },
        toggleDay(index) { 
            this.state.checklist[index].done = !this.state.checklist[index].done; 
            if (this.state.checklist[index].done) {
                this.sparklingDays.push(index);
                setTimeout(() => { this.sparklingDays = this.sparklingDays.filter(i => i !== index); }, 1000);
            }
        },
        resetWegweiser() { if(confirm('Möchtest du den Wegweiser wirklich zurücksetzen?')) { this.state.checklist = Array.from({length: 14}, () => ({ done: false, journal: '' })); } },
        printWegweiser() { window.print(); },
        resizeJournal(el) { if (!el) return; el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; },
        scrollTo(id) { const el = document.getElementById(id); if (el) { const offset = 100; const bodyRect = document.body.getBoundingClientRect().top; const elementRect = el.getBoundingClientRect().top; const elementPosition = elementRect - bodyRect; const offsetPosition = elementPosition - offset; window.scrollTo({ top: offsetPosition, behavior: 'smooth' }); } }
    }
}