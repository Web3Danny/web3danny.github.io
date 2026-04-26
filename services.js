/* ── SERVICES ──────────────────────────────────────────────────────────────── */
/* Extracted from var code string. Plain JS only — no JSX, no React.            */
/* Loaded before the Babel-compiled code block.                                  */

function fmtK(v,cur){
  if(!v&&v!==0)return"—";
  if(v>=1000000)return(cur||"")+Math.round(v/100000)/10+"M";
  if(v>=1000)return(cur||"")+Math.round(v/1000)+"k";
  return(cur||"")+v.toString();
}

function encodeRfc822(to,subject,body){
  var lines=["To: "+to,"Subject: "+subject,"Content-Type: text/plain; charset=UTF-8","MIME-Version: 1.0","",""].concat(body.split("\n"));
  var raw=lines.join("\r\n");
  try{return btoa(unescape(encodeURIComponent(raw))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");}catch(e){return btoa(raw).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");}
}
function encodeRfc822WithAttachments(to,subject,htmlBody,attachments){
  var boundary="pcrm_"+Date.now();
  var parts=["To: "+to,"Subject: "+subject,"MIME-Version: 1.0","Content-Type: multipart/mixed; boundary=\""+boundary+"\"","","--"+boundary,"Content-Type: text/html; charset=UTF-8","",""+htmlBody,""];
  (attachments||[]).forEach(function(att){
    var b64=att.data?att.data.split(",")[1]:att.b64||"";
    var wrapped=b64.match(/.{1,76}/g)||[];
    parts.push("--"+boundary,"Content-Type: "+(att.type||"application/octet-stream")+"; name=\""+att.name+"\"","Content-Disposition: attachment; filename=\""+att.name+"\"","Content-Transfer-Encoding: base64","",wrapped.join("\r\n"),"");
  });
  parts.push("--"+boundary+"--");
  var raw=parts.join("\r\n");
  try{var bytes=new TextEncoder().encode(raw);var bin="";var chunk=8192;for(var i=0;i<bytes.length;i+=chunk){bin+=String.fromCharCode.apply(null,bytes.subarray(i,i+chunk));}return btoa(bin).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");}
  catch(e){try{return btoa(unescape(encodeURIComponent(raw))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");}catch(e2){return btoa(raw).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");}}
}
var ATTACH_MAX_MB=10,ATTACH_TOTAL_MB=25;
function validateAttachments(files,existing){
  var errs=[];
  var totalBytes=(existing||[]).reduce(function(s,a){return s+a.size;},0);
  Array.from(files).forEach(function(f){
    if(f.size>ATTACH_MAX_MB*1024*1024){errs.push(f.name+" is "+Math.round(f.size/1024/1024*10)/10+"MB — max "+ATTACH_MAX_MB+"MB per file");}
    else{totalBytes+=f.size;}
  });
  if(totalBytes>ATTACH_TOTAL_MB*1024*1024){errs.push("Total attachments exceed "+ATTACH_TOTAL_MB+"MB limit");}
  return errs;
}
/* ── GOOGLE DRIVE SYNC ──────────────────────────────────── */
// SECURITY — Drive access limited to pcrm_sync.json only. Never access, read, list, or modify any other Drive file.
var DRIVE_FILE_NAME="pcrm_sync.json";
async function driveFindFile(tok){
  var url="https://www.googleapis.com/drive/v3/files?q=name%3D%27"+DRIVE_FILE_NAME+"%27+and+trashed%3Dfalse&fields=files(id,name,modifiedTime)";
  console.log("Drive search URL:",url);
  var res=await fetch(url,{headers:{"Authorization":"Bearer "+tok}});
  if(!res.ok){var errTxt=await res.text();console.log("Drive search failed:",res.status,errTxt);return null;}
  var data=await res.json();
  console.log("Drive search result:",JSON.stringify(data));
  return(data.files&&data.files.length>0)?data.files[0]:null;
}
async function driveLoad(tok){
  var file=await driveFindFile(tok);
  if(!file)return null;
  var res=await fetch("https://www.googleapis.com/drive/v3/files/"+file.id+"?alt=media",{headers:{"Authorization":"Bearer "+tok}});
  if(!res.ok)return null;
  var data=await res.json();
  data._driveFileId=file.id;
  data._driveModified=file.modifiedTime;
  return data;
}
async function driveSave(tok,payload){
  var file=await driveFindFile(tok);
  var body=JSON.stringify(payload);
  var boundary="pcrm_boundary_"+Date.now();
  var metadata=JSON.stringify({name:DRIVE_FILE_NAME,mimeType:"application/json"});
  var multipart="--"+boundary+"\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n"+metadata+"\r\n--"+boundary+"\r\nContent-Type: application/json\r\n\r\n"+body+"\r\n--"+boundary+"--";
  if(file){
    var res=await fetch("https://www.googleapis.com/upload/drive/v3/files/"+file.id+"?uploadType=multipart",{method:"PATCH",headers:{"Authorization":"Bearer "+tok,"Content-Type":"multipart/related; boundary="+boundary},body:multipart});
    if(!res.ok){var err=await res.text();console.log("Drive PATCH failed:",res.status,err);}
    return res.ok;
  }else{
    var res2=await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",{method:"POST",headers:{"Authorization":"Bearer "+tok,"Content-Type":"multipart/related; boundary="+boundary},body:multipart});
    if(!res2.ok){var err2=await res2.text();console.log("Drive POST failed:",res2.status,err2);}
    else{var created=await res2.clone().json();console.log("Drive file created:",created);}
    return res2.ok;
  }
}

function sendViaGmail(tok,to,subject,body,attachments){
  var raw=attachments&&attachments.length>0?encodeRfc822WithAttachments(to,subject,body,attachments):encodeRfc822(to,subject,body);
  return fetch("https://www.googleapis.com/gmail/v1/users/me/messages/send",{method:"POST",headers:{"Authorization":"Bearer "+tok,"Content-Type":"application/json"},body:JSON.stringify({raw:raw})}).then(function(r){if(!r.ok){return r.json().then(function(err){var msg=err&&err.error&&err.error.message||"";if(r.status===403)throw new Error("403 Forbidden — reconnect Google (click G) to grant send permission. "+msg);if(r.status===401)throw new Error("401 Token expired — reconnect Google (click G). "+msg);throw new Error("Gmail error "+r.status+": "+msg);}).catch(function(e){if(e.message.indexOf("403")>=0||e.message.indexOf("401")>=0)throw e;throw new Error("Gmail send failed: "+r.status+" — try reconnecting Google");});}return r.json();});
}
function parseEmailFromPitch(pitch){
  if(!pitch)return{subject:"",body:pitch||""};
  var lines=pitch.split("\
");
  var subj="";
  var bodyStart=0;
  for(var i=0;i<Math.min(lines.length,5);i++){
    var m=lines[i].match(/^Subject:\s*(.+)/i);
    if(m){subj=m[1].trim();bodyStart=i+1;while(bodyStart<lines.length&&!lines[bodyStart].trim())bodyStart++;break;}
  }
  return{subject:subj,body:lines.slice(bodyStart).join("\
").trim()};
}
function getWeekStart(){var d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-d.getDay()+1);if(d.getDay()===0)d.setDate(d.getDate()-6);return d;}

