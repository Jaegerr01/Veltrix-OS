module.exports=[24229,e=>{"use strict";let t={ceo:{name:"Alex (CEO Agent)",role:"AI Chief of Staff",systemPrompt:`You are Alex, the CEO Agent (AI Chief of Staff) for VELTRIX COMMAND OS.
Your objective is to lead the VELTRIX team to cross its $6,000/month target. 
You act as a strategic, human-like advisor. Speak in a confident, conversational, and natural tone. Your responsibilities:
1. Analyze the live business database context (metrics, leads, tasks, upcoming follow-ups).
2. Prioritize high-value actions: suggest who to contact, identify delivery blockers, and recommend today's top checklist items.
3. Recommend how to patch the revenue gap by matching active leads to offerings (AI Websites, AI Receptionists, or Creative Tech Growth Packages).

COORDINATION & DELEGATION AUTONOMY:
You work with a collaborative team of specialized agents:
- Marcus (Revenue Agent)
- Sophia (Sales Agent)
- Daniel (Lead Research Agent)
- Emma (Outreach Agent)
- Lucas (Follow-up Agent)
- Olivia (Proposal Agent)
- Ryan (Content Agent)
- Mia (Delivery Manager Agent)
- Leo (Memory Manager Agent)

If the user assigns a task that should be handled by a specialized agent, you can coordinate and execute that task by including one or more commands in your response. The system will automatically run these agents in the background.

To execute a specialized agent, output:
[RUN_AGENT: agentKey, {"paramName": "value"}]

Available agents for delegation and their exact parameters (derive the ID or parameters from the CRM database context provided in the conversation):
- leadResearch (Qualify and score a lead):
  Parameters: {"leadId": "string"}
- outreach (Draft cold outreach copy):
  Parameters: {"leadId": "string", "offerName": "string", "channel": "Email" | "LinkedIn" | "Instagram"}
- proposal (Draft a premium price quote/proposal):
  Parameters: {"leadId": "string", "offerName": "string", "price": number}
- followup (Draft follow-up copy):
  Parameters: {"leadId": "string", "sequenceDay": number}
- content (Draft social media posts/carousels):
  Parameters: {"topic": "string"}
- delivery (Create step-by-step project delivery roadmap checklist):
  Parameters: {"projectId": "string"}
- memory (Search notes or tags):
  Parameters: {"query": "string"}

Always use real, existing UUIDs for leadId or projectId from the database context. If you need to research/qualify a lead and write an email, you should output both [RUN_AGENT: leadResearch, ...] and [RUN_AGENT: outreach, ...] in sequence. You can declare as many as you need. Keep the user informed that you are executing this autonomously in the background.`,actions:["Recommend next best action","Generate daily checklist","Prioritize client pipeline"]},revenue:{name:"Marcus (Revenue Agent)",role:"Financial Operations Analyst",systemPrompt:`You are Marcus, the Revenue Agent (Financial Operations Analyst) for VELTRIX.
Your objective is to monitor targets ($6,000/mo) and map the mathematical path to victory.
Speak in a precise, helpful, and analytical conversational tone. Address your team members (especially Alex) naturally.
Your responsibilities:
1. Break down the current closed revenue, pipeline estimates, and the revenue gap.
2. Provide clear math explaining exactly how many deals of each tier are needed (e.g. AI Website systems at $1,200/each, or AI Receptionist setups at $800 + $250/mo retainers).
3. Outline historical or expected trends from the revenue record. Always present neat calculations.`,actions:["Calculate revenue gap","Project monthly earnings","Run sales modeling forecasts"]},sales:{name:"Sophia (Sales Agent)",role:"Conversion Optimization Strategist",systemPrompt:`You are Sophia, the Sales Agent (Conversion Optimization Strategist) for VELTRIX.
Your objective is to formulate sales strategies, angles, and pitch guidelines to close leads.
Speak in a charismatic, persuasive, and highly professional conversational tone. Address your coordinator Alex naturally.
Your responsibilities:
1. Review lead details: website weaknesses, branding flaws, and lack of automations.
2. Prepare a customized pitch for the lead. Recommend either the AI Website + Brand System ($800 - $1,500), AI Receptionist / Lead Booking Agent ($500 - $1,200 + retainer), or Growth Package ($1,000 - $2,500).
3. Address common objections (e.g. "We don't need a bot," "It's too expensive") with customized scripts based on their industry pain points.`,actions:["Recommend service offer","Prepare objection responses","Design sales hooks"]},leadResearch:{name:"Daniel (Lead Research Agent)",role:"Lead Qualifier & Assessor",systemPrompt:`You are Daniel, the Lead Research Agent (Lead Qualifier & Assessor) for VELTRIX.
Your objective is to analyze lead data and score their potential from 1 to 10.
Speak in a curious, detail-oriented, and structured conversational tone. Address your coordinator Alex naturally.
Your responsibilities:
1. Evaluate website quality, branding strength, booking funnel efficiency, and potential automation needs.
2. Produce individual scores (1-10) for Website Weakness (higher is worse website), Brand Weakness, Automation Need, Ability to Pay, and Urgency.
3. Output the total score as the mathematical average of these factors and provide structured reasoning.`,actions:["Score lead fit","Analyze competitor presence","Identify tech stack weaknesses"]},outreach:{name:"Emma (Outreach Agent)",role:"Cold Outreach Writer",systemPrompt:`You are Emma, the Outreach Agent (Cold Outreach Writer) for VELTRIX.
Your objective is to draft short, high-conversion cold outreach sequences.
Speak in a creative, warm, and highly engaging conversational tone. Address your coordinator Alex naturally.
Your responsibilities:
1. Craft highly personalized outreach messages (Email, LinkedIn, Instagram) referencing the lead's specific business niche.
2. Use a soft CTA (e.g., "Can I send you a 2-minute video showing how we can capture these booking leaks?").
3. Keep the content extremely concise (3-4 sentences, no huge walls of text) and professional. Never sound needy or automated.`,actions:["Draft email outreach","Write LinkedIn DM","Draft Instagram outreach"]},followup:{name:"Lucas (Follow-up Agent)",role:"Pipeline Nurturer",systemPrompt:`You are Lucas, the Follow-up Agent (Pipeline Nurturer) for VELTRIX.
Your objective is to maintain lead engagement without being intrusive.
Speak in a persistent, friendly, and relationship-driven conversational tone. Address your coordinator Alex naturally.
Your responsibilities:
1. Draft follow-up messages depending on the lead's pipeline status and follow-up interval:
   - Day 3: Soft reminder / check-in.
   - Day 7: Value injection (e.g., share a quick tip or industry statistic).
   - Day 14: Final check-in / break-up message.
   - Day 30: Re-engagement prompt.
2. Keep the copy short, casual, helpful, and focused on starting a conversation.`,actions:["Draft follow-up template","Recommend follow-up channel","Schedule sequence reminder"]},proposal:{name:"Olivia (Proposal Agent)",role:"Business Proposal Writer",systemPrompt:`You are Olivia, the Proposal Agent (Business Proposal Writer) for VELTRIX.
Your objective is to generate formal, premium business proposals.
Speak in a professional, detail-oriented, and value-focused conversational tone. Address your coordinator Alex naturally.
Your responsibilities:
1. Structuring proposals with: Executive Overview, Identified Problems, Recommended Solution, Deliverables list, Pricing (setup + retainers), Payment Terms, and Next Steps.
2. Outputting the proposal in well-structured Markdown. Focus on the value and ROI of the VELTRIX implementation.`,actions:["Create client proposal","Estimate delivery scope","Structure pricing milestones"]},content:{name:"Ryan (Content Agent)",role:"Brand Content Creator",systemPrompt:`You are Ryan, the Content Agent (Brand Content Creator) for VELTRIX.
Your objective is to design authority-building social media content.
Speak in an energetic, creative, and industry-savvy conversational tone. Address your coordinator Alex naturally.
Your responsibilities:
1. Brainstorm hooks, outlines, and body copy for LinkedIn, Instagram, and YouTube.
2. Focus on educating clients on the power of AI receptionists, booking widgets, modern branding, and fast landing pages.
3. Provide high-converting structures (e.g. Hook, Story, Value, call to action).`,actions:["Generate LinkedIn post","Draft Instagram caption","Outline video hook"]},delivery:{name:"Mia (Delivery Manager Agent)",role:"Client Project Manager",systemPrompt:`You are Mia, the Delivery Manager Agent (Client Project Manager) for VELTRIX.
Your objective is to ensure sold projects are delivered flawlessly.
Speak in an organized, clear, and reassuring project-management conversational tone. Address your coordinator Alex naturally.
Your responsibilities:
1. Build step-by-step onboarding and implementation checklists for branding, custom websites, or AI receptionists.
2. Keep track of project statuses (Discovery, Design, Development, Review) and deadlines.
3. Draft professional client progress updates to keep the customer aligned and happy.`,actions:["Build checklist roadmap","Draft client progress email","Plan revision cycles"]},memory:{name:"Leo (Memory Manager Agent)",role:"Knowledge Graph Custodian",systemPrompt:`You are Leo, the Memory Manager Agent (Knowledge Graph Custodian) for VELTRIX.
Your objective is to organize and structure business notes and decisions.
Speak in a helpful, structured, and recollection-oriented conversational tone. Address your coordinator Alex naturally.
Your responsibilities:
1. Analyze business notes, preferences, or findings, tagging them appropriately.
2. Retrieve relevant context for specific queries and summarize core lessons learned.
3. Help the team maintain a single source of truth for all client preferences and business strategy updates.`,actions:["Summarize business notes","Tag memories","Retrieve relative context"]}};e.s(["AGENTS",0,t])},18622,(e,t,a)=>{t.exports=e.x("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js",()=>require("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js"))},56704,(e,t,a)=>{t.exports=e.x("next/dist/server/app-render/work-async-storage.external.js",()=>require("next/dist/server/app-render/work-async-storage.external.js"))},32319,(e,t,a)=>{t.exports=e.x("next/dist/server/app-render/work-unit-async-storage.external.js",()=>require("next/dist/server/app-render/work-unit-async-storage.external.js"))},24725,(e,t,a)=>{t.exports=e.x("next/dist/server/app-render/after-task-async-storage.external.js",()=>require("next/dist/server/app-render/after-task-async-storage.external.js"))},70406,(e,t,a)=>{t.exports=e.x("next/dist/compiled/@opentelemetry/api",()=>require("next/dist/compiled/@opentelemetry/api"))},93695,(e,t,a)=>{t.exports=e.x("next/dist/shared/lib/no-fallback-error.external.js",()=>require("next/dist/shared/lib/no-fallback-error.external.js"))},17301,e=>{"use strict";var t=e.i(24389);let a=(()=>{let e="https://sxueyuqpqeqvzuzhrhxo.supabase.co";if(e.includes("supabase.com/dashboard/project/")){let t=e.split("/"),a=t[t.length-1];e=`https://${a}.supabase.co`}return e})(),r=process.env.SUPABASE_SERVICE_ROLE_KEY||"",n=a&&r&&"undefined"!==a&&"undefined"!==r?(0,t.createClient)(a,r,{auth:{persistSession:!1,autoRefreshToken:!1}}):null;e.s(["supabaseAdmin",0,n])},15677,59354,e=>{"use strict";var t=e.i(89171),a=e.i(17301);async function r(e){let r=e.headers.get("Authorization"),n=r?.startsWith("Bearer ")?r.slice(7).trim():null;if(!n)return{user:null,response:t.NextResponse.json({success:!1,error:"Unauthorized"},{status:401})};if(!a.supabaseAdmin)return{user:{id:"local-dev",email:void 0},response:null};let{data:{user:o},error:s}=await a.supabaseAdmin.auth.getUser(n);return s||!o?{user:null,response:t.NextResponse.json({success:!1,error:"Unauthorized"},{status:401})}:{user:{id:o.id,email:o.email},response:null}}e.s(["requireUser",0,r],15677);let n=new Map;e.s(["checkRateLimit",0,function(e,{limit:t=20,windowMs:a=6e4}={}){let r=Date.now(),o=n.get(e)??{timestamps:[]};return(o.timestamps=o.timestamps.filter(e=>r-e<a),o.timestamps.length>=t)?(n.set(e,o),{allowed:!1,remaining:0}):(o.timestamps.push(r),n.set(e,o),{allowed:!0,remaining:t-o.timestamps.length})}],59354)},8223,e=>{"use strict";e.i(28976),e.s([])},394,e=>{"use strict";e.i(75705);var t=e.i(84501);e.i(8223);var a=e.i(28976),r=e.i(24229),n=e.i(82408);async function o(e,s,i=!1){if(!e||!r.AGENTS[e])return{success:!1,error:"Valid agentKey is required"};let l=r.AGENTS[e],d="";try{switch(e){case"ceo":{let e=await t.db.getBusinessProfile(),r=await t.db.getLeads(),n=await t.db.getMemories(),o=await t.db.getDailyReports(),s=new Date().toISOString().split("T")[0],l=o.find(e=>e.report_date===s);if(!l){let o,d=r.slice(0,10),u=0;r.forEach(e=>{["Qualified","Contacted","Replied","Call Booked","Proposal Sent"].includes(e.status)&&(e.notes?.toLowerCase().includes("website")||e.notes?.toLowerCase().includes("brand")?u+=1200:e.notes?.toLowerCase().includes("receptionist")||e.notes?.toLowerCase().includes("bot")?u+=1e3:u+=1500)});try{o=await a.gemini.generateDailyReport(e.target_monthly_revenue,e.current_monthly_revenue,u,d,n)}catch(t){o=`VELTRIX Daily Command Report

Revenue Target:
$${e.target_monthly_revenue}

Closed Revenue:
$${e.current_monthly_revenue}

Pipeline Value:
$${u}

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
Open Potential Clients page.`}let c=o.split("\n"),p="Review qualified leads and outline sales scripts.",m=[],g=[],h="Draft LinkedIn hook for business AI.",f="Contact dentist leads.",y="";c.forEach(e=>{let t=e.trim();t.startsWith("Today's Top Priority:")?y="priority":t.startsWith("Leads to Contact:")?y="leads":t.startsWith("Follow-ups Due:")?y="followups":t.startsWith("Content to Post:")?y="content":t.startsWith("Recommended Action:")?y="action":t.startsWith("Risk / Blocker:")||t.startsWith("Next Step:")||t.startsWith("Revenue Target:")||t.startsWith("Closed Revenue:")||t.startsWith("Pipeline Value:")||t.startsWith("Revenue Gap:")?y="":"priority"===y&&t?p=t:"leads"===y&&t.match(/^\d+\./)?m.push(t.replace(/^\d+\.\s*/,"")):"followups"===y&&t.match(/^\d+\./)?g.push(t.replace(/^\d+\.\s*/,"")):"content"===y&&t?h=t:"action"===y&&t&&(f=t)}),l=await t.db.addDailyReport({report_date:s,revenue_target:e.target_monthly_revenue,closed_revenue:e.current_monthly_revenue,pipeline_value:u,revenue_gap:e.target_monthly_revenue-e.current_monthly_revenue,top_priority:p,leads_to_contact:m.slice(0,3),followups_due:g.slice(0,2),content_to_post:h,recommended_action:f}),await t.db.addMemory({type:"Decision",content:`Veltrix Daily Command Report generated for ${s}. Recommended action: ${f}`,tags:["daily-report","automated"],importance:6,source:"AI CEO"}),await t.db.addTask({agent_name:"Outreach Agent",title:`Perform recommended action: ${f.substring(0,70)}...`,description:`Recommended in Daily Report: ${f}. Address leads: ${m.join(", ")}`,priority:"High",status:i?"Completed":"Pending",due_date:s})}d=`Hey team, Alex here. I've successfully compiled today's Daily Action Plan:

**Top Priority:** ${l.top_priority}

**Recommended Action:** ${l.recommended_action}

Let's get to work! Check the "Daily Summaries" page for the full layout.`,i&&(d+=`

[AUTONOMOUS OPERATION COMMITTED]: Recommended action task has been automatically executed and marked completed.`);break}case"revenue":{let e=await t.db.getRevenue(),r=await t.db.getProposals(),n=await t.db.getClients(),o=await t.db.getBusinessProfile(),i=e.filter(e=>"Paid"===e.status).reduce((e,t)=>e+Number(t.amount),0),u=Math.max(0,o.target_monthly_revenue-i),c=s?.websites||0,p=s?.receptionists||0,m=`
Analyze the following financial statistics for VELTRIX:
- Monthly Target: $${o.target_monthly_revenue}
- Closed Earnings: $${i}
- Earnings Gap: $${u}
- Active Clients: ${n.length}
- Active Proposals: ${r.length}
`;c>0||p>0?m+=`
The user is simulating closing the following deals:
- ${c} AI Website Refresh(es) ($1,200/each)
- ${p} AI Receptionist Setup(s) ($1,000/each + $250/mo retainer)

Provide a tactical sales execution playbook explaining how to close these specific deals. Which industries or prospects in our CRM should we target first? What objections will they raise and how do we handle them? Keep it highly structured and actionable.
`:m+=`
Provide a short, grounded financial report. Highlight the exact gap math. Calculate how many projects are needed to close the gap:
- Website refresh projects (average $1,200 each)
- AI Receptionist retainers (average $250/month each)
`,m+=`
Respond in character as Marcus, the Revenue Agent. Speak in a precise, helpful, and analytical conversational tone, addressed to Alex and the team naturally.
Output in a concise layout with next actions.
`;let g=await a.gemini.callRawLLM(m,l.systemPrompt);d=`**Marcus (Revenue Agent)**: ${g}`;break}case"sales":{let{leadId:e}=s;if(!e)return{success:!1,error:"leadId is required for Sales Agent"};let r=(await t.db.getLeads()).find(t=>t.id===e);if(!r)return{success:!1,error:"Lead not found"};let n=`
Analyze this specific lead for VELTRIX:
Business Name: ${r.business_name}
Industry: ${r.industry||"Unknown"}
Location: ${r.location||"Unknown"}
Pain Points: ${r.pain_point||"Unknown"}
Notes: ${r.notes||"None"}

Draft a sales pitch recommendation. Outline:
1. Which VELTRIX service fits best (AI Website, AI Receptionist, or Growth Package) and why.
2. The exact pitch angle (time-saved, revenue capture, or aesthetics reboot).
3. Objections handling guide for this client.

Respond in character as Sophia, the Sales Agent. Speak in a charismatic, persuasive, and highly professional conversational tone, addressed to Alex and the team naturally.
`,o=await a.gemini.callRawLLM(n,l.systemPrompt);d=`**Sophia (Sales Agent)**: ${o}`,r.business_name;break}case"leadResearch":{let e,{leadId:r}=s;if(!r)return{success:!1,error:"leadId is required for Lead Research Agent"};let n=(await t.db.getLeads()).find(e=>e.id===r);if(!n)return{success:!1,error:"Lead not found"};try{e=await a.gemini.scoreLead(n)}catch(r){let t=!!n.website,a=!!n.pain_point;(e={website_score:t?5:9,branding_score:7,automation_need_score:a?9:6,ability_to_pay_score:8,urgency_score:a?8:5,total_score:0,reasoning:`Qualifications calculated via local heuristics due to Gemini error: ${r.message}`}).total_score=Number(((e.website_score+e.branding_score+e.automation_need_score+e.ability_to_pay_score+e.urgency_score)/5).toFixed(1))}let l=e.total_score>=7?"Qualified":"Researched";await t.db.updateLead(r,{lead_score:e.total_score,status:l,notes:`${n.notes||""}

[AI Qualification Score: ${e.total_score}/10]
${e.reasoning}`.trim()}),await t.db.addMemory({type:"Lead",content:`Lead ${n.business_name} scored ${e.total_score}/10. Reasoning: ${e.reasoning}`,tags:["lead-scoring",n.business_name.toLowerCase().replace(/\s+/g,"-")],importance:7,source:"Lead Research Agent"});let u=await t.db.getBusinessProfile(),c=i||u.autopilot;if(c&&(await t.db.addTask({agent_name:"Lead Research Agent",title:`Autonomous research completed for ${n.business_name}`,description:`Automatically researched and qualified ${n.business_name}. Score: ${e.total_score}/10. Status set to ${l}.`,priority:"Medium",status:"Completed",related_lead_id:r}),e.total_score>=7)){let e=n.pain_point?.toLowerCase().includes("receptionist")||n.pain_point?.toLowerCase().includes("call")||"Dental"===n.industry;o("outreach",{leadId:r,offerName:e?"AI Receptionist / Lead Booking Agent":"AI Website + Brand System",channel:"Email"},!0)}d=`**Daniel (Lead Research Agent)**: Hey Alex, I completed qualifying scoring for lead **${n.business_name}**.

**Total Score:** ${e.total_score}/10

**Reasoning:** ${e.reasoning}`,c&&(d+=`

[AUTONOMOUS OPERATION COMMITTED]: Lead status updated to "${l}". Research task logged as Completed.`,e.total_score>=7&&(d+=" Outreach drafting automatically triggered."));break}case"outreach":{let e,{leadId:r,offerName:n,channel:o="Email"}=s;if(!r||!n)return{success:!1,error:"leadId and offerName are required for Outreach Agent"};let l=(await t.db.getLeads()).find(e=>e.id===r);if(!l)return{success:!1,error:"Lead not found"};try{e=await a.gemini.generateOutreach(l,n)}catch(n){let t=l.contact_name||"Owner",a=l.business_name,r=l.industry||"your business";e="LinkedIn"===o||"Instagram"===o?`Hi ${t} - noticed your page for ${a}. Love the work you do in ${r}! Quick question: do you guys handle after-hours bookings manually, or do you have a bot? We build simple AI receptionists that qualify leads and schedule them 24/7. Open to a 1-min demo video?`:`Hello ${t},

I was looking at ${a} online and noticed that patients or clients trying to book appointments after hours might bounce due to a lack of live scheduling assistance.

We design lightweight AI booking agents specifically for ${r} services. They handle common FAQs and schedule appointments directly into your calendar 24/7.

Would it be okay to send over a short 90-second video demo of how it looks?

Best,
VELTRIX Partner`}let u=await t.db.getBusinessProfile(),c=i||u.autopilot;await t.db.addOutreachMessage({lead_id:r,channel:o,message:e,status:c?"Sent":"Draft",approval_status:c?"Approved":"Pending Approval",sent_at:c?new Date().toISOString():void 0}),c&&await t.db.updateLead(r,{status:"Contacted"}),await t.db.addTask({agent_name:"Outreach Agent",title:c?`Autonomous outreach sent to ${l.business_name}`:`Review and approve outreach message for ${l.business_name}`,description:c?`Automatically sent outreach for ${l.business_name} using channel: ${o}.`:`Drafted outreach for ${l.business_name} using channel: ${o}. Click Approve to mark sent.`,priority:"High",status:c?"Completed":"Pending",related_lead_id:r}),d=c?`**Emma (Outreach Agent)**: Hey Alex! I've autonomously generated and sent the outreach message to **${l.business_name}** via ${o}.

I updated their lead status to "Contacted" and marked the message as "Sent" in the Outbox.`:`**Emma (Outreach Agent)**: Hey Alex! I've generated the outreach draft message for **${l.business_name}** via ${o}.

You can review it in the Outbox under "Pending Approval". Let me know if you want any edits!`;break}case"followup":{let{leadId:e,sequenceDay:r=3}=s;if(!e)return{success:!1,error:"leadId is required for Follow-up Agent"};let n=(await t.db.getLeads()).find(t=>t.id===e);if(!n)return{success:!1,error:"Lead not found"};let o=await a.gemini.generateFollowup(n,Number(r)),l=await t.db.getBusinessProfile(),u=i||l.autopilot;await t.db.addFollowup({lead_id:e,followup_date:new Date(Date.now()+1728e5).toISOString().split("T")[0],followup_type:`Day ${r} Follow-up`,message:o,status:u?"Sent":"Pending"}),await t.db.addTask({agent_name:"Follow-up Agent",title:u?`Autonomous Day ${r} follow-up sent to ${n.business_name}`:`Send Day ${r} follow-up to ${n.business_name}`,description:u?`Automatically generated and sent Day ${r} follow-up to ${n.business_name}.`:"Follow-up draft is saved. Channel: Check client calendar reminders.",priority:"Medium",status:u?"Completed":"Pending",related_lead_id:e}),d=u?`**Lucas (Follow-up Agent)**: Hi Alex, I've autonomously generated and sent the Day ${r} follow-up check-in to **${n.business_name}**.

Everything is logged in the CRM and the task is marked "Completed".`:`**Lucas (Follow-up Agent)**: Hi Alex, I've drafted the Day ${r} follow-up check-in message for **${n.business_name}**:

---

${o}

---

I've logged it in the CRM and set up a task for when we're ready to send.`;break}case"proposal":{let e,{leadId:r,offerName:n,price:o=1200}=s;if(!r||!n)return{success:!1,error:"leadId and offerName are required for Proposal Agent"};let l=(await t.db.getLeads()).find(e=>e.id===r);if(!l)return{success:!1,error:"Lead not found"};try{e=await a.gemini.generateProposal(l,n,o)}catch(r){let t=l.business_name,a=l.industry||"your business";e=`# Business Proposal: ${n} Integration

Prepared for: **${t}**

### Executive Summary
VELTRIX proposes a custom deployment of the **${n}** to solve core operational bottlenecks. Local diagnostics indicated critical areas of improvement in lead qualification and response times.

### Solution Overview
- **Automated Workflow**: Custom FAQs configured based on local ${a} operations.
- **Full Availability**: Handles inquiries 24/7, reducing lead bounce rates by 20%.
- **Pricing Model**: Total setup fee of $${o}.

*Generated via local backup templates.*`}await t.db.addProposal({lead_id:r,title:`${n} Proposal - ${l.business_name}`,problem:l.pain_point||"Outdated digital interface and conversion leaks.",solution:e,deliverables:n.toLowerCase().includes("receptionist")?["Custom AI chatbot or receptionist","FAQs knowledge base","Lead capture database","Calendar appointment booking","CRM sync"]:["5-page website","Mobile responsive design","Brand direction","High-converting copy","Contact & Booking integrations"],timeline:"2-3 weeks",price:Number(o),payment_terms:"50% upfront retainer, 50% upon deployment",status:i?"Sent":"Draft"}),i&&await t.db.updateLead(r,{status:"Proposal Sent"}),await t.db.addTask({agent_name:"Proposal Agent",title:i?`Autonomous proposal sent to ${l.business_name}`:`Review and finalize proposal for ${l.business_name}`,description:i?`Automatically sent proposal for ${n} ($${o}) to ${l.business_name}.`:`Drafted proposal for ${n} ($${o}). Click Accept to send to client when ready.`,priority:"Medium",status:i?"Completed":"Pending",related_lead_id:r}),d=i?`**Olivia (Proposal Agent)**: Hey Alex, I've autonomously generated and sent the proposal for **${n}** ($${o}) to **${l.business_name}**.

I've moved the proposal to "Sent", updated the lead status to "Proposal Sent", and marked the task "Completed".`:`**Olivia (Proposal Agent)**: Hey Alex, I've drafted the proposal for **${n}** ($${o}) for **${l.business_name}**.

You can review and finalize the proposal on the Price Quotes page whenever you're ready.`;break}case"content":{let{topic:e}=s;if(!e)return{success:!1,error:"topic is required for Content Agent"};let r=await a.gemini.generateContentIdeas(e);for(let e of r)await t.db.addContentIdea({platform:e.platform,title:e.title,hook:e.hook,content:e.content,content_type:e.content_type,status:"Idea"});d=`**Ryan (Content Agent)**: Hey team! Ryan here. I've successfully generated ${r.length} fresh authority content ideas on the topic "${e}":

`+r.map((e,t)=>`${t+1}. **${e.title}** (${e.platform})
*Hook:* ${e.hook}`).join("\n\n")+`

I've saved these drafts directly to the Social Writer page for you.`;break}case"delivery":{let{projectId:e}=s;if(!e)return{success:!1,error:"projectId is required for Delivery Manager Agent"};let r=(await t.db.getProjects()).find(t=>t.id===e);if(!r)return{success:!1,error:"Project not found"};let n=`
Generate a project milestone checklist for:
Project Name: ${r.project_name}
Service Type: ${r.service_type}
Status: ${r.status}
Requirements: ${r.requirements}

Respond in character as Mia, the Delivery Manager Agent. Speak in an organized, clear, and reassuring project-management conversational tone. Address your coordinator Alex and the team naturally.
Suggest a 6-item progress roadmap with clear checkboxes to mark in our delivery database.
`,o=await a.gemini.callRawLLM(n,l.systemPrompt);d=`**Mia (Delivery Manager Agent)**: ${o}`;break}case"memory":{let{query:e}=s;if(!e)return{success:!1,error:"query is required for Memory Manager Agent"};let a=await t.db.searchMemories(e);d=`**Leo (Memory Manager Agent)**: Hello Alex. I've searched our core database for "${e}" and recovered ${a.length} relevant log entries:

`+(0===a.length?"No matching memories or tags found.":a.map((e,t)=>`${t+1}. **[${e.type}]** ${e.content} (Importance: ${e.importance}/10)`).join("\n\n"));break}default:return{success:!1,error:"Agent execution not implemented"}}return await t.db.logAgentAction(l.name,"Run Agent Triggered Autonomously",JSON.stringify({params:s}),d,"Success"),{success:!0,result:d}}catch(a){console.error("Error running agent in executor:",a);try{let r=await (0,n.generateSimulatedResponse)(e,`Run Agent Direct Triggered: ${JSON.stringify(s)}`,a.message||"AI request failed");return await t.db.logAgentAction(l.name,"Run Agent Trigger Fallback Autonomously",JSON.stringify({params:s,error:a.message}),r.text,"Success"),{success:!0,result:r.text,simulated:!0}}catch(e){return{success:!1,error:e.message}}}}e.s(["runAgentLogic",0,o])},39204,e=>{"use strict";var t=e.i(47909),a=e.i(74017),r=e.i(96250),n=e.i(59756),o=e.i(61916),s=e.i(74677),i=e.i(69741),l=e.i(16795),d=e.i(87718),u=e.i(95169),c=e.i(47587),p=e.i(66012),m=e.i(70101),g=e.i(26937),h=e.i(10372),f=e.i(93695);e.i(52474);var y=e.i(5232),v=e.i(89171),b=e.i(394),w=e.i(15677),A=e.i(59354);async function R(e){let t=await (0,w.requireUser)(e);if(t.response)return t.response;if(!(0,A.checkRateLimit)(t.user.id).allowed)return v.NextResponse.json({success:!1,error:"Rate limit exceeded. Try again in a minute."},{status:429});try{let t=await e.json().catch(()=>({})),a=t.agentKey||"",r=t.params||{},n=t.autonomous||!1,o=await (0,b.runAgentLogic)(a,r,n);if(!o.success)return v.NextResponse.json({success:!1,error:o.error},{status:400});return v.NextResponse.json({success:!0,result:o.result,simulated:o.simulated})}catch(e){return console.error("Error running agent in route:",e),v.NextResponse.json({success:!1,error:e.message},{status:500})}}e.s(["POST",0,R],96870);var _=e.i(96870);let k=new t.AppRouteRouteModule({definition:{kind:a.RouteKind.APP_ROUTE,page:"/api/ai/agent/run/route",pathname:"/api/ai/agent/run",filename:"route",bundlePath:""},distDir:".next",relativeProjectDir:"",resolvedPagePath:"[project]/src/app/api/ai/agent/run/route.ts",nextConfigOutput:"standalone",userland:_,...{}}),{workAsyncStorage:$,workUnitAsyncStorage:x,serverHooks:I}=k;async function P(e,t,r){r.requestMeta&&(0,n.setRequestMeta)(e,r.requestMeta),k.isDev&&(0,n.addRequestMeta)(e,"devRequestTimingInternalsEnd",process.hrtime.bigint());let v="/api/ai/agent/run/route";v=v.replace(/\/index$/,"")||"/";let b=await k.prepare(e,t,{srcPage:v,multiZoneDraftMode:!1});if(!b)return t.statusCode=400,t.end("Bad Request"),null==r.waitUntil||r.waitUntil.call(r,Promise.resolve()),null;let{buildId:w,deploymentId:A,params:R,nextConfig:_,parsedUrl:$,isDraftMode:x,prerenderManifest:I,routerServerContext:P,isOnDemandRevalidate:C,revalidateOnlyGenerated:S,resolvedPathname:E,clientReferenceManifest:L,serverActionsManifest:T}=b,O=(0,i.normalizeAppPath)(v),D=!!(I.dynamicRoutes[O]||I.routes[E]),M=async()=>((null==P?void 0:P.render404)?await P.render404(e,t,$,!1):t.end("This page could not be found"),null);if(D&&!x){let e=!!I.routes[E],t=I.dynamicRoutes[O];if(t&&!1===t.fallback&&!e){if(_.adapterPath)return await M();throw new f.NoFallbackError}}let N=null;!D||k.isDev||x||(N="/index"===(N=E)?"/":N);let j=!0===k.isDev||!D,q=D&&!j;T&&L&&(0,s.setManifestsSingleton)({page:v,clientReferenceManifest:L,serverActionsManifest:T});let W=e.method||"GET",Y=(0,o.getTracer)(),H=Y.getActiveScopeSpan(),U=!!(null==P?void 0:P.isWrappedByNextServer),B=!!(0,n.getRequestMeta)(e,"minimalMode"),F=(0,n.getRequestMeta)(e,"incrementalCache")||await k.getIncrementalCache(e,_,I,B);null==F||F.resetRequestCache(),globalThis.__incrementalCache=F;let z={params:R,previewProps:I.preview,renderOpts:{experimental:{authInterrupts:!!_.experimental.authInterrupts},cacheComponents:!!_.cacheComponents,supportsDynamicResponse:j,incrementalCache:F,cacheLifeProfiles:_.cacheLife,waitUntil:r.waitUntil,onClose:e=>{t.on("close",e)},onAfterTaskError:void 0,onInstrumentationRequestError:(t,a,r,n)=>k.onRequestError(e,t,r,n,P)},sharedContext:{buildId:w,deploymentId:A}},V=new l.NodeNextRequest(e),G=new l.NodeNextResponse(t),X=d.NextRequestAdapter.fromNodeNextRequest(V,(0,d.signalFromNodeResponse)(t));try{let n,s=async e=>k.handle(X,z).finally(()=>{if(!e)return;e.setAttributes({"http.status_code":t.statusCode,"next.rsc":!1});let a=Y.getRootSpanAttributes();if(!a)return;if(a.get("next.span_type")!==u.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${a.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let r=a.get("next.route");if(r){let t=`${W} ${r}`;e.setAttributes({"next.route":r,"http.route":r,"next.span_name":t}),e.updateName(t),n&&n!==e&&(n.setAttribute("http.route",r),n.updateName(t))}else e.updateName(`${W} ${v}`)}),i=async n=>{var o,i;let l=async({previousCacheEntry:a})=>{try{if(!B&&C&&S&&!a)return t.statusCode=404,t.setHeader("x-nextjs-cache","REVALIDATED"),t.end("This page could not be found"),null;let o=await s(n);e.fetchMetrics=z.renderOpts.fetchMetrics;let i=z.renderOpts.pendingWaitUntil;i&&r.waitUntil&&(r.waitUntil(i),i=void 0);let l=z.renderOpts.collectedTags;if(!D)return await (0,p.sendResponse)(V,G,o,z.renderOpts.pendingWaitUntil),null;{let e=await o.blob(),t=(0,m.toNodeOutgoingHttpHeaders)(o.headers);l&&(t[h.NEXT_CACHE_TAGS_HEADER]=l),!t["content-type"]&&e.type&&(t["content-type"]=e.type);let a=void 0!==z.renderOpts.collectedRevalidate&&!(z.renderOpts.collectedRevalidate>=h.INFINITE_CACHE)&&z.renderOpts.collectedRevalidate,r=void 0===z.renderOpts.collectedExpire||z.renderOpts.collectedExpire>=h.INFINITE_CACHE?void 0:z.renderOpts.collectedExpire;return{value:{kind:y.CachedRouteKind.APP_ROUTE,status:o.status,body:Buffer.from(await e.arrayBuffer()),headers:t},cacheControl:{revalidate:a,expire:r}}}}catch(t){throw(null==a?void 0:a.isStale)&&await k.onRequestError(e,t,{routerKind:"App Router",routePath:v,routeType:"route",revalidateReason:(0,c.getRevalidateReason)({isStaticGeneration:q,isOnDemandRevalidate:C})},!1,P),t}},d=await k.handleResponse({req:e,nextConfig:_,cacheKey:N,routeKind:a.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:I,isRoutePPREnabled:!1,isOnDemandRevalidate:C,revalidateOnlyGenerated:S,responseGenerator:l,waitUntil:r.waitUntil,isMinimalMode:B});if(!D)return null;if((null==d||null==(o=d.value)?void 0:o.kind)!==y.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==d||null==(i=d.value)?void 0:i.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});B||t.setHeader("x-nextjs-cache",C?"REVALIDATED":d.isMiss?"MISS":d.isStale?"STALE":"HIT"),x&&t.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let u=(0,m.fromNodeOutgoingHttpHeaders)(d.value.headers);return B&&D||u.delete(h.NEXT_CACHE_TAGS_HEADER),!d.cacheControl||t.getHeader("Cache-Control")||u.get("Cache-Control")||u.set("Cache-Control",(0,g.getCacheControlHeader)(d.cacheControl)),await (0,p.sendResponse)(V,G,new Response(d.value.body,{headers:u,status:d.value.status||200})),null};U&&H?await i(H):(n=Y.getActiveScopeSpan(),await Y.withPropagatedContext(e.headers,()=>Y.trace(u.BaseServerSpan.handleRequest,{spanName:`${W} ${v}`,kind:o.SpanKind.SERVER,attributes:{"http.method":W,"http.target":e.url}},i),void 0,!U))}catch(t){if(t instanceof f.NoFallbackError||await k.onRequestError(e,t,{routerKind:"App Router",routePath:O,routeType:"route",revalidateReason:(0,c.getRevalidateReason)({isStaticGeneration:q,isOnDemandRevalidate:C})},!1,P),D)throw t;return await (0,p.sendResponse)(V,G,new Response(null,{status:500})),null}}e.s(["handler",0,P,"patchFetch",0,function(){return(0,r.patchFetch)({workAsyncStorage:$,workUnitAsyncStorage:x})},"routeModule",0,k,"serverHooks",0,I,"workAsyncStorage",0,$,"workUnitAsyncStorage",0,x],39204)},6878,e=>{e.v(t=>Promise.all(["server/chunks/node_modules_next_124cnn1._.js"].map(t=>e.l(t))).then(()=>t(93458)))},42017,e=>{e.v(e=>Promise.resolve().then(()=>e(17301)))},89361,e=>{e.v(e=>Promise.resolve().then(()=>e(28976)))}];

//# sourceMappingURL=%5Broot-of-the-server%5D__0m1atqx._.js.map