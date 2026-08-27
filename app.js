const KEY="unghie-mamma-v1";
const SV=[
 {id:"ricostruzione",name:"Ricostruzione",minutes:90,price:40},
 {id:"refill",name:"Rifatto / refill",minutes:60,price:30},
 {id:"semiperm",name:"Smalto semipermanente",minutes:50,price:25},
 {id:"nailart",name:"Decorazione extra",minutes:30,price:10},
 {id:"rimozione",name:"Togliere unghie",minutes:30,price:15},
 {id:"pedicure",name:"Piedi",minutes:60,price:30}
];
let db,tab="oggi",selectedDate,q="";
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,6)}
function today(){const d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")}
function load(){try{db=Object.assign({clients:[],appointments:[],services:SV},JSON.parse(localStorage.getItem(KEY)||"{}"))}catch(e){db={clients:[],appointments:[],services:SV}}
if(!db.services||!db.services.length)db.services=SV.slice()}
function save(){try{localStorage.setItem(KEY,JSON.stringify(db))}catch(e){alert("Salvataggio non riuscito")}}
function euro(n){return(Number(n)||0).toLocaleString("it-IT",{style:"currency",currency:"EUR"})}
function esc(s){return String(s||"").replace(/[&<>"]/g,function(ch){return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[ch]})}
function C(id){return db.clients.find(x=>x.id===id)}
function S(id){return (db.services||[]).find(x=>x.id===id)}
function apts(date){return db.appointments.filter(a=>a.date===date&&a.status!=="deleted").sort((a,b)=>(a.time||"").localeCompare(b.time||""))}
function bal(id){return db.appointments.filter(a=>a.clientId===id&&a.status==="done").reduce((s,a)=>s+(+a.price||0)-(+a.paid||0),0)}
function last(id){return db.appointments.filter(a=>a.clientId===id&&a.status==="done").sort((a,b)=>b.date.localeCompare(a.date))[0]}
function nd(iso){if(!iso)return"";const p=iso.split("-");return new Date(+p[0],+p[1]-1,+p[2]).toLocaleDateString("it-IT",{weekday:"short",day:"numeric",month:"short"})}
function ndl(iso){const p=iso.split("-");return new Date(+p[0],+p[1]-1,+p[2]).toLocaleDateString("it-IT",{weekday:"long",day:"numeric",month:"long"})}
function openModal(h){document.getElementById("modal").innerHTML='<div class="handle"></div>'+h;document.getElementById("modalBg").classList.add("show")}
function closeModal(){document.getElementById("modalBg").classList.remove("show")}
function phoneDigits(p){return String(p||"").replace(/\D/g,"")}
function waNum(p){const d=phoneDigits(p);if(!d)return"";return d.length<=10?"39"+d:d}
function waLink(phone,text){const n=waNum(phone);if(!n)return"";return "https://wa.me/"+n+"?text="+encodeURIComponent(text)}
function msgRemind(a){const c=C(a.clientId);const nome=c?c.name.split(" ")[0]:"tesoro";return "Ciao "+nome+", ti aspetto "+ndl(a.date)+" alle "+(a.time||"").slice(0,5)+" per le unghie"}
function msgRecall(c){const nome=(c.name||"tesoro").split(" ")[0];return "Ciao "+nome+", sono passate un po' di settimane dall'ultima volta. Vuoi prenotare per le unghie?"}
function toRecall(){return db.clients.filter(function(c){const lv=last(c.id);if(!lv)return false;const weeks=c.recallWeeks||3;const dt=new Date(lv.date+"T12:00:00");dt.setDate(dt.getDate()+weeks*7);const y=dt.getFullYear(),m=String(dt.getMonth()+1).padStart(2,"0"),d=String(dt.getDate()).padStart(2,"0");const due=y+"-"+m+"-"+d;if(due>today())return false;const future=db.appointments.some(a=>a.clientId===c.id&&a.status==="booked"&&a.date>=today());return !future})}
function go(t){tab=t;document.querySelectorAll(".nav button").forEach(b=>b.classList.toggle("active",b.dataset.tab===t));
const T={oggi:["Oggi",ndl(today())],agenda:["Agenda","Scegli un giorno"],clienti:["Clienti",db.clients.length+" schede"],soldi:["Soldi","Incassi e crediti"]};
document.getElementById("title").textContent=T[t][0];document.getElementById("subtitle").textContent=T[t][1];
document.getElementById("fab").classList.toggle("hidden",t==="soldi");
document.getElementById("clientSearch").classList.toggle("hidden",t!=="clienti");render()}
function render(){const el=document.getElementById("app");if(tab==="oggi")el.innerHTML=vToday();if(tab==="agenda")el.innerHTML=vAgenda();if(tab==="clienti")el.innerHTML=vClients();if(tab==="soldi")el.innerHTML=vMoney()}
function openNew(){if(tab==="clienti")formClient();else formApt()}
function markDonePaid(id){const a=db.appointments.find(x=>x.id===id);if(!a)return;a.status="done";a.paid=+a.price||0;save();render()}