function detectBlocker(txt){
  const lo=txt.toLowerCase();
  return lo.indexOf("blocker")>=0;
}
function extractBlockerType(txt){
  const lo=txt.toLowerCase();
  if(lo.indexOf("external")>=0||lo.indexOf("client")>=0||lo.indexOf("waiting on")>=0)return"external";
  return"internal";
}
function showAiError(msg){
  var el=document.createElement("div");
  el.textContent=msg;
  el.style.cssText="position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#FF6B6B;color:#fff;padding:10px 20px;border-radius:6px;z-index:9999;font-size:14px;pointer-events:none;";
  document.body.appendChild(el);
  setTimeout(function(){if(el.parentNode)el.parentNode.removeChild(el);},5000);
}
async function orFetch(apiKey,prompt){
  var delays=[5000,15000];
  for(var attempt=0;attempt<=delays.length;attempt++){
    var resp=await fetch("https://api.groq.com/openai/v1/chat/completions",{
      method:"POST",
      headers:{"Content-Type":"application/json","Authorization":"Bearer "+apiKey},
      body:JSON.stringify({model:"llama-3.3-70b-versatile",messages:[{role:"user",content:prompt}]})
    });
    if(resp.status===429&&attempt<delays.length){
      await new Promise(function(r){setTimeout(r,delays[attempt]);});
      continue;
    }
    if(resp.status===429){
      showAiError("AI service temporarily busy \u2014 please try again in a moment.");
      throw new Error("RATE_LIMITED");
    }
    if(resp.status===400){
      var errBody=await resp.json().catch(function(){return{};});
      var errMsg=(errBody&&errBody.error&&errBody.error.message)||JSON.stringify(errBody);
      showAiError("Groq 400: "+errMsg.slice(0,120));
      throw new Error("BAD_REQUEST");
    }
    return resp;
  }
}
async function generateAiSuggestion(deal,icp,apiKey){
  if(!apiKey)return null;
  var pc=primaryContact(deal);
  var stage=pipeStage(deal);
  var stageName=stage>=0?(PIPE[stage]&&PIPE[stage].label)||"Stage "+stage:"Unstarted";
  var ds=calcDynamicScore(deal,icp||{},DEF_WEIGHTS);
  var lastLogs=(deal.logEntries||[]).slice(-5).map(function(e){return(e.category||"note")+": "+((e.content||"").slice(0,80));}).join(" | ")||"none";
  var blocker=deal.blocker?(deal.blocker.text||deal.blocker.description||"present"):"none";
  var nextStep=deal.nextStep||(deal.nextStep&&deal.nextStep.action)||"";
  var prompt="Analyze this sales deal and return JSON only. No markdown.\n"+
    "Company: "+deal.company+"\n"+
    "Stage: "+stageName+"\n"+
    "Days since last contact: "+ds.lastContact+"\n"+
    "Days stuck in stage: "+ds.stuckDays+"\n"+
    "Blocker: "+blocker+"\n"+
    "Next step on file: "+(nextStep||"none")+"\n"+
    "Recent activity: "+lastLogs+"\n"+
    "Contact: "+(pc?pc.name+" ("+pc.title+")":"unknown")+"\n\n"+
    "CONSTRAINT: Only use the data provided above. Do not search the web, assume company details, or invent information not present in the data. If a field is missing or unknown, reflect that in gaps. Do not make claims about company size, funding, or industry unless explicitly listed above.\n\n"+
    "Return exactly this JSON shape:\n"+
    "{\"action\":\"<imperative, max 10 words>\",\"reasoning\":\"<fact-based, max 12 words>\",\"why\":[\"<max 15 words>\",\"<max 15 words>\",\"<max 15 words>\"],\"dataUsed\":[\"<max 15 words>\",\"<max 15 words>\",\"<max 15 words>\"],\"gaps\":[\"<max 15 words>\",\"<max 15 words>\"],\"confidence\":\"high|mid|low\"}";
  try{
    var resp=await orFetch(apiKey,prompt);
    var data=await resp.json();
    var text=(data.choices[0].message.content||"{}");
    var jsonMatch=text.match(/\{[\s\S]*\}/);
    var parsed=jsonMatch?JSON.parse(jsonMatch[0]):{};
    parsed.action=truncateAI(parsed.action||"Review deal status",10);
    parsed.reasoning=truncateAI(parsed.reasoning||"Insufficient recent activity",12);
    parsed.why=(parsed.why||[]).map(function(b){return truncateAI(b,15);});
    parsed.dataUsed=(parsed.dataUsed||[]).map(function(b){return truncateAI(b,15);});
    parsed.gaps=(parsed.gaps||[]).map(function(b){return truncateAI(b,15);});
    parsed.confidence=["high","mid","low"].indexOf(parsed.confidence)>=0?parsed.confidence:"mid";
    parsed.directive=parsed.confidence==="high"?"\u2192":parsed.confidence==="mid"?"~":"?";
    parsed.generatedAt=new Date().toISOString();
    return parsed;
  }catch(e){
    return{action:"Review deal status",reasoning:"Unable to generate suggestion",why:[],dataUsed:[],gaps:["AI unavailable"],confidence:"low",directive:"?",generatedAt:new Date().toISOString()};
  }
}
async function summarizeLead(lead,apiKey){
  if(!apiKey||!lead)return"No lead selected.";
  var logs=(lead.logEntries||[]).slice(-15);
  var logText=logs.length?logs.map(function(e){var d=new Date(e.timestamp).toLocaleDateString("en-US",{month:"short",day:"numeric"});return d+" ["+e.category+"]: "+e.content.slice(0,120);}).join("\n"):"No activity logged.";
  var docs=(lead.dealRoom||[]).map(function(d){return d.name+" ("+d.status+")";}).join(", ")||"None";
  var contacts=(lead.contacts||[]).map(function(c){return c.name+(c.title?" — "+c.title:"")+(c.email?" <"+c.email+">":"")+(c.lastContacted?", last contacted "+c.lastContacted:"");}).join("; ")||"None";
  var stage=lead.pipeline>=0&&typeof lead.pipeline==="number"?"Stage "+(lead.pipeline+1)+" ("+["Signal","Echo","Locked","Proposal","Closed"][lead.pipeline]+")":"Not in pipeline";
  var blocker=lead.blocker&&lead.blocker.text?"BLOCKED: "+lead.blocker.text:"No blocker";
  var ctx="Company: "+lead.company+"\n"+
    "Stage: "+stage+" | Score: "+(lead.totalScore||0)+"/100 | Value: "+(lead.dealValue||0)+"\n"+
    "Next step: "+(lead.nextStep||"Not set")+"\n"+
    "Contacts: "+contacts+"\n"+
    "Status: "+blocker+"\n"+
    "Notes: "+(lead.notes?lead.notes.slice(0,200):"None")+"\n"+
    "Deal room: "+docs+"\n\n"+
    "Activity log (most recent first):\n"+logText;
  var prompt="You are a senior sales analyst. Write a concise deal brief using ONLY the data below.\n\n"+ctx+"\n\n"+
    "Format your response as exactly 3 numbered blocks:\n"+
    "1. SITUATION — current deal state, stage, last contact, who is the decision maker\n"+
    "2. HISTORY — key events in chronological order, what was discussed, replies, meetings\n"+
    "3. WHAT'S NEXT — specific recommended action based on next step, stage, and any gaps\n\n"+
    "Be direct and factual. Max 3 sentences per block. Use only the data provided.";
  try{
    var resp=await orFetch(apiKey,prompt);
    var data=await resp.json();
    return((data.choices[0].message.content||"").trim()||"Could not generate summary.");
  }catch(e){
    return"Could not generate summary right now.";
  }
}
async function answerQuestion(question,lead,apiKey){
  if(!apiKey)return"No API key configured.";
  var ctx="No lead in focus.";
  if(lead){
    var logs=(lead.logEntries||[]).slice(-5).map(function(e){return e.category+": "+e.content.slice(0,60);}).join("; ");
    var docs=(lead.dealRoom||[]).map(function(d){return d.name+"("+d.status+")";}).join(", ");
    ctx="Company: "+lead.company+
      ". Stage: "+(lead.pipeline>=0?"stage "+lead.pipeline:"not in pipeline")+
      ". Next step: "+(lead.nextStep||"none")+
      ". Notes: "+(lead.notes?lead.notes.slice(0,120):"")+
      ". Recent activity: "+(logs||"none")+
      ". Deal room docs: "+(docs||"none")+
      ". Deal value: "+(lead.dealValue||0)+".";
  }
  var prompt="A BDM asked: \""+question+"\"\n\nDeal context: "+ctx+"\n\nRules: Answer only from the data above. If the answer is one sentence, give one sentence. Maximum 2-3 sentences. No filler phrases. No restating the question. No 'based on what we know' or 'it appears that'. If you cannot answer from the data, say so in one sentence.";
  try{
    var resp=await orFetch(apiKey,prompt);
    var data=await resp.json();
    return((data.choices[0].message.content||"").trim()||"No answer available.");
  }catch(e){
    return"Could not get an answer right now.";
  }
}
async function parseCapture(text,leads,nowDealId,apiKey){
  if(!apiKey||!text)return{dealId:nowDealId,confidence:"low",eventType:"note",summary:text,proposedNextStep:null,ambiguous:true};
  var companyMap=(leads||[]).map(function(l){return '"'+l.company+'": "'+l.id+'"';}).join(", ");
  var focusCompany=((leads||[]).find(function(l){return l.id===nowDealId;})||{}).company||"none";
  var prompt="A sales BDM typed this note: \""+text+"\"\n\n"+
    "Company ID map (name -> id): {"+companyMap+"}\n"+
    "Currently focused deal: "+focusCompany+"\n\n"+
    "Instructions:\n"+
    "1. If a company name from the map appears in the note, set dealId to its exact ID and ambiguous to false.\n"+
    "2. If no company is mentioned but there is a focused deal, use that deal's ID and set ambiguous to false.\n"+
    "3. Only set ambiguous to true if multiple companies could match or the note has no company context.\n"+
    "4. Write summary as a concise third-person event (e.g. 'Called and discussed pricing'), max 20 words.\n"+
    "5. CONSTRAINT: Only classify based on what the user typed. Do not infer from external knowledge.\n\n"+
    "Return JSON only:\n"+
    "{\"dealId\":\"<exact id from map or null>\",\"confidence\":\"high|mid|low\",\"eventType\":\"call|email|note|meeting\",\"summary\":\"<max 20 words>\",\"proposedNextStep\":\"<max 10 words or null>\",\"ambiguous\":true|false}";
  try{
    var resp=await orFetch(apiKey,prompt);
    var data=await resp.json();
    var text2=(data.choices[0].message.content||"{}");
    var jsonMatch=text2.match(/\{[\s\S]*\}/);
    var parsed=jsonMatch?JSON.parse(jsonMatch[0]):{};
    parsed.dealId=parsed.dealId&&(leads||[]).some(function(l){return l.id===parsed.dealId;})?parsed.dealId:nowDealId;
    if(parsed.confidence==="low")parsed.ambiguous=true;
    return parsed;
  }catch(e){
    return{dealId:nowDealId,confidence:"low",eventType:"note",summary:text,proposedNextStep:null,ambiguous:true};
  }
}
function buildPCRMReport(leads,icp,blocked,activeLeads,pipelineValue,coverageRatio,aiSummary,isWeek){
  var now=new Date();
  var todayStart=new Date(now.getFullYear(),now.getMonth(),now.getDate());
  var weekAgo=new Date(now.getTime()-7*24*3600000);
  var rangeStart=isWeek?weekAgo:todayStart;
  var cur=(icp&&icp.currency)||"\u20AC";
  var rL=[];leads.forEach(function(l){(l.logEntries||[]).forEach(function(e){if(new Date(e.timestamp)>=rangeStart)rL.push({company:l.company,entry:e});});});
  var rM=[];leads.forEach(function(l){(l.pipelineHistory||[]).forEach(function(h){if(new Date(h.timestamp)>=rangeStart)rM.push({company:l.company,stage:h.stage});});});
  var rN=leads.filter(function(l){return new Date(l.createdAt)>=rangeStart;});
  var d2=now.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});
  var d1=isWeek?weekAgo.toLocaleDateString("en-US",{month:"short",day:"numeric"})+" to "+d2:now.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"});
  var ln=[(isWeek?"END OF WEEK REPORT":"END OF DAY REPORT")+" -- "+d1,"================================================",""];
  ln.push("BLOCKERS");
  if(blocked.length>0){blocked.forEach(function(l){ln.push("- "+l.company+(l.blocker?": "+l.blocker.description:""));});}else{ln.push("- None");}
  ln.push("","LEAD INPUT","- New: "+rN.length+", Qualified(60+): "+rN.filter(function(l){return l.totalScore>=60;}).length+", HP(75+): "+rN.filter(function(l){return l.totalScore>=75;}).length,"- Pain: "+leads.filter(function(l){return l.summary&&l.summary.goal;}).length+", Notes: "+leads.filter(function(l){return l.notes&&l.notes.trim();}).length);
  ln.push("","OUTREACH: "+rL.length+" total, "+rL.filter(function(x){return x.entry.category==="email";}).length+" emails, "+rL.filter(function(x){return x.entry.category==="call";}).length+" calls, "+rM.length+" moves");
  if(rM.length>0){rM.forEach(function(m){var s=PIPE[m.stage];ln.push("  "+m.company+" -> "+(s?s.code:"?"));});}
  ln.push("","PIPELINE: "+activeLeads.length+" active, "+blocked.length+" blocked, "+cur+pipelineValue.toLocaleString()+" value"+(coverageRatio>0?", "+coverageRatio+"% coverage":""));
  if(aiSummary){ln.push("","AI DEBRIEF",aiSummary);}
  ln.push("","Generated by PCRM -- "+now.toISOString());
  return ln.join("\n");
}
async function generateDealDiagnosis(lead,sequences,icp,apiKey){
  if(!apiKey)return null;
  var stage=pipeStage(lead);
  var stageName=stage>=0?(PIPE[stage]&&PIPE[stage].label)||"Stage "+stage:"Unstarted";
  var ds=calcDynamicScore(lead,icp||{},DEF_WEIGHTS);
  var lastLogs=(lead.logEntries||[]).slice(-4).map(function(e){return(e.category||"note")+": "+((e.content||"").slice(0,60));}).join(" | ")||"none";
  var blocker=lead.blocker?(lead.blocker.text||lead.blocker.description||"present"):"none";
  var prompt="Diagnose this sales deal. Return JSON only, no markdown, no action suggestions.\n"+
    "Company: "+lead.company+"\n"+
    "Stage: "+stageName+"\n"+
    "Days since last contact: "+ds.lastContact+"\n"+
    "Days stuck in stage: "+ds.stuckDays+"\n"+
    "Blocker: "+blocker+"\n"+
    "Recent activity: "+lastLogs+"\n\n"+
    "Return exactly:\n"+
    "{\"currentState\":\"<what is objectively true now, max 12 words>\",\"risk\":\"<biggest risk if nothing changes, max 12 words>\",\"decidingQuestion\":\"<the one question that determines outcome, max 12 words>\"}";
  try{
    var resp=await orFetch(apiKey,prompt);
    var data=await resp.json();
    var text=(data.choices[0].message.content||"{}");
    var jsonMatch=text.match(/\{[\s\S]*\}/);
    var parsed=jsonMatch?JSON.parse(jsonMatch[0]):{};
    parsed.currentState=truncateAI(parsed.currentState||"Insufficient data",12);
    parsed.risk=truncateAI(parsed.risk||"Unknown",12);
    parsed.decidingQuestion=truncateAI(parsed.decidingQuestion||"What is the next step?",12);
    parsed.generatedAt=new Date().toISOString();
    return parsed;
  }catch(e){
    return{currentState:"Unable to diagnose",risk:"AI unavailable",decidingQuestion:"Check deal manually",generatedAt:new Date().toISOString()};
  }
}
async function generateWeeklyReport(dailyReports,apiKey){
  if(!apiKey||!dailyReports||!dailyReports.length)return null;
  var last7=dailyReports.slice(-7);
  var summaries=last7.map(function(r,i){
    return "Day "+(i+1)+" ("+new Date(r.date).toLocaleDateString()+"): "+(r.aiText||"");
  }).join("\n\n");
  var prompt="You are analysing "+last7.length+" daily sales summaries for a BDM. Return JSON only, no markdown.\n\nOnly report what you can directly observe in the data provided. If you cannot find evidence for a field, write 'No data yet'. Never invent numbers, percentages, or patterns that are not present in the data. A short honest report is better than a complete fabricated one.\n\nDaily summaries:\n"+summaries+"\n\nReturn exactly:\n{\"workingEmail\":\"<what is working best in email outreach based only on observed data, or 'No data yet'>\",\"workingCalls\":\"<what is working best in calls based only on observed data, or 'No data yet'>\",\"notWorking\":\"<what is not working across channels based only on observed data, or 'No data yet'>\",\"bestSignalType\":\"<best signal type by conversion based only on observed data, or 'No data yet'>\",\"bestOpener\":\"<best opener pattern based only on observed data, or 'No data yet'>\",\"bestContactRole\":\"<best contact role by full-cycle conversion based only on observed data, or 'No data yet'>\",\"avgTimeToProgression\":\"<average time from first signal to progression based only on observed data, or 'No data yet'>\"}";
  try{
    var resp=await orFetch(apiKey,prompt);
    var data=await resp.json();
    var text=(data.choices[0].message.content||"{}");
    var jsonMatch=text.match(/\{[\s\S]*\}/);
    var parsed=jsonMatch?JSON.parse(jsonMatch[0]):{};
    parsed.generatedAt=new Date().toISOString();
    parsed.daysAnalysed=last7.length;
    return parsed;
  }catch(e){
    return null;
  }
}

