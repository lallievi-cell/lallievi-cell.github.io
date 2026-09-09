function formApt(id,time){
  if(!db.clients.length){
    openModal("<h2>Nuovo appuntamento</h2><p style='margin:12px 0'>Prima serve una cliente.</p><button type='button' class='btn btn-primary' onclick='formClient(null,1)'>Aggiungi cliente</button><button type='button' class='btn btn-ghost' style='width:100%;margin-top:8px' onclick='closeModal()'>Chiudi</button>");
    return;
  }
  const a=id?db.appointments.find(x=>x.id===id):{date:tab==="agenda"?selectedDate:today(),time:time||"10:00",status:"booked",paid:0};
  const opts=db.clients.map(function(c){return "<option value='"+c.id+"' "+(c.id===a.clientId?"selected":"")+">"+esc(c.name)+"</option>"}).join("");
  const sopts=(db.services||[]).map(function(s){return "<option value='"+s.id+"' "+(s.id===a.serviceId?"selected":"")+">"+esc(s.name)+" · "+euro(s.price)+" · "+s.minutes+" min</option>"}).join("");
  const price=a.price!=null?a.price:(S(a.serviceId)||db.services[0]).price;
  const minutes=a.minutes!=null?a.minutes:(S(a.serviceId)||db.services[0]).minutes;
  const c=C(a.clientId)||db.clients[0];
  const wa=c?waLink(c.phone,msgRemind(Object.assign({},a,{clientId:c.id}))):"";
  let h="<h2>"+(id?"Appuntamento":"Nuovo appuntamento")+"</h2>";
  h+="<label>Cliente</label><select id='f_c'>"+opts+"</select>";
  h+="<button type='button' class='btn btn-ghost btn-sm' style='margin-top:8px' onclick='formClient(null,1)'>+ Nuova cliente</button>";
  h+="<label>Giorno</label><input id='f_d' type='date' value='"+(a.date||today())+"'>";
  h+="<label>Ora</label><input id='f_t' type='time' value='"+(a.time||"10:00")+"'>";
  h+="<label>Servizio</label><select id='f_s' onchange='fillService()'>"+sopts+"</select>";
  h+="<label>Durata (minuti)</label><input id='f_min' type='number' step='5' min='15' value='"+minutes+"'>";
  h+="<label>Prezzo €</label><input id='f_p' type='number' step='0.5' value='"+price+"'>";
  h+="<label>Gia pagato €</label><input id='f_pay' type='number' step='0.5' value='"+(a.paid||0)+"'>";
  h+="<label>Cosa hai fatto</label><textarea id='f_w'>"+esc(a.work||"")+"</textarea>";
  h+="<label>Stato</label><select id='f_st'><option value='booked' "+(a.status==="booked"?"selected":"")+">Deve venire</option><option value='done' "+(a.status==="done"?"selected":"")+">Fatta</option><option value='cancelled' "+(a.status==="cancelled"?"selected":"")+">Annullata</option></select>";
  if(id&&a.status==="booked") h+="<button type='button' class='btn btn-ok' style='margin-top:16px' onclick='markDonePaid(\""+id+"\")'>"+I("check",18)+" Fatto e pagato</button>";
  if(wa) h+="<a class='btn btn-wa' style='width:100%;margin-top:8px' href='"+wa+"'>"+I("wa",18)+" Scrivi su WhatsApp</a>";
  h+="<button type='button' class='btn btn-primary' style='margin-top:8px' onclick='saveApt(\""+(id||"")+"\")'>"+I("check",18)+" Salva appuntamento</button>";
  if(id) h+="<button type='button' class='btn btn-bad' style='width:100%;margin-top:8px' onclick='delApt(\""+id+"\")'>"+I("trash",18)+" Elimina appuntamento</button>";
  h+="<button type='button' class='btn btn-ghost' style='width:100%;margin-top:8px' onclick='closeModal()'>Chiudi</button>";
  openModal(h);
}
function openApt(id){formApt(id)}
function saveApt(id){
  const clientId=document.getElementById("f_c").value;
  const date=document.getElementById("f_d").value;
  const time=document.getElementById("f_t").value;
  const serviceId=document.getElementById("f_s").value;
  const minutes=+document.getElementById("f_min").value||60;
  const price=+document.getElementById("f_p").value||0;
  const paid=+document.getElementById("f_pay").value||0;
  const work=document.getElementById("f_w").value.trim();
  const status=document.getElementById("f_st").value;
  if(!clientId){alert("Serve una cliente");return}
  if(status!=="cancelled"){
    const ov=findOverlap(date,time,minutes,id);
    if(ov){
      const oc=C(ov.clientId);
      const ovName=oc?oc.name:"un'altra cliente";
      if(!confirm("Attenzione: a quest'ora c'è già "+ovName+" ("+(ov.time||"").slice(0,5)+", "+mins(ov)+" min). Vuoi salvare comunque?")) return;
    }
  }
  const rec={id:id||uid(),clientId,date,time,serviceId,minutes,price,paid,work,status};
  const i=db.appointments.findIndex(a=>a.id===rec.id);
  if(i>=0)db.appointments[i]=rec;else db.appointments.push(rec);
  save();closeModal();render();
}
function delApt(id){if(!confirm("Vuoi cancellare questo appuntamento?"))return;db.appointments=db.appointments.filter(a=>a.id!==id);save();closeModal();render()}
function formClient(id,fromApt){
  const c=id?C(id):{recallWeeks:3};
  let h="<h2>"+(id?"Modifica cliente":"Nuova cliente")+"</h2>";
  h+="<label>Nome</label><input id='c_n' value=\""+esc(c.name||"")+"\">";
  h+="<label>Telefono</label><input id='c_p' inputmode='tel' value=\""+esc(c.phone||"")+"\">";
  h+="<label>Allergie</label><input id='c_a' value=\""+esc(c.allergies||"")+"\">";
  h+="<label>Forma unghie</label><input id='c_shape' placeholder='quadrate, ovali...' value=\""+esc(c.shape||"")+"\">";
  h+="<label>Lunghezza</label><input id='c_len' placeholder='corte, medie...' value=\""+esc(c.length||"")+"\">";
  h+="<label>Colore abituale</label><input id='c_col' value=\""+esc(c.color||"")+"\">";
  h+="<label>Prodotto che le sta bene</label><input id='c_prod' value=\""+esc(c.product||"")+"\">";
  h+="<label>Preferenze</label><textarea id='c_pr'>"+esc(c.prefs||"")+"</textarea>";
  h+="<label>Foto ultima set</label><input id='c_photo' type='file' accept='image/*'>";
  if(c.photo){
    h+="<img class='photo' src='"+c.photo+"' alt='unghie'>";
    h+="<button type='button' class='btn btn-bad btn-sm' style='width:100%;margin-top:6px' onclick='removeClientPhoto(\""+(id||"")+"\")'>Rimuovi foto</button>";
  }
  h+="<label>Richiamo dopo quante settimane</label><input id='c_r' type='number' value='"+(c.recallWeeks||3)+"'>";
  h+="<button type='button' class='btn btn-primary' style='margin-top:16px' onclick='saveClient(\""+(id||"")+"\","+(fromApt?1:0)+")'>"+I("check",18)+" Salva cliente</button>";
  h+="<button type='button' class='btn btn-ghost' style='width:100%;margin-top:8px' onclick='closeModal()'>Annulla</button>";
  openModal(h);
}
function removeClientPhoto(id){
  if(!id)return;
  const c=C(id);
  if(c&&confirm("Vuoi rimuovere la foto da questa scheda?")){
    delete c.photo;
    save();
    formClient(id);
  }
}
function resizePhoto(file,cb){
  const r=new FileReader();
  r.onload=function(){
    const img=new Image();
    img.onload=function(){
      const max=480;let w=img.width,h=img.height;
      if(w>max){h=h*max/w;w=max}
      const cv=document.createElement("canvas");cv.width=w;cv.height=h;
      cv.getContext("2d").drawImage(img,0,0,w,h);
      cb(cv.toDataURL("image/jpeg",0.65));
    };
    img.src=r.result;
  };
  r.readAsDataURL(file);
}
function saveClient(id,fromApt){
  const name=document.getElementById("c_n").value.trim();
  if(!name){alert("Serve il nome");return}
  const rec={id:id||uid(),name:name,phone:document.getElementById("c_p").value.trim(),allergies:document.getElementById("c_a").value.trim(),shape:document.getElementById("c_shape").value.trim(),length:document.getElementById("c_len").value.trim(),color:document.getElementById("c_col").value.trim(),product:document.getElementById("c_prod").value.trim(),prefs:document.getElementById("c_pr").value.trim(),recallWeeks:+document.getElementById("c_r").value||3};
  const old=C(rec.id);
  if(old&&old.photo) rec.photo=old.photo;
  const file=document.getElementById("c_photo").files[0];
  const finish=function(){
    const i=db.clients.findIndex(c=>c.id===rec.id);
    if(i>=0)db.clients[i]=Object.assign({},db.clients[i],rec);else db.clients.push(rec);
    save();
    if(fromApt)formApt();else{go("clienti");openClient(rec.id)}
  };
  if(file) resizePhoto(file,function(data){rec.photo=data;finish()});else finish();
}
function openClient(id){
  const c=C(id);if(!c)return;
  const hist=db.appointments.filter(a=>a.clientId===id).sort((a,b)=>b.date.localeCompare(a.date));
  const b=bal(id);
  const ph=phoneDigits(c.phone);
  const waR=waLink(c.phone,msgRecall(c));
  let h="<h2>"+esc(c.name)+"</h2>";
  h+=c.phone?"<p class='muted'>"+esc(c.phone)+"</p>":"<p class='warn'>Manca il numero</p>";
  if(c.allergies) h+="<p class='warn' style='margin-top:8px'>⚠ "+esc(c.allergies)+"</p>";
  h+="<div class='row' style='margin:14px 0'><span class='chip "+(b>0.01?"debt":"paid")+"'>"+(b>0.01?"Deve "+euro(b):"In pari")+"</span></div>";
  h+="<div class='grid4'>";
  h+=ph?"<a class='btn btn-soft' href='tel:"+ph+"'>"+I("phone",16)+" Chiama</a>":"<button type='button' class='btn btn-ghost' disabled>Chiama</button>";
  h+=waR?"<a class='btn btn-wa' href='"+waR+"'>"+I("wa",16)+" WhatsApp</a>":"<button type='button' class='btn btn-ghost' disabled>WhatsApp</button>";
  h+="<button type='button' class='btn btn-primary' onclick='pickClient(\""+id+"\")'>"+I("plus",16)+" Prenota</button>";
  h+="<button type='button' class='btn btn-ghost' onclick='formClient(\""+id+"\")'>"+I("edit",16)+" Modifica</button></div>";
  const nails=[c.shape,c.length,c.color,c.product].filter(Boolean);
  h+="<h3 style='margin:18px 0 8px'>Unghie</h3>";
  if(nails.length||c.photo){
    if(c.shape) h+="<p>Forma: <strong>"+esc(c.shape)+"</strong></p>";
    if(c.length) h+="<p>Lunghezza: <strong>"+esc(c.length)+"</strong></p>";
    if(c.color) h+="<p>Colore: <strong>"+esc(c.color)+"</strong></p>";
    if(c.product) h+="<p>Prodotto: <strong>"+esc(c.product)+"</strong></p>";
    if(c.prefs) h+="<p class='muted'>"+esc(c.prefs)+"</p>";
    if(c.photo) h+="<img class='photo' src='"+c.photo+"' alt='unghie'>";
  } else {
    h+="<p class='muted'>Ancora niente in scheda unghie.</p>";
  }
  if(b>0.01) h+="<button type='button' class='btn btn-ok' style='width:100%;margin-top:12px' onclick='payOff(\""+id+"\")'>"+I("check",18)+" Segna pagato</button>";
  h+="<h3 style='margin:18px 0 8px'>Storico</h3>";
  if(!hist.length) h+="<p class='muted'>Nessuno storico.</p>";
  else hist.forEach(function(a){
    h+="<div class='list-item' onclick='openApt(\""+a.id+"\")'><div class='row'><strong>"+nd(a.date)+" "+esc(a.time||"")+"</strong><span>"+euro(a.price||0)+"</span></div><div class='muted'>"+esc((S(a.serviceId)||{}).name||"")+" · "+mins(a)+" min</div>";
    if(a.work) h+="<div style='margin-top:4px'>"+esc(a.work)+"</div>";
    h+="</div>";
  });
  h+="<button type='button' class='btn btn-bad' style='width:100%;margin-top:16px' onclick='delClient(\""+id+"\")'>"+I("trash",18)+" Elimina cliente</button>";
  h+="<button type='button' class='btn btn-ghost' style='width:100%;margin-top:8px' onclick='closeModal()'>Chiudi</button>";
  openModal(h);
}
function delClient(id){
  const c=C(id);if(!c)return;
  const b=bal(id);
  const msg=b>0.01?"Attenzione! "+c.name+" deve ancora "+euro(b)+". Eliminando la scheda cancellerai anche il suo debito. Vuoi davvero eliminarla?":"Vuoi davvero eliminare la cliente "+c.name+"?";
  if(!confirm(msg))return;
  db.clients=db.clients.filter(x=>x.id!==id);
  db.appointments=db.appointments.filter(a=>a.clientId!==id);
  save();closeModal();render();toast("Cliente eliminata.");
}
function formExpense(id){
  const x=id?(db.expenses||[]).find(e=>e.id===id):null;
  const d=x?x.date:today();
  const amt=x?x.amount:"";
  const cat=x?x.category:"materiali";
  const desc=x?(x.desc||""):"";

  let h="<h2>"+(x?"Modifica spesa":"Nuova spesa")+"</h2>";
  h+="<form onsubmit='event.preventDefault();saveExpense("+(id?"\""+id+"\"":"null")+")'>";
  h+="<label>Quanto hai speso (€)</label>";
  h+="<input id='e_amt' type='number' step='0.50' min='0.10' placeholder='Es. 35' value='"+amt+"' required autofocus style='font-size:26px;font-weight:900;color:var(--bad)'/>";
  
  h+="<label>Giorno</label>";
  h+="<input id='e_date' type='date' value='"+d+"' required/>";

  h+="<label>Categoria</label>";
  h+="<select id='e_cat'>"+
    "<option value='materiali'"+(cat==="materiali"?" selected":"")+">💅 Gel, Smalti e Colori</option>"+
    "<option value='attrezzatura'"+(cat==="attrezzatura"?" selected":"")+">🔌 Attrezzatura, Lampade e Frese</option>"+
    "<option value='varie'"+(cat==="varie"?" selected":"")+">📦 Monouso, Lime, Pad e Varie</option>"+
    "</select>";

  h+="<label>Cosa hai comprato? (facoltativo)</label>";
  h+="<input id='e_desc' type='text' placeholder='Es. Top coat, punte fresa, lime...' value='"+esc(desc)+"'/>";

  h+="<button type='submit' class='btn btn-primary' style='margin-top:20px;font-size:18px;padding:16px'>"+(x?I("check",18)+" Salva Modifiche":I("plus",18)+" Aggiungi Spesa")+"</button>";

  if(x){
    h+="<button type='button' class='btn btn-bad' style='width:100%;margin-top:10px' onclick='delExpense(\""+id+"\")'>"+I("trash",18)+" Elimina spesa</button>";
  }
  h+="<button type='button' class='btn btn-ghost' style='width:100%;margin-top:8px' onclick='closeModal()'>Annulla</button>";
  h+="</form>";

  openModal(h);
}
function saveExpense(id){
  const amt=parseFloat(document.getElementById("e_amt").value);
  if(!amt||amt<=0){alert("Inserisci un importo valido");return;}
  const date=document.getElementById("e_date").value||today();
  const cat=document.getElementById("e_cat").value||"materiali";
  const desc=document.getElementById("e_desc").value.trim();

  const rec={
    id:id||uid(),
    amount:amt,
    date:date,
    category:cat,
    desc:desc
  };

  if(!db.expenses) db.expenses=[];
  const idx=db.expenses.findIndex(e=>e.id===rec.id);
  if(idx>=0) db.expenses[idx]=rec;
  else db.expenses.push(rec);

  save();
  closeModal();
  render();
  toast("Spesa registrata!");
}
function exp(){
  const a=document.createElement("a");
  a.href=URL.createObjectURL(new Blob([JSON.stringify(db,null,2)],{type:"application/json"}));
  a.download="backup-unghie-"+today()+".json";
  a.click();
  const when=new Date().toLocaleString("it-IT");
  localStorage.setItem(BKEY,when);
  toast("Copia salvata");
  if(tab==="soldi") render();
}
function imp(ev){
  const f=ev.target.files[0];ev.target.value="";if(!f)return;
  const r=new FileReader();
  r.onload=function(){
    try{
      const d=JSON.parse(r.result);
      if(!d.clients||!d.appointments)throw 1;
      if(confirm("Sostituire i dati con questa copia?")){
        db=d;
        if(!db.services)db.services=SV.slice();
        if(!db.expenses)db.expenses=[];
        save();render();toast("Dati ripristinati con successo!");alert("Dati ripristinati con successo!");
      }
    }catch(e){alert("File non valido")}
  };
  r.readAsText(f);
}
document.getElementById("clientSearch").addEventListener("input",function(e){q=e.target.value.toLowerCase();if(tab==="clienti")render()});
document.getElementById("modalBg").addEventListener("click",function(e){if(e.target.id==="modalBg")closeModal()});
load();selectedDate=today();go("oggi");

