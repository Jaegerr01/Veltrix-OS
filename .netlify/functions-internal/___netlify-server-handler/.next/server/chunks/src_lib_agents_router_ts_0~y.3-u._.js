module.exports=[82408,e=>{"use strict";e.i(75705);var t=e.i(84501);async function i(){let[e,i,s,n,a,o,l,r,c,d,u]=await Promise.all([t.db.getBusinessProfile(),t.db.getGoals(),t.db.getOffers(),t.db.getLeads(),t.db.getTasks(),t.db.getRevenue(),t.db.getFollowups(),t.db.getMemories(),t.db.getClients(),t.db.getProposals(),t.db.getProjects()]),m=o.filter(e=>"Paid"===e.status).reduce((e,t)=>e+Number(t.amount),0),p=d.filter(e=>["Draft","Sent"].includes(e.status)).reduce((e,t)=>e+Number(t.price),0),g=e.target_monthly_revenue||6e3,h=Math.max(0,g-m),f=c.filter(e=>"Active"===e.status).length,y=d.filter(e=>["Draft","Sent"].includes(e.status)).length,$=n.filter(e=>["New","Researched","Qualified","Contacted","Replied"].includes(e.status)).length,v=`
=== BUSINESS PROFILE ===
Company Name: ${e.business_name}
Description: ${e.description||"N/A"}
Services Offered: ${(e.services||[]).join(", ")||"N/A"}
Primary Offer: ${e.primary_offer||"N/A"}
Secondary Offer: ${e.secondary_offer||"N/A"}
Target Markets: ${(e.target_markets||[]).join(", ")||"N/A"}

=== REVENUE METRICS ===
Target Monthly Revenue: $${g}
Current Month Closed Revenue: $${m}
Revenue Gap to Target: $${h}
Est. Pipeline Value: $${p}

=== ACTIVE RECURRING CLIENTS ===
${0===c.length?"No active clients yet.":c.map(e=>`- ID: ${e.id} | ${e.business_name} (Retainer: $${e.monthly_retainer}/mo, Service: ${e.service_purchased||"N/A"}, Status: ${e.status})`).join("\n")}

=== ACTIVE OFFERS PRICING AND DELIVERABLES ===
${0===s.length?"No offers defined.":s.map(e=>`- ${e.name}: Price Range $${e.price_min}-$${e.price_max}, Retainer $${e.monthly_retainer_min}-$${e.monthly_retainer_max}/mo. Deliverables: ${(e.deliverables||[]).join(", ")}`).join("\n")}

=== CRM LEADS PIPELINE ===
${0===n.length?"No leads in CRM.":n.map(e=>`- ID: ${e.id} | ${e.business_name} (${e.industry||"Unknown"}, Web: ${e.website||"None"}, Score: ${e.lead_score||"Not Scored"}, Status: ${e.status}, Pain Points: ${e.pain_point||"None"})`).join("\n")}

=== CHECKLIST TO-DOS ===
${0===a.length?"No checklist tasks pending.":a.map(e=>`- [${"Completed"===e.status?"X":" "}] ID: ${e.id} | ${e.title} (Agent: ${e.agent_name}, Due: ${e.due_date||"N/A"}, Priority: ${e.priority}, Status: ${e.status})`).join("\n")}

=== BUSINESS MEMORIES & NOTES ===
${0===r.length?"No memories saved.":r.map(e=>`- [${e.type}] ${e.content} (Importance: ${e.importance}/10, Tags: ${(e.tags||[]).join(", ")})`).join("\n")}

=== ACTIVE CLIENT PROJECTS ===
${0===u.length?"No active delivery projects.":u.map(e=>`- ID: ${e.id} | ${e.project_name} (Status: ${e.status}, Deadline: ${e.deadline||"N/A"}, Deliverables: ${(e.deliverables||[]).slice(0,3).join(", ")}...)`).join("\n")}

=== UPCOMING FOLLOW-UPS ===
${0===l.length?"No followups scheduled.":l.map(e=>`- ID: ${e.id} | Lead ID: ${e.lead_id} (Date: ${e.followup_date}, Type: ${e.followup_type}, Status: ${e.status})`).join("\n")}
`.trim();return{profile:e,goals:i,offers:s,leads:n,tasks:a,revenues:o,followups:l,memories:r,clients:c,proposals:d,projects:u,metrics:{targetRevenue:g,closedRevenue:m,pipelineValue:p,revenueGap:h,activeClientsCount:f,activeProposalsCount:y,qualifiedLeadsCount:$},contextString:v}}var s=e.i(28976),n=e.i(24229);function a(e){let t=e.toLowerCase();return t.includes("alex")?"ceo":t.includes("marcus")?"revenue":t.includes("sophia")?"sales":t.includes("daniel")?"leadResearch":t.includes("emma")?"outreach":t.includes("lucas")?"followup":t.includes("olivia")?"proposal":t.includes("ryan")?"content":t.includes("mia")?"delivery":t.includes("leo")?"memory":t.includes("revenue")||t.includes("earn")||t.includes("finance")||t.includes("money")||t.includes("gap")||t.includes("target")?"revenue":t.includes("outreach")||t.includes("email")||t.includes("contact")||t.includes("message")?"outreach":t.includes("proposal")||t.includes("bid")||t.includes("quote")||t.includes("price")?"proposal":t.includes("follow")||t.includes("reminder")||t.includes("fup")?"followup":t.includes("score")||t.includes("qualif")||t.includes("research")||t.includes("grade")?"leadResearch":t.includes("sales")||t.includes("close")||t.includes("convert")||t.includes("objection")?"sales":t.includes("content")||t.includes("post")||t.includes("linkedin")||t.includes("instagram")||t.includes("social")?"content":t.includes("project")||t.includes("deliver")||t.includes("checklist")||t.includes("milestone")?"delivery":t.includes("memory")||t.includes("remember")||t.includes("recall")||t.includes("notes")||t.includes("fact")?"memory":"ceo"}async function o(e){let t=e.trim(),i=t.match(/^(?:to\s+)?(?:the\s+)?([^:]+?)(?:\s+agent)?\s*:/i);if(i){let e=i[1].trim().toLowerCase(),t=Object.keys(n.AGENTS).find(t=>{let i=n.AGENTS[t].name.toLowerCase(),s=i.split(" ")[0].toLowerCase();return i===e||i.includes(e)||s===e||t.toLowerCase()===e||n.AGENTS[t].role.toLowerCase()===e||n.AGENTS[t].role.toLowerCase().includes(e)});if(t)return t}if(!s.isGeminiConfigured)return a(t);let o=`
Classify the following user message to determine which business agent should handle it.
Your choices are:
- "ceo" (Alex): Questions about overall strategy, what to do today, priority checklists, daily reports, and team delegation coordination.
- "revenue" (Marcus): Financial calculations, goals, monthly targets, closed earnings, revenue gap.
- "sales" (Sophia): Closing clients, pitch angles, pricing options, objections.
- "leadResearch" (Daniel): Qualifying leads, lead scoring, researching website/brand problems.
- "outreach" (Emma): Drafting first-contact messages (emails, DMs).
- "followup" (Lucas): Scheduling/drafting sequential check-ins.
- "proposal" (Olivia): Creating pricing quotes, contracts, scope of work.
- "content" (Ryan): Ideas for social media, LinkedIn carousels, video hooks.
- "delivery" (Mia): Client project checklists, milestone plans, progress updates.
- "memory" (Leo): Saving, searching, recalling business facts.

User Message: "${t}"

Output ONLY the exact category string (e.g. "revenue" or "ceo"), with no punctuation or additional text.
`;try{let e=(await s.gemini.callRawLLM(o,"You are a classification assistant. Output ONLY the lowercase category key.")).trim().toLowerCase().replace(/['"]/g,"");if(n.AGENTS[e])return e}catch(e){console.error("Agent classification failed, using fallback:",e)}return a(t)}async function l(e,t,s){let a=n.AGENTS[e]||n.AGENTS.ceo,o=t.toLowerCase(),l=6e3,r=0,c=6e3,d=0,u=0,m=0,p=[],g=[],h=[];try{let e=await i();l=e.metrics.targetRevenue,r=e.metrics.closedRevenue,c=e.metrics.revenueGap,d=e.metrics.pipelineValue,u=e.leads.length,m=e.metrics.activeClientsCount,p=e.leads,g=e.tasks,h=e.offers}catch(e){console.error("Database fetch failed during simulated response generation:",e)}let f=s;s.includes("API key not valid")||s.includes("API_KEY_INVALID")?f="Invalid Gemini API key in .env.local":s.includes("503")||s.includes("Service Unavailable")||s.includes("overloaded")?f="Gemini API is temporarily overloaded (503 Service Unavailable). Please try chat again in a few seconds.":s.includes("429")||s.includes("Quota exceeded")||s.includes("rate limit")?f="Gemini API Rate Limit exceeded (429 Too Many Requests). Please wait a moment.":(s.includes("not found")||s.includes("not supported"))&&(f="Model not supported or Generative Language API is disabled for this key");let y=`⚠️ **Offline Simulator Mode** (${f})

`;if("revenue"===e){if(y+=`**Marcus (Revenue Agent)**: Hey Alex and team! Let's look at our revenue metrics. Here is where we stand:

- **Monthly Revenue Target**: $${l.toLocaleString()}
- **Current Closed Revenue**: $${r.toLocaleString()}
- **Revenue Gap**: $${c.toLocaleString()}
- **Est. Pipeline Value**: $${d.toLocaleString()}
- **Active Clients**: ${m}

`,c>0)if(y+=`We have a remaining gap of **$${c.toLocaleString()}** to hit our monthly target. `,h.length>0){let e=h[0],t=e.price_min||800,i=Math.ceil(c/t);y+=`To cover this, we would need approximately **${i}** deal(s) of our "${e.name}" package (starting at $${t.toLocaleString()}).`}else y+="To cover this, we should focus on securing 2-3 custom website or automation design projects ($800 - $1,500 each).";else y+=`Fantastic work team! We have fully hit and exceeded our target monthly revenue of $${l.toLocaleString()}!`;y+=`

**Actionable Next Steps:**
1. Review pricing models and retainer terms to maximize margins.
2. Sophia, let's align on closing the warm leads in our pipeline (valued at $${d.toLocaleString()}).`}else if("leadResearch"===e||o.includes("score")||o.includes("qualif")){let e="Radiant Smiles Dental Clinic",t=p.find(e=>o.includes(e.business_name.toLowerCase()));!t&&p.length>0&&(t=p[0]),t&&(e=t.business_name),y+=`**Daniel (Lead Research Agent)**: Hey Alex, I completed the qualification and research on **${e}**:

`;let i=t?.website?6:9,s=t?.pain_point?.toLowerCase().includes("booking")||t?.pain_point?.toLowerCase().includes("chat")?9:7,n=((i+8+s+8+7)/5).toFixed(1);y+=`- **Website Weakness Score**: ${i}/10 ${t?.website?`(${t.website})`:"(No website listed - High opportunity!)"}
- **Brand Weakness Score**: 8/10 (Lacks modern design details)
- **Automation Need Score**: ${s}/10 (High potential for AI receptionists/booking bots)
- **Ability to Pay Score**: 8/10 (Local service business with healthy margins)
- **Urgency Score**: 7/10 (No automated system to capture night/weekend leads)
- **Overall Qualified Score**: **${n}/10**

**Analysis**: ${t?.pain_point||"The prospect exhibits typical service industry pain points: no live appointment booking, slow follow-ups, and a lack of responsive mobile design. A custom AI receptionist or modern website upgrade would yield high ROI."}

**Actionable Next Steps:**
1. Emma, let's draft a personalized cold outreach sequence for this lead.
2. Alex, I recommend offering a risk-free 2-minute video mockup of their new booking system.`}else if("outreach"===e||o.includes("outreach")||o.includes("email")||o.includes("message")){let e="Radiant Smiles Dental Clinic",t=p.find(e=>o.includes(e.business_name.toLowerCase()));!t&&p.length>0&&(t=p[0]),t&&(e=t.business_name,t.website),y+=`**Emma (Outreach Agent)**: Hey team! Here is the custom outreach sequence I drafted for ${e}:

> "Hi ${t?.contact_name||"there"},
> 
> I was looking at ${e} and noticed that patients trying to book appointments after hours don't have an automated way to schedule. This typically leads to about 20% of web visitors bouncing to competitors.
> 
> We build lightweight AI booking assistants for clinics that handle FAQs and schedule patients 24/7 directly into your calendar. Would it be okay if I sent over a short 90-second demo video of how it looks?"

**Actionable Next Steps:**
1. Alex, let's load this message into the Outbox and customize contact details.
2. Lucas, please schedule a Day 3 follow-up sequence in case we don't get a reply.`}else if("proposal"===e||o.includes("proposal")||o.includes("quote")||o.includes("price")){let e="Radiant Smiles Dental Clinic",t=p.find(e=>o.includes(e.business_name.toLowerCase()));!t&&p.length>0&&(t=p[0]),t&&(e=t.business_name),y+=`**Olivia (Proposal Agent)**: Hi Alex, I have prepared a business proposal outline for **${e}**:

**Recommended Package**: AI Website + Brand System & AI Booking Integration
**Estimated Investment**: $1,500 Setup + $150/mo Retainer

#### Proposed Deliverables:
1. **Premium 5-Page Site**: Clean typography, SEO optimized, fully responsive mobile interface.
2. **Brand Identity System**: High-end color palette, custom graphics/illustrations, and brand style guide.
3. **AI Booking Assistant**: Chat widget configured to ingest clinic FAQs and schedule appointments.

**Actionable Next Steps:**
1. Alex, I'll log the full proposal details in the "Price Quotes" page.
2. Sophia, let's plan the post-proposal call script to walk them through the ROI.`}else if("sales"===e||o.includes("sales")||o.includes("close")||o.includes("convert"))y+=`**Sophia (Sales Agent)**: Hey everyone! I've laid out the sales and conversion playbook for our current prospects:

1. **Focus Angle**: Frame the AI Receptionist not as a cost, but as an extra receptionist who works 24/7 without taking breaks or asking for salary.
2. **Objection Buster**: When they say "It's too expensive," point out that saving just 2 bounced leads per month fully pays for the retainer and setup fees.

**Actionable Next Steps:**
1. Emma, let's use the 'receptionist math' hook in our DMs.
2. Alex, let's set up a calendar event to call the warm leads on Friday.`;else if("followup"===e||o.includes("follow")||o.includes("reminder"))y+=`**Lucas (Follow-up Agent)**: Lucas here. I'm keeping a close eye on the pipeline. Here's my plan:

- **Follow-up Sequence**: We'll deploy a soft Day 3 check-in, a Day 7 value injection (sending them a stats report), and a Day 14 break-up message.
- **Current Action**: Preparing follow-up drafts for contacted prospects who haven't replied yet.

**Actionable Next Steps:**
1. Emma, let's align on who has replied so I can take over the sequence.
2. Leo, please log the response status updates in the system notes.`;else if("content"===e||o.includes("content")||o.includes("post")||o.includes("linkedin"))y+=`**Ryan (Content Agent)**: What's up team! Ryan here. I've got some high-performing content ideas to build authority on LinkedIn and Instagram:

- **Idea 1**: "How a local clinic lost $3,200 in 1 weekend by not answering their phone" (Hook + Case study).
- **Idea 2**: Carousel detailing the difference between standard form builders and interactive AI booking widgets.

**Actionable Next Steps:**
1. Mia, please review the graphics workflow checkmarks.
2. Alex, I'll save these drafts to the Social Writer page.`;else if("delivery"===e||o.includes("project")||o.includes("deliver")||o.includes("checklist"))y+=`**Mia (Delivery Manager Agent)**: Mia here. Standard onboarding and project delivery are running smoothly. Here's our baseline roadmap:

1. Onboarding & Assets Collection (Day 1-2)
2. Layout & Wireframes Review (Day 3-5)
3. AI Custom Training & FAQs Ingestion (Day 6-8)
4. Mobile testing & launch checklist (Day 9-12)

**Actionable Next Steps:**
1. Marcus, let's ensure the upfront invoice is paid before kickoff.
2. Leo, please tag client preferences in our central memory database.`;else if("memory"===e||o.includes("memory")||o.includes("remember")||o.includes("notes"))y+=`**Leo (Memory Manager Agent)**: Leo reporting in. I've archived our business memories and preferences:

- Central preference updated: We prioritize local service clinics, dental offices, and health spas.
- Tech stack tag: Next.js + Supabase + Gemini API.

**Actionable Next Steps:**
1. Alex, let's keep details updated on the Memories tab to refine context.
2. Daniel, I've linked the new lead files to our historical target tags.`;else{if(y+=`**Alex (CEO Agent)**: Hey team, Alex here. Let's work together to reach our $6,000/month milestone. Here is the current status of the dashboard:

- **Closed Earnings**: $${r.toLocaleString()} / $${l.toLocaleString()} (Gap: $${c.toLocaleString()})
- **Active Leads in CRM**: ${u}
- **Ongoing Projects**: ${g.filter(e=>"Completed"!==e.status).length} tasks pending

**Priority Actions to Close the Revenue Gap:**
`,p.length>0){let e=p[0];y+=`- **Daniel & Emma**: Let's qualify and reach out to **${e.business_name}** (${e.industry||"Local Business"}) with a personalized AI booking assistant pitch.
`}else y+=`- **Lead Generation**: Add local service businesses (dentists, medical clinics, home services) to the Potential Clients CRM list.
`;let e=g.filter(e=>"Completed"!==e.status).slice(0,2);e.length>0&&(y+=`- **Mia**: Please check on the progress of these tasks: ${e.map(e=>`"${e.title}"`).join(", ")}.
`),y+=`
**Actionable Next Steps:**
1. Daniel, let's qualification score our active leads.
2. Ensure your Supabase and Gemini environment variables are correctly configured for live mode.`}return{agentName:a.name,text:y}}async function r(e,a,o){let r=n.AGENTS[e]||n.AGENTS.ceo;if(!s.isGeminiConfigured)return l(e,a,"Gemini API key is missing. Add GEMINI_API_KEY to your env variables.");try{let{contextString:e}=await i(),n=o.map(e=>`${"user"===e.sender?"User":"Agent"}: ${e.message}`).join("\n"),l=a,c=a.trim().match(/^(?:to\s+)?(?:the\s+)?(?:[^:]+?)(?:\s+agent)?\s*:\s*(.*)$/i);c&&(l=c[1]);let d="";try{let e=await t.db.searchMemories(l,6);e&&e.length>0&&(d=`
=== RETRIEVED BUSINESS MEMORIES (VECTOR SEARCH) ===
`+e.map(e=>`- [${e.source||"Memory"}] ${e.content}`).join("\n")+`
`)}catch(e){console.warn("Failed to retrieve vector memories for agent:",e)}let u=`
${r.systemPrompt}
${d}
Below is the real-time business workspace data compiled from Supabase:
${e}

Use this data to provide concrete, grounded answers. If metrics, goals, or lists are empty, guide the user on how to add them. Never invent fake leads, transactions, or stats if they are not in the context above.
`,m=`
Conversation History:
${n}

User Input Message: "${l}"

Provide your professional guidance. Address the user directly, keep your formatting clean with clear markdown, and end with 1-2 actionable next bullet steps.
`,p=await s.gemini.callRawLLM(m,u);return{agentName:r.name,text:p}}catch(t){return console.error(`Error executing agent ${e}:`,t),l(e,a,t.message||"AI request failed")}}e.s(["classifyRequest",0,o,"executeAgent",0,r,"generateSimulatedResponse",0,l],82408)}];

//# sourceMappingURL=src_lib_agents_router_ts_0~y.3-u._.js.map