async function parseStructuredNote(raw, lead, apiKey){
  if(!raw||!lead||!apiKey)return null;
  var existingCts=(lead.contacts||[]).map(function(c){return c.name.toLowerCase();});
  var existDocs=(lead.dealRoom||[]).map(function(d){return d.name;}).join(", ");
  var prompt="Extract ALL structured data from this sales/meeting note for "+lead.company+". Return JSON only, no markdown, no explanation."
    +" NOTE: "+JSON.stringify(raw)
    +" Existing contacts: "+existingCts.join(", ")+"."
    +" Existing deal docs: "+(existDocs||"none")+"."
    +" OUTPUT JSON: {"
    +" contacts:[{name,title,email}],"
    +" subTasks:[{text,owner,dueDate}],"
    +" nextStep:{text,date},"
    +" blockers:[{text}],"
    +" meetingNote:string, generalContext:string"
    +" }"
    +" RULES:"
    +" contacts = new people NOT already in existing contacts list;"
    +" subTasks = every distinct action item, todo, follow-up — one object per item;"
    +" nextStep = single most important agreed next action with date if given;"
    +" meetingNote = start with one sentence: [who] at [company] — [key outcome]. Then full prose;"
    +" NEVER put meeting note content into subTasks;"
    +" generalContext = everything else not captured above: observations, background, context, company info, relationship notes — free text;"
    +" date format = ISO YYYY-MM-DD or empty string.";
  try{
    var resp=await orFetch(apiKey,prompt);
    var data=await resp.json();
    var txt=((data.choices&&data.choices[0]&&data.choices[0].message&&data.choices[0].message.content)||"{}").replace(/```json|```/g,"").trim();
    var jm=txt.match(/{[sS]*}/);
    return jm?JSON.parse(jm[0]):null;
  }catch(e){
    return null;
  }
}

