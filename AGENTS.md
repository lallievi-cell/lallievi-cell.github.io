# Unghie Mamma - Contesto e Istruzioni Persistenti

> **IMPORTANTE PER TUTTI I MODELLI / AGENTI NELLE FUTURE CHAT:**  
> Leggere attentamente questo documento prima di modificare qualsiasi linea di codice. L'applicazione è **in uso reale in produzione**.

---

## 1. Contesto Reale di Produzione
- **Utente finale**: La mamma dell'utente utilizza quotidianamente questa applicazione sul suo **iPhone** per gestire gli appuntamenti, le schede clienti e gli incassi della sua attività di ricostruzione unghie.
- **Orari e modalità di lavoro**: Lavora nella fascia **08:00 – 20:00**, **senza pause pranzo fisse**. Prende appuntamenti in qualsiasi momento di questa fascia oraria in base alle richieste delle clienti e alla durata dei trattamenti.
- **I due repository GitHub collegati**:
  - `lallievi-cell/unghie-mamma`: il repository iniziale.
  - `lallievi-cell/lallievi-cell.github.io`: **il repository principale di produzione** pubblicato live su GitHub Pages a `https://lallievi-cell.github.io/`.
- **Link Live Ufficiale**:
  👉 **`https://lallievi-cell.github.io/`** (con cache-bust `v19`, font Plus Jakarta Sans, icone SVG stile Lucide, bottoni tattili iOS e glassmorphism, chiusura modale con swipe/trascinamento verso il basso, spese e guadagno netto).
- **Dove sono salvati i dati reali**: I dati (nomi clienti, numeri, storico trattamenti, appuntamenti, debiti, spese e incassi) risiedono nel `localStorage` del browser dell'iPhone, sotto la chiave `unghie-mamma-v1`.

---

## 2. Regole Assolute di Sicurezza (Zero Data Loss)
1. **MAI alterare o rompere la struttura dati**:
   - Struttura:
     ```json
     {
       "clients": [
         { "id": "...", "name": "...", "phone": "...", "allergies": "...", "prefs": "...", "recallWeeks": 3 }
       ],
       "appointments": [
         { "id": "...", "clientId": "...", "date": "YYYY-MM-DD", "time": "HH:MM", "serviceId": "...", "price": 0, "paid": 0, "work": "...", "status": "booked|done|cancelled" }
       ],
       "services": [
         { "id": "ricostruzione", "name": "Ricostruzione unghie", "minutes": 90, "price": 40 }
       ],
       "expenses": [
         { "id": "...", "amount": 45.0, "date": "YYYY-MM-DD", "category": "materiali|attrezzatura|varie", "desc": "Top coat e gel" }
       ]
     }
     ```
   - Qualsiasi nuovo campo deve essere facoltativo con fallback di default retrocompatibili (`db.expenses = db.expenses || []`).
2. **Attenzione al cambio di dominio (Migrazione su GitHub Pages)**:
   - Il dominio previsto definitivo è `https://lallievi-cell.github.io/unghie-mamma/`.
   - **ATTENZIONE**: Poiché il browser isola il `localStorage` per dominio (Same-Origin Policy), aprendo il nuovo link i dati **NON** si trasferiranno da soli.
   - **Procedura obbligatoria prima di cambiare link**:
     1. Far aprire a mamma la sezione **"Soldi"** (💶).
     2. Cliccare su **"Salva copia"** (`exp()`) per scaricare il file JSON di backup su iPhone.
     3. Aprire il nuovo link sul telefono.
     4. Andare in "Soldi" -> **"Ripristina"** (`imp()`) e selezionare il file JSON appena salvato.
3. **Attenzione a `index.html` e gli script CDN**:
   - Nel file `index.html` gli script `app.js`, `app2.js`, `app3.js` erano stati inclusi puntando a versioni fisse di jsDelivr (es. `@c997829`, `@8dc0ebb`, `@7b05e63`) per farli funzionare dentro `htmlpreview`.
   - Se si apportano modifiche locali, verificare che `index.html` carichi gli script aggiornati senza rompere il funzionamento dell'app per la mamma.

---

