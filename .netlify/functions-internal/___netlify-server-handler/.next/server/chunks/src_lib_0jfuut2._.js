module.exports=[8223,e=>{"use strict";e.i(28976),e.s([])},394,e=>{"use strict";e.i(75705);var t=e.i(84501);e.i(8223);var a=e.i(28976),o=e.i(24229),n=e.i(82408);async function s(e,r,i=!1){if(!e||!o.AGENTS[e])return{success:!1,error:"Valid agentKey is required"};let l=o.AGENTS[e],d="";try{switch(e){case"ceo":{let e=await t.db.getBusinessProfile(),o=await t.db.getLeads(),n=await t.db.getMemories(),s=await t.db.getDailyReports(),r=new Date().toISOString().split("T")[0],l=s.find(e=>e.report_date===r);if(!l){let s,d=o.slice(0,10),c=0;o.forEach(e=>{["Qualified","Contacted","Replied","Call Booked","Proposal Sent"].includes(e.status)&&(e.notes?.toLowerCase().includes("website")||e.notes?.toLowerCase().includes("brand")?c+=1200:e.notes?.toLowerCase().includes("receptionist")||e.notes?.toLowerCase().includes("bot")?c+=1e3:c+=1500)});try{s=await a.gemini.generateDailyReport(e.target_monthly_revenue,e.current_monthly_revenue,c,d,n)}catch(t){s=`VELTRIX Daily Command Report

Revenue Target:
$${e.target_monthly_revenue}

Closed Revenue:
$${e.current_monthly_revenue}

Pipeline Value:
$${c}

Revenue Gap:
$${e.target_monthly_revenue-e.current_monthly_revenue}

Today's Top Priority:
Review warm leads and prepare proposals.

Leads to Contact:
${d.slice(0,3).map((e,t)=>`${t+1}. ${e.business_name}`).join("\n")}

Follow-ups Due:
None

Content to Post:
Deploy an AI Receptionist to prevent after-hour appointment leaks.

Recommended Action:
Contact active warm leads.

Risk / Blocker:
Gemini API unavailable. Local fallback generated.

Next Step:
Open Potential Clients page.`}let u=s.split("\n"),p="Review qualified leads and outline sales scripts.",m=[],g=[],h="Draft LinkedIn hook for business AI.",y="Contact dentist leads.",f="";u.forEach(e=>{let t=e.trim();t.startsWith("Today's Top Priority:")?f="priority":t.startsWith("Leads to Contact:")?f="leads":t.startsWith("Follow-ups Due:")?f="followups":t.startsWith("Content to Post:")?f="content":t.startsWith("Recommended Action:")?f="action":t.startsWith("Risk / Blocker:")||t.startsWith("Next Step:")||t.startsWith("Revenue Target:")||t.startsWith("Closed Revenue:")||t.startsWith("Pipeline Value:")||t.startsWith("Revenue Gap:")?f="":"priority"===f&&t?p=t:"leads"===f&&t.match(/^\d+\./)?m.push(t.replace(/^\d+\.\s*/,"")):"followups"===f&&t.match(/^\d+\./)?g.push(t.replace(/^\d+\.\s*/,"")):"content"===f&&t?h=t:"action"===f&&t&&(y=t)}),l=await t.db.addDailyReport({report_date:r,revenue_target:e.target_monthly_revenue,closed_revenue:e.current_monthly_revenue,pipeline_value:c,revenue_gap:e.target_monthly_revenue-e.current_monthly_revenue,top_priority:p,leads_to_contact:m.slice(0,3),followups_due:g.slice(0,2),content_to_post:h,recommended_action:y}),await t.db.addMemory({type:"Decision",content:`Veltrix Daily Command Report generated for ${r}. Recommended action: ${y}`,tags:["daily-report","automated"],importance:6,source:"AI CEO"}),await t.db.addTask({agent_name:"Outreach Agent",title:`Perform recommended action: ${y.substring(0,70)}...`,description:`Recommended in Daily Report: ${y}. Address leads: ${m.join(", ")}`,priority:"High",status:i?"Completed":"Pending",due_date:r})}d=`Hey team, Alex here. I've successfully compiled today's Daily Action Plan:

**Top Priority:** ${l.top_priority}

**Recommended Action:** ${l.recommended_action}

Let's get to work! Check the "Daily Summaries" page for the full layout.`,i&&(d+=`

[AUTONOMOUS OPERATION COMMITTED]: Recommended action task has been automatically executed and marked completed.`);break}case"revenue":{let e=await t.db.getRevenue(),o=await t.db.getProposals(),n=await t.db.getClients(),s=await t.db.getBusinessProfile(),i=e.filter(e=>"Paid"===e.status).reduce((e,t)=>e+Number(t.amount),0),c=Math.max(0,s.target_monthly_revenue-i),u=r?.websites||0,p=r?.receptionists||0,m=`
Analyze the following financial statistics for VELTRIX:
- Monthly Target: $${s.target_monthly_revenue}
- Closed Earnings: $${i}
- Earnings Gap: $${c}
- Active Clients: ${n.length}
- Active Proposals: ${o.length}
`;u>0||p>0?m+=`
The user is simulating closing the following deals:
- ${u} AI Website Refresh(es) ($1,200/each)
- ${p} AI Receptionist Setup(s) ($1,000/each + $250/mo retainer)

Provide a tactical sales execution playbook explaining how to close these specific deals. Which industries or prospects in our CRM should we target first? What objections will they raise and how do we handle them? Keep it highly structured and actionable.
`:m+=`
Provide a short, grounded financial report. Highlight the exact gap math. Calculate how many projects are needed to close the gap:
- Website refresh projects (average $1,200 each)
- AI Receptionist retainers (average $250/month each)
`,m+=`
Respond in character as Marcus, the Revenue Agent. Speak in a precise, helpful, and analytical conversational tone, addressed to Alex and the team naturally.
Output in a concise layout with next actions.
`;let g=await a.gemini.callRawLLM(m,l.systemPrompt);d=`**Marcus (Revenue Agent)**: ${g}`;break}case"sales":{let{leadId:e}=r;if(!e)return{success:!1,error:"leadId is required for Sales Agent"};let o=(await t.db.getLeads()).find(t=>t.id===e);if(!o)return{success:!1,error:"Lead not found"};let n=`
Analyze this specific lead for VELTRIX:
Business Name: ${o.business_name}
Industry: ${o.industry||"Unknown"}
Location: ${o.location||"Unknown"}
Pain Points: ${o.pain_point||"Unknown"}
Notes: ${o.notes||"None"}

Draft a sales pitch recommendation. Outline:
1. Which VELTRIX service fits best (AI Website, AI Receptionist, or Growth Package) and why.
2. The exact pitch angle (time-saved, revenue capture, or aesthetics reboot).
3. Objections handling guide for this client.

Respond in character as Sophia, the Sales Agent. Speak in a charismatic, persuasive, and highly professional conversational tone, addressed to Alex and the team naturally.
`,s=await a.gemini.callRawLLM(n,l.systemPrompt);d=`**Sophia (Sales Agent)**: ${s}`,o.business_name;break}case"leadResearch":{let e,{leadId:o}=r;if(!o)return{success:!1,error:"leadId is required for Lead Research Agent"};let n=(await t.db.getLeads()).find(e=>e.id===o);if(!n)return{success:!1,error:"Lead not found"};try{e=await a.gemini.scoreLead(n)}catch(o){let t=!!n.website,a=!!n.pain_point;(e={website_score:t?5:9,branding_score:7,automation_need_score:a?9:6,ability_to_pay_score:8,urgency_score:a?8:5,total_score:0,reasoning:`Qualifications calculated via local heuristics due to Gemini error: ${o.message}`}).total_score=Number(((e.website_score+e.branding_score+e.automation_need_score+e.ability_to_pay_score+e.urgency_score)/5).toFixed(1))}let l=e.total_score>=7?"Qualified":"Researched";await t.db.updateLead(o,{lead_score:e.total_score,status:l,notes:`${n.notes||""}

[AI Qualification Score: ${e.total_score}/10]
${e.reasoning}`.trim()}),await t.db.addMemory({type:"Lead",content:`Lead ${n.business_name} scored ${e.total_score}/10. Reasoning: ${e.reasoning}`,tags:["lead-scoring",n.business_name.toLowerCase().replace(/\s+/g,"-")],importance:7,source:"Lead Research Agent"});let c=await t.db.getBusinessProfile(),u=i||c.autopilot;if(u&&(await t.db.addTask({agent_name:"Lead Research Agent",title:`Autonomous research completed for ${n.business_name}`,description:`Automatically researched and qualified ${n.business_name}. Score: ${e.total_score}/10. Status set to ${l}.`,priority:"Medium",status:"Completed",related_lead_id:o}),e.total_score>=7)){let e=n.pain_point?.toLowerCase().includes("receptionist")||n.pain_point?.toLowerCase().includes("call")||"Dental"===n.industry;s("outreach",{leadId:o,offerName:e?"AI Receptionist / Lead Booking Agent":"AI Website + Brand System",channel:"Email"},!0)}d=`**Daniel (Lead Research Agent)**: Hey Alex, I completed qualifying scoring for lead **${n.business_name}**.

**Total Score:** ${e.total_score}/10

**Reasoning:** ${e.reasoning}`,u&&(d+=`

[AUTONOMOUS OPERATION COMMITTED]: Lead status updated to "${l}". Research task logged as Completed.`,e.total_score>=7&&(d+=" Outreach drafting automatically triggered."));break}case"outreach":{let e,{leadId:o,offerName:n,channel:s="Email"}=r;if(!o||!n)return{success:!1,error:"leadId and offerName are required for Outreach Agent"};let l=(await t.db.getLeads()).find(e=>e.id===o);if(!l)return{success:!1,error:"Lead not found"};try{e=await a.gemini.generateOutreach(l,n)}catch(n){let t=l.contact_name||"Owner",a=l.business_name,o=l.industry||"your business";e="LinkedIn"===s||"Instagram"===s?`Hi ${t} - noticed your page for ${a}. Love the work you do in ${o}! Quick question: do you guys handle after-hours bookings manually, or do you have a bot? We build simple AI receptionists that qualify leads and schedule them 24/7. Open to a 1-min demo video?`:`Hello ${t},

I was looking at ${a} online and noticed that patients or clients trying to book appointments after hours might bounce due to a lack of live scheduling assistance.

We design lightweight AI booking agents specifically for ${o} services. They handle common FAQs and schedule appointments directly into your calendar 24/7.

Would it be okay to send over a short 90-second video demo of how it looks?

Best,
VELTRIX Partner`}let c=await t.db.getBusinessProfile(),u=i||c.autopilot;await t.db.addOutreachMessage({lead_id:o,channel:s,message:e,status:u?"Sent":"Draft",approval_status:u?"Approved":"Pending Approval",sent_at:u?new Date().toISOString():void 0}),u&&await t.db.updateLead(o,{status:"Contacted"}),await t.db.addTask({agent_name:"Outreach Agent",title:u?`Autonomous outreach sent to ${l.business_name}`:`Review and approve outreach message for ${l.business_name}`,description:u?`Automatically sent outreach for ${l.business_name} using channel: ${s}.`:`Drafted outreach for ${l.business_name} using channel: ${s}. Click Approve to mark sent.`,priority:"High",status:u?"Completed":"Pending",related_lead_id:o}),d=u?`**Emma (Outreach Agent)**: Hey Alex! I've autonomously generated and sent the outreach message to **${l.business_name}** via ${s}.

I updated their lead status to "Contacted" and marked the message as "Sent" in the Outbox.`:`**Emma (Outreach Agent)**: Hey Alex! I've generated the outreach draft message for **${l.business_name}** via ${s}.

You can review it in the Outbox under "Pending Approval". Let me know if you want any edits!`;break}case"followup":{let{leadId:e,sequenceDay:o=3}=r;if(!e)return{success:!1,error:"leadId is required for Follow-up Agent"};let n=(await t.db.getLeads()).find(t=>t.id===e);if(!n)return{success:!1,error:"Lead not found"};let s=await a.gemini.generateFollowup(n,Number(o)),l=await t.db.getBusinessProfile(),c=i||l.autopilot;await t.db.addFollowup({lead_id:e,followup_date:new Date(Date.now()+1728e5).toISOString().split("T")[0],followup_type:`Day ${o} Follow-up`,message:s,status:c?"Sent":"Pending"}),await t.db.addTask({agent_name:"Follow-up Agent",title:c?`Autonomous Day ${o} follow-up sent to ${n.business_name}`:`Send Day ${o} follow-up to ${n.business_name}`,description:c?`Automatically generated and sent Day ${o} follow-up to ${n.business_name}.`:"Follow-up draft is saved. Channel: Check client calendar reminders.",priority:"Medium",status:c?"Completed":"Pending",related_lead_id:e}),d=c?`**Lucas (Follow-up Agent)**: Hi Alex, I've autonomously generated and sent the Day ${o} follow-up check-in to **${n.business_name}**.

Everything is logged in the CRM and the task is marked "Completed".`:`**Lucas (Follow-up Agent)**: Hi Alex, I've drafted the Day ${o} follow-up check-in message for **${n.business_name}**:

---

${s}

---

I've logged it in the CRM and set up a task for when we're ready to send.`;break}case"proposal":{let e,{leadId:o,offerName:n,price:s=1200}=r;if(!o||!n)return{success:!1,error:"leadId and offerName are required for Proposal Agent"};let l=(await t.db.getLeads()).find(e=>e.id===o);if(!l)return{success:!1,error:"Lead not found"};try{e=await a.gemini.generateProposal(l,n,s)}catch(o){let t=l.business_name,a=l.industry||"your business";e=`# Business Proposal: ${n} Integration

Prepared for: **${t}**

### Executive Summary
VELTRIX proposes a custom deployment of the **${n}** to solve core operational bottlenecks. Local diagnostics indicated critical areas of improvement in lead qualification and response times.

### Solution Overview
- **Automated Workflow**: Custom FAQs configured based on local ${a} operations.
- **Full Availability**: Handles inquiries 24/7, reducing lead bounce rates by 20%.
- **Pricing Model**: Total setup fee of $${s}.

*Generated via local backup templates.*`}await t.db.addProposal({lead_id:o,title:`${n} Proposal - ${l.business_name}`,problem:l.pain_point||"Outdated digital interface and conversion leaks.",solution:e,deliverables:n.toLowerCase().includes("receptionist")?["Custom AI chatbot or receptionist","FAQs knowledge base","Lead capture database","Calendar appointment booking","CRM sync"]:["5-page website","Mobile responsive design","Brand direction","High-converting copy","Contact & Booking integrations"],timeline:"2-3 weeks",price:Number(s),payment_terms:"50% upfront retainer, 50% upon deployment",status:i?"Sent":"Draft"}),i&&await t.db.updateLead(o,{status:"Proposal Sent"}),await t.db.addTask({agent_name:"Proposal Agent",title:i?`Autonomous proposal sent to ${l.business_name}`:`Review and finalize proposal for ${l.business_name}`,description:i?`Automatically sent proposal for ${n} ($${s}) to ${l.business_name}.`:`Drafted proposal for ${n} ($${s}). Click Accept to send to client when ready.`,priority:"Medium",status:i?"Completed":"Pending",related_lead_id:o}),d=i?`**Olivia (Proposal Agent)**: Hey Alex, I've autonomously generated and sent the proposal for **${n}** ($${s}) to **${l.business_name}**.

I've moved the proposal to "Sent", updated the lead status to "Proposal Sent", and marked the task "Completed".`:`**Olivia (Proposal Agent)**: Hey Alex, I've drafted the proposal for **${n}** ($${s}) for **${l.business_name}**.

You can review and finalize the proposal on the Price Quotes page whenever you're ready.`;break}case"content":{let{topic:e}=r;if(!e)return{success:!1,error:"topic is required for Content Agent"};let o=await a.gemini.generateContentIdeas(e);for(let e of o)await t.db.addContentIdea({platform:e.platform,title:e.title,hook:e.hook,content:e.content,content_type:e.content_type,status:"Idea"});d=`**Ryan (Content Agent)**: Hey team! Ryan here. I've successfully generated ${o.length} fresh authority content ideas on the topic "${e}":

`+o.map((e,t)=>`${t+1}. **${e.title}** (${e.platform})
*Hook:* ${e.hook}`).join("\n\n")+`

I've saved these drafts directly to the Social Writer page for you.`;break}case"delivery":{let{projectId:e}=r;if(!e)return{success:!1,error:"projectId is required for Delivery Manager Agent"};let o=(await t.db.getProjects()).find(t=>t.id===e);if(!o)return{success:!1,error:"Project not found"};let n=`
Generate a project milestone checklist for:
Project Name: ${o.project_name}
Service Type: ${o.service_type}
Status: ${o.status}
Requirements: ${o.requirements}

Respond in character as Mia, the Delivery Manager Agent. Speak in an organized, clear, and reassuring project-management conversational tone. Address your coordinator Alex and the team naturally.
Suggest a 6-item progress roadmap with clear checkboxes to mark in our delivery database.
`,s=await a.gemini.callRawLLM(n,l.systemPrompt);d=`**Mia (Delivery Manager Agent)**: ${s}`;break}case"memory":{let{query:e}=r;if(!e)return{success:!1,error:"query is required for Memory Manager Agent"};let a=await t.db.searchMemories(e);d=`**Leo (Memory Manager Agent)**: Hello Alex. I've searched our core database for "${e}" and recovered ${a.length} relevant log entries:

`+(0===a.length?"No matching memories or tags found.":a.map((e,t)=>`${t+1}. **[${e.type}]** ${e.content} (Importance: ${e.importance}/10)`).join("\n\n"));break}default:return{success:!1,error:"Agent execution not implemented"}}return await t.db.logAgentAction(l.name,"Run Agent Triggered Autonomously",JSON.stringify({params:r}),d,"Success"),{success:!0,result:d}}catch(a){console.error("Error running agent in executor:",a);try{let o=await (0,n.generateSimulatedResponse)(e,`Run Agent Direct Triggered: ${JSON.stringify(r)}`,a.message||"AI request failed");return await t.db.logAgentAction(l.name,"Run Agent Trigger Fallback Autonomously",JSON.stringify({params:r,error:a.message}),o.text,"Success"),{success:!0,result:o.text,simulated:!0}}catch(e){return{success:!1,error:e.message}}}}e.s(["runAgentLogic",0,s])}];

//# sourceMappingURL=src_lib_0jfuut2._.js.map