async function getOrCreateGmailLabel(tok,name){
  if(!tok||!name)return null;
  try{
    var r=await fetch("https://www.googleapis.com/gmail/v1/users/me/labels",{headers:{Authorization:"Bearer "+tok}});
    var d=await r.json();
    var ex=(d.labels||[]).find(function(l){return l.name===name;});
    if(ex)return ex.id;
    var r2=await fetch("https://www.googleapis.com/gmail/v1/users/me/labels",{method:"POST",headers:{Authorization:"Bearer "+tok,"Content-Type":"application/json"},body:JSON.stringify({name:name,labelListVisibility:"labelShow",messageListVisibility:"show"})});
    var cr=await r2.json();
    return cr.id||null;
  }catch(e){return null;}
}
async function applyGmailLabel(tok,messageId,labelId){
  if(!tok||!messageId||!labelId)return;
  try{
    await fetch("https://www.googleapis.com/gmail/v1/users/me/messages/"+messageId+"/modify",{method:"POST",headers:{Authorization:"Bearer "+tok,"Content-Type":"application/json"},body:JSON.stringify({addLabelIds:[labelId]})});
  }catch(e){}
}
async function fetchGmailBody(tok,messageId){
  if(!tok||!messageId)return"";
  try{
    var r=await fetch("https://www.googleapis.com/gmail/v1/users/me/messages/"+messageId+"?format=full",{headers:{Authorization:"Bearer "+tok}});
    var d=await r.json();
    function xb(p){
      if(!p)return"";
      if(p.mimeType==="text/plain"&&p.body&&p.body.data){try{return atob(p.body.data.replace(/-/g,"+").replace(/_/g,"/"));}catch(e){return"";}}
      if(p.parts){for(var i=0;i<p.parts.length;i++){var b=xb(p.parts[i]);if(b)return b;}}
      return"";
    }
    return xb(d.payload)||d.snippet||"";
  }catch(e){return"";}
}

