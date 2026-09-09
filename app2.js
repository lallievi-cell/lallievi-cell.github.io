function card(a,opts){
  opts=opts||{};
  const c=C(a.clientId),s=S(a.serviceId),due=(+a.price||0)-(+a.paid||0);
  const st=a.status==="done"?"Fatta":a.status==="cancelled"?"Annullata":"Deve venire";
  const wa=c?waLink(c.phone,msgRemind(a)):"";
  const id=a.id;
  const late=isLate(a);
  let actions="";
  if(opts.today && a.status==="booked"){
    actions="<div class='actions'><button type='button' class='btn btn-ok btn-sm' onclick='markDonePaid(\""+id+"\")'>"+I("check",16)+" Fatto e pagato</button>";
    if(wa) actions+="<a class='btn btn-wa btn-sm' href='"+wa+"'>"+I("wa",16)+" WhatsApp</a>";
    else actions+="<button type='button' class='btn btn-ghost btn-sm' onclick='openApt(\""+id+"\")'>Apri</button>";
    actions+="</div><div class='actions'><button type='button' class='btn btn-ghost btn-sm' onclick='shiftApt(\""+id+"\",15)'>+15 min</button><button type='button' class='btn btn-bad btn-sm' onclick='cancelApt(\""+id+"\")'>"+I("trash",15)+" Annulla</button></div>";
  }
  return "<div class='card"+(opts.now?" now":"")+"'>"+(late?"<div class='chip late' style='margin-bottom:8px'>"+I("clock",14)+" Sta aspettando</div>":"")+"<div class='apt' onclick='openApt(\""+id+"\")'><div class='timebox'>"+esc((a.time||"--:--").slice(0,5))+"<small>"+mins(a)+" min</small></div><div style='flex:1'><div class='name'>"+esc(c?c.name:"Cliente")+"</div><div class='muted'>"+esc(s?s.name:"Servizio")+"</div><div style='margin-top:8px;display:flex;gap:6px;flex-wrap:wrap'><span class='chip'>"+st+"</span><span class='chip "+(due>0.01?"debt":"paid")+"'>"+(due>0.01?"Deve "+euro(due):euro(a.price||0))+"</span></div></div></div>"+actions+"</div>";
}
function vToday(){
  const list=apts(today());
  const next=list.filter(a=>a.status==="booked");
  const done=list.filter(a=>a.status==="done");
  const recall=toRecall();
  const tm=apts(tomorrow()).filter(a=>a.status==="booked");
  let html="";
  if(next.length){
    html+=card(next[0],{today:1,now:1});
    html+=next.slice(1).map(function(a){return card(a,{today:1})}).join("");
  } else {
    html+="<div class='card empty'><div class='big'>💅</div><p>Nessun appuntamento oggi.</p><p class='tiny' style='margin-top:8px'>Tocca + Prenota in alto per aggiungerne uno.</p></div>";
  }
  if(done.length) html+="<p class='muted' style='margin:8px 4px'>Gia fatte</p>"+done.map(function(a){return card(a)}).join("");
  if(tm.length){
    html+="<div class='card'><h3>Domani — mandagli il messaggio</h3><p class='tiny' style='margin:6px 0 8px'>Tocca WhatsApp, il testo e gia pronto. Poi Invio.</p>";
    tm.forEach(function(a){
      const c=C(a.clientId);
      const wa=c?waLink(c.phone,msgRemind(a)):"";
      html+="<div class='list-item'><div class='name'>"+esc(c?c.name:"Cliente")+"</div><div class='tiny'>"+esc((a.time||"").slice(0,5))+" · "+mins(a)+" min</div>";
      if(a.reminded) html+="<div class='chip paid' style='margin-top:8px'>"+I("check",14)+" Gia scritto</div>";
      else if(wa) html+="<a class='btn btn-wa' style='width:100%;margin-top:10px' href='"+wa+"' onclick='markReminded(\""+a.id+"\")'>"+I("wa",18)+" WhatsApp promemoria</a>";
      else html+="<p class='warn tiny' style='margin-top:8px'>Manca il numero</p>";
      html+="</div>";
    });
    html+="</div>";
  }
  if(recall.length){
    const show=recall.slice(0,3);
    html+="<div class='card'><h3>Da richiamare</h3>";
    show.forEach(function(c){
      const lv=last(c.id);const wa=waLink(c.phone,msgRecall(c));
      html+="<div class='list-item'><div class='name'>"+esc(c.name)+"</div><div class='tiny'>ultima volta "+nd(lv.date)+"</div><div class='actions' style='margin-top:10px'>";
      if(wa) html+="<a class='btn btn-wa btn-sm' href='"+wa+"'>"+I("wa",16)+" WhatsApp</a>";
      html+="<button type='button' class='btn btn-ghost btn-sm' onclick='pickClient(\""+c.id+"\")'>"+I("plus",15)+" Prenota</button></div></div>";
    });
    if(recall.length>3) html+="<button type='button' class='btn btn-ghost' style='width:100%;margin-top:8px' onclick='cFilter=\"recall\";go(\"clienti\")'>Vedi tutte ("+recall.length+")</button>";
    html+="</div>";
  }
  return html;
}
function calToggle(){
  return "<div class='filters' style='padding-bottom:8px'><button type='button' class='"+(calView!=="month"?"on":"")+"' onclick='setCal(\"week\")'>Settimana</button><button type='button' class='"+(calView==="month"?"on":"")+"' onclick='setCal(\"month\")'>Mese</button></div>";
}
function vAgenda(){
  if(!selectedDate) selectedDate=today();
  if(calView==="month") return vMonth();
  const days=weekDays(selectedDate);
  const start=parseISO(days[0]);
  const end=parseISO(days[6]);
  const label=start.toLocaleDateString("it-IT",{day:"numeric",month:"short"})+" – "+end.toLocaleDateString("it-IT",{day:"numeric",month:"short"});

  let weekTotal=0;
  days.forEach(function(iso){
    weekTotal += allApts(iso).filter(function(a){return a.status!=="cancelled"}).length;
  });

  const dayInitials=["Lun","Mar","Mer","Gio","Ven","Sab","Dom"];
  let strip="<div class='week-strip'>";
  days.forEach(function(iso,idx){
    const dt=parseISO(iso);
    const dNum=dt.getDate();
    const dayApts=allApts(iso).filter(function(a){return a.status!=="cancelled"});
    const totalMins=dayApts.reduce(function(acc,a){return acc+mins(a)},0);
    const loadPct=Math.min(100,Math.round(totalMins/720*100));
    const hoursDec=Math.round(totalMins/60*10)/10;
    const loadTxt=totalMins?(hoursDec%1===0?Math.floor(hoursDec)+"h":hoursDec+"h"):"libero";
    const isTod=iso===today();
    const isSel=iso===selectedDate;
    const cls=["day-btn",isTod?"today":"",dayApts.length?"has":"",isSel?"sel":""].filter(Boolean).join(" ");
    strip+="<button type='button' class='"+cls+"' onclick='scrollToDay(\""+iso+"\")'>"+
      "<div style='opacity:0.85'>"+dayInitials[idx]+"</div>"+
      "<div class='d-num'>"+dNum+"</div>"+
      "<div class='d-load-bar'><div class='d-load-fill' style='width:"+loadPct+"%'></div></div>"+
      "<div class='d-load-txt'>"+loadTxt+"</div>"+
      "</button>";
  });
  strip+="</div>";

  let html=calToggle()+"<div class='card'><div class='week-nav'><button type='button' class='btn btn-ghost btn-sm' onclick='shiftW(-1)'>←</button><button type='button' class='btn btn-soft btn-sm' onclick='goToday()'>Oggi</button><button type='button' class='btn btn-ghost btn-sm' onclick='shiftW(1)'>→</button></div><div style='text-align:center;font-weight:800;margin-top:6px'>"+label+" <span class='muted' style='font-size:14px;font-weight:700'>· "+(weekTotal===1?"1 appuntamento":weekTotal+" appuntamenti")+"</span></div>"+strip+"</div>";

  days.forEach(function(iso){
    const list=allApts(iso).sort(function(a,b){return (a.time||"").localeCompare(b.time||"")});
    const activeList=list.filter(function(a){return a.status!=="cancelled"});
    const isTod=iso===today();
    const dt=parseISO(iso);
    const dayTitle=dt.toLocaleDateString("it-IT",{weekday:"long",day:"numeric",month:"long"});
    const dayMins=activeList.reduce(function(acc,a){return acc+mins(a)},0);
    const freeMins=Math.max(0,720-dayMins);

    let countBadge="";
    if(isTod){
      countBadge="<span class='chip' style='background:var(--rose);color:#fff;font-weight:850'>OGGI</span>";
    } else if(activeList.length){
      countBadge="<span class='chip'>"+activeList.length+(activeList.length===1?" appuntam.":" appuntam.")+"</span>";
    } else {
      countBadge="<span class='tiny' style='font-weight:800;color:var(--ok)'>Tutto libero</span>";
    }

    // Costruzione Timeline orizzontale 08:00 - 20:00
    let barBlocks="";
    activeList.forEach(function(a){
      const sMin=toMin(a.time);
      const eMin=sMin+mins(a);
      const clampS=Math.max(480,Math.min(1200,sMin));
      const clampE=Math.max(480,Math.min(1200,eMin));
      if(clampE>clampS){
        const left=((clampS-480)/720*100).toFixed(1);
        const width=Math.max(2,((clampE-clampS)/720*100)).toFixed(1);
        const cls=a.status==="done"?"timeline-block done":"timeline-block";
        const cName=(C(a.clientId)||{}).name||"Cliente";
        barBlocks+="<div class='"+cls+"' style='left:"+left+"%;width:"+width+"%' onclick='openApt(\""+a.id+"\")' title='"+esc(cName)+" ("+(a.time||"").slice(0,5)+")'></div>";
      }
    });

    const hoursWorked=Math.round(dayMins/60*10)/10;
    const subLabel=dayMins?(hoursWorked%1===0?Math.floor(hoursWorked):hoursWorked)+"h occupate · "+fmtDuration(freeMins):"<span style='color:var(--ok)'>Tutto libero (12 ore)</span>";

    const timelineHtml="<div class='timeline-box'>"+
      "<div class='row' style='margin-bottom:6px;font-size:13px;font-weight:800'>"+
        "<span class='muted'>Nastro orario 08:00 – 20:00</span>"+
        "<span>"+subLabel+"</span>"+
      "</div>"+
      "<div class='timeline-bar'>"+barBlocks+"</div>"+
      "<div class='timeline-labels'>"+
        "<span>08:00</span><span>11:00</span><span>14:00</span><span>17:00</span><span>20:00</span>"+
      "</div>"+
    "</div>";

    html+="<div class='card daycard"+(isTod?" now":"")+"' id='day-"+iso+"'>"+
      "<div class='row' style='padding-bottom:6px;border-bottom:1px solid var(--line)'><div class='name' style='text-transform:capitalize;font-size:20px'>"+dayTitle+"</div>"+countBadge+"</div>"+
      timelineHtml;

    if(!activeList.length){
      html+="<div class='day-empty'>"+
        "<div style='font-size:16px;font-weight:800;color:var(--ok)'>🎉 Tutta la giornata libera (08:00 – 20:00)</div>"+
        "<div class='tiny' style='margin-top:4px'>12 ore disponibili per prendere appuntamenti</div>"+
      "</div>";
    } else {
      let cursor=480; // 08:00
      list.forEach(function(a){
        const startTime=(a.time||"10:00").slice(0,5);
        const startMin=toMin(startTime);
        const duration=mins(a);
        const endMin=startMin+duration;
        const endTime=minToTime(endMin);

        // Buco libero prima di questo appuntamento
        if(a.status!=="cancelled" && startMin>cursor){
          const gapMins=startMin-cursor;
          if(gapMins>=15){
            const gapStart=minToTime(cursor);
            html+="<div class='gap-item' onclick='newAt(\""+iso+"\",\""+gapStart+"\")'>"+
              "<div><strong>⏱️ "+gapStart+" – "+startTime+" libero</strong> <span class='tiny' style='color:var(--muted)'>("+fmtDuration(gapMins)+")</span></div>"+
              "<span class='chip' style='background:#fff;font-size:12px;padding:4px 9px;color:var(--rose)'>+ Prenota</span>"+
              "</div>";
          }
        }
        if(a.status!=="cancelled"){
          cursor=Math.max(cursor,endMin);
        }

        const c=C(a.clientId);
        const s=S(a.serviceId);
        const due=(+a.price||0)-(+a.paid||0);
        let chipCls="paid", chipText="Deve venire";
        if(a.status==="cancelled"){
          chipCls="debt"; chipText="Annullata";
        } else if(a.status==="done"){
          if(due>0.01){ chipCls="debt"; chipText="Fatta · Deve "+euro(due); }
          else { chipCls="paid"; chipText="Fatta · Pagato"; }
        } else {
          if(due>0.01){ chipCls="debt"; chipText="Deve venire · "+euro(a.price||0); }
          else { chipCls="paid"; chipText="Deve venire"; }
        }

        html+="<div class='apt-item' onclick='openApt(\""+a.id+"\")'>"+
          "<div class='apt-time'>"+startTime+"<small>fino "+endTime+"</small></div>"+
          "<div class='apt-info'>"+
            "<div class='apt-name'>"+esc(c?c.name:"Cliente")+"</div>"+
            "<div class='apt-serv'>"+esc(s?s.name:"Servizio")+" · "+duration+" min</div>"+
            "<div style='margin-top:5px'><span class='chip "+chipCls+"' style='font-size:12px;padding:3px 9px'>"+chipText+"</span></div>"+
          "</div>"+
        "</div>";
      });

      // Buco libero dopo l'ultimo appuntamento fino alle 20:00 (1200 min)
      if(cursor<1200){
        const remMins=1200-cursor;
        if(remMins>=15){
          const gapStart=minToTime(cursor);
          html+="<div class='gap-item' onclick='newAt(\""+iso+"\",\""+gapStart+"\")'>"+
            "<div><strong>⏱️ "+gapStart+" – 20:00 libero</strong> <span class='tiny' style='color:var(--muted)'>("+fmtDuration(remMins)+")</span></div>"+
            "<span class='chip' style='background:#fff;font-size:12px;padding:4px 9px;color:var(--rose)'>+ Prenota</span>"+
            "</div>";
        }
      }
    }

    html+="<button type='button' class='btn btn-soft btn-sm' style='width:100%;margin-top:12px' onclick='newAt(\""+iso+"\",\"08:00\")'>+ Aggiungi a "+nd(iso)+"</button></div>";
  });

  return html;
}
function vMonth(){
  const dt=parseISO(selectedDate||today());
  const y=dt.getFullYear(), m=dt.getMonth();
  const first=new Date(y,m,1);
  const pad=(first.getDay()+6)%7;
  const dim=new Date(y,m+1,0).getDate();
  const title=first.toLocaleDateString("it-IT",{month:"long",year:"numeric"});
  let html=calToggle()+"<div class='card'><div class='week-nav'><button type='button' class='btn btn-ghost btn-sm' onclick='shiftM(-1)'>←</button><button type='button' class='btn btn-soft btn-sm' onclick='goToday()'>Oggi</button><button type='button' class='btn btn-ghost btn-sm' onclick='shiftM(1)'>→</button></div><div style='text-align:center;font-weight:800;margin:6px 0 8px;text-transform:capitalize'>"+title+"</div>";
  html+="<div style='display:grid;grid-template-columns:repeat(7,1fr);gap:4px;text-align:center;font-weight:800;color:#5C3D45;font-size:13px;margin-bottom:6px'><div>L</div><div>M</div><div>M</div><div>G</div><div>V</div><div>S</div><div>D</div></div>";
  html+="<div style='display:grid;grid-template-columns:repeat(7,1fr);gap:4px'>";
  for(let i=0;i<pad;i++) html+="<div></div>";
  for(let d=1;d<=dim;d++){
    const iso=ymd(new Date(y,m,d));
    const n=allApts(iso).length;
    const sel=iso===selectedDate;
    const tod=iso===today();
    html+="<button type='button' onclick='pickDay(\""+iso+"\")' style='border:"+(sel?"3px solid #6B2740":"1px solid #E4C5CD")+";background:"+(tod?"#F3D7DE":"#fff")+";border-radius:14px;padding:8px 2px;min-height:52px'><div style='font-weight:900'>"+d+"</div>"+(n?"<div style='font-size:12px;color:#6B2740;font-weight:800'>"+n+"</div>":"")+"</button>";
  }
  html+="</div></div>";
  const list=allApts(selectedDate);
  html+="<div class='card'><div class='name' style='text-transform:capitalize;margin-bottom:8px'>"+ndl(selectedDate)+"</div>";
  if(!list.length) html+="<p class='muted'>Nessun appuntamento.</p>";
  else list.forEach(function(a){
    const c=C(a.clientId);
    const isCanc=a.status==="cancelled";
    const stText=isCanc?"Annullata":(a.status==="done"?"Fatta":mins(a)+" min");
    html+="<div class='slot' style='"+(isCanc?"opacity:0.5;text-decoration:line-through":"")+"' onclick='openApt(\""+a.id+"\")'><span>"+esc((a.time||"").slice(0,5))+" · "+esc(c?c.name:"Cliente")+"</span><span class='tiny'>"+stText+"</span></div>";
  });
  html+="<button type='button' class='btn btn-soft' style='width:100%;margin-top:10px' onclick='newAt(\""+selectedDate+"\",\"10:00\")'>+ In questo giorno</button></div>";
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
  const mo=moneyMonth||today().slice(0,7);
  const isCurrentMonth=mo===today().slice(0,7);
  const pMo=mo.split("-");
  const dtMo=new Date(+pMo[0],(+pMo[1]||1)-1,1);
  const monthTitle=dtMo.toLocaleDateString("it-IT",{month:"long",year:"numeric"});

  const monthDone=done.filter(a=>(a.date||"").startsWith(mo));
  const monthPaid=monthDone.reduce((s,a)=>s+(+a.paid||0),0);

  const exps=(db.expenses||[]).filter(e=>(e.date||"").startsWith(mo)).sort((a,b)=>(b.date||"").localeCompare(a.date||""));
  const monthExpenses=exps.reduce((s,e)=>s+(+e.amount||0),0);

  const netProfit=monthPaid-monthExpenses;

  const cred=db.clients.map(function(c){return {c:c,b:bal(c.id)}}).filter(x=>x.b>0.01);
  const totalDebt=cred.reduce((s,x)=>s+x.b,0);

  let html="";

  html+="<div class='card' style='padding:12px 14px;margin-bottom:12px'>"+
    "<div class='row'>"+
      "<button type='button' class='btn btn-ghost btn-sm' style='min-width:48px;padding:8px 12px' onclick='shiftMoneyM(-1)'>"+I("left",22)+"</button>"+
      "<div style='text-align:center'>"+
        "<div style='font-size:21px;font-weight:900;text-transform:capitalize'>"+monthTitle+"</div>"+
        (!isCurrentMonth?"<button type='button' class='btn btn-soft btn-sm' style='margin-top:4px;padding:4px 10px;font-size:13px' onclick='goMoneyThisMonth()'>Torna a questo mese</button>":"<div class='tiny' style='color:var(--muted)'>Mese in corso</div>")+
      "</div>"+
      "<button type='button' class='btn btn-ghost btn-sm' style='min-width:48px;padding:8px 12px' onclick='shiftMoneyM(1)'>"+I("right",22)+"</button>"+
    "</div>"+
  "</div>";

  if(isCurrentMonth){
    const weekStart=mondayISO();
    const todayPaid=done.filter(a=>a.date===today()).reduce((s,a)=>s+(+a.paid||0),0);
    const weekPaid=done.filter(a=>a.date>=weekStart&&a.date<=today()).reduce((s,a)=>s+(+a.paid||0),0);
    html+="<div class='grid2' style='margin-bottom:12px'>"+
      "<div class='card' style='margin-bottom:0;padding:12px 14px'>"+
        "<div class='tiny muted'>Oggi</div>"+
        "<div class='money' style='font-size:24px;color:var(--ok)'>"+euro(todayPaid)+"</div>"+
      "</div>"+
      "<div class='card' style='margin-bottom:0;padding:12px 14px'>"+
        "<div class='tiny muted'>Questa settimana</div>"+
        "<div class='money' style='font-size:24px;color:var(--ok)'>"+euro(weekPaid)+"</div>"+
      "</div>"+
    "</div>";
  }

  const netColor=netProfit>=0?"var(--ok)":"var(--bad)";
  html+="<div class='card card-net' style='border:2px solid "+(netProfit>=0?"var(--ok)":"var(--bad)")+";background:"+(netProfit>=0?"#F0F9F3":"#FDF2F2")+";margin-bottom:12px'>"+
    "<div class='row'>"+
      "<div>"+
        "<div style='font-size:14px;font-weight:800;letter-spacing:0.5px;color:var(--muted);text-transform:uppercase'>Guadagno Netto ("+monthTitle+")</div>"+
        "<div class='money' style='font-size:36px;font-weight:900;color:"+netColor+";margin-top:2px'>"+euro(netProfit)+"</div>"+
        "<div class='tiny' style='margin-top:2px;color:var(--muted)'>Incassi totali meno spese sostenute</div>"+
      "</div>"+
      "<div style='font-size:36px'>"+(netProfit>=0?"💰":"📉")+"</div>"+
    "</div>"+
  "</div>";

  html+="<div class='grid2' style='margin-bottom:12px'>"+
    "<div class='card' style='margin-bottom:0;border-left:4px solid var(--ok)'>"+
      "<div class='tiny muted'>Incassato</div>"+
      "<div class='money' style='font-size:26px;color:var(--ok);margin-top:2px'>"+euro(monthPaid)+"</div>"+
      "<div class='tiny muted' style='margin-top:2px'>"+monthDone.length+(monthDone.length===1?" lavoro":" lavori")+"</div>"+
    "</div>"+
    "<div class='card' style='margin-bottom:0;border-left:4px solid var(--bad)'>"+
      "<div class='tiny muted'>Spese uscite</div>"+
      "<div class='money' style='font-size:26px;color:var(--bad);margin-top:2px'>"+euro(monthExpenses)+"</div>"+
      "<div class='tiny muted' style='margin-top:2px'>"+exps.length+(exps.length===1?" acquisto":" acquisti")+"</div>"+
    "</div>"+
  "</div>";

  let expsHtml="";
  if(!exps.length){
    expsHtml="<p class='muted' style='margin:12px 0 6px'>Nessuna spesa registrata per questo mese.</p>";
  } else {
    expsHtml=exps.map(function(e){
      const title=e.desc||expenseCatName(e.category);
      const icon=expenseCatIcon(e.category);
      return "<div class='list-item' style='cursor:pointer' onclick='formExpense(\""+e.id+"\")'>"+
        "<div class='row'>"+
          "<div class='row' style='gap:10px;justify-content:flex-start'>"+
            "<span style='font-size:24px'>"+icon+"</span>"+
            "<div>"+
              "<div class='name' style='font-size:18px'>"+esc(title)+"</div>"+
              "<div class='tiny'>"+nd(e.date)+" · "+esc(expenseCatName(e.category))+"</div>"+
            "</div>"+
          "</div>"+
          "<div style='text-align:right'>"+
            "<strong style='color:var(--bad);font-size:18px'>-"+euro(e.amount)+"</strong>"+
            "<div class='tiny' style='color:var(--muted)'>Modifica ›</div>"+
          "</div>"+
        "</div>"+
      "</div>";
    }).join("");
  }

  html+="<div class='card'>"+
    "<div class='row'>"+
      "<div>"+
        "<h3 style='margin:0'>Spese del mese</h3>"+
        "<div class='tiny muted'>Totale: "+euro(monthExpenses)+"</div>"+
      "</div>"+
      "<button type='button' class='btn btn-soft btn-sm' onclick='formExpense()'>"+I("plus",16)+" Nuova spesa</button>"+
    "</div>"+
    "<div style='margin-top:10px'>"+expsHtml+"</div>"+
  "</div>";

  let debts="<p class='muted' style='margin-top:8px'>Nessuna cliente deve soldi.</p>";
  if(cred.length){
    debts=cred.map(function(x){
      const wa=waLink(x.c.phone,msgDebt(x.c,x.b));
      return "<div class='list-item'><div class='row'><div class='name'>"+esc(x.c.name)+"</div><span class='chip debt'>"+euro(x.b)+"</span></div><div class='actions'><button type='button' class='btn btn-ok btn-sm' onclick='payOff(\""+x.c.id+"\")'>"+I("check",16)+" Segna pagato</button>"+(wa?"<a class='btn btn-wa btn-sm' href='"+wa+"'>"+I("wa",16)+" WhatsApp</a>":"<button type='button' class='btn btn-ghost btn-sm' onclick='openClient(\""+x.c.id+"\")'>Apri</button>")+"</div></div>";
    }).join("");
  }
  html+="<div class='card'>"+
    "<div class='row'><h3>Mi devono</h3>"+(totalDebt>0.01?"<span class='chip debt'>Totale: "+euro(totalDebt)+"</span>":"")+"</div>"+
    debts+
  "</div>";

  const monthList=monthDone.slice().sort(function(a,b){return (b.date+b.time).localeCompare(a.date+a.time)}).slice(0,25);
  let mov="";
  if(monthList.length){
    mov=monthList.map(function(a){
      const c=C(a.clientId);const s=S(a.serviceId);
      return "<div class='list-item' onclick='openApt(\""+a.id+"\")'><div class='row'><div><div class='name'>"+esc(c?c.name:"Cliente")+"</div><div class='tiny'>"+nd(a.date)+" · "+esc(s?s.name:"")+"</div></div><strong style='color:var(--ok)'>+"+euro(a.paid||0)+"</strong></div></div>";
    }).join("");
  }
  html+="<div class='card'><h3>Dettaglio incassi ("+monthTitle+")</h3>"+(mov||"<p class='muted' style='margin-top:8px'>Nessun incasso in questo mese.</p>")+"</div>";

  const lastB=localStorage.getItem(BKEY);
  html+="<div class='card'><h3>Copia di sicurezza</h3><p class='tiny' style='margin-bottom:10px'>"+(lastB?"Ultima copia: "+lastB:"Non hai ancora salvato una copia")+"</p><div class='grid2'><button type='button' class='btn btn-soft' onclick='exp()'>"+I("backup",18)+" Salva copia sul telefono</button><button type='button' class='btn btn-ghost' onclick='document.getElementById(\"imp\").click()'>"+I("restore",18)+" Rimetti la copia</button></div><input id='imp' type='file' accept='application/json' class='hidden' onchange='imp(event)'></div>";

  return html;
}
