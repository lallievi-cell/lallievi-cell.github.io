function card(a,opts){
  opts=opts||{};
  const c=C(a.clientId),s=S(a.serviceId),due=(+a.price||0)-(+a.paid||0);
  const st=a.status==="done"?"Fatta":a.status==="cancelled"?"Annullata":"Deve venire";
  const wa=c?waLink(c.phone,msgRemind(a)):"";
  const id=a.id;
  const late=isLate(a);
  let actions="";
  if(opts.today && a.status==="booked"){
    actions="<div class='actions'><button type='button' class='btn btn-ok btn-sm' onclick='markDonePaid(\""+id+"\")'>Fatto e pagato</button>";
    if(wa) actions+="<a class='btn btn-soft btn-sm' href='"+wa+"'>WhatsApp</a>";
    else actions+="<button type='button' class='btn btn-ghost btn-sm' onclick='openApt(\""+id+"\")'>Apri</button>";
    actions+="</div><div class='actions'><button type='button' class='btn btn-ghost btn-sm' onclick='shiftApt(\""+id+"\",15)'>+15 min</button><button type='button' class='btn btn-bad btn-sm' onclick='cancelApt(\""+id+"\")'>Annulla</button></div>";
  }
  return "<div class='card"+(opts.now?" now":"")+"'>"+(late?"<div class='chip late' style='margin-bottom:8px'>Sta aspettando</div>":"")+"<div class='apt' onclick='openApt(\""+id+"\")'><div class='timebox'>"+esc((a.time||"--:--").slice(0,5))+"<small>"+(s?s.minutes+" min":"")+"</small></div><div style='flex:1'><div class='name'>"+esc(c?c.name:"Cliente")+"</div><div class='muted'>"+esc(s?s.name:"Servizio")+"</div><div style='margin-top:8px;display:flex;gap:6px;flex-wrap:wrap'><span class='chip'>"+st+"</span><span class='chip "+(due>0.01?"debt":"paid")+"'>"+(due>0.01?"Deve "+euro(due):euro(a.price||0))+"</span></div></div></div>"+actions+"</div>";
}
function vToday(){
  const list=apts(today());
  const next=list.filter(a=>a.status==="booked");
  const done=list.filter(a=>a.status==="done");
  const recall=toRecall();
  let html="";
  if(next.length){
    html+=card(next[0],{today:1,now:1});
    html+=next.slice(1).map(function(a){return card(a,{today:1})}).join("");
  } else {
    html+="<div class='card empty'><div class='big'>💅</div><p>Nessun appuntamento oggi.</p><p class='tiny' style='margin-top:8px'>Tocca + Appuntamento per aggiungerne uno.</p></div>";
  }
  if(done.length) html+="<p class='muted' style='margin:8px 4px'>Gia fatte</p>"+done.map(function(a){return card(a)}).join("");
  if(recall.length){
    const show=recall.slice(0,3);
    html+="<div class='card'><h3>Da richiamare</h3>";
    show.forEach(function(c){
      const lv=last(c.id);const wa=waLink(c.phone,msgRecall(c));
      html+="<div class='list-item'><div class='name'>"+esc(c.name)+"</div><div class='tiny'>ultima volta "+nd(lv.date)+"</div><div class='actions' style='margin-top:10px'>";
      if(wa) html+="<a class='btn btn-soft btn-sm' href='"+wa+"'>WhatsApp</a>";
      html+="<button type='button' class='btn btn-ghost btn-sm' onclick='pickClient(\""+c.id+"\")'>Prenota</button></div></div>";
    });
    if(recall.length>3) html+="<button type='button' class='btn btn-ghost' style='width:100%;margin-top:8px' onclick='cFilter=\"recall\";go(\"clienti\")'>Vedi tutte ("+recall.length+")</button>";
    html+="</div>";
  }
  return html;
}
function vAgenda(){
  if(!selectedDate) selectedDate=today();
  const days=weekDays(selectedDate);
  const start=parseISO(days[0]);
  const end=parseISO(days[6]);
  const label=start.toLocaleDateString("it-IT",{day:"numeric",month:"short"})+" – "+end.toLocaleDateString("it-IT",{day:"numeric",month:"short"});
  let html="<div class='card'><div class='week-nav'><button type='button' class='btn btn-ghost btn-sm' onclick='shiftW(-1)'>←</button><strong style='flex:1;text-align:center'>"+label+"</strong><button type='button' class='btn btn-ghost btn-sm' onclick='shiftW(1)'>→</button></div></div>";
  const hours=["09:00","10:00","11:00","12:00","14:00","15:00","16:00","17:00","18:00"];
  days.forEach(function(iso){
    const list=allApts(iso);
    const isTod=iso===today();
    html+="<div class='card daycard"+(isTod?" now":"")+"'><div class='row'><div class='name' style='text-transform:capitalize'>"+nd(iso)+"</div>"+(list.length?"<span class='chip'>"+list.length+"</span>":"<span class='tiny'>Libero</span>")+"</div>";
    hours.forEach(function(hh){
      const found=list.find(a=>(a.time||"").slice(0,5)===hh);
      if(found){
        const c=C(found.clientId);
        html+="<div class='slot' onclick='openApt(\""+found.id+"\")'><span>"+hh+" · "+esc(c?c.name:"Cliente")+"</span><span class='tiny'>"+(found.status==="done"?"Fatta":found.status==="cancelled"?"Annullata":"")+"</span></div>";
      } else {
        html+="<div class='slot empty' onclick='newAt(\""+iso+"\",\""+hh+"\")'>"+hh+" · libero</div>";
      }
    });
    html+="<button type='button' class='btn btn-soft btn-sm' style='width:100%;margin-top:8px' onclick='newAt(\""+iso+"\",\"10:00\")'>+ In questo giorno</button></div>";
  });
  return html;
}
function shiftW(k){const dt=parseISO(startOfWeek(selectedDate||today()));dt.setDate(dt.getDate()+k*7);selectedDate=ymd(dt);render()}
function drawFilters(){
  const el=document.getElementById("filters");
  const rec=toRecall().length, debt=db.clients.filter(c=>bal(c.id)>0.01).length;
  el.innerHTML="<button type='button' class='"+(cFilter==="all"?"on":"")+"' onclick='cFilter=\"all\";drawFilters();render()'>Tutte</button>"+
    "<button type='button' class='"+(cFilter==="recall"?"on":"")+"' onclick='cFilter=\"recall\";drawFilters();render()'>Da richiamare"+(rec?" · "+rec:"")+"</button>"+
    "<button type='button' class='"+(cFilter==="debt"?"on":"")+"' onclick='cFilter=\"debt\";drawFilters();render()'>Mi devono"+(debt?" · "+debt:"")+"</button>";
}
function vClients(){
  let list=db.clients.slice().sort(function(a,b){return a.name.localeCompare(b.name,"it")});
  if(q) list=list.filter(c=>(c.name||"").toLowerCase().includes(q)||(c.phone||"").includes(q));
  if(cFilter==="recall"){const ids=toRecall().map(c=>c.id);list=list.filter(c=>ids.indexOf(c.id)>=0)}
  if(cFilter==="debt") list=list.filter(c=>bal(c.id)>0.01);
  if(!list.length) return "<div class='card empty'><div class='big'>👩</div><p>"+(db.clients.length?"Nessun risultato.":"Nessuna cliente ancora.")+"</p></div>";
  return list.map(function(c){
    const b=bal(c.id),lv=last(c.id);
    const line=(lv?weeksAgo(lv.date):"mai venuta")+(b>0.01?" · deve "+euro(b):"");
    const av=c.photo?"<img class='avatar' src='"+c.photo+"' alt=''>":"<div class='avatar'>"+esc(initial(c))+"</div>";
    return "<div class='card' onclick='openClient(\""+c.id+"\")'><div class='row' style='justify-content:flex-start;gap:12px'>"+av+"<div style='flex:1'><div class='name'>"+esc(c.name)+"</div><div class='muted'>"+line+"</div>"+(c.phone?"":"<div class='warn tiny'>Manca il numero</div>")+"</div>"+(b>0.01?"<span class='chip debt'>"+euro(b)+"</span>":"")+"</div></div>";
  }).join("");
}
function mondayISO(){return startOfWeek(today())}
function vMoney(){
  const done=db.appointments.filter(a=>a.status==="done");
  const weekStart=mondayISO();
  const todayPaid=done.filter(a=>a.date===today()).reduce(function(s,a){return s+(+a.paid||0)},0);
  const weekPaid=done.filter(a=>a.date>=weekStart&&a.date<=today()).reduce(function(s,a){return s+(+a.paid||0)},0);
  const mo=today().slice(0,7);
  const monthPaid=done.filter(a=>(a.date||"").startsWith(mo)).reduce(function(s,a){return s+(+a.paid||0)},0);
  const cred=db.clients.map(function(c){return {c:c,b:bal(c.id)}}).filter(x=>x.b>0.01);
  const monthList=done.filter(a=>(a.date||"").startsWith(mo)).sort(function(a,b){return (b.date+b.time).localeCompare(a.date+a.time)}).slice(0,12);
  let debts="<p class='muted' style='margin-top:8px'>Nessuna cliente deve soldi.</p>";
  if(cred.length){
    debts=cred.map(function(x){
      const wa=waLink(x.c.phone,msgDebt(x.c,x.b));
      return "<div class='list-item'><div class='row'><div class='name'>"+esc(x.c.name)+"</div><span class='chip debt'>"+euro(x.b)+"</span></div><div class='actions'><button type='button' class='btn btn-ok btn-sm' onclick='payOff(\""+x.c.id+"\")'>Segna pagato</button>"+(wa?"<a class='btn btn-soft btn-sm' href='"+wa+"'>WhatsApp</a>":"<button type='button' class='btn btn-ghost btn-sm' onclick='openClient(\""+x.c.id+"\")'>Apri</button>")+"</div></div>";
    }).join("");
  }
  let mov="";
  if(monthList.length){
    mov=monthList.map(function(a){
      const c=C(a.clientId);const s=S(a.serviceId);
      return "<div class='list-item' onclick='openApt(\""+a.id+"\")'><div class='row'><div><div class='name'>"+esc(c?c.name:"Cliente")+"</div><div class='tiny'>"+nd(a.date)+" · "+esc(s?s.name:"")+"</div></div><strong>"+euro(a.paid||0)+"</strong></div></div>";
    }).join("");
  }
  const lastB=localStorage.getItem(BKEY);
  return "<div class='card'><div class='muted'>Oggi</div><div class='money' style='font-size:36px'>"+euro(todayPaid)+"</div></div>"+
    "<div class='card'><div class='muted'>Questa settimana</div><div class='money' style='font-size:32px'>"+euro(weekPaid)+"</div></div>"+
    "<div class='card'><div class='muted'>Questo mese</div><div class='money' style='font-size:32px'>"+euro(monthPaid)+"</div></div>"+
    "<div class='card'><h3>Mi devono</h3>"+debts+"</div>"+
    "<div class='card'><h3>Di chi e</h3>"+(mov||"<p class='muted'>Nessun incasso questo mese.</p>")+"</div>"+
    "<div class='card'><h3>Copia di sicurezza</h3><p class='tiny' style='margin-bottom:10px'>"+(lastB?"Ultima copia: "+lastB:"Non hai ancora salvato una copia")+"</p><div class='grid2'><button type='button' class='btn btn-soft' onclick='exp()'>Salva copia sul telefono</button><button type='button' class='btn btn-ghost' onclick='document.getElementById(\"imp\").click()'>Rimetti la copia</button></div><input id='imp' type='file' accept='application/json' class='hidden' onchange='imp(event)'></div>";
}