async function parseGranolaNote(text,lead,apiKey){
  if(!text||!apiKey)return null;
  var schema='{"summary":"max 20 words","dealProgression":"call_happened|meeting_booked|proposal_discussed|deal_advanced|deal_closed|relationship_maintained","nextStep":"max 10 words or null","contactName":"name or null"}';
  var prompt='Extract call outcome from this meeting note for '+lead.company+'. Return JSON only, no markdown.'
    +' NOTE: '+JSON.stringify(text.slice(0,2000))
    +' Return exactly: '+schema
    +' Rules: call_happened=just a call, meeting_booked=next meeting confirmed, proposal_discussed=pricing/RFP/proposal, deal_advanced=clear progress, deal_closed=signed/closed, relationship_maintained=catch-up.';
  try{
    var resp=await orFetch(apiKey,prompt);
    var data=await resp.json();
    var txt=((data.choices&&data.choices[0]&&data.choices[0].message&&data.choices[0].message.content)||"{}").replace(/```json|```/g,"").trim();
    var jm=txt.match(/\{[\s\S]*\}/);
    return jm?JSON.parse(jm[0]):null;
  }catch(e){return null;}
}

/* ── STEP 20B: URL DROP ENRICHMENT ─────────────────────────────────────────── */
function extractDomain(text){
  if(!text)return null;
  var m=text.match(/https?:\/\/([a-z0-9](?:[a-z0-9\-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9\-]{0,61}[a-z0-9])?)+)/i);
  if(m)return m[1].toLowerCase();
  var m2=text.match(/\b([a-z0-9](?:[a-z0-9\-]{0,61}[a-z0-9])?(?:\.[a-z]{2,}){1,3})\b/i);
  if(m2){var d=m2[1].toLowerCase();if(d.indexOf(".")!==-1&&!/^[\d.]+$/.test(d))return d;}
  return null;
}

