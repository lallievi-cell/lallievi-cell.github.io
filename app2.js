function card(a,opts){
  opts=opts||{};
  const c=C(a.clientId),s=S(a.serviceId),due=(+a.price||0)-(+a.paid||0);
  const st=a.status==="done"?"Fatta":a.status==="cancelled"?"Annullata":"Deve venire";
  const wa=c?waLink(c.phone,msgRemind(a)):"";
  let actions="";
  if(opts.today && a.status==="booked"){
    actions='<div class="actions">'+
      '<button type="button" class="btn btn-ok btn-sm" onclick="event.stopPropagation();markDonePaid(\''+a.id+'\')">Fatto e pagato</button>'+
      (wa?'<a class="btn btn-soft btn-sm" href="'+wa+'" onclick="event.stopPropagation()">WhatsApp</a>':'<button type="button" class="btn btn-ghost btn-sm" onclick="event.stopPropagation();openApt(\''+a.id+'\')">Apri</button>')+
    '</div>';
  }
  return '<div class="card"><div class="apt" onclick="openApt(\''+a.id+'\')"><div class="timebox">'+esc((a.time||"--:--").slice(0,5))+'<small>'+(s?s.minutes+" min":"")+'</small></div><div style="flex:1"><div class="name">'+esc(c?c.name:"Cliente")+'</div><div class="muted">'+esc(s?s.name:"Servizio")+'</div><div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap"><span class="chip">'+st+'</span><span class="chip '+(due>0.01?"debt":"paid")+'">'+(due>0.01?"Deve "+euro(due):euro(a.price||0))+'</span></div></div></div>'+actions+'</div>';
}
function vToday(){
  const list=apts(today()).filter(a=>a.status!=="cancelled");
  const recall=toRecall();
  let html="";
  if(recall.length){
    html+='<div class="card"><h3>Da richiamare</h3>'+recall.map(function(c){
      const lv=last(c.id);const wa=waLink(c.phone,msgRecall(c));
      return '<div class="list-item"><div class="row"><div><div class="name">'+esc(c.name)+'</div><div class="tiny">ultima volta '+nd(lv.date)+'</div></div></div>'+
        '<div class="actions" style="margin-top:10px">'+(wa?'<a class="btn btn-soft btn-sm" href="'+wa+'">WhatsApp</a>':'')+
        '<button type="button" class="btn btn-ghost btn-sm" onclick="formApt();setTimeout(function(){var s=document.getElementById(\'f_c\');if(s)s.value=\''+c.id+'\'},0)">Prenota</button></div></div>';
    }).join("")+"</div>";
  }
  if(!list.length) return html+'<div class="card empty"><div class="big">💅</div><p>Nessun appuntamento oggi.</p><p class="tiny" style="margin-top:8px">Tocca + per aggiungerne uno.</p></div>';
  const next=list.filter(a=>a.status==="booked"),done=list.filter(a=>a.status==="done");
  return html+next.map(a=>card(a,{today:1})).join("")+(done.length?'<p class="muted" style="margin:8px 4px">Gia fatte</p>'+done.map(a=>card(a)).join(""):"");
}
function vAgenda(){
  const p=selectedDate.split("-").map(Number);const y=p[0],m=p[1];
  const first=new Date(y,m-1,1),start=(first.getDay()+6)%7,dim=new Date(y,m,0).getDate();
  let cells="";
  for(let i=0;i<start;i++)cells+="<div></div>";
  for(let d=1;d<=dim;d++){
    const iso=y+"-"+String(m).padStart(2,"0")+"-"+String(d).padStart(2,"0");
    const cls=["day",iso===selectedDate?"sel":"",apts(iso).some(a=>a.status!=="cancelled")?"has":"",iso===today()?"today":""].join(" ");
    cells+='<button type="button" class="'+cls+'" onclick="selectedDate=\''+iso+'\';render()">'+d+"</button>";
  }
  const list=apts(selectedDate);
  return '<div class="card"><div class="row" style="margin-bottom:10px"><button type="button" class="btn btn-ghost btn-sm" onclick="shiftM(-1)">←</button><strong style="text-transform:capitalize">'+first.toLocaleDateString("it-IT",{month:"long",year:"numeric"})+'</strong><button type="button" class="btn btn-ghost btn-sm" onclick="shiftM(1)">→</button></div><div class="cal-grid">'+["L","M","M","G","V","S","D"].map(x=>'<div class="dow">'+x+"</div>").join("")+cells+"</div></div><p class=\"muted\" style=\"margin:4px 4px 10px;text-transform:capitalize\">"+ndl(selectedDate)+"</p>"+(list.length?list.map(a=>card(a)).join(""):'<div class="card empty"><p>Nessun appuntamento.</p></div>');
}
function shiftM(k){const p=selectedDate.split("-").map(Number);const dt=new Date(p[0],p[1]-1+k,1);selectedDate=dt.getFullYear()+"-"+String(dt.getMonth()+1).padStart(2,"0")+"-01";render()}
function vClients(){
  const list=db.clients.filter(c=>!q||(c.name||"").toLowerCase().includes(q)||(c.phone||"").includes(q)).sort((a,b)=>a.name.localeCompare(b.name,"it"));
  if(!list.length)return '<div class="card empty"><div class="big">👩</div><p>'+(db.clients.length?"Nessun risultato.":"Nessuna cliente ancora.")+"</p></div>";
  return list.map(function(c){const b=bal(c.id),lv=last(c.id);return '<div class="card" onclick="openClient(\''+c.id+'\')"><div class="row"><div><div class="name">'+esc(c.name)+'</div><div class="muted">'+esc(c.phone||"Nessun telefono")+" · "+(lv?"ultima "+nd(lv.date):"mai venuta")+'</div></div>'+(b>0.01?'<span class="chip debt">'+euro(b)+"</span>":"")+"</div>"+(c.allergies?'<div class="tiny" style="margin-top:8px;color:var(--bad)">⚠ '+esc(c.allergies)+"</div>":"")+"</div>"}).join("");
}
function vMoney(){
  const mo=today().slice(0,7);
  const done=db.appointments.filter(a=>a.status==="done");
  const todayPaid=done.filter(a=>a.date===today()).reduce((s,a)=>s+(+a.paid||0),0);
  const md=done.filter(a=>(a.date||"").startsWith(mo));
  const inc=md.reduce((s,a)=>s+(+a.paid||0),0);
  const cred=db.clients.map(c=>({c:c,b:bal(c.id)})).filter(x=>x.b>0.01);
  return '<div class="card"><div class="muted">Oggi ho preso</div><div class="money" style="font-size:36px;margin:4px 0">'+euro(todayPaid)+'</div></div><div class="card"><div class="muted">Questo mese</div><div class="money" style="font-size:32px;margin:4px 0">'+euro(inc)+'</div></div><div class="card"><h3>Mi devono</h3>'+(cred.length?cred.map(x=>'<div class="list-item row" onclick="openClient(\''+x.c.id+'\')"><div class="name">'+esc(x.c.name)+'</div><span class="chip debt">'+euro(x.b)+"</span></div>").join(""):'<p class="muted" style="margin-top:8px">Nessuna cliente deve soldi.</p>')+'</div><div class="card"><h3>Copia di sicurezza</h3><div class="grid2"><button type="button" class="btn btn-soft" onclick="exp()">Salva copia</button><button type="button" class="btn btn-ghost" onclick="document.getElementById(\'imp\').click()">Ripristina</button></div><input id="imp" type="file" accept="application/json" class="hidden" onchange="imp(event)"></div>';
}
