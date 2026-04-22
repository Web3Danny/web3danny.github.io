/* ── VERSION ─────────────────────────────────────────────────────────────────── */
const VERSION = '04.22.21';

/* ── AI MODEL ───────────────────────────────────────────────────────────────── */
const GROQ_LLAMA = "llama-3.3-70b-versatile";

function checkStorageSize(){
  var leadsVal=localStorage.getItem("pcrm_v9_leads")||"";
  var seqVal=localStorage.getItem("pcrm_v9_sequences")||"";
  var total=leadsVal.length+seqVal.length;
  if(total>4500000){alert("PCRM: storage is approaching the limit. Please export your data.");}
  else if(total>3000000){console.warn("PCRM storage above 3 MB — leads:"+leadsVal.length+" chars, sequences:"+seqVal.length+" chars");}
}

/* \u2500\u2500 DESIGN TOKENS \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
const C = {
  acc:"#0BE881", info:"#0BE881", warn:"#FFE066", danger:"#FF6B6B",
  bg:"#080604", surf:"#201C17", surf2:"#2C2620", surf3:"#38302A",
  line:"#5C5044", line2:"#4A4238",
  text:"#F5F0E8", muted:"#7A7268", dim:"#B8AFA0",
  shadow:"0 4px 16px rgba(0,0,0,0.6)",
  shadowLg:"0 8px 32px rgba(0,0,0,0.8)",
  radius:"8px", radiusSm:"5px", radiusLg:"18px", radiusCard:"18px",
};
const SP = {xs:"4px", sm:"8px", md:"16px", lg:"24px", xl:"32px"};
const PIPE_NONE_META = {label:"Unstarted", code:"UNSTARTED", clr:"#7A7268"};

/* \u2500\u2500 CONSTANTS \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
const PIPE = [
  {id:0,code:"SIG",        label:"SIGNAL",      sub:"Weak or unconfirmed interest",  clr:"#48DBFB"},
  {id:1,code:"ECHO",       label:"Echo",        sub:"Response or feedback obtained", clr:"#B8AFA0"},
  {id:2,code:"LOCKED",     label:"Locked",      sub:"Genuine interest confirmed",    clr:"#FFE066"},
  {id:3,code:"DEEP_DIVE",  label:"Deep Dive",   sub:"In evaluation / discovery",     clr:"#FF9F43"},
  {id:4,code:"ON_THE_WIRE",label:"ON THE WIRE", sub:"Signing process initiated",     clr:"#0BE881"},
];
const STAGE_ALIASES = {0:"Qualified",1:"Engaged",2:"Committed",3:"Proposal",4:"Closing"};
/* pipeLbl(idx) — returns stage label according to user's chosen display mode */
function pipeLbl(idx){
  var mode=(typeof window!=="undefined"&&window.__pcrmPipeLabelMode)||"alias";
  if(idx<0||idx>=PIPE.length)return"Unstarted";
  if(mode==="original")return PIPE[idx].label;
  if(mode==="both")return STAGE_ALIASES&&STAGE_ALIASES[idx]?PIPE[idx].label+" \u00b7 "+STAGE_ALIASES[idx]:PIPE[idx].label;
  return STAGE_ALIASES&&STAGE_ALIASES[idx]?STAGE_ALIASES[idx]:PIPE[idx].label;
}
if(typeof window!=="undefined"){window.__pcrmPipeLabelMode=(localStorage&&localStorage.getItem("pcrm_v9_pipe_labels"))||"alias";}
/* Milestone labels for execution graph */
const GRAPH_MILESTONES=[
  {id:"commitment_secured",label:"Commitment Secured",stage:2,defaultBranches:["Prepare NDA","Align stakeholders","Confirm next step"]},
  {id:"solution_validated", label:"Solution Validated", stage:3,defaultBranches:["Create one-pager","Get ROI data","Tailor solution","Internal alignment"]},
  {id:"contract_signed",    label:"Contract Signed",    stage:4,defaultBranches:["Final negotiation","Legal review","Signature process"]},
];
/* Pipeline migration: old 5-stage → new 4-stage */
function migrateLeadPipeline(lead){
  var op=lead.pipeline;
  if(typeof op!=="number")return lead;
  var np=op<0?-1:op<=1?0:op-1;
  if(np===op)return lead;
  var nh=(lead.pipelineHistory||[]).map(function(h){var ns=h.stage<0?-1:h.stage<=1?0:h.stage-1;return Object.assign({},h,{stage:ns});});
  return Object.assign({},lead,{pipeline:np,pipelineHistory:nh});
}
function migrateLeadPipelineV5(lead){
  var op=lead.pipeline;
  if(typeof op!=="number"||op<0)return lead;
  var np=op+1;
  var nh=(lead.pipelineHistory||[]).map(function(h){return Object.assign({},h,{stage:h.stage<0?h.stage:h.stage+1});});
  return Object.assign({},lead,{pipeline:np,pipelineHistory:nh});
}
function migrateLeadPipelineV6(lead){
  var op=lead.pipeline;
  if(typeof op!=="number"||op<0)return lead;
  var np=op+1;
  var nh=(lead.pipelineHistory||[]).map(function(h){return Object.assign({},h,{stage:h.stage<0?h.stage:h.stage+1});});
  return Object.assign({},lead,{pipeline:np,pipelineHistory:nh});
}
function migrateLeadPipelineV7(lead){
  var op=lead.pipeline;
  if(typeof op!=="number"||op<=0)return lead;
  var np=op-1;
  var nh=(lead.pipelineHistory||[]).map(function(h){return Object.assign({},h,{stage:h.stage<=0?h.stage:h.stage-1});});
  return Object.assign({},lead,{pipeline:np,pipelineHistory:nh});
}
function migrateLeadPipelineV8(lead){
  var contacts=(lead.contacts||[]).map(function(c){return c.role?c:Object.assign({},c,{role:"unknown"});});
  return Object.assign({enrichment:null,signals:[],outreachOutcome:null,callOutcomes:[],snoozedUntil:null,snoozeReason:null},lead,{contacts:contacts});
}
function migrateLeadStatusV9(lead){
  var old=lead.status;
  if(old==="new"||old==="contacted"||old==="qualified")return Object.assign({},lead,{status:"active"});
  if(old==="not_fit")return lead;
  return Object.assign({},lead,{status:"active"});
}
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
const STATUSES = ["active","not_fit"];
const ST_META = {
  active:  {label:"Active",    clr:"#0BE881", bg:"rgba(11,232,129,0.08)"},
  not_fit: {label:"Not a fit", clr:"#FF6B6B", bg:"rgba(255,107,107,0.12)"},
};
const LOG_CATS = {
  call:           {label:"Call",              icon:"📞",clr:"#999999"},
  call_transcript:{label:"Call Transcript",   icon:"📼",clr:"#999999"},
  call_summary:   {label:"Call Summary",      icon:"📋",clr:"#999999"},
  email:          {label:"Email",             icon:"✉️", clr:"#999999"},
  meeting_notes:  {label:"Meeting",           icon:"📅",clr:"#999999"},
  news:           {label:"Company News",      icon:"📰",clr:"#999999"},
  strategy:       {label:"Strategy",          icon:"♟", clr:"#999999"},
  whatsapp:       {label:"WhatsApp",          icon:"💬",clr:"#999999"},
  telegram:       {label:"Telegram",          icon:"telegram_plane",clr:"#999999"},
  linkedin:       {label:"LinkedIn",          icon:"💼",clr:"#999999"},
  message:        {label:"Message",           icon:"💬",clr:"#999999"},
  note:           {label:"Note",              icon:"✍", clr:"#999999"},
  task:           {label:"Task",              icon:"☑", clr:"#999999"},
  reminder:       {label:"Reminder",          icon:"🔔",clr:"#999999"},
  overdue:        {label:"Overdue",           icon:"⚠️", clr:"#FF6B6B"},
  blocker:        {label:"Blocker",           icon:"⛔",clr:"#FF6B6B"},
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
const DOC_STATUSES = ["needed","in_progress","sent","received","approved","signed"];
const DOC_STATUS_META = {
  needed:{label:"Needed",clr:"#888888",icon:"\u25cb"},
  in_progress:{label:"In Progress",clr:"#FFE066",icon:"\u25d0"},
  sent:{label:"Sent",clr:"#FF9F43",icon:"\u25d1"},
  received:{label:"Received",clr:"#3CB371",icon:"\u25d5"},
  approved:{label:"Approved",clr:"#0BE881",icon:"●"},
  signed:{label:"Signed",clr:"#0BE881",icon:"\u2713"}
};
const DEAL_DOCS = [
  {id:"nda",name:"NDA",stages:[1,2],category:"legal"},
  {id:"one_pager",name:"One-Pager",stages:[1,2],category:"commercial"},
  {id:"exec_summary",name:"Executive Summary",stages:[2,3],category:"commercial"},
  {id:"proposal",name:"Proposal / Pricing",stages:[3],category:"commercial"},
  {id:"roi",name:"ROI Calculation",stages:[3],category:"commercial"},
  {id:"tech_spec",name:"Technical Integration Spec",stages:[3],category:"technical"},
  {id:"security_q",name:"Security Questionnaire",stages:[3],category:"compliance"},
  {id:"compliance_kyb",name:"Compliance / KYB Docs",stages:[3],category:"compliance"},
  {id:"contract",name:"Contract / MSA / SLA",stages:[4],category:"legal"},
  {id:"onboarding",name:"Onboarding Checklist",stages:[3],category:"operations"}
];
const SK = {leads:"pcrm_v9_leads",sequences:"pcrm_v9_sequences",campaigns:"pcrm_v9_campaigns",icp:"pcrm_v9_icp",weights:"pcrm_v9_weights",statsHistory:"pcrm_v9_stats",reminders:"pcrm_v9_reminders",apiKey:"pcrm_v9_apikey",strategy:"pcrm_v9_strategy",lastBackup:"pcrm_v9_lastbackup",scheduledEmails:"pcrm_v9_scheduled",weeklyGoal:"pcrm_v9_wgoal",emailTemplates:"pcrm_v9_templates",internalTeam:"pcrm_v9_team",qna:"pcrm_v9_qna",compIntel:"pcrm_v9_compintel",dailyReports:"pcrm_v9_daily_reports",weeklyReports:"pcrm_v9_weekly_reports",activePrompt:"pcrm_v9_active_prompt",signature:"pcrm_v9_signature"};
const STAGE_LIMITS=[3,4,5,7,5];
const STUCK_REASONS=["No reply","Follow-up not sent","Weak contact","Wrong persona","No clear pain","Low priority for prospect","Waiting on prospect","Internal blocker","Unclear value proposition"];
function getStuckStatus(lead){
  var ps=pipeStage(lead);
  if(ps<0||ps===4)return{isStuck:false};
  var limit=STAGE_LIMITS[ps]||7;
  var history=lead.pipelineHistory||[];
  var stageEntry=null;
  for(var i=history.length-1;i>=0;i--){if(history[i].stage===ps){stageEntry=history[i];break;}}
  var enteredAt=stageEntry?stageEntry.timestamp:(lead.createdAt||new Date().toISOString());
  var daysInStage=Math.floor((Date.now()-new Date(enteredAt))/86400000);
  var entries=lead.logEntries||[];
  var lastAct=entries.length>0?new Date(entries[entries.length-1].timestamp):new Date(lead.createdAt||Date.now());
  var daysSinceAct=Math.floor((Date.now()-lastAct)/86400000);
  if(daysInStage>limit&&daysSinceAct>2){
    return{isStuck:true,daysInStage:daysInStage,stageLimit:limit,daysSinceAct:daysSinceAct,severity:daysInStage/limit};
  }
  return{isStuck:false};
}
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
  "0":["Verify the signal is genuine","Find the right decision-maker","Send a first personalised reach-out"],
  "1":["Book a discovery call","Send a product overview","Confirm stakeholder and pain point"],
  "2":["Prepare NDA","Align all stakeholders","Confirm commitment to next step"],
  "3":["Send formal proposal","Share ROI calculation","Schedule deep-dive session"],
  "4":["Follow up on contract review","Confirm legal sign-off","Agree on implementation timeline"],
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
  var t=0,w=0;
  CRITERIA.forEach(function(cr){
    var v=scores&&scores[cr.id];
    if(v===null||v===undefined)return;
    t+=v*(weights[cr.id]||15);
    w+=(weights[cr.id]||15);
  });
  return w>0?Math.round((t/(w*10))*100):0;
}
function calcAxes(scores){
  function known(v){return v!==null&&v!==undefined?v:null;}
  var dm=known(scores&&scores.decisionMaker),en=known(scores&&scores.engagement);
  var iF=known(scores&&scores.industryFit),cs=known(scores&&scores.companySize),bu=known(scores&&scores.budget),pp=known(scores&&scores.painPoint);
  var easeVals=[dm,en].filter(function(v){return v!==null;});
  var valueVals=[iF,cs,bu,pp].filter(function(v){return v!==null;});
  return {
    ease:easeVals.length?Math.round(easeVals.reduce(function(a,v){return a+v;},0)/easeVals.length*10):50,
    value:valueVals.length?Math.round(valueVals.reduce(function(a,v){return a+v;},0)/valueVals.length*10):50,
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
function getDealState(lead,sequences){
  if(!lead)return null;
  var stage=pipeStage(lead);
  var blocked=isBlocked(lead);
  var contacts=lead.contacts||[];
  var owner=contacts.find(function(c){return c.role==="champion"||c.role==="economic_buyer";});
  var seqs=sequences||[];
  var activeSeqContacts=contacts.filter(function(ct){return seqs.some(function(s){var lp=(s.leadProgress||{})[ct.id];return lp&&!lp.bounced&&!lp.optedOut;});});
  var isHot=!!(lead.isHot||(lead.logEntries||[]).some(function(e){return e.hot;}));
  var isActionable=!blocked&&stage>=0&&stage<4;
  var nextAction=(lead.logEntries||[]).slice().reverse().map(function(e){return e.nextStep||null;}).find(function(x){return x;})||null;
  return {stage:stage,status:lead.status||"new",blockers:blocked?[lead.blocker]:[],nextAction:nextAction,owner:owner?owner.name:null,isActionable:isActionable,isHot:isHot,activeSeqContacts:activeSeqContacts};
}
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
function makeContact(o){return Object.assign({id:uid("c"),name:"",title:"",email:"",phone:"",linkedin:"",notes:"",lastContacted:"",role:"unknown",relationships:[]},o||{});}
function makeLead(data,weights){
  return {id:uid("lead"),aiPitch:"",createdAt:new Date().toISOString(),
    leadType:"prospect",
    pipeline:PIPE_NONE,pipelineHistory:[],contacts:[],blocker:null,blockerHistory:[],
    logEntries:[],summary:{currentStatus:"",latestUpdate:"",goal:"",generatedAt:null},
    dealValue:0,closedAt:null,dealRoom:[],deals:[],
    accountData:{renewalDate:"",healthScore:"happy",upsellStatus:"none",upsellNotes:"",qbrDate:"",supportIssues:"",accountNotes:""},
    enrichment:null,signals:[],outreachOutcome:null,callOutcomes:[],snoozedUntil:null,snoozeReason:null,
    ...data,totalScore:calcScore(data.scores||{},weights)};
}
/* ── STAGE GATE RULES ────────────────────────────────────────────────────────
   checkStageGate(lead, currentStageIdx)
   currentStageIdx: -1=Unstarted, 0=Signal, 1=Echo, 2=Locked, 3=Deep Dive
   Returns {met:bool, missing:string[]}
────────────────────────────────────────────────────────────────────────────── */
function checkStageGate(lead, currentStageIdx){
  var missing=[];
  var logs=lead.logEntries||[];
  var docs=lead.dealRoom||[];
  var contacts=lead.contacts||[];
  var dp=(lead.outreachOutcome&&lead.outreachOutcome.dealProgression)||"not_tracked";

  if(currentStageIdx===-1){
    /* Unstarted -> Signal: company data exists (1 signal) */
    var hasData=contacts.length>0||(lead.notes&&lead.notes.trim().length>0)||lead.website||lead.industry;
    if(!hasData)missing.push("Add at least one contact, notes, website, or industry to profile the account.");
  } else if(currentStageIdx===0){
    /* Signal -> Echo: outreach made + 1 doc in deal room (1 signal + doc) */
    var hasOutreach=logs.some(function(e){return e.category==="call"||e.category==="email";});
    if(!hasOutreach)missing.push("Log at least one outbound call or email to this account.");
    var hasDoc=docs.length>0;
    if(!hasDoc)missing.push("Add at least one document to Deal Room — confirms the relationship has moved beyond cold outreach.");
  } else if(currentStageIdx===1){
    /* Echo -> Locked: pain info + call/meeting happened + next step agreed + NDA (3 signals + NDA) */
    var hasPain=lead.notes&&lead.notes.trim().length>10;
    if(!hasPain)missing.push("Document their pain points and needs in Notes.");
    var positiveDP=["call_happened","meeting_booked","deal_advanced","relationship_maintained"].indexOf(dp)>=0;
    var hasMeetingLog=logs.some(function(e){return e.category==="meeting_notes"||e.category==="call";});
    if(!positiveDP&&!hasMeetingLog)missing.push("Log a call or meeting — a conversation must have taken place.");
    var hasNextStep=lead.nextStep&&lead.nextStep.action&&lead.nextStep.action.trim().length>0;
    if(!hasNextStep)missing.push("Set a next step with a concrete date or meeting agreed.");
    var hasNda=docs.some(function(d){return d.name&&/nda/i.test(d.name);});
    if(!hasNda)missing.push("Add NDA document to Deal Room to initiate the NDA process.");
  } else if(currentStageIdx===2){
    /* Locked -> Deep Dive: RFPI initiated OR 3 engagement signals */
    var hasRfp=docs.some(function(d){return d.name&&/rfp|rfi|rfpi|request for/i.test(d.name);});
    if(hasRfp){return{met:true,missing:[]};}
    var hasPricing=logs.some(function(e){return /pric|cost|budget|fee/i.test(e.content||"");});
    if(!hasPricing)missing.push("Log a pricing or budget discussion with the prospect.");
    var hasDemo=logs.some(function(e){return e.category==="meeting_notes"||/demo|presentation|overview/i.test(e.content||"");});
    if(!hasDemo)missing.push("Log a demo or detailed product presentation.");
    var ndaApproved=docs.some(function(d){return d.name&&/nda/i.test(d.name)&&(d.status==="approved"||d.status==="sent");});
    if(!ndaApproved)missing.push("NDA must be sent or approved. Alternatively, add an RFP/RFPI document to fast-track.");
  } else if(currentStageIdx===3){
    /* Deep Dive -> On the Wire: decision maker known + contract doc + active negotiation (3 signals) */
    var hasDecisionMaker=contacts.some(function(c){
      return c.role==="decision_maker"||c.role==="economic_buyer"||
        (c.title&&/ceo|cfo|cto|coo|vp |vp$|director|head of|partner|owner|president/i.test(c.title));
    });
    if(!hasDecisionMaker)missing.push("Identify the decision maker or economic buyer in Stakeholders.");
    var hasContract=docs.some(function(d){return d.name&&/contract|agreement|sow|statement of work|proposal/i.test(d.name);});
    if(!hasContract)missing.push("Add a contract, proposal, or SOW document to Deal Room.");
    var recentLogs=logs.filter(function(e){return new Date(e.timestamp)>(new Date(Date.now()-60*86400000));});
    var hasActiveNeg=["deal_advanced","deal_closed"].indexOf(dp)>=0||recentLogs.length>=3;
    if(!hasActiveNeg)missing.push("Log active negotiations (need 3+ activities in last 60 days or deal_advanced status).");
  }
  return{met:missing.length===0,missing:missing};
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
function detectResponsible(text){var lo=(text||"").toLowerCase();if(/waiting|pending|awaiting|their side|they need|they will|approve|sign off|review by/.test(lo))return"them";return"me";}
function makeActionItem(o){return Object.assign({id:uid("ai"),action:"",type:"other",dueDate:null,contact:null,responsible:"me",status:"active",createdAt:new Date().toISOString(),completedAt:null},o||{});}
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
/* ── EXECUTION ENGINE ────────────────────────────────────────────────────── */
function truncateAI(text,maxWords){
  if(!text)return"";
  var words=text.trim().split(/\s+/);
  if(words.length<=maxWords)return text.trim();
  return words.slice(0,maxWords).join(" ")+"...";
}
function isReplyPattern(content){
  var lo=(content||"").toLowerCase();
  return lo.indexOf("replied")>=0||lo.indexOf(" re:")>=0||lo.indexOf("re: ")>=0||
    lo.indexOf("got back")>=0||lo.indexOf("responded")>=0||lo.indexOf("response from")>=0||
    lo.indexOf("wrote back")>=0||lo.indexOf("they replied")>=0||lo.indexOf("got a reply")>=0;
}
function computeDealMode(lead,sequences){
  var stage=pipeStage(lead);
  var logs=lead.logEntries||[];
  var hasOutreach=logs.some(function(e){return e.category==="email"||e.category==="call";});
  if(stage===PIPE_NONE&&!hasOutreach)return{mode:"watch",seq:null,prog:null,replyDetected:false};
  var seqs=(sequences&&sequences.sequences)||[];
  var enrolled=null,prog=null;
  for(var i=0;i<seqs.length;i++){
    var p=seqs[i].leadProgress&&seqs[i].leadProgress[lead.id];
    if(p&&!p.bounced&&!p.optedOut){enrolled=seqs[i];prog=p;break;}
  }
  var replyDetected=logs.some(function(e){return e.category==="email"&&isReplyPattern(e.content);});
  if(enrolled&&prog&&!replyDetected&&stage<2)return{mode:"sequence",seq:enrolled,prog:prog,replyDetected:false};
  return{mode:"manual",seq:null,prog:null,replyDetected:replyDetected};
}
function computePrimaryAction(lead,dm){
  if(dm.mode==="watch")return"[WATCH] Monitor — no outreach yet";
  if(dm.mode==="sequence"){
    var seqName=(dm.seq&&dm.seq.name)||"sequence";
    var step=dm.seq&&dm.seq.steps&&dm.prog&&dm.seq.steps[dm.prog.currentStep];
    var stepName=step?step.name:"next step";
    return"[SEQ] "+seqName+" — "+stepName;
  }
  var logs=lead.logEntries||[];
  var DAY=86400000,now=Date.now();
  var hasReply48=logs.some(function(e){return e.category==="email"&&isReplyPattern(e.content)&&(now-new Date(e.timestamp).getTime())<48*DAY;});
  if(hasReply48)return"[MAN] Reply received — respond now";
  var ns=lead.nextStep||"";
  if(ns)return"[MAN] "+ns;
  return"[MAN] Review and take next action";
}
function computeCompositeScore(lead,sequences){
  var DAY=86400000,now=Date.now();
  var logs=lead.logEntries||[];
  var stage=pipeStage(lead);
  var ds=calcDynamicScore(lead,{},DEF_WEIGHTS);
  var stuckDays=ds.stuckDays||0;
  var todayStart=new Date();todayStart.setHours(0,0,0,0);
  var hasMeeting=logs.some(function(e){return e.category==="meeting_notes"&&new Date(e.timestamp)>=todayStart;});
  if(hasMeeting)return 135;
  var hasReply48=logs.some(function(e){return e.category==="email"&&isReplyPattern(e.content)&&(now-new Date(e.timestamp).getTime())<48*DAY;});
  if(hasReply48)return 95;
  var score=0;
  var decayScore=Math.min(50,stuckDays*2);
  score+=decayScore;
  var stageBonus=[0,8,16,28,40];
  score+=(stage>=0&&stage<=4)?stageBonus[stage]:0;
  var dv=lead.dealValue||0;
  if(dv>=1000)score+=Math.min(20,Math.round(Math.log10(dv/1000)*10));
  var hasReply=logs.some(function(e){return e.category==="email"&&isReplyPattern(e.content);});
  if(hasReply&&!hasReply48)score+=15;
  var lastOutbound=null;
  for(var i=logs.length-1;i>=0;i--){
    var e=logs[i];
    if((e.category==="email"||e.category==="call")&&(!e.source||e.source!=="system")){
      lastOutbound=new Date(e.timestamp).getTime();break;
    }
  }
  if(lastOutbound&&(now-lastOutbound)>21*DAY&&!hasReply)score-=20;
  var seqs=(sequences&&sequences.sequences)||[];
  var enrolled=seqs.some(function(s){var p=s.leadProgress&&s.leadProgress[lead.id];return p&&!p.bounced&&!p.optedOut;});
  if(enrolled){
    var overdue=seqs.some(function(s){var p=s.leadProgress&&s.leadProgress[lead.id];return p&&p.nextUnlockAt&&new Date(p.nextUnlockAt)<=new Date();});
    if(overdue)score+=10;
  }
  return Math.max(0,score);
}
function isQuitCandidate(lead,sequences){
  if(pipeStage(lead)===4)return false;
  var logs=lead.logEntries||[];
  var DAY=86400000,now=Date.now();
  var outboundEmails=logs.filter(function(e){return e.category==="email"&&(!e.source||e.source!=="system");});
  if(outboundEmails.length<4)return false;
  var hasReply=logs.some(function(e){return e.category==="email"&&isReplyPattern(e.content);});
  if(hasReply)return false;
  var lastEmail=outboundEmails.reduce(function(a,e){return Math.max(a,new Date(e.timestamp).getTime());},0);
  if((now-lastEmail)<21*DAY)return false;
  var seqs=(sequences&&sequences.sequences)||[];
  var enrolled=seqs.some(function(s){var p=s.leadProgress&&s.leadProgress[lead.id];return p&&!p.bounced&&!p.optedOut;});
  if(enrolled)return false;
  var hist=lead.pipelineHistory||[];
  if(hist.length>=2){
    var lastMove=new Date(hist[hist.length-1].timestamp).getTime();
    if((now-lastMove)<45*DAY)return false;
  }
  var hasPositiveCall=logs.some(function(e){
    if(e.category!=="call")return false;
    var c=(e.content||"").toLowerCase();
    return c.indexOf("spoke")>=0&&(c.indexOf("interested")>=0||c.indexOf("positive")>=0||c.indexOf("keen")>=0||c.indexOf("open")>=0);
  });
  if(hasPositiveCall)return false;
  if(lead.quitFlagSnoozedUntil&&new Date(lead.quitFlagSnoozedUntil)>new Date())return false;
  return true;
}
function computeUrgency(leads,sequences){
  var DAY=86400000,now=Date.now();
  var todayMidnight=new Date();todayMidnight.setHours(0,0,0,0);
  var active=(leads||[]).filter(function(l){if(pipeStage(l)===4)return false;if(l._completedAt&&new Date(l._completedAt)>=todayMidnight)return false;var gateReady=checkStageGate(l,pipeStage(l)).met;if(l.waitingUntil&&new Date(l.waitingUntil)>new Date()&&!gateReady)return false;return true;});
  var scored=active.map(function(l){
    var signals=[],ds=calcDynamicScore(l,{},DEF_WEIGHTS);
    var todayStart=new Date();todayStart.setHours(0,0,0,0);
    var hasMeeting=(l.logEntries||[]).some(function(e){
      return e.category==="meeting_notes"&&new Date(e.timestamp)>=todayStart;
    });
    if(hasMeeting)signals.push({type:"meeting_today",weight:100});
    if(l.waitingUntil&&new Date(l.waitingUntil)<=new Date())signals.push({type:"follow_up_due",weight:95});
    var hasReply=(l.logEntries||[]).some(function(e){
      return e.category==="email"&&(now-new Date(e.timestamp).getTime())<48*DAY&&isReplyPattern(e.content);
    });
    if(hasReply)signals.push({type:"reply_waiting",weight:90});
    var gateReady=checkStageGate(l,pipeStage(l)).met;
    if(gateReady)signals.push({type:"gate_ready",weight:85});
    if(ds.stuckDays>=3)signals.push({type:"decay",weight:Math.min(80,ds.stuckDays*2),value:ds.stuckDays});
    if(isBlocked(l))signals.push({type:"blocked",weight:20});
    var stg=pipeStage(l);if(stg>=3&&!l.waitingUntil&&!l._completedAt)signals.push({type:"late_stage",weight:18});
    var topWeight=signals.reduce(function(a,s){return Math.max(a,s.weight);},0);
    var dm=computeDealMode(l,sequences);
    var primaryAction=computePrimaryAction(l,dm);
    var cScore=computeCompositeScore(l,sequences);
    var qCand=isQuitCandidate(l,sequences);
    var pLabel=cScore>=90?"HOT":cScore>=60?"MED":"LOW";
    return{leadId:l.id,lead:l,weight:topWeight,signals:signals,stuckDays:ds.stuckDays,dealValue:l.dealValue||0,dealMode:dm.mode,primaryAction:primaryAction,compositeScore:cScore,priorityLabel:pLabel,quitCandidate:qCand};
  });
  var todayStr=new Date().toDateString();
  scored.sort(function(a,b){
    var aPromoted=(a.lead&&a.lead._promotedAt&&new Date(a.lead._promotedAt).toDateString()===todayStr)?1:0;
    var bPromoted=(b.lead&&b.lead._promotedAt&&new Date(b.lead._promotedAt).toDateString()===todayStr)?1:0;
    if(bPromoted!==aPromoted)return bPromoted-aPromoted;
    return b.compositeScore-a.compositeScore;
  });
  var topSlice=scored.slice(0,8),restSlice=scored.slice(8);
  /* Collect execution tasks (actionItems with milestoneId) from all active leads */
  var execTasks=[];
  var todayEnd=new Date();todayEnd.setHours(23,59,59,999);
  (leads||[]).forEach(function(l){
    if(pipeStage(l)===4)return;
    var curStage=pipeStage(l);
    (l.actionItems||[]).forEach(function(t){
      if(t.status==="done"||t.status==="active_done")return;
      if(!t.milestoneId)return;
      var ms=GRAPH_MILESTONES.find(function(m){return m.id===t.milestoneId;})||null;
      var isCurrentMilestone=ms?ms.stage===curStage+1:false;
      var dueToday=!!(t.dueDate&&new Date(t.dueDate)<=todayEnd);
      var isBlocking=false;
      if(isCurrentMilestone&&t.branchId){
        var branchPending=(l.actionItems||[]).filter(function(x){return x.branchId===t.branchId&&x.milestoneId===t.milestoneId&&x.status!=="done"&&x.status!=="active_done";});
        isBlocking=branchPending.length===1;
      }
      var priority=(dueToday?30:0)+(isCurrentMilestone?40:0)+(isBlocking?50:0);
      var branchLabel="";
      if(t.branchId&&l.executionGraph){
        (l.executionGraph.milestones||[]).forEach(function(ms2){
          var br=(ms2.branches||[]).find(function(b){return b.id===t.branchId;});
          if(br)branchLabel=br.label;
        });
      }
      execTasks.push({taskId:t.id,task:t,lead:l,milestoneLabel:ms?ms.label:"",branchLabel:branchLabel,priority:priority,dueToday:dueToday,isCurrentMilestone:isCurrentMilestone,isBlocking:isBlocking});
    });
  });
  execTasks.sort(function(a,b){return b.priority-a.priority;});
  return{
    now:topSlice.length>0?topSlice[0].leadId:null,
    queue:topSlice.slice(1).map(function(s){return s.leadId;}),
    notToday:restSlice.map(function(s){return s.leadId;}),
    scored:scored,
    execTasks:execTasks
  };
}
function computeDelay(deal){
  var count=deal.delayCount||0;
  var history=deal.delayHistory||[];
  var now=Date.now(),DAY=86400000;
  var recentDelays=history.filter(function(d){return(now-new Date(d.at).getTime())<7*DAY;}).length;
  return{
    frictionLevel:count<2?0:count===2?1:2,
    requiresReason:count>=2,
    requiresConfirm:count>=3,
    flagged:recentDelays>=3
  };
}
function computeStageSuggestion(lead){
  var stage=pipeStage(lead);
  if(stage===4)return null;
  var logs=lead.logEntries||[];
  var docs=lead.dealRoom||[];
  var SENT_STATUSES=["sent","received","approved"];
  if(stage===-1){
    var hasOutreach=logs.some(function(e){return e.category==="email"||e.category==="call";});
    if(hasOutreach)return{suggestedStage:0,reason:"First outreach logged",confidence:"high",autoApply:true};
    return null;
  }
  if(stage===0){
    var hasSigReply=logs.some(function(e){if(e.category!=="email")return false;var lc=(e.content||"").toLowerCase();return lc.indexOf("replied")>=0||lc.indexOf("re:")>=0||lc.indexOf("responded")>=0;});
    var hasSigCall=logs.some(function(e){return e.category==="call";});
    if(hasSigReply||hasSigCall)return{suggestedStage:1,reason:hasSigCall?"Call logged — move to Echo":"Reply received — move to Echo",confidence:"medium",autoApply:false};
    return null;
  }
  if(stage===1){
    var hasMeeting=logs.some(function(e){return e.category==="meeting_notes";});
    var hasNda=docs.some(function(d){return d.id==="nda"&&SENT_STATUSES.indexOf(d.status)>=0;});
    var hasReply=logs.some(function(e){if(e.category!=="email")return false;var c=(e.content||"").toLowerCase();return c.indexOf("replied")>=0||c.indexOf("re:")>=0||c.indexOf("responded")>=0||c.indexOf("response")>=0;});
    var hasPositiveCall=logs.some(function(e){return e.category==="call"&&(e.content||"").toLowerCase().indexOf("interested")>=0;});
    if(hasMeeting||hasNda)return{suggestedStage:2,reason:hasMeeting?"Meeting held — move to Locked":"NDA in progress — move to Locked",confidence:"high",autoApply:false};
    if(hasReply||hasPositiveCall)return{suggestedStage:2,reason:hasPositiveCall?"Positive call — move to Locked":"Reply received — qualify for Locked",confidence:"medium",autoApply:false};
    return null;
  }
  if(stage===2){
    var hasProposal=docs.some(function(d){return(d.id==="proposal"||d.id==="roi")&&SENT_STATUSES.indexOf(d.status)>=0;});
    var hasDDMeeting=logs.filter(function(e){return e.category==="meeting_notes";}).length>=2;
    if(hasProposal||hasDDMeeting)return{suggestedStage:3,reason:hasProposal?"Proposal or ROI sent — enter Deep Dive":"Multiple meetings held — ready for solution validation",confidence:"high",autoApply:false};
    return null;
  }
  if(stage===3){
    var hasContract=docs.some(function(d){return d.id==="contract"&&SENT_STATUSES.indexOf(d.status)>=0;});
    if(hasContract)return{suggestedStage:4,reason:"Contract on file — move to ON THE WIRE",confidence:"high",autoApply:false};
    return null;
  }
  var _fallbackGate=checkStageGate(lead,stage);
  if(_fallbackGate.met&&stage<4&&PIPE[stage+1]){
    return{suggestedStage:stage+1,reason:"Stage gate met — ready to advance",confidence:"high",autoApply:false};
  }
  return null;
}
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

function serializeActivePrompt(leads, sequences) {
  var now = Date.now();
  var day7ms = 7 * 24 * 3600 * 1000;

  // Section 1: pipeline stage counts
  var stageLabels = {"-1":"Unstarted","0":"Signal","1":"Echo","2":"Locked","3":"DeepDive","4":"OnTheWire"};
  var stageCounts = {"-1":0,"0":0,"1":0,"2":0,"3":0,"4":0};
  (leads||[]).forEach(function(l){
    var s = String(l.pipeline!=null?l.pipeline:-1);
    if(stageCounts[s]!=null) stageCounts[s]++;
  });
  var s1 = "[PIPELINE]";
  ["-1","0","1","2","3","4"].forEach(function(k){ if(stageCounts[k]>0) s1+=" "+stageLabels[k]+":"+stageCounts[k]; });

  // Section 2: signal types in last 7 days
  var sigFreq = {};
  (leads||[]).forEach(function(l){
    (l.signals||[]).forEach(function(sig){
      if(sig.detectedAt && now-new Date(sig.detectedAt).getTime()<=day7ms){
        sigFreq[sig.type]=(sigFreq[sig.type]||0)+1;
      }
    });
  });
  var sigSorted = Object.keys(sigFreq).sort(function(a,b){return sigFreq[b]-sigFreq[a];});
  var s2 = "[SIGNALS/7D]";
  if(sigSorted.length===0){ s2+=" none"; }
  else{ sigSorted.slice(0,6).forEach(function(k){ s2+=" "+k+":"+sigFreq[k]; }); }

  // Section 3: sequence performance from stepOutcome
  var totalOutcomes=0, replied=0, posReply=0, callBooked=0;
  var seqArr = Array.isArray(sequences)?sequences:[];
  seqArr.forEach(function(seq){
    var prog = seq.leadProgress||seq.enrolledLeads||{};
    Object.keys(prog).forEach(function(lid){
      var lp = prog[lid];
      var outcomes = lp.stepOutcome||{};
      Object.keys(outcomes).forEach(function(k){
        var o = outcomes[k];
        totalOutcomes++;
        if(o&&o.replied) replied++;
        if(o&&o.positive) posReply++;
        if(o&&o.callBooked) callBooked++;
      });
    });
  });
  var s3 = "[SEQ_PERF]";
  if(totalOutcomes===0){ s3+=" no outcome data"; }
  else{
    s3+=" reply:"+Math.round(replied/totalOutcomes*100)+"% pos:"+Math.round(posReply/totalOutcomes*100)+"% call:"+Math.round(callBooked/totalOutcomes*100)+"% ("+totalOutcomes+" steps)";
  }

  // Section 4: best-performing patterns from weekly report
  var s4 = "[PATTERNS]";
  try{
    var wr = JSON.parse(localStorage.getItem("pcrm_v9_weekly_reports")||"[]");
    if(wr.length>0){
      var latest = wr[wr.length-1];
      s4+=" opener:"+(latest.bestOpenerPattern||"n/a")+" signal:"+(latest.bestSignalType||"n/a");
    } else { s4+=" not enough data yet"; }
  } catch(_){ s4+=" not enough data yet"; }

  // Section 5: top 5 leads by totalScore
  var sorted = (leads||[]).slice().sort(function(a,b){return (b.totalScore||0)-(a.totalScore||0);});
  var s5 = "[TOP5]";
  sorted.slice(0,5).forEach(function(l){ s5+=" "+(l.company||"?")+"("+(l.totalScore||0)+")"; });

  // Section 6: trend indicators (only if >= 7 daily reports)
  var s6 = "";
  try{
    var dr = JSON.parse(localStorage.getItem("pcrm_v9_daily_reports")||"[]");
    if(dr.length>=7){
      var last7 = dr.slice(-7);
      var prev7 = dr.slice(-14,-7);
      var parts = [];
      if(prev7.length>=7){
        var avgRLast = last7.reduce(function(s,d){return s+(d.replyRate||0);},0)/7;
        var avgRPrev = prev7.reduce(function(s,d){return s+(d.replyRate||0);},0)/7;
        var rdiff = Math.round((avgRLast-avgRPrev)*100);
        if(rdiff!==0) parts.push("Reply rate "+(rdiff>0?"increased":"decreased")+" by "+Math.abs(rdiff)+"% in the last 7 days.");
        var sigLast = last7.reduce(function(s,d){return s+(d.signalCount||0);},0);
        var sigPrev = prev7.reduce(function(s,d){return s+(d.signalCount||0);},0);
        var sdiff = sigLast-sigPrev;
        if(sdiff!==0) parts.push("Signal volume "+(sdiff>0?"increased":"decreased")+" by "+Math.abs(sdiff)+" in the last 7 days.");
      }
      if(parts.length>0) s6="[TRENDS] "+parts.join(" ");
    }
  } catch(_){}

  // Assemble with 2000 char limit — s6 always preserved, s1-s5 truncated if needed
  var NL = String.fromCharCode(10);
  var sections = [s1,s2,s3,s4,s5];
  var result = sections.join(NL)+(s6?NL+s6:"");
  if(result.length>2000){
    var s6Reserve = s6?s6.length+1:0;
    var budget = 1995-s6Reserve;
    var trimTo = Math.floor(budget/5);
    var trimmed = sections.map(function(s){return s.length>trimTo?s.slice(0,trimTo):s;});
    result = trimmed.join(NL)+(s6?NL+s6:"");
  }

  localStorage.setItem("pcrm_v9_active_prompt", result);
}