/* ── STEP 20C2: ENRICHMENT USAGE TRACKING ────────────────────────────────────── */
var ENRICH_LIMITS={apollo:{contacts:50,exports_today:5},hunter:{searches:25},clay:{credits:100}};
function getEnrichmentUsage(){
  var now=new Date();
  var month=now.getFullYear()+"-"+String(now.getMonth()+1).padStart(2,"0");
  var today=now.toISOString().slice(0,10);
  try{
    var raw=localStorage.getItem("pcrm_v9_enrichment_usage");
    var u=raw?JSON.parse(raw):null;
    if(!u||u.month!==month){
      u={month:month,apollo:{contacts:0,exports_today:0,export_date:today},hunter:{searches:0},clay:{credits:0}};
    } else if(u.apollo.export_date!==today){
      u.apollo.exports_today=0;u.apollo.export_date=today;
    }
    return u;
  }catch(e){return{month:month,apollo:{contacts:0,exports_today:0,export_date:today},hunter:{searches:0},clay:{credits:0}};}
}
function saveEnrichmentUsage(u){try{localStorage.setItem("pcrm_v9_enrichment_usage",JSON.stringify(u));}catch(e){}}
function incrementEnrichUsage(provider,field){
  var u=getEnrichmentUsage();
  if(u[provider]&&field in u[provider]){u[provider][field]=(u[provider][field]||0)+1;saveEnrichmentUsage(u);}
}
function isEnrichLimitReached(provider){
  var u=getEnrichmentUsage();
  if(provider==="apollo")return u.apollo.contacts>=(ENRICH_LIMITS.apollo.contacts);
  if(provider==="hunter")return u.hunter.searches>=(ENRICH_LIMITS.hunter.searches);
  if(provider==="clay")return u.clay.credits>=(ENRICH_LIMITS.clay.credits);
  return false;
}