## 3. Struttura dei File del Progetto
- [`index.html`](file:///c:/Users/MFCS/Desktop/Unghie-mamma/index.html): Markup base, stili CSS responsive/mobile-first, scheletro modale e tab bar.
- [`app.js`](file:///c:/Users/MFCS/Desktop/Unghie-mamma/app.js): Costanti servizi predefiniti (`SV`), caricamento/salvataggio `localStorage`, funzioni di formattazione valuta/data (`euro`, `nd`, `ndl`), routing tab (`go`).
- [`app2.js`](file:///c:/Users/MFCS/Desktop/Unghie-mamma/app2.js): Rendering delle 4 schermate principali:
  - `vToday()`: Tab "Oggi" (appuntamenti del giorno, divisi per prenotati e già fatti).
  - `vAgenda()`: Tab "Agenda" (calendario mensile con pallini per i giorni occupati).
  - `vClients()`: Tab "Clienti" (elenco clienti con ricerca, debiti e note allergie).
  - `vMoney()`: Tab "Soldi" (incasso mensile, clienti con pagamenti in sospeso, pulsanti Backup "Salva copia" e "Ripristina").
- [`app3.js`](file:///c:/Users/MFCS/Desktop/Unghie-mamma/app3.js): Logica dei modali, form di inserimento/modifica appuntamenti e clienti, click-to-call e click-to-WhatsApp, funzioni di export (`exp`) e import (`imp`).
- [`manifest.json`](file:///c:/Users/MFCS/Desktop/Unghie-mamma/manifest.json) & [`sw.js`](file:///c:/Users/MFCS/Desktop/Unghie-mamma/sw.js): Configurazione Progressive Web App e Service Worker per la modalità offline.
- [`.github/workflows/pages.yml`](file:///c:/Users/MFCS/Desktop/Unghie-mamma/.github/workflows/pages.yml): Workflow GitHub Actions per il deploy automatico su GitHub Pages.

---

## 4. Regola d'Oro UX: Design per la Mamma ("Boomer-Proof")
> 👵 **TARGET UTENTE: Mamma non tecnica.**  
> Qualsiasi modifica futura DEVE assolutamente rispettare questi principi di semplicità estrema. Se una funzione risulta complicata o poco intuitiva per lei, è un fallimento di design.

1. **Zero Gergo Tecnico e Zero Complessità**:
   - Usare solo italiano semplice, naturale e diretto (es. *"Chiama"*, *"Manda WhatsApp"*, *"Segna come fatta"*, *"Da pagare"*, *"Salva copia"*).
   - Niente impostazioni nascoste, sottomenu annidati o flussi a più passaggi complicati.
2. **Pulsanti Grandi e Spaziati ("Fat-Finger Friendly")**:
   - Tutti i pulsanti devono essere grandi, alti (minimo 48-52px di touch target) e ben distanziati per essere premuti comodamente con il pollice su iPhone senza rischiare di toccare il tasto sbagliato.
3. **Alta Leggevolezza e Contrasto**:
   - Font grandi (minimo 16-18px per i testi principali, numeri orari e prezzi ben visibili).
   - Nessun testo grigio chiaro o a basso contrasto: deve potersi leggere senza sforzo anche senza occhiali o con luce forte.
4. **Protezione della Memoria Muscolare**:
   - Mamma ha già memorizzato dove si trovano le cose:
     - La barra in basso con le 4 icone: **📅 Oggi**, **🗓️ Agenda**, **👩 Clienti**, **💶 Soldi**.
     - Il grande pulsante rotondo **[+]** in basso a destra per aggiungere.
   - **NON spostare o stravolgere** la disposizione di questi elementi base: l'abitudine è fondamentale.
5. **Colori Parlanti e Chiari**:
   - Verde per ciò che è a posto / pagato.
   - Rosso/Rosa scuro per chi deve ancora pagare o per le allergie.
   - Toni caldi, rassicuranti ed eleganti (palette rosa/crema già presente).
6. **Nessun Rischio di Errori Accidentali**:
   - Mai eliminazioni dirette con un tocco: chiedere sempre una conferma chiarissima prima di cancellare un appuntamento o una cliente.
   - Modali semplici con pulsante "Salva" evidente e pulsante "Chiudi / Annulla" ben visibile in basso.
