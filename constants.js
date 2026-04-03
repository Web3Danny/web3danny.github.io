/* \u2500\u2500 DESIGN TOKENS \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
const C = {
  acc:"#0BE881", info:"#0BE881", warn:"#FECA57", danger:"#FF6B6B",
  bg:"#0F0F0F", surf:"#1C1C1C", surf2:"#242424", surf3:"#2C2C2C",
  line:"#4A4A4A", line2:"#383838",
  text:"#F0F0F0", muted:"#888888", dim:"#BBBBBB",
  shadow:"0 2px 12px rgba(0,0,0,0.5)",
  shadowLg:"0 8px 32px rgba(0,0,0,0.7)",
  radius:"8px", radiusSm:"5px", radiusLg:"12px",
};

/* \u2500\u2500 CONSTANTS \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
const PIPE = [
  {id:0,code:"SIGNAL",    label:"Signal Sent",     sub:"First outreach made",          clr:"#1B5E3B"},
  {id:1,code:"ECHO",      label:"Echo Received",   sub:"Response or feedback obtained", clr:"#2E8B57"},
  {id:2,code:"LOCKED",    label:"Interest Locked", sub:"Genuine interest confirmed",    clr:"#3CB371"},
  {id:3,code:"DEEP DIVE", label:"Deep Dive",       sub:"In evaluation / discovery",     clr:"#50E88A"},
  {id:4,code:"ON THE WIRE",label:"On the Wire",    sub:"Signing process initiated",     clr:"#0BE881"},
];
const PIPE_NONE = -1;
const CRITERIA = [
  {id:"decisionMaker",label:"Decision-Maker Access",short:"DM ACCESS",clr:"#FFE066"},
  {id:"engagement",   label:"Engagement / Intent",  short:"INTENT",   clr:"#0BE881"},
  {id:"companySize",  label:"Company Size / Revenue",short:"SIZE/REV", clr:"#888888"},
  {id:"industryFit",  label:"Industry Fit",          short:"IND FIT",  clr:"#888888"},
  {id:"budget",       label:"Budget Signals",        short:"BUDGET",   clr:"#FF9F43"},
  {id:"painPoint",    label:"Pain Point Match",      short:"PAIN FIT", clr:"#0BE881"},
];
const DEF_WEIGHTS = {decisionMaker:20,engagement:15,companySize:15,industryFit:20,budget:15,painPoint:15};
const DEF_ICP = {productDescription:"",targetIndustries:"",targetSize:"",idealBudget:"",painPoints:"",bdmName:"",currency:"€"};
const STATUSES = ["new","contacted","qualified","not_fit"];
const ST_META = {
  new:      {label:"New",       clr:"#78909C", bg:"rgba(120,144,156,0.12)"},
  contacted:{label:"Contacted", clr:"#888888", bg:"rgba(136,136,136,0.12)"},
  qualified:{label:"Qualified", clr:"#888888", bg:"rgba(136,136,136,0.12)"},
  not_fit:  {label:"Not a fit", clr:"#78909C", bg:"rgba(120,144,156,0.12)"},
};
const LOG_CATS = {
  call_transcript:{label:"Call Transcript",   icon:"📞",clr:"#999999"},
  call_summary:   {label:"Call Summary",      icon:"📞",clr:"#999999"},
  email:          {label:"Email",             icon:"📧",clr:"#999999"},
  meeting_notes:  {label:"Meeting Notes",     icon:"📋",clr:"#999999"},
  news:           {label:"Company News",      icon:"📰",clr:"#999999"},
  strategy:       {label:"Strategy Note",     icon:"💡",clr:"#999999"},
  message:        {label:"WhatsApp/LinkedIn", icon:"💬",clr:"#999999"},
  note:           {label:"Note",              icon:"📝",clr:"#999999"},
};
const OUTPUT_TYPES = [
  {id:"first_outreach",label:"First Outreach",      icon:"✦",desc:"Cold intro"},
  {id:"follow_up_cold",label:"Follow-up (No Reply)",icon:"\u21a9",desc:"After silence"},
  {id:"post_call",     label:"Post-Call Email",     icon:"📞",desc:"After conversation"},
  {id:"re_engagement", label:"Re-engagement",       icon:"🔄",desc:"Gone cold"},
  {id:"proposal",      label:"Proposal",            icon:"📋",desc:"Next step"},
  {id:"linkedin",      label:"LinkedIn",            icon:"💼",desc:"Short & direct"},
];
const TONES = [{id:"formal",label:"Formal"},{id:"casual",label:"Casual"},{id:"short",label:"Short"}];
const BLOCKER_TYPES = ["internal","external"];
const DOC_STATUSES = ["needed","in_progress","sent","received","approved"];
const DOC_STATUS_META = {
  needed:{label:"Needed",clr:"#888888",icon:"\u25cb"},
  in_progress:{label:"In Progress",clr:"#FFE066",icon:"\u25d0"},
  sent:{label:"Sent",clr:"#FF9F43",icon:"\u25d1"},
  received:{label:"Received",clr:"#3CB371",icon:"\u25d5"},
  approved:{label:"Approved",clr:"#0BE881",icon:"●"}
};
const DEAL_DOCS = [
  {id:"nda",name:"NDA",stages:[0,1],category:"legal"},
  {id:"proposal",name:"Proposal / Pricing",stages:[2],category:"commercial"},
  {id:"roi",name:"ROI Calculation",stages:[2],category:"commercial"},
  {id:"tech_spec",name:"Technical Integration Spec",stages:[3],category:"technical"},
  {id:"security_q",name:"Security Questionnaire",stages:[3],category:"compliance"},
  {id:"compliance_kyb",name:"Compliance / KYB Docs",stages:[3],category:"compliance"},
  {id:"contract",name:"Contract / MSA / SLA",stages:[4],category:"legal"},
  {id:"onboarding",name:"Onboarding Checklist",stages:[4],category:"operations"}
];
const SK = {leads:"pcrm_v9_leads",icp:"pcrm_v9_icp",weights:"pcrm_v9_weights",statsHistory:"pcrm_v9_stats",reminders:"pcrm_v9_reminders",apiKey:"pcrm_v9_apikey",strategy:"pcrm_v9_strategy",lastBackup:"pcrm_v9_lastbackup",scheduledEmails:"pcrm_v9_scheduled",weeklyGoal:"pcrm_v9_wgoal",emailTemplates:"pcrm_v9_templates",internalTeam:"pcrm_v9_team",qna:"pcrm_v9_qna",compIntel:"pcrm_v9_compintel"};
const NEXT_STEP_TYPES=[
  {id:"email",label:"Email",icon:"📧"},
  {id:"call",label:"Call",icon:"📞"},
  {id:"meeting",label:"Meeting",icon:"📅"},
  {id:"proposal",label:"Proposal",icon:"📋"},
  {id:"followup",label:"Follow-up",icon:"\u21a9"},
  {id:"other",label:"Other",icon:"\u26a1"},
];
const STAGE_NEXT_STEPS={
  "-1":["Research the company and find the right contact","Send a cold intro email","Connect on LinkedIn"],
  "0":["Follow up on the intro email","Schedule a discovery call","Share a relevant case study"],
  "1":["Send a product demo or overview","Book a discovery call","Send pricing information"],
  "2":["Send a formal proposal","Schedule a deep-dive call","Introduce the technical team"],
  "3":["Follow up on contract review","Confirm legal sign-off","Agree on implementation timeline"],
  "4":["Schedule kick-off meeting","Complete onboarding checklist","Follow up on renewal date"],
};
const COMP_STATUSES=[{id:"evaluating",label:"Evaluating",clr:"#FECA57"},{id:"pilot",label:"Pilot",clr:"#48DBFB"},{id:"using",label:"Using",clr:"#FF9F43"},{id:"integrated",label:"Integrated",clr:"#FF6B6B"},{id:"exclusive",label:"Exclusive",clr:"#FF6B6B"},{id:"in_procurement",label:"In Procurement",clr:"#A29BFE"},{id:"parallel",label:"Running Parallel",clr:"#FFA502"},{id:"replacing",label:"Replacing Us",clr:"#FF4757"},{id:"replaced",label:"Replaced",clr:"#888888"}];
const DAYS_SHORT = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MONTHS_NLP = ["january","february","march","april","may","june","july","august","september","october","november","december"];
const DAY_NAMES  = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];

/* \u2500\u2500 HELPERS \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
const DEF_STRATEGY = {
  kpiTargets:{acv:0,netNewNames:0,pipelineValue:0,retention:90},
  mindMap:{nodes:[{id:"root",text:"My Annual Goal",x:400,y:250,parentId:null,color:"#0BE881"}]}
};
const DEF_SEQUENCES = {
  aiInstructions:"Write professional but warm emails. Be concise (under 120 words for cold, under 80 for follow-ups). Focus on value and market context, not features. Never be pushy.",
  sequences:[{
    id:"seq_wallets",
    name:"Wallets campaign",
    steps:[
      {id:"s1",name:"Cold Intro",channel:"email",dayOffset:0,subject:"{{company}} \u2014 a thought",body:"Hi {{first_name}},\n\nI wanted to reach out as I believe we might have something relevant for {{company}}.\n\nWould you be open to a quick 15-min call this week?\n\nBest,\n{{my_name}}",enabled:true},
      {id:"s2",name:"Follow-up 1",channel:"email",dayOffset:3,subject:"Re: {{company}} \u2014 quick follow-up",body:"Hi {{first_name}},\n\nJust following up on my note from a few days ago. Happy to share a quick case study if useful.\n\nBest,\n{{my_name}}",enabled:true},
      {id:"s3",name:"Value Touch",channel:"linkedin",dayOffset:7,subject:"",body:"Hi {{first_name}}, I've been following {{company}}'s work. I'd love to connect \u2014 we've been helping similar teams with {{value_proposition}}.",enabled:true},
      {id:"s4",name:"Demo Ask",channel:"email",dayOffset:14,subject:"15 min for {{company}}?",body:"Hi {{first_name}},\n\nWould a 15-min call next week make sense? I'll share one specific idea relevant to {{company}}.\n\nBest,\n{{my_name}}",enabled:true},
      {id:"s5",name:"Breakup",channel:"email",dayOffset:30,subject:"Closing the loop \u2014 {{company}}",body:"Hi {{first_name}},\n\nI'll keep this short \u2014 I won't reach out again unless it makes sense.\n\nWishing you all the best.\n\n{{my_name}}",enabled:true}
    ],
    leadProgress:{
      "lead_web3danny":{currentStep:0,history:[],sentCount:0,replyCount:0,bounced:false,optedOut:false,nextUnlockAt:null,addedAt:new Date(Date.now()-7*86400000).toISOString()},
      "test_vaultchain_001":{currentStep:1,history:[{stepIdx:0,sentAt:new Date(Date.now()-2*86400000).toISOString(),to:"marcus@vaultchain.io"}],sentCount:1,replyCount:0,bounced:false,optedOut:false,nextUnlockAt:new Date(Date.now()+3*86400000).toISOString(),addedAt:new Date(Date.now()-7*86400000).toISOString()},
      "cb_c1":{currentStep:2,history:[{stepIdx:0,sentAt:new Date(Date.now()-7*86400000).toISOString(),to:"sarah@cryptobase.io"},{stepIdx:1,sentAt:new Date(Date.now()-2*86400000).toISOString(),to:"sarah@cryptobase.io"}],sentCount:2,replyCount:1,bounced:false,optedOut:false,nextUnlockAt:new Date(Date.now()+3*86400000).toISOString(),addedAt:new Date(Date.now()-7*86400000).toISOString()},
      "cb_c2":{currentStep:2,history:[{stepIdx:0,sentAt:new Date(Date.now()-7*86400000).toISOString(),to:"james@cryptobase.io"},{stepIdx:1,sentAt:new Date(Date.now()-2*86400000).toISOString(),to:"james@cryptobase.io"}],sentCount:2,replyCount:0,bounced:false,optedOut:false,nextUnlockAt:new Date(Date.now()+7*86400000).toISOString(),addedAt:new Date(Date.now()-7*86400000).toISOString()},
      "cb_c3":{currentStep:3,history:[{stepIdx:0,sentAt:new Date(Date.now()-7*86400000).toISOString(),to:"mia@cryptobase.io"},{stepIdx:1,sentAt:new Date(Date.now()-2*86400000).toISOString(),to:"mia@cryptobase.io"},{stepIdx:2,sentAt:new Date(Date.now()-86400000).toISOString(),to:"mia@cryptobase.io"}],sentCount:3,replyCount:0,bounced:false,optedOut:false,nextUnlockAt:new Date(Date.now()+7*86400000).toISOString(),addedAt:new Date(Date.now()-7*86400000).toISOString()},
      "cb_c4":{currentStep:3,history:[{stepIdx:0,sentAt:new Date(Date.now()-7*86400000).toISOString(),to:"leo@cryptobase.io"},{stepIdx:1,sentAt:new Date(Date.now()-2*86400000).toISOString(),to:"leo@cryptobase.io"},{stepIdx:2,sentAt:new Date(Date.now()-86400000).toISOString(),to:"leo@cryptobase.io"}],sentCount:3,replyCount:1,bounced:false,optedOut:false,nextUnlockAt:new Date(Date.now()+3*86400000).toISOString(),addedAt:new Date(Date.now()-7*86400000).toISOString()},
      "cb_c5":{currentStep:4,history:[{stepIdx:0,sentAt:new Date(Date.now()-7*86400000).toISOString(),to:"nina@cryptobase.io"},{stepIdx:1,sentAt:new Date(Date.now()-2*86400000).toISOString(),to:"nina@cryptobase.io"},{stepIdx:2,sentAt:new Date(Date.now()-86400000).toISOString(),to:"nina@cryptobase.io"},{stepIdx:3,sentAt:new Date(Date.now()-86400000).toISOString(),to:"nina@cryptobase.io"}],sentCount:4,replyCount:0,bounced:false,optedOut:true,nextUnlockAt:null,addedAt:new Date(Date.now()-7*86400000).toISOString()}
    }
  }]
};
const DEF_CAMPAIGNS = [
  {id:"camp_default",name:"Cold Outreach",createdAt:new Date().toISOString(),steps:[
    {id:"s1",name:"Cold Intro",channel:"email",delayHours:0,subject:"{{company}} — a thought",body:"Hi {{first_name}},\n\nI wanted to reach out as I believe we might have something relevant for {{company}}.\n\nWould you be open to a quick 15-min call this week?\n\nBest,\n{{my_name}}"},
    {id:"s2",name:"Follow-up 1",channel:"email",delayHours:72,subject:"Re: {{company}} — quick follow-up",body:"Hi {{first_name}},\n\nJust following up on my note from a few days ago. Happy to share a quick case study if useful.\n\nBest,\n{{my_name}}"},
    {id:"s3",name:"LinkedIn Touch",channel:"linkedin",delayHours:168,subject:"Connecting",body:"Hi {{first_name}}, I've been following {{company}}'s work. I'd love to connect."},
    {id:"s4",name:"Demo Ask",channel:"email",delayHours:336,subject:"15 min for {{company}}?",body:"Hi {{first_name}},\n\nWould a 15-min call next week make sense?\n\nBest,\n{{my_name}}"},
    {id:"s5",name:"Breakup",channel:"email",delayHours:720,subject:"Closing the loop — {{company}}",body:"Hi {{first_name}},\n\nI won't reach out again unless it makes sense. Wishing you all the best.\n\n{{my_name}}"}
  ],enrolledLeads:{}}
];


function calcScore(scores,weights){
  const t=CRITERIA.reduce(function(a,cr){return a+(scores[cr.id]||5)*(weights[cr.id]||15);},0);
  const w=CRITERIA.reduce(function(a,cr){return a+(weights[cr.id]||15);},0);
  return w>0?Math.round((t/(w*10))*100):0;
}
function calcAxes(scores){
  return {
    ease:Math.round(((scores.decisionMaker||5)+(scores.engagement||5))/2*10),
    value:Math.round(((scores.industryFit||5)+(scores.companySize||5)+(scores.budget||5)+(scores.painPoint||5))/4*10),
  };
}
function getQuadrant(ease,value){
  if(ease>=50&&value>=50)return{label:"QUICK WINS",  clr:"#0BE881"};
  if(ease<50 &&value>=50)return{label:"STRATEGIC",   clr:"#FFE066"};
  if(ease>=50&&value<50) return{label:"LOW-HANGING",  clr:"#FF9F43"};
  return                        {label:"DEPRIORITIZE",clr:"#888888"};
}
function scoreClr(v){return v>=75?"#FF9F43":v>=50?"#0BE881":v>=25?"#48DBFB":"#888888";}
function scoreTier(v){return v>=75?"HOT":v>=50?"WARM":v>=25?"COLD":"SKIP";}
function pipeClr(idx){return(idx>=0&&idx<PIPE.length)?PIPE[idx].clr:C.muted;}
function pipeStage(l){return(l&&typeof l.pipeline==="number"&&l.pipeline>=0)?l.pipeline:PIPE_NONE;}
function isBlocked(l){return !!(l&&l.blocker);}
function calcDynamicScore(lead,icp,weights){
  var now=Date.now(),DAY=86400000,base=lead.totalScore||calcScore(lead.scores||{},weights||{});
  var logs=(lead.logEntries||[]).map(function(e){return new Date(e.timestamp).getTime();}).filter(function(t){return t>0;});
  var pipeHist=(lead.pipelineHistory||[]).map(function(h){return new Date(h.timestamp).getTime();}).filter(function(t){return t>0;});
  var allDates=logs.concat(pipeHist);
  var lastContactMs=allDates.length>0?Math.max.apply(null,allDates):new Date(lead.createdAt||now).getTime();
  var daysSinceLast=Math.max(0,Math.round((now-lastContactMs)/DAY));
  var recency=Math.max(0,Math.round(100-daysSinceLast*3.3));
  var last30=allDates.filter(function(t){return(now-t)<30*DAY;}).length;
  var engagement=Math.min(100,last30*12);
  var ps=pipeStage(lead),stuckDays=0;
  if(ps>=0&&pipeHist.length>0){stuckDays=Math.round((now-Math.max.apply(null,pipeHist))/DAY);}
  else if(ps===PIPE_NONE){stuckDays=Math.round((now-new Date(lead.createdAt||now).getTime())/DAY);}
  var momentum=0;
  if(pipeHist.length>=2){var sorted=pipeHist.slice().sort();var avgGap=(sorted[sorted.length-1]-sorted[0])/(sorted.length-1)/DAY;momentum=avgGap<7?100:avgGap<14?75:avgGap<30?50:avgGap<60?25:0;}
  else if(pipeHist.length===1){momentum=50;}
  var risks=[];
  if(daysSinceLast>=14)risks.push("No contact 14d+");
  if(stuckDays>=21)risks.push("Stuck "+stuckDays+"d");
  if(isBlocked(lead))risks.push("Blocked");
  if(engagement<25&&ps>=0)risks.push("Low engagement");
  var dynamic=Math.round(base*0.5+recency*0.2+engagement*0.15+momentum*0.15);
  if(isBlocked(lead))dynamic=Math.max(0,dynamic-10);
  return{dynamic:dynamic,recency:recency,momentum:momentum,engagement:engagement,risks:risks,lastContact:daysSinceLast,stuckDays:stuckDays};
}
function fmtDate(iso){
  try{const d=new Date(iso);return d.toLocaleDateString("en-US",{month:"short",day:"numeric"})+" "+d.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"});}
  catch(_){return "";}
}
function fmtDateShort(iso){
  if(!iso)return"";
  try{return new Date(iso).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});}
  catch(_){return iso;}
}
function uid(p){return p+"_"+Date.now()+"_"+Math.random().toString(36).slice(2,6);}
function makeContact(o){return Object.assign({id:uid("c"),name:"",title:"",email:"",phone:"",linkedin:"",notes:"",lastContacted:""},o||{});}
function makeLead(data,weights){
  return {id:uid("lead"),aiPitch:"",createdAt:new Date().toISOString(),
    pipeline:PIPE_NONE,pipelineHistory:[],contacts:[],blocker:null,blockerHistory:[],
    logEntries:[],summary:{currentStatus:"",latestUpdate:"",goal:"",generatedAt:null},
    dealValue:0,closedAt:null,dealRoom:[],
    accountData:{renewalDate:"",healthScore:"happy",upsellStatus:"none",upsellNotes:"",qbrDate:"",supportIssues:"",accountNotes:""},
    ...data,totalScore:calcScore(data.scores||{},weights)};
}
function computeSnapshot(leads){
  return {total:leads.length,
    hot:leads.filter(function(l){return l.totalScore>=75;}).length,
    qualified:leads.filter(function(l){return l.status==="qualified";}).length,
    blocked:leads.filter(function(l){return isBlocked(l);}).length,
    avg:leads.length?Math.round(leads.reduce(function(a,l){return a+l.totalScore;},0)/leads.length):0};
}
function primaryContact(l){return(l.contacts&&l.contacts.length>0)?l.contacts[0]:null;}
function activityDots(lead){
  var now=Date.now(),DAY=86400000;
  var logs=(lead.logEntries||[]).filter(function(e){return(now-new Date(e.timestamp).getTime())<30*DAY;});
  var count=Math.min(logs.length,8);
  if(count===0)return null;
  var dots=[];
  for(var i=0;i<count;i++){
    var age=i<logs.length?Math.round((now-new Date(logs[i].timestamp).getTime())/DAY):30;
    var opacity=age<3?1:age<7?0.7:age<14?0.5:0.3;
    dots.push({opacity:opacity});
  }
  return dots;
}
function isOptedOut(contact){return !!(contact&&contact.optedOut);}
function getOptOutReason(contact){return contact&&contact.optOutReason||"";}
function parseNextStep(ns){if(!ns)return null;if(typeof ns==="string")return{action:ns,type:"other",dueDate:null,createdAt:null};return ns;}
function nextStepUrgencyClr(dueDate){if(!dueDate)return C.muted;var days=Math.ceil((new Date(dueDate)-new Date())/86400000);if(days<0)return C.danger;if(days===0)return"#FECA57";if(days<=2)return"#FF9F43";return C.dim;}
function fmtNextStepDate(iso){if(!iso)return"";try{return new Date(iso).toLocaleDateString("en-US",{month:"short",day:"numeric"});}catch(_){return"";}}

function categorize(text){
  const lo=text.toLowerCase(),w=text.split(/\s+/).length;
  if(w>150&&(lo.indexOf(" said ")>=0||lo.indexOf(" mentioned ")>=0||lo.indexOf(" asked ")>=0))return"call_transcript";
  if(lo.indexOf("subject:")>=0||lo.indexOf("from:")>=0||lo.indexOf("best regards")>=0||lo.indexOf("dear ")>=0)return"email";
  if(lo.indexOf("whatsapp")>=0||lo.indexOf("linkedin message")>=0)return"message";
  if(lo.indexOf("funding")>=0||lo.indexOf(" raised ")>=0||lo.indexOf("announced")>=0||lo.indexOf("launched")>=0)return"news";
  if(w<150&&(lo.indexOf("spoke")>=0||lo.indexOf("called")>=0||lo.indexOf("summary")>=0||lo.indexOf("recap")>=0))return"call_summary";
  if(lo.indexOf("action item")>=0||lo.indexOf("next step")>=0||lo.indexOf("agreed to")>=0)return"meeting_notes";
  if(lo.indexOf("i think")>=0||lo.indexOf("we should")>=0||lo.indexOf("strategy")>=0)return"strategy";
  return"note";
}

/* \u2500\u2500 NLP DATE PARSER \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
function parseNaturalDate(text){
  if(!text)return null;
  const now=new Date(),lo=text.toLowerCase();
  function setT(d,h,m){d.setHours(h,m||0,0,0);return d;}
  function nextWD(di){const d=new Date(now),diff=(di-d.getDay()+7)%7||7;d.setDate(d.getDate()+diff);return d;}
  let hour=9,min=0,hasTime=false;
  const ampm=lo.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/);
  if(ampm){hasTime=true;hour=parseInt(ampm[1]);min=parseInt(ampm[2]||"0");if(ampm[3]==="pm"&&hour!==12)hour+=12;if(ampm[3]==="am"&&hour===12)hour=0;}
  const t24=lo.match(/\b(\d{1,2}):(\d{2})\b/);
  if(!hasTime&&t24){hasTime=true;hour=parseInt(t24[1]);min=parseInt(t24[2]);}
  const dbm=lo.match(/(?:day before|eve of|evening before|night before)\s+(\w+)/);
  if(dbm){
    const ref=dbm[1];let refDate=null;
    if(ref.indexOf("tomorrow")>=0){refDate=new Date(now);refDate.setDate(refDate.getDate()+1);}
    else{for(let i=0;i<DAY_NAMES.length;i++){if(ref.indexOf(DAY_NAMES[i].slice(0,3))===0||ref===DAY_NAMES[i]){refDate=nextWD(i);break;}}}
    if(refDate){refDate.setDate(refDate.getDate()-1);return setT(refDate,hasTime?hour:17,min);}
  }
  const inM=lo.match(/\bin (\d+) (day|hour|week)s?\b/);
  if(inM){const d=new Date(now),n=parseInt(inM[1]);
    if(inM[2]==="day")d.setDate(d.getDate()+n);
    else if(inM[2]==="week")d.setDate(d.getDate()+n*7);
    else d.setTime(d.getTime()+n*3600000);
    return setT(d,inM[2]==="hour"?d.getHours():(hasTime?hour:9),min);}
  if(lo.indexOf("today")>=0){const d=new Date(now);return setT(d,hasTime?hour:9,min);}
  if(lo.indexOf("tomorrow")>=0){const d=new Date(now);d.setDate(d.getDate()+1);return setT(d,hasTime?hour:9,min);}
  if(lo.indexOf("tmw")>=0||lo.indexOf("tom ")>=0||lo.indexOf("tonite")>=0||lo.indexOf("tonight")>=0){const d=new Date(now);d.setDate(d.getDate()+1);return setT(d,hasTime?hour:9,min);}
  if(lo.indexOf("next week")>=0){const d=new Date(now);d.setDate(d.getDate()+7);return setT(d,hasTime?hour:9,min);}
  for(let i=0;i<DAY_NAMES.length;i++){if(lo.indexOf(DAY_NAMES[i])>=0){const d=nextWD(i);return setT(d,hasTime?hour:9,min);}}
  for(let i=0;i<MONTHS_NLP.length;i++){
    if(lo.indexOf(MONTHS_NLP[i])>=0){
      const am=lo.slice(lo.indexOf(MONTHS_NLP[i])+MONTHS_NLP[i].length).match(/\s*(\d{1,2})/);
      const bm=lo.slice(0,lo.indexOf(MONTHS_NLP[i])).match(/(\d{1,2})\s*$/);
      const day=parseInt((am||bm||["","1"])[1]);
      const d=new Date(now.getFullYear(),i,day);
      if(d<now)d.setFullYear(d.getFullYear()+1);
      return setT(d,hasTime?hour:9,min);}}
  const sl=lo.match(/\b(\d{1,2})\/(\d{1,2})\b/);
  if(sl){const a=parseInt(sl[1]),b=parseInt(sl[2]);
    const d1=new Date(now.getFullYear(),a-1,b),d2=new Date(now.getFullYear(),b-1,a);
    const cand=d1>=now?d1:(d2>=now?d2:d1);return setT(cand,hasTime?hour:9,min);}
  return null;
}
function fmtReminder(iso){
  if(!iso)return"";
  const d=new Date(iso),now=new Date(),ms=d-now;
  const mi=Math.round(ms/60000),hr=Math.round(ms/3600000),dy=Math.round(ms/86400000);
  if(ms<0){const am=Math.abs(mi),ah=Math.abs(hr),ad=Math.abs(dy);
    if(am<60)return"overdue "+am+"m";if(ah<24)return"overdue "+ah+"h";return"overdue "+ad+"d";}
  if(mi<60)return"in "+mi+"m";if(hr<24)return"in "+hr+"h";
  if(dy===1)return"tomorrow "+d.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"});
  if(dy<7)return DAYS_SHORT[d.getDay()]+" "+d.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"});
  return d.toLocaleDateString("en-US",{month:"short",day:"numeric"})+" "+d.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"});
}
function parseSmartNotes(notesText,lead){
  if(!notesText||!notesText.trim())return{cleanNotes:notesText,newReminders:[]};
  const lo=notesText.toLowerCase();
  const TRIGGERS=["please set reminder","please remind me","set a reminder","set reminder","remind me","add reminder","create reminder"];
  const hasTrigger=TRIGGERS.some(function(t){return lo.indexOf(t)>=0;});
  if(!hasTrigger)return{cleanNotes:notesText,newReminders:[]};
  const eventDate=parseNaturalDate(notesText);
  if(!eventDate)return{cleanNotes:notesText,newReminders:[],needsDate:true};
  function getOffset(t){
    if(t.indexOf("24h before")>=0||t.indexOf("day before")>=0||t.indexOf("the day before")>=0)return 0;
    if(t.indexOf("48h before")>=0||t.indexOf("2 days before")>=0)return 48*60;
    if(t.indexOf("2 hours before")>=0||t.indexOf("2h before")>=0)return 120;
    if(t.indexOf("1 hour before")>=0||t.indexOf("an hour before")>=0)return 60;
    if(t.indexOf("30 min before")>=0)return 30;
    return 0;
  }
  const offsetMinutes=getOffset(lo);
  const reminderDate=new Date(eventDate);
  if(offsetMinutes===-1)reminderDate.setHours(8,0,0,0);
  else if(offsetMinutes>0)reminderDate.setTime(reminderDate.getTime()-offsetMinutes*60000);
  const contacts=(lead&&lead.contacts)||[];
  let mentionedContact=null;
  for(let ci=0;ci<contacts.length;ci++){
    const ct=contacts[ci];
    if(ct.name){const fn=ct.name.split(" ")[0].toLowerCase();if(fn.length>1&&lo.indexOf(fn)>=0){mentionedContact=ct;break;}}
  }
  function buildClean(t){
    const parts=t.split(/[.!?]/);
    const keep=[];
    for(let pi=0;pi<parts.length;pi++){
      const p=parts[pi].trim();if(!p)continue;
      const pl=p.toLowerCase();
      if(!TRIGGERS.some(function(tr){return pl.indexOf(tr)>=0;}))keep.push(p);
    }
    return keep.join(". ").trim()||t.split(".")[0].trim();
  }
  const cleanNotes=buildClean(notesText);
  let reminderText=cleanNotes||("Reminder for "+(lead?lead.company:"lead"));
  if(mentionedContact)reminderText+=" with "+mentionedContact.name+(mentionedContact.title?" ("+mentionedContact.title+")":"");
  return{cleanNotes,newReminders:[{
    id:uid("rem"),text:reminderText.trim(),dueAt:reminderDate.toISOString(),
    linkedCompany:lead?lead.company:null,linkedLeadId:lead?lead.id:null,
    linkedContactId:mentionedContact?mentionedContact.id:null,
    linkedContactName:mentionedContact?mentionedContact.name:null,
    done:false,createdAt:new Date().toISOString(),
  }]};
}

/* \u2500\u2500 STYLE SYSTEM \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
const INP = {
  width:"100%",background:C.surf3,border:"1px solid "+C.line,borderRadius:C.radiusSm,
  padding:"9px 12px",color:C.text,fontSize:13,boxSizing:"border-box",
  outline:"none",fontFamily:"'Barlow',sans-serif",letterSpacing:0.1,
  transition:"border-color 0.15s",
};
const BTN = {
  primary:  {background:"#E8E8E8",border:"none",borderRadius:C.radiusSm,padding:"9px 20px",color:"#0F0F0F",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:13,letterSpacing:0.8,cursor:"pointer",textTransform:"uppercase"},
  secondary:{background:"transparent",border:"1px solid "+C.line,borderRadius:C.radiusSm,padding:"8px 16px",color:C.dim,fontFamily:"'Barlow',sans-serif",fontWeight:500,fontSize:13,cursor:"pointer"},
  danger:   {background:"rgba(255,107,107,0.1)",border:"1px solid rgba(255,107,107,0.3)",borderRadius:C.radiusSm,padding:"6px 12px",color:C.danger,fontFamily:"'Barlow',sans-serif",fontWeight:600,fontSize:12,cursor:"pointer"},
  ghost:    {background:"transparent",border:"none",borderRadius:C.radiusSm,padding:"5px 8px",color:C.muted,cursor:"pointer",fontSize:13},
  sm:       {background:"transparent",border:"1px solid "+C.line,borderRadius:C.radiusSm,padding:"4px 10px",color:C.dim,fontSize:11,cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:0.5},
  smRed:    {background:"rgba(255,107,107,0.1)",border:"1px solid rgba(255,107,107,0.3)",borderRadius:C.radiusSm,padding:"4px 10px",color:C.danger,fontSize:11,cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif"},
  smGreen:  {background:"rgba(11,232,129,0.08)",border:"1px solid rgba(198,255,0,0.3)",borderRadius:C.radiusSm,padding:"4px 10px",color:C.acc,fontSize:11,cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif"},
  icon:     {background:"transparent",border:"none",padding:"4px",color:C.muted,cursor:"pointer",fontSize:14,borderRadius:"4px",lineHeight:1},
};
const LBL = {
  color:C.muted,fontSize:10,textTransform:"uppercase",letterSpacing:1.4,
  display:"block",marginBottom:5,fontFamily:"'Barlow Condensed',sans-serif",fontWeight:600,
};
function card(accent,noPad){
  return {background:C.surf,border:"1px solid "+(accent?accent+"28":C.line),
    borderRadius:C.radius,padding:noPad?0:20,position:"relative",
    boxShadow:C.shadow};
}