/* ── STEP 20C2: CLAY ENRICHMENT ───────────────────────────────────────────────── */
async function enrichViaClay(domain,firstName,lastName){
  var clayKey=localStorage.getItem("pcrm_v9_clay_key")||"";
  if(!clayKey||isEnrichLimitReached("clay"))return null;
  try{
    var body={domain:domain};
    if(firstName)body.first_name=firstName;
    if(lastName)body.last_name=lastName;
    var resp=await fetch("https://api.clay.com/v1/sources/people-search",{
      method:"POST",
      headers:{"Content-Type":"application/json","Authorization":"Bearer "+clayKey},
      body:JSON.stringify(body)
    });
    if(!resp.ok)return null;
    var data=await resp.json();
    incrementEnrichUsage("clay","credits");
    var person=(data.data&&data.data[0])||data;
    if(!person||(!person.email&&!person.first_name))return null;
    return{email:person.email||null,name:(person.first_name&&person.last_name)?person.first_name+" "+person.last_name:(person.first_name||person.last_name||null),title:person.title||null,source:"clay"};
  }catch(e){return null;}
}

/* ── STEP 20C2: ENRICHMENT WATERFALL ─────────────────────────────────────────── */
/* Waterfall: Apollo → Clay (company data); Apollo → Hunter → Clay (email) */
async function enrichWaterfall(domain,firstName,lastName,backendKey){
  var result={email:null,name:null,title:null,source:null,companyData:null,companySource:null};
  /* Company data: Apollo first, Clay second */
  var apolloKey=localStorage.getItem("pcrm_v9_apollo_key")||"";
  var apolloOk=apolloKey&&!isEnrichLimitReached("apollo");
  if(apolloOk){
    try{
      var aResp=await fetch("http://178.104.168.218:3000/apollo-search",{method:"POST",headers:{"Content-Type":"application/json","x-pcrm-key":backendKey||""},body:JSON.stringify({domain:domain,firstName:firstName,lastName:lastName})});
      if(aResp.ok){var aData=await aResp.json();if(aData.success&&aData.data){incrementEnrichUsage("apollo","contacts");result.companyData=aData.data;result.companySource="apollo";if(aData.data.email){result.email=aData.data.email;result.name=aData.data.name||null;result.title=aData.data.title||null;result.source="apollo";}}}
    }catch(e){}
  }
  if(!result.companyData){
    var clayCompany=await enrichViaClay(domain,firstName,lastName);
    if(clayCompany){result.companyData=clayCompany;result.companySource="clay";if(clayCompany.email&&!result.email){result.email=clayCompany.email;result.name=clayCompany.name||null;result.title=clayCompany.title||null;result.source="clay";}}
  }
  /* Email: Apollo already checked → Hunter second → Clay third */
  if(!result.email){
    var hKey=localStorage.getItem("pcrm_v9_hunter_key")||"";
    var hunterOk=hKey&&!isEnrichLimitReached("hunter");
    if(hunterOk){
      try{
        var hResp=await fetch("http://178.104.168.218:3000/hunter",{method:"POST",headers:{"Content-Type":"application/json","x-pcrm-key":backendKey||""},body:JSON.stringify({type:"email-finder",domain:domain,firstName:firstName,lastName:lastName,hunterApiKey:hKey})});
        if(hResp.ok){var hData=await hResp.json();if(hData.success&&hData.email){incrementEnrichUsage("hunter","searches");result.email=hData.email;result.source="hunter";}}
      }catch(e){}
    }
    if(!result.email){
      var clayEmail=await enrichViaClay(domain,firstName,lastName);
      if(clayEmail&&clayEmail.email){result.email=clayEmail.email;result.name=result.name||clayEmail.name||null;result.title=result.title||clayEmail.title||null;result.source="clay";}
    }
  }
  return result;
}

function triggerUrlDropEnrichment(leadId,domain){
  var webhookUrl=null;
  try{
    var settings=JSON.parse(localStorage.getItem("pcrm_v9_settings")||"{}");
    webhookUrl=settings.n8nWebhookUrl||localStorage.getItem("pcrm_v9_n8n_webhook_url")||null;
  }catch(e){}
  if(!webhookUrl)return;
  var payload={leadId:leadId,domain:domain,source:"url_drop",requestId:(typeof uid==="function"?uid("enr"):Math.random().toString(36).slice(2)),updatedAt:new Date().toISOString()};
  fetch(webhookUrl,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)}).catch(function(){});
}
