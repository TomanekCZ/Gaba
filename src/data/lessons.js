export const lessonsData = [
    {
        id: "lesson-1",
        title: "Základy a pozdravy",
        description: "První kontakt, zdvořilé fráze a krátké odpovědi pro běžný rozhovor",
        icon: "MessageCircle",
        level: "A0-A1",
        goal: "Navážeš jednoduchý rozhovor a zvládneš pozdravit, poděkovat i reagovat.",
        studyFocus: "Pozdravy, základní otázky, zdvořilostní fráze",
        recommendedFor: "Začni tady, pokud se chceš znovu rozmluvit v každodenních situacích.",
        cards: [
            { id: "c1", en: "Hello", cz: "Ahoj", phonetic: "/həˈləʊ/", type: "Pozdrav", context: "Hello, how are you today?", contextCz: "Ahoj, jak se dnes máš?" },
            { id: "c2", en: "Good morning", cz: "Dobré ráno", phonetic: "/ɡʊd ˈmɔːnɪŋ/", type: "Pozdrav", context: "Good morning! It's a beautiful day.", contextCz: "Dobré ráno! Je krásný den." },
            { id: "c3", en: "Thank you", cz: "Děkuji", phonetic: "/θæŋk juː/", type: "Fráze", context: "Thank you for your help.", contextCz: "Děkuji za tvou pomoc." },
            { id: "c4", en: "Please", cz: "Prosím", phonetic: "/pliːz/", type: "Fráze", context: "Can I have some water, please?", contextCz: "Můžu dostat trochu vody, prosím?" },
            { id: "c5", en: "How are you?", cz: "Jak se máš?", phonetic: "/haʊ ɑː juː/", type: "Otázka", context: "Hi John, how are you?", contextCz: "Ahoj Johne, jak se máš?" },
            { id: "c6", en: "Nice to meet you", cz: "Rád tě poznávám", phonetic: "/naɪs tə miːt juː/", type: "Fráze", context: "Nice to meet you, I'm Petra.", contextCz: "Rád tě poznávám, jsem Petra." }
        ]
    },
    {
        id: "lesson-2",
        title: "V kavárně",
        description: "Objednávka, drobné změny v objednávce a komunikace s obsluhou",
        icon: "Coffee",
        level: "A1",
        goal: "Objednáš si pití a jídlo bez přepínání do češtiny.",
        studyFocus: "Objednávka, velikosti, placení, prosby",
        recommendedFor: "Vhodné po zvládnutí základních pozdravů a krátkých otázek.",
        cards: [
            { id: "c21", en: "Coffee", cz: "Káva", phonetic: "/ˈkɒfi/", type: "Podstatné jméno", context: "I would like a cup of coffee.", contextCz: "Dal bych si šálek kávy." },
            { id: "c22", en: "Tea", cz: "Čaj", phonetic: "/tiː/", type: "Podstatné jméno", context: "Green tea is very healthy.", contextCz: "Zelený čaj je velmi zdravý." },
            { id: "c23", en: "Water", cz: "Voda", phonetic: "/ˈwɔːtə/", type: "Podstatné jméno", context: "Sparkling or still water?", contextCz: "Perlivou nebo neperlivou vodu?" },
            { id: "c24", en: "Sugar", cz: "Cukr", phonetic: "/ˈʃʊɡə/", type: "Podstatné jméno", context: "No sugar for me, thanks.", contextCz: "Pro mě bez cukru, díky." },
            { id: "c25", en: "To go", cz: "S sebou", phonetic: "/tə ɡəʊ/", type: "Fráze", context: "Is that for here or to go?", contextCz: "Bude to tady nebo s sebou?" },
            { id: "c26", en: "Can I pay by card?", cz: "Můžu zaplatit kartou?", phonetic: "/kæn aɪ peɪ baɪ kɑːd/", type: "Otázka", context: "Can I pay by card, please?", contextCz: "Můžu zaplatit kartou, prosím?" }
        ]
    },
    {
        id: "lesson-3",
        title: "Na letišti",
        description: "Základní orientace při check-inu, kontrole a hledání gate",
        icon: "Plane",
        level: "A1-A2",
        goal: "Zvládneš se zorientovat při cestování a reagovat na běžné pokyny.",
        studyFocus: "Let, gate, zavazadla, doklady, zpoždění",
        recommendedFor: "Hodí se před cestou nebo jako praktické opakování cestovatelských témat.",
        cards: [
            { id: "c31", en: "Flight", cz: "Let", phonetic: "/flaɪt/", type: "Podstatné jméno", context: "My flight is delayed.", contextCz: "Můj let je zpožděný." },
            { id: "c32", en: "Ticket", cz: "Letenka / Lístek", phonetic: "/ˈtɪkɪt/", type: "Podstatné jméno", context: "Do you have your ticket?", contextCz: "Máte svou letenku?" },
            { id: "c33", en: "Gate", cz: "Brána", phonetic: "/ɡeɪt/", type: "Podstatné jméno", context: "Please proceed to gate number 5.", contextCz: "Prosím pokračujte k bráně číslo 5." },
            { id: "c34", en: "Luggage", cz: "Zavazadla", phonetic: "/ˈlʌɡɪdʒ/", type: "Podstatné jméno", context: "Where can I pick up my luggage?", contextCz: "Kde si mohu vyzvednout svá zavazadla?" },
            { id: "c35", en: "Passport", cz: "Pas", phonetic: "/ˈpɑːspɔːt/", type: "Podstatné jméno", context: "Show me your passport, please.", contextCz: "Ukažte mi prosím svůj pas." },
            { id: "c36", en: "Delayed", cz: "Zpožděný", phonetic: "/dɪˈleɪd/", type: "Přídavné jméno", context: "The flight is delayed by thirty minutes.", contextCz: "Let je zpožděný o třicet minut." }
        ]
    },
    {
        id: "lesson-4",
        title: "Hotel a ubytování",
        description: "Check-in, rezervace a řešení jednoduchých problémů na recepci",
        icon: "BedDouble",
        level: "A2",
        goal: "Vyřídíš příjezd, rezervaci i základní požadavky na hotelu.",
        studyFocus: "Rezervace, pokoj, klíč, snídaně, recepce",
        recommendedFor: "Navazuje na cestování a rozšiřuje fráze pro pobyt v zahraničí.",
        cards: [
            { id: "c41", en: "Reservation", cz: "Rezervace", phonetic: "/ˌrezəˈveɪʃən/", type: "Podstatné jméno", context: "I have a reservation for two nights.", contextCz: "Mám rezervaci na dvě noci." },
            { id: "c42", en: "Room key", cz: "Klíč od pokoje", phonetic: "/ruːm kiː/", type: "Podstatné jméno", context: "Here is your room key.", contextCz: "Tady je váš klíč od pokoje." },
            { id: "c43", en: "Reception", cz: "Recepce", phonetic: "/rɪˈsepʃən/", type: "Podstatné jméno", context: "Please call reception if you need anything.", contextCz: "Pokud budete něco potřebovat, zavolejte na recepci." },
            { id: "c44", en: "Breakfast", cz: "Snídaně", phonetic: "/ˈbrekfəst/", type: "Podstatné jméno", context: "Is breakfast included?", contextCz: "Je snídaně v ceně?" },
            { id: "c45", en: "Check out", cz: "Odhlásit se z hotelu", phonetic: "/tʃek aʊt/", type: "Fráze", context: "What time do we need to check out?", contextCz: "V kolik se musíme odhlásit?" }
        ]
    },
    {
        id: "lesson-5",
        title: "V práci a na meetingu",
        description: "Slovní zásoba pro jednoduché pracovní situace a týmovou komunikaci",
        icon: "BriefcaseBusiness",
        level: "A2-B1",
        goal: "Domluvíš se na úkolu, termínu a základním průběhu meetingu.",
        studyFocus: "Úkoly, termíny, tým, schůzka, aktualizace",
        recommendedFor: "Vhodné pro studenty a pracující, kteří chtějí aktivní angličtinu do práce.",
        cards: [
            { id: "c51", en: "Deadline", cz: "Termín", phonetic: "/ˈdedlaɪn/", type: "Podstatné jméno", context: "The deadline is on Friday.", contextCz: "Termín je v pátek." },
            { id: "c52", en: "Meeting", cz: "Schůzka", phonetic: "/ˈmiːtɪŋ/", type: "Podstatné jméno", context: "We have a meeting at ten.", contextCz: "Máme schůzku v deset." },
            { id: "c53", en: "Task", cz: "Úkol", phonetic: "/tɑːsk/", type: "Podstatné jméno", context: "Can you finish this task today?", contextCz: "Můžeš tenhle úkol dokončit dnes?" },
            { id: "c54", en: "Team", cz: "Tým", phonetic: "/tiːm/", type: "Podstatné jméno", context: "Our team is working on a new project.", contextCz: "Náš tým pracuje na novém projektu." },
            { id: "c55", en: "Update", cz: "Aktualizace / informovat", phonetic: "/ˈʌpdeɪt/", type: "Podstatné jméno / sloveso", context: "Please update me tomorrow.", contextCz: "Prosím informuj mě zítra." }
        ]
    },
    {
        id: "lesson-6",
        title: "U lékaře a v lékárně",
        description: "Základní výrazy pro zdravotní potíže, léky a jednoduché otázky",
        icon: "HeartPulse",
        level: "A2-B1",
        goal: "Popíšeš jednoduchý problém a zvládneš se doptat na pomoc nebo léky.",
        studyFocus: "Bolest, léky, symptomy, doporučení",
        recommendedFor: "Praktická lekce pro cesty i každodenní život.",
        cards: [
            { id: "c61", en: "Headache", cz: "Bolest hlavy", phonetic: "/ˈhedeɪk/", type: "Podstatné jméno", context: "I have a headache.", contextCz: "Bolí mě hlava." },
            { id: "c62", en: "Medicine", cz: "Lék", phonetic: "/ˈmedɪsən/", type: "Podstatné jméno", context: "Do you need any medicine?", contextCz: "Potřebujete nějaký lék?" },
            { id: "c63", en: "Pain", cz: "Bolest", phonetic: "/peɪn/", type: "Podstatné jméno", context: "Where is the pain?", contextCz: "Kde je ta bolest?" },
            { id: "c64", en: "Pharmacy", cz: "Lékárna", phonetic: "/ˈfɑːməsi/", type: "Podstatné jméno", context: "Is there a pharmacy nearby?", contextCz: "Je poblíž lékárna?" },
            { id: "c65", en: "I don't feel well", cz: "Necítím se dobře", phonetic: "/aɪ dəʊnt fiːl wel/", type: "Fráze", context: "I don't feel well today.", contextCz: "Dnes se necítím dobře." }
        ]
    }
];
