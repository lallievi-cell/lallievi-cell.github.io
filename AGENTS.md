# Unghie Mamma - Contesto e Istruzioni Persistenti

> **IMPORTANTE PER TUTTI I MODELLI / AGENTI NELLE FUTURE CHAT:**  
> Leggere attentamente questo documento prima di modificare qualsiasi linea di codice. L'applicazione è **in uso reale in produzione**.

---

## 1. Contesto Reale di Produzione
- **Utente finale**: La mamma dell'utente utilizza quotidianamente questa applicazione sul suo **iPhone** per gestire gli appuntamenti, le schede clienti e gli incassi della sua attività di ricostruzione unghie.
- **Come la usa attualmente**: L'app è stata installata sulla schermata Home dell'iPhone come WebClip tramite il seguente link:
  `https://htmlpreview.github.io/?https://github.com/lallievi-cell/unghie-mamma/blob/main/index.html`
- **Dove sono salvati i dati reali**: I dati (nomi clienti, numeri, storico trattamenti, appuntamenti, debiti e incassi) risiedono nel `localStorage` del browser dell'iPhone, sotto la chiave `unghie-mamma-v1`, **isolati nel dominio `htmlpreview.github.io`**.

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
       ]
     }
     ```
   - Qualsiasi nuovo campo deve essere facoltativo con fallback di default retrocompatibili.
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

## 4. Linee Guida di Sviluppo
- **UI & UX per Mamma**: La grafica deve essere pulita, a caratteri grandi, pulsanti ben distanziati per il tocco con le dita su iPhone, con colori caldi/eleganti (palette già presente: tonalità malva/rosa/crema).
- **Semplicità prima di tutto**: Evitare configurazioni complesse o dipendenze pesanti inutili; il codice è volutamente puro (Vanilla JS + CSS nativo), ultra-veloce e senza build step obbligatori.
