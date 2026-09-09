const KEY="unghie-mamma-v1";
const BKEY="unghie-mamma-backup-at";
const SV=[
 {id:"ricostruzione",name:"Ricostruzione",minutes:90,price:40},
 {id:"refill",name:"Rifatto / refill",minutes:60,price:30},
 {id:"semiperm",name:"Smalto semipermanente",minutes:50,price:25},
 {id:"nailart",name:"Decorazione extra",minutes:30,price:10},
 {id:"rimozione",name:"Togliere unghie",minutes:30,price:15},
 {id:"pedicure",name:"Piedi",minutes:60,price:30}
];
let db,tab="oggi",selectedDate,q="",cFilter="all",calView="week",moneyMonth=today().slice(0,7);
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,6)}
function pad(n){return String(n).padStart(2,"0")}
function ymd(d){return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate())}
function today(){return ymd(new Date())}
function tomorrow(){const d=parseISO(today());d.setDate(d.getDate()+1);return ymd(d)}
function parseISO(iso){const p=(iso||"").split("-");return new Date(+p[0],(+p[1]||1)-1,+p[2]||1)}
function load(){try{db=Object.assign({clients:[],appointments:[],services:SV,expenses:[]},JSON.parse(localStorage.getItem(KEY)||"{}"))}catch(e){db={clients:[],appointments:[],services:SV,expenses:[]}}
if(!db.services||!db.services.length)db.services=SV.slice();
if(!db.expenses)db.expenses=[];}
function save(){try{localStorage.setItem(KEY,JSON.stringify(db));toast("Salvato.")}catch(e){if(e&&(e.name==='QuotaExceededError'||e.code===22)){alert("Attenzione: memoria del telefono piena! Rimuovi qualche foto dalle schede clienti per liberare spazio.")}else{alert("Salvataggio non riuscito: memoria non disponibile.")}}}
function toast(msg){const el=document.getElementById("toast");if(!el)return;el.textContent=msg||"Salvato.";el.classList.add("show");clearTimeout(toast.t);toast.t=setTimeout(function(){el.classList.remove("show")},1400)}
function euro(n){return(Number(n)||0).toLocaleString("it-IT",{style:"currency",currency:"EUR"})}
function esc(s){return String(s||"").replace(/[&<>"]/g,function(ch){return "&#"+ch.charCodeAt(0)+";"})}
function C(id){return db.clients.find(x=>x.id===id)}
function S(id){return (db.services||[]).find(x=>x.id===id)}
function mins(a){if(a&&+a.minutes)return +a.minutes;const s=S(a&&a.serviceId);return (s&&s.minutes)||60}
function toMin(t){const p=String(t||"0:0").split(":");return (+p[0]||0)*60+(+p[1]||0)}
function slotApt(list,hh){const slot=toMin(hh);return list.find(function(a){if(a.status==="cancelled")return false;const start=toMin(a.time);return slot>=start&&slot<start+mins(a)})}
function findOverlap(date,time,minutes,exceptId){const start=toMin(time),end=start+(+minutes||60);return db.appointments.find(function(a){if(a.id===exceptId||a.date!==date||a.status==="cancelled"||a.status==="deleted")return false;const s=toMin(a.time),e=s+mins(a);return start<e&&end>s})}
function overlaps(date,time,minutes,exceptId){return Boolean(findOverlap(date,time,minutes,exceptId))}
function apts(date){return db.appointments.filter(a=>a.date===date&&a.status!=="deleted"&&a.status!=="cancelled").sort((a,b)=>(a.time||"").localeCompare(b.time||""))}
function allApts(date){return db.appointments.filter(a=>a.date===date&&a.status!=="deleted").sort((a,b)=>(a.time||"").localeCompare(b.time||""))}
function bal(id){return db.appointments.filter(a=>a.clientId===id&&a.status==="done").reduce((s,a)=>s+(+a.price||0)-(+a.paid||0),0)}
function last(id){return db.appointments.filter(a=>a.clientId===id&&a.status==="done").sort((a,b)=>b.date.localeCompare(a.date))[0]}
function nd(iso){if(!iso)return"";return parseISO(iso).toLocaleDateString("it-IT",{weekday:"short",day:"numeric",month:"short"})}
function ndl(iso){return parseISO(iso).toLocaleDateString("it-IT",{weekday:"long",day:"numeric",month:"long"})}
function weeksAgo(iso){const d=Math.round((parseISO(today())-parseISO(iso))/86400000);if(d<=0)return "oggi";if(d<7)return d+" gg fa";return Math.floor(d/7)+" sett. fa"}
function openModal(h){
  const m=document.getElementById("modal");
  const bg=document.getElementById("modalBg");
  m.style.transform="";
  m.style.transition="";
  if(bg) bg.style.backgroundColor="";
  m.innerHTML="<div class='handle-wrap' onclick='if(!window.modalRecentlyDragged||Date.now()-window.modalRecentlyDragged>350)closeModal()'><div class='handle'></div></div>"+h;
  bg.classList.add("show");
  m.scrollTop=0;
}
function closeModal(){
  const m=document.getElementById("modal");
  const bg=document.getElementById("modalBg");
  if(!bg||!bg.classList.contains("show"))return;
  m.style.transition="transform 0.22s cubic-bezier(0.32, 0.72, 0, 1)";
  m.style.transform="translateY(100%)";
  if(bg) bg.style.backgroundColor="rgba(25, 14, 18, 0)";
  setTimeout(function(){
    bg.classList.remove("show");
    m.style.transform="";
    m.style.transition="";
    if(bg) bg.style.backgroundColor="";
  },230);
}
function phoneDigits(p){return String(p||"").replace(/\D/g,"")}
function waNum(p){let d=phoneDigits(p);if(!d)return"";if(d.startsWith("00"))d=d.slice(2);return d.length<=10?"39"+d:d}
function waLink(phone,text){const n=waNum(phone);if(!n)return"";return "https://wa.me/"+n+"?text="+encodeURIComponent(text)}
function firstName(c){return ((c&&c.name)||"tesoro").split(" ")[0]}
function msgRemind(a){const c=C(a.clientId);return "Ciao "+firstName(c)+", ti aspetto "+ndl(a.date)+" alle "+(a.time||"").slice(0,5)+" per le unghie. A domani!"}
function msgRecall(c){return "Ciao "+firstName(c)+", sono passate un po' di settimane dall'ultima volta. Vuoi prenotare per le unghie?"}
function msgDebt(c,b){return "Ciao "+firstName(c)+", ti ricordo i "+euro(b)+" dell'ultima volta. Grazie!"}
function toRecall(){return db.clients.filter(function(c){const lv=last(c.id);if(!lv)return false;const weeks=c.recallWeeks||3;const dt=parseISO(lv.date);dt.setDate(dt.getDate()+weeks*7);if(ymd(dt)>today())return false;return !db.appointments.some(a=>a.clientId===c.id&&a.status==="booked"&&a.date>=today())})}
function startOfWeek(iso){const dt=parseISO(iso);const day=(dt.getDay()+6)%7;dt.setDate(dt.getDate()-day);return ymd(dt)}
function weekDays(iso){const start=parseISO(startOfWeek(iso));const out=[];for(let i=0;i<7;i++){const d=new Date(start);d.setDate(start.getDate()+i);out.push(ymd(d))}return out}
function isLate(a){if(a.status!=="booked"||a.date!==today())return false;const p=(a.time||"00:00").split(":");const t=new Date();t.setHours(+p[0]||0,(+p[1]||0)+10,0,0);return new Date()>t}
function initial(c){return ((c&&c.name)||"?").trim().charAt(0).toUpperCase()}
function setCal(v){calView=v;if(tab==="agenda"){document.getElementById("subtitle").textContent=v==="month"?"Mese":"Settimana";render()}}
function shiftM(k){const dt=parseISO(selectedDate||today());dt.setMonth(dt.getMonth()+k);selectedDate=ymd(dt);render()}
function minToTime(m){const h=Math.floor(m/60)%24,min=m%60;return pad(h)+":"+pad(min)}
function fmtDuration(m){m=Math.round(m);if(m<60)return m+" min liberi";const h=Math.floor(m/60),rem=m%60;if(rem===0)return h===1?"1 ora libera":h+" ore libere";return h+"h "+rem+"m libere"}
function scrollToDay(iso){selectedDate=iso;const el=document.getElementById("day-"+iso);if(el)el.scrollIntoView({behavior:"smooth",block:"start"})}
function scrollToToday(){const el=document.getElementById("day-"+today())||document.getElementById("day-today");if(!el)return;el.scrollIntoView({behavior:"smooth",block:"start"})}
function goToday(){selectedDate=today();render();setTimeout(scrollToToday,80)}
function markReminded(id){const a=db.appointments.find(x=>x.id===id);if(!a)return;a.reminded=true;save();render()}
function I(name,sz,cls){
  sz=sz||20;
  const s='width="'+sz+'" height="'+sz+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="svg-ico '+(cls||'')+'"';
  if(name==="phone") return '<svg '+s+'><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>';
  if(name==="wa") return '<svg width="'+sz+'" height="'+sz+'" viewBox="0 0 24 24" fill="currentColor" class="svg-ico '+(cls||'')+'" style="color:#25D366"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24m4.52 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.03-1.25-.75-.67-1.26-1.5-1.41-1.75-.14-.25-.02-.39.11-.51.11-.11.25-.29.38-.44.12-.14.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.34-.76-1.84-.2-.49-.4-.42-.56-.43h-.47c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.13.17 1.77 2.71 4.3 3.8 2.52 1.09 2.52.73 2.98.69.45-.05 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18-.06-.1-.23-.16-.48-.28"/></svg>';
  if(name==="cal") return '<svg '+s+'><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/><circle cx="12" cy="14" r="2"/></svg>';
  if(name==="grid") return '<svg '+s+'><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg>';
  if(name==="users") return '<svg '+s+'><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>';
  if(name==="wallet") return '<svg '+s+'><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/></svg>';
  if(name==="plus") return '<svg '+s+'><path d="M5 12h14"/><path d="M12 5v14"/></svg>';
  if(name==="check") return '<svg '+s+'><polyline points="20 6 9 17 4 12"/></svg>';
  if(name==="clock") return '<svg '+s+'><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>';
  if(name==="left") return '<svg '+s+'><path d="m15 18-6-6 6-6"/></svg>';
  if(name==="right") return '<svg '+s+'><path d="m9 18 6-6-6-6"/></svg>';
  if(name==="trash") return '<svg '+s+'><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>';
  if(name==="edit") return '<svg '+s+'><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>';
  if(name==="backup") return '<svg '+s+'><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="3" y2="15"/></svg>';
  if(name==="restore") return '<svg '+s+'><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>';
  return "";
}
function go(t){
  tab=t;
  document.querySelectorAll(".nav button").forEach(function(b){b.classList.toggle("active",b.dataset.tab===t)});
  const n=db.clients.length;
  const T={oggi:["Oggi",ndl(today())],agenda:["Agenda",calView==="month"?"Mese":"Settimana"],clienti:["Clienti",n+(n===1?" scheda":" schede")],soldi:["Soldi","Incassi, spese e bilancio"]};
  document.getElementById("title").textContent=T[t][0];
  document.getElementById("subtitle").textContent=T[t][1];
  const fab=document.getElementById("fab");
  fab.classList.remove("hidden");
  if(t==="clienti") fab.innerHTML=I("plus",16)+" Cliente";
  else if(t==="soldi") fab.innerHTML=I("plus",16)+" Spesa";
  else fab.innerHTML=I("plus",16)+" Prenota";
  document.getElementById("clientSearch").classList.toggle("hidden",t!=="clienti");
  document.getElementById("filters").classList.toggle("hidden",t!=="clienti");
  if(t==="clienti") drawFilters();
  render();
}
function render(){const el=document.getElementById("app");if(tab==="oggi")el.innerHTML=vToday();if(tab==="agenda")el.innerHTML=vAgenda();if(tab==="clienti")el.innerHTML=vClients();if(tab==="soldi")el.innerHTML=vMoney()}
function openNew(){if(tab==="clienti")formClient();else if(tab==="soldi")formExpense();else formApt()}
function markDonePaid(id){const a=db.appointments.find(x=>x.id===id);if(!a)return;a.status="done";a.paid=+a.price||0;save();closeModal();render()}
function shiftApt(id,min){const a=db.appointments.find(x=>x.id===id);if(!a)return;const p=(a.time||"10:00").split(":");const dt=new Date();dt.setHours(+p[0]||10,+p[1]||0,0,0);dt.setMinutes(dt.getMinutes()+min);a.time=pad(dt.getHours())+":"+pad(dt.getMinutes());save();render()}
function cancelApt(id){if(!confirm("Annullare questo appuntamento?"))return;const a=db.appointments.find(x=>x.id===id);if(!a)return;a.status="cancelled";save();closeModal();render()}
function payOff(id){const c=C(id),b=bal(id);if(!confirm("Confermi di aver incassato "+euro(b)+" da "+(c?c.name:"questa cliente")+"?"))return;db.appointments.forEach(function(a){if(a.clientId===id&&a.status==="done")a.paid=+a.price||0});save();closeModal();render();toast("Incasso registrato!")}
function pickDay(iso){selectedDate=iso;if(tab!=="agenda")go("agenda");else render()}
function pickClient(id){formApt();setTimeout(function(){const s=document.getElementById("f_c");if(s)s.value=id},0)}
function newAt(iso,time){selectedDate=iso;formApt(null,time)}
function fillService(){const s=S(document.getElementById("f_s").value);if(!s)return;document.getElementById("f_p").value=s.price;document.getElementById("f_min").value=s.minutes}
function shiftMoneyM(k){
  const p=moneyMonth.split("-");
  const dt=new Date(+p[0],(+p[1]||1)-1+k,1);
  moneyMonth=dt.getFullYear()+"-"+pad(dt.getMonth()+1);
  render();
}
function goMoneyThisMonth(){
  moneyMonth=today().slice(0,7);
  render();
}
function delExpense(id){
  const x=(db.expenses||[]).find(e=>e.id===id);
  if(!x)return;
  const desc=x.desc||expenseCatName(x.category);
  if(!confirm("Cancellare la spesa di "+euro(x.amount)+" ("+desc+")?"))return;
  db.expenses=(db.expenses||[]).filter(e=>e.id!==id);
  save();
  closeModal();
  render();
  toast("Spesa eliminata.");
}
function expenseCatName(cat){
  if(cat==="materiali")return "Gel e Smalti";
  if(cat==="attrezzatura")return "Attrezzatura e Frese";
  if(cat==="varie")return "Monouso e Varie";
  return "Altro";
}
function expenseCatIcon(cat){
  if(cat==="materiali")return "💅";
  if(cat==="attrezzatura")return "🔌";
  if(cat==="varie")return "📦";
  return "🧾";
}
