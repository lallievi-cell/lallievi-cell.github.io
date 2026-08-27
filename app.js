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
let db,tab="oggi",selectedDate,q="",cFilter="all",calView="week";
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,6)}
function pad(n){return String(n).padStart(2,"0")}
function ymd(d){return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate())}
function today(){return ymd(new Date())}
function parseISO(iso){const p=(iso||"").split("-");return new Date(+p[0],(+p[1]||1)-1,+p[2]||1)}
function load(){try{db=Object.assign({clients:[],appointments:[],services:SV},JSON.parse(localStorage.getItem(KEY)||"{}"))}catch(e){db={clients:[],appointments:[],services:SV}}
if(!db.services||!db.services.length)db.services=SV.slice()}
function save(){try{localStorage.setItem(KEY,JSON.stringify(db));toast("Salvato.")}catch(e){alert("Salvataggio non riuscito")}}
function toast(msg){const el=document.getElementById("toast");if(!el)return;el.textContent=msg||"Salvato.";el.classList.add("show");clearTimeout(toast.t);toast.t=setTimeout(function(){el.classList.remove("show")},1400)}
function euro(n){return(Number(n)||0).toLocaleString("it-IT",{style:"currency",currency:"EUR"})}
function esc(s){return String(s||"").replace(/[&<>"]/g,function(ch){return "&#"+ch.charCodeAt(0)+";"})}
function C(id){return db.clients.find(x=>x.id===id)}
function S(id){return (db.services||[]).find(x=>x.id===id)}
function mins(a){if(a&&+a.minutes)return +a.minutes;const s=S(a&&a.serviceId);return (s&&s.minutes)||60}
function toMin(t){const p=String(t||"0:0").split(":");return (+p[0]||0)*60+(+p[1]||0)}
function slotApt(list,hh){const slot=toMin(hh);return list.find(function(a){if(a.status==="cancelled")return false;const start=toMin(a.time);return slot>=start&&slot<start+mins(a)})}
function overlaps(date,time,minutes,exceptId){const start=toMin(time),end=start+(+minutes||60);return db.appointments.some(function(a){if(a.id===exceptId||a.date!==date||a.status==="cancelled"||a.status==="deleted")return false;const s=toMin(a.time),e=s+mins(a);return start<e&&end>s})}
function apts(date){return db.appointments.filter(a=>a.date===date&&a.status!=="deleted"&&a.status!=="cancelled").sort((a,b)=>(a.time||"").localeCompare(b.time||""))}
function allApts(date){return db.appointments.filter(a=>a.date===date&&a.status!=="deleted").sort((a,b)=>(a.time||"").localeCompare(b.time||""))}
function bal(id){return db.appointments.filter(a=>a.clientId===id&&a.status==="done").reduce((s,a)=>s+(+a.price||0)-(+a.paid||0),0)}
function last(id){return db.appointments.filter(a=>a.clientId===id&&a.status==="done").sort((a,b)=>b.date.localeCompare(a.date))[0]}
function nd(iso){if(!iso)return"";return parseISO(iso).toLocaleDateString("it-IT",{weekday:"short",day:"numeric",month:"short"})}
function ndl(iso){return parseISO(iso).toLocaleDateString("it-IT",{weekday:"long",day:"numeric",month:"long"})}
function weeksAgo(iso){const d=Math.round((parseISO(today())-parseISO(iso))/86400000);if(d<=0)return "oggi";if(d<7)return d+" gg fa";return Math.floor(d/7)+" sett. fa"}
function openModal(h){document.getElementById("modal").innerHTML="<div class='handle'></div>"+h;document.getElementById("modalBg").classList.add("show")}
function closeModal(){document.getElementById("modalBg").classList.remove("show")}
function phoneDigits(p){return String(p||"").replace(/\D/g,"")}
function waNum(p){const d=phoneDigits(p);if(!d)return"";return d.length<=10?"39"+d:d}
function waLink(phone,text){const n=waNum(phone);if(!n)return"";return "https://wa.me/"+n+"?text="+encodeURIComponent(text)}
function firstName(c){return ((c&&c.name)||"tesoro").split(" ")[0]}
function msgRemind(a){const c=C(a.clientId);return "Ciao "+firstName(c)+", ti aspetto "+ndl(a.date)+" alle "+(a.time||"").slice(0,5)+" per le unghie"}
function msgRecall(c){return "Ciao "+firstName(c)+", sono passate un po' di settimane dall'ultima volta. Vuoi prenotare per le unghie?"}
function msgDebt(c,b){return "Ciao "+firstName(c)+", ti ricordo i "+euro(b)+" dell'ultima volta. Grazie!"}
function toRecall(){return db.clients.filter(function(c){const lv=last(c.id);if(!lv)return false;const weeks=c.recallWeeks||3;const dt=parseISO(lv.date);dt.setDate(dt.getDate()+weeks*7);if(ymd(dt)>today())return false;return !db.appointments.some(a=>a.clientId===c.id&&a.status==="booked"&&a.date>=today())})}
function startOfWeek(iso){const dt=parseISO(iso);const day=(dt.getDay()+6)%7;dt.setDate(dt.getDate()-day);return ymd(dt)}
function weekDays(iso){const start=parseISO(startOfWeek(iso));const out=[];for(let i=0;i<7;i++){const d=new Date(start);d.setDate(start.getDate()+i);out.push(ymd(d))}return out}
function isLate(a){if(a.status!=="booked"||a.date!==today())return false;const p=(a.time||"00:00").split(":");const t=new Date();t.setHours(+p[0]||0,(+p[1]||0)+10,0,0);return new Date()>t}
function initial(c){return ((c&&c.name)||"?").trim().charAt(0).toUpperCase()}
function setCal(v){calView=v;if(tab==="agenda"){document.getElementById("subtitle").textContent=v==="month"?"Mese":"Settimana";render()}}
function shiftM(k){const dt=parseISO(selectedDate||today());dt.setMonth(dt.getMonth()+k);selectedDate=ymd(dt);render()}
function go(t){
  tab=t;
  document.querySelectorAll(".nav button").forEach(function(b){b.classList.toggle("active",b.dataset.tab===t)});
  const n=db.clients.length;
  const T={oggi:["Oggi",ndl(today())],agenda:["Agenda",calView==="month"?"Mese":"Settimana"],clienti:["Clienti",n+(n===1?" scheda":" schede")],soldi:["Soldi","Incassi e crediti"]};
  document.getElementById("title").textContent=T[t][0];
  document.getElementById("subtitle").textContent=T[t][1];
  const fab=document.getElementById("fab");
  fab.classList.toggle("hidden",t==="soldi");
  fab.textContent=t==="clienti"?"+ Cliente":"+ Prenota";
  document.getElementById("clientSearch").classList.toggle("hidden",t!=="clienti");
  document.getElementById("filters").classList.toggle("hidden",t!=="clienti");
  if(t==="clienti") drawFilters();
  render();
}
function render(){const el=document.getElementById("app");if(tab==="oggi")el.innerHTML=vToday();if(tab==="agenda")el.innerHTML=vAgenda();if(tab==="clienti")el.innerHTML=vClients();if(tab==="soldi")el.innerHTML=vMoney()}
function openNew(){if(tab==="clienti")formClient();else formApt()}
function markDonePaid(id){const a=db.appointments.find(x=>x.id===id);if(!a)return;a.status="done";a.paid=+a.price||0;save();closeModal();render()}
function shiftApt(id,min){const a=db.appointments.find(x=>x.id===id);if(!a)return;const p=(a.time||"10:00").split(":");const dt=new Date();dt.setHours(+p[0]||10,+p[1]||0,0,0);dt.setMinutes(dt.getMinutes()+min);a.time=pad(dt.getHours())+":"+pad(dt.getMinutes());save();render()}
function cancelApt(id){if(!confirm("Annullare questo appuntamento?"))return;const a=db.appointments.find(x=>x.id===id);if(!a)return;a.status="cancelled";save();closeModal();render()}
function payOff(id){db.appointments.forEach(function(a){if(a.clientId===id&&a.status==="done")a.paid=+a.price||0});save();closeModal();render()}
function pickDay(iso){selectedDate=iso;if(tab!=="agenda")go("agenda");else render()}
function pickClient(id){formApt();setTimeout(function(){const s=document.getElementById("f_c");if(s)s.value=id},0)}
function newAt(iso,time){selectedDate=iso;formApt(null,time)}
function fillService(){const s=S(document.getElementById("f_s").value);if(!s)return;document.getElementById("f_p").value=s.price;document.getElementById("f_min").value=s.minutes}
