function nouraApp() {
    return {
        scroll: 0, 
        showSOS: false, 
        tourStep: 1, 
        welcomeStep: 1,
        sparklingDays: [],
        saved: false,
        accessCode: '',
        showPassword: false,
        get greeting() {
            const h = new Date().getHours();
            if (h < 4) return `Gute Nacht`;
            if (h < 12) return `Guten Morgen`;
            if (h < 18) return `Guten Tag`;
            return `Guten Abend`;
        },
        get sleepReminder() {
            const h = new Date().getHours();
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
            hasAccess: false,
            startDate: null, 
            tourSeen: false, 
            welcomeComplete: false,
            reduceMotion: false,
            todayMood: '',
            name: '', 
            why: '', 
            nourish: ['', '', ''], 
            pivot: '', 
            safety: '', 
            anamnese: {
                schlaf: '',
                energie: '',
                zyklus: '',
                stress: '',
                verdauung: '',
                ziele: ''
            },
            checklist: Array.from({length: 14}, () => ({ done: false, journal: '' }))
        }).as('noura_storage'),
        checkAccessCode() {
            const codeMap = {
                'NOURA-MERVE-26': 'Merve',
                'NOURA-MASOOMA-26': 'Masooma',
                'NOURA-RANA-26': 'Rana',
                'NOURA-REBECCA-26': 'Rebecca',
                'NOURA-EBRU-26': 'Ebru',
                'NOURA-MUKADDES-26': 'Mukaddes',
                'NOURA-MAMA-07-26': 'Mama',
                'NOURA-MAMA-08-26': 'Mama',
                'NOURA-MAMA-09-26': 'Mama',
                'NOURA-MAMA-10-26': 'Mama'
            };
            
            const enteredCode = this.accessCode.toUpperCase().trim();
            if (codeMap[enteredCode]) {
                this.state.name = codeMap[enteredCode];
                this.state.hasAccess = true;
                this.state.welcomeComplete = true; // Wir überspringen die Namenseingabe
            } else {
                alert('Dieser Zugangscode ist uns nicht bekannt. Bitte prüfe die Schreibweise.');
                this.accessCode = '';
            }
        },
        completeWelcome() {
            this.state.welcomeComplete = true;
            if (!this.state.startDate) this.state.startDate = new Date().toISOString();
        },
        get currentDayIndex() {
            if (!this.state.startDate) return 0;
            const s = new Date(this.state.startDate); s.setHours(0,0,0,0);
            const n = new Date(); n.setHours(0,0,0,0);
            const diff = Math.floor((n - s) / 86400000);
            return Math.max(0, Math.min(13, diff));
        },
        days: [
            { title: 'Teller-Hoheit', mission: "Iss heute keine Reste. Deck dir einen eigenen Teller. In <a href='https://t.me/+ZaOT7m-1ZykwYjAy' target='_blank' class='text-sage underline'>Telegram</a> erkläre ich dir, warum das dein wichtigster Sieg ist.", prompt: "Wie hat es sich angefühlt, heute nur für dich einen Teller anzurichten?" },
            { title: 'Protein-Anker', mission: "Zu jeder Mahlzeit heute eine Faustgröße Protein. Schau in <a href='https://t.me/+ZaOT7m-1ZykwYjAy' target='_blank' class='text-sage underline'>Telegram</a> für meine Liste der besten Quellen!", prompt: "Welche Proteinquelle hat dir heute am meisten Energie gegeben?" },
            { title: 'Liquid Gold', mission: "Trinke 500ml Wasser vor dem ersten Kaffee. In <a href='https://t.me/+ZaOT7m-1ZykwYjAy' target='_blank' class='text-sage underline'>Telegram</a> erfährst du, wie Wasser deinen Heißhunger steuert.", prompt: "Was hat sich durch das Wasser am Morgen in deinem Körper verändert?" },
            { title: '5-Minuten-Stille', mission: "Halte kurz inne, bevor du isst. Atme 3x tief. Hör dir dazu meinen Quick-Reset Audio-Impuls in <a href='https://t.me/+ZaOT7m-1ZykwYjAy' target='_blank' class='text-sage underline'>Telegram</a> an.", prompt: "Welcher Gedanke kam dir in der Stille vor dem Essen?" },
            { title: 'Flow-Check', mission: "Pass dein Essen dem Familienchaos an, ohne extra zu kochen. In <a href='https://t.me/+ZaOT7m-1ZykwYjAy' target='_blank' class='text-sage underline'>Telegram</a> zeige ich dir heute meine 3 besten Flow-Hacks.", prompt: "Wie hast du es heute geschafft, flexibel zu bleiben?" },
            { title: 'Body Respect', mission: "Nenne eine Sache, für die du deinem Körper heute dankbar bist. Teile sie mit uns in der <a href='https://t.me/+ZaOT7m-1ZykwYjAy' target='_blank' class='text-sage underline'>Gruppe</a>!", prompt: "Wofür bist du deinem Körper heute besonders dankbar?" },
            { title: 'Rest & Reflect', mission: "Sonntags-Reset: Was darf heute gehen? Schau in <a href='https://t.me/+ZaOT7m-1ZykwYjAy' target='_blank' class='text-sage underline'>Telegram</a> für unsere gemeinsame Reflektions-Runde.", prompt: "Was darfst du heute loslassen, um leichter in die neue Woche zu starten?" },
            { title: 'Blutzucker-Liebe', mission: "Achte auf die Reihenfolge: Erst Gemüse, dann Protein. Warum das alles ändert, erkläre ich dir heute in <a href='https://t.me/+ZaOT7m-1ZykwYjAy' target='_blank' class='text-sage underline'>Telegram</a>.", prompt: "Wie hat dein Körper auf die neue Reihenfolge beim Essen reagiert?" },
            { title: 'Intuitive Wahl', mission: "Hunger oder Emotion? Frag dich vor dem Snack: Was brauche ich gerade wirklich? In <a href='https://t.me/+ZaOT7m-1ZykwYjAy' target='_blank' class='text-sage underline'>Telegram</a> gehen wir heute tief.", prompt: "Was war heute der Unterschied zwischen emotionalem und körperlichem Hunger?" },
            { title: 'Morgen-Anker', mission: "2 Minuten Stille vor dem Handy. Starte bei dir, nicht bei den anderen. Tipps für Morgen-Rituale findest du in <a href='https://t.me/+ZaOT7m-1ZykwYjAy' target='_blank' class='text-sage underline'>Telegram</a>.", prompt: "Wie hat die Stille am Morgen deinen Tag beeinflusst?" },
            { title: 'Sanfter Flow', mission: "Bewege deinen Körper für 5 Minuten so, wie es sich gut anfühlt. In <a href='https.t.me/+ZaOT7m-1ZykwYjAy' target='_blank' class='text-sage underline'>Telegram</a> teile ich heute eine sanfte Routine mit dir.", prompt: "Welche Bewegung hat dein Körper heute am meisten gebraucht?" },
            { title: 'Echtzeit-Genuss', mission: "Iss die ersten 3 Bissen in voller Stille. Was schmeckst du? In <a href='https://t.me/+ZaOT7m-1ZykwYjAy' target='_blank' class='text-sage underline'>Telegram</a> besprechen wir heute das Thema Achtsamkeit.", prompt: "Was hast du bei den ersten drei Bissen heute bewusst wahrgenommen?" },
            { title: 'Safety First', mission: "Bereite heute Abend deinen Rettungsanker für morgen vor. In <a href='https://t.me/+ZaOT7m-1ZykwYjAy' target='_blank' class='text-sage underline'>Telegram</a> zeige ich dir, wie mein Schutzschild aussieht.", prompt: "Was ist dein persönlicher 'Rettungsanker' für stressige Momente?" },
            { title: 'Dein Licht', mission: "Tag 14! Du hast dir vertraut. Schau in <a href='https://t.me/+ZaOT7m-1ZykwYjAy' target='_blank' class='text-sage underline'>Telegram</a> für das große Finale und deinen Weg in die Zukunft mit mir.", prompt: "Was ist die wichtigste Erkenntnis, die du aus den letzten 14 Tagen mitnimmst?" }
        ],
        init() {
            if (window.location.search.includes('reset=true')) {
                localStorage.removeItem('noura_storage');
                window.location.href = window.location.pathname;
            }
            if (Array.isArray(this.state.checklist) && typeof this.state.checklist[0] === 'boolean') {
                this.state.checklist = this.state.checklist.map(done => ({ done: done, journal: '' }));
            }
            this.$nextTick(() => lucide.createIcons());
            this.$watch('state', () => { 
                this.saved = true; 
                setTimeout(() => this.saved = false, 2000); 
                this.$nextTick(() => lucide.createIcons()); 
            });
        },
        completeTour() { this.state.tourSeen = true; },
        addProteinTag(tag) {
            const emptyIndex = this.state.nourish.findIndex(v => v === '');
            if (emptyIndex !== -1) {
                this.state.nourish[emptyIndex] = tag;
            } else {
                this.state.nourish[2] = tag;
            }
        },
        toggleDay(index) { 
            this.state.checklist[index].done = !this.state.checklist[index].done; 
            if (this.state.checklist[index].done) {
                this.sparklingDays.push(index);
                setTimeout(() => {
                    this.sparklingDays = this.sparklingDays.filter(i => i !== index);
                }, 1000);
            }
        },
        resetWegweiser() {
            if(confirm('Möchtest du den Wegweiser wirklich zurücksetzen?')) {
                this.state.checklist = Array.from({length: 14}, () => ({ done: false, journal: '' }));
            }
        },
        printWegweiser() { window.print(); },
        resizeJournal(el) {
            if (!el) return;
            el.style.height = 'auto';
            el.style.height = el.scrollHeight + 'px';
        },
        scrollTo(id) {
            const el = document.getElementById(id);
            if (el) {
                const offset = 100;
                const bodyRect = document.body.getBoundingClientRect().top;
                const elementRect = el.getBoundingClientRect().top;
                const elementPosition = elementRect - bodyRect;
                const offsetPosition = elementPosition - offset;
                window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
            }
        }
    }
}
