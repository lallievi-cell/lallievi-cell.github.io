function formApt(id,time){
  if(!db.clients.length){
    openModal("<h2>Nuovo appuntamento</h2><p style='margin:12px 0'>Prima serve una cliente.</p><button type='button' class='btn btn-primary' onclick='formClient(null,1)'>Aggiungi cliente</button><button type='button' class='btn btn-ghost' style='width:100%;margin-top:8px' onclick='closeModal()'>Chiudi</button>");
    return;
  }
  const a=id?db.appointments.find(x=>x.id===id):{date:tab==="agenda"?selectedDate:today(),time:time||"10:00",status:"booked",paid:0};
  const opts=db.clients.map(function(c){return "<option value='"+c.id+"' "+(c.id===a.clientId?"selected":"")+">"+esc(c.name)+"</option>"}).join("");
  const sopts=(db.services||[]).map(function(s){return "<option value='"+s.id+"' "+(s.id===a.serviceId?"selected":"")+">"+esc(s.name)+" · "+euro(s.price)+"</option>"}).join("");
  const price=a.price!=null?a.price:(S(a.serviceId)||db.services[0]).price;
  const c=C(a.clientId)||db.clients[0];
  const wa=c?waLink(c.phone,msgRemind(Object.assign({},a,{clientId:c.id}))):"";
  let h="<h2>"+(id?"Appuntamento":"Nuovo appuntamento")+"</h2>";
  h+="<label>Cliente</label><select id='f_c'>"+opts+"</select>";
  h+="<button type='button' class='btn btn-ghost btn-sm' style='margin-top:8px' onclick='formClient(null,1)'>+ Nuova cliente</button>";
  h+="<label>Giorno</label><input id='f_d' type='date' value='"+(a.date||today())+"'>";
  h+="<label>Ora</label><input id='f_t' type='time' value='"+(a.time||"10:00")+"'>";
  h+="<label>Servizio</label><select id='f_s' onchange='var s=S(this.value);if(s)document.getElementById(\"f_p\").value=s.price'>"+sopts+"</select>";
  h+="<label>Prezzo €</label><input id='f_p' type='number' step='0.5' value='"+price+"'>";
  h+="<label>Gia pagato €</label><input id='f_pay' type='number' step='0.5' value='"+(a.paid||0)+"'>";
  h+="<label>Cosa hai fatto</label><textarea id='f_w'>"+esc(a.work||"")+"</textarea>";
  h+="<label>Stato</label><select id='f_st'><option value='booked' "+(a.status==="booked"?"selected":"")+">Deve venire</option><option value='done' "+(a.status==="done"?"selected":"")+">Fatta</option><option value='cancelled' "+(a.status==="cancelled"?"selected":"")+">Annullata</option></select>";
  if(id&&a.status==="booked") h+="<button type='button' class='btn btn-ok' style='margin-top:16px' onclick='markDonePaid(\""+id+"\")'>Fatto e pagato</button>";
  if(wa) h+="<a class='btn btn-soft' style='width:100%;margin-top:8px' href='"+wa+"'>Scrivi su WhatsApp</a>";
  h+="<button type='button' class='btn btn-primary' style='margin-top:8px' onclick='saveApt(\""+(id||"")+"\")'>Salva</button>";
  if(id) h+="<button type='button' class='btn btn-bad' style='width:100%;margin-top:8px' onclick='delApt(\""+id+"\")'>Elimina</button>";
  h+="<button type='button' class='btn btn-ghost' style='width:100%;margin-top:8px' onclick='closeModal()'>Chiudi</button>";
  openModal(h);
}
function openApt(id){formApt(id)}
function saveApt(id){
  const rec={id:id||uid(),clientId:document.getElementById("f_c").value,date:document.getElementById("f_d").value,time:document.getElementById("f_t").value,serviceId:document.getElementById("f_s").value,price:+document.getElementById("f_p").value||0,paid:+document.getElementById("f_pay").value||0,work:document.getElementById("f_w").value.trim(),status:document.getElementById("f_st").value};
  if(!rec.clientId){alert("Serve una cliente");return}
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
  if(c.photo) h+="<img class='photo' src='"+c.photo+"' alt='unghie'>";
  h+="<label>Richiamo dopo quante settimane</label><input id='c_r' type='number' value='"+(c.recallWeeks||3)+"'>";
  h+="<button type='button' class='btn btn-primary' style='margin-top:16px' onclick='saveClient(\""+(id||"")+"\","+(fromApt?1:0)+")'>Salva cliente</button>";
  h+="<button type='button' class='btn btn-ghost' style='width:100%;margin-top:8px' onclick='closeModal()'>Annulla</button>";
  openModal(h);
}
function resizePhoto(file,cb){
  const r=new FileReader();
  r.onload=function(){
    const img=new Image();
    img.onload=function(){
      const max=640;let w=img.width,h=img.height;
      if(w>max){h=h*max/w;w=max}
      const cv=document.createElement("canvas");cv.width=w;cv.height=h;
      cv.getContext("2d").drawImage(img,0,0,w,h);
      cb(cv.toDataURL("image/jpeg",0.72));
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
  h+=ph?"<a class='btn btn-soft' href='tel:"+ph+"'>Chiama</a>":"<button type='button' class='btn btn-ghost' disabled>Chiama</button>";
  h+=waR?"<a class='btn btn-soft' href='"+waR+"'>WhatsApp</a>":"<button type='button' class='btn btn-ghost' disabled>WhatsApp</button>";
  h+="<button type='button' class='btn btn-primary' onclick='pickClient(\""+id+"\")'>Prenota</button>";
  h+="<button type='button' class='btn btn-ghost' onclick='formClient(\""+id+"\")'>Modifica</button></div>";
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
  if(b>0.01) h+="<button type='button' class='btn btn-ok' style='width:100%;margin-top:12px' onclick='payOff(\""+id+"\")'>Segna pagato</button>";
  h+="<h3 style='margin:18px 0 8px'>Storico</h3>";
  if(!hist.length) h+="<p class='muted'>Nessuno storico.</p>";
  else hist.forEach(function(a){
    h+="<div class='list-item' onclick='openApt(\""+a.id+"\")'><div class='row'><strong>"+nd(a.date)+" "+esc(a.time||"")+"</strong><span>"+euro(a.price||0)+"</span></div><div class='muted'>"+esc((S(a.serviceId)||{}).name||"")+"</div>";
    if(a.work) h+="<div style='margin-top:4px'>"+esc(a.work)+"</div>";
    h+="</div>";
  });
  h+="<button type='button' class='btn btn-bad' style='width:100%;margin-top:16px' onclick='delClient(\""+id+"\")'>Elimina cliente</button>";
  h+="<button type='button' class='btn btn-ghost' style='width:100%;margin-top:8px' onclick='closeModal()'>Chiudi</button>";
  openModal(h);
}
function delClient(id){const c=C(id);if(!confirm("Vuoi eliminare "+c.name+"?"))return;db.clients=db.clients.filter(x=>x.id!==id);db.appointments=db.appointments.filter(a=>a.clientId!==id);save();closeModal();render()}
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
        db=d;if(!db.services)db.services=SV.slice();save();render();
      }
    }catch(e){alert("File non valido")}
  };
  r.readAsText(f);
}
document.getElementById("clientSearch").addEventListener("input",function(e){q=e.target.value.toLowerCase();if(tab==="clienti")render()});
document.getElementById("modalBg").addEventListener("click",function(e){if(e.target.id==="modalBg")closeModal()});
load();selectedDate=today();go("oggi");
