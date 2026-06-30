module.exports=[8406,a=>{"use strict";let b=(0,a.i(70106).default)("Sparkles",[["path",{d:"M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z",key:"4pj2yx"}],["path",{d:"M20 3v4",key:"1olli1"}],["path",{d:"M22 5h-4",key:"1gvqau"}],["path",{d:"M4 17v2",key:"vumght"}],["path",{d:"M5 18H3",key:"zchphs"}]]);a.s(["Sparkles",0,b],8406)},22520,a=>{"use strict";let b=(0,a.i(70106).default)("ArrowUpRight",[["path",{d:"M7 7h10v10",key:"1tivn9"}],["path",{d:"M7 17 17 7",key:"1vkiza"}]]);a.s(["ArrowUpRight",0,b],22520)},81560,a=>{"use strict";let b=(0,a.i(70106).default)("Trash2",[["path",{d:"M3 6h18",key:"d0wm0j"}],["path",{d:"M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6",key:"4alrt4"}],["path",{d:"M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2",key:"v07s0e"}],["line",{x1:"10",x2:"10",y1:"11",y2:"17",key:"1uufr5"}],["line",{x1:"14",x2:"14",y1:"11",y2:"17",key:"xtxkd"}]]);a.s(["Trash2",0,b],81560)},13551,a=>{"use strict";var b=a.i(87924),c=a.i(11300),d=a.i(22520);let e=(0,a.i(70106).default)("CircleAlert",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["line",{x1:"12",x2:"12",y1:"8",y2:"12",key:"1pkeuh"}],["line",{x1:"12",x2:"12.01",y1:"16",y2:"16",key:"4dfq90"}]]);var f=a.i(7831),g=a.i(87534),h=a.i(8406);a.s(["default",0,function({report:a}){return(0,b.jsxs)("div",{className:"glass-panel border border-white/5 rounded-xl bg-cyber-bg/30 p-6 space-y-5 hover:border-neon-purple/20 scanlines",children:[(0,b.jsxs)("div",{className:"flex justify-between items-center pb-3 border-b border-white/5",children:[(0,b.jsxs)("div",{className:"flex items-center space-x-2.5 text-neon-purple",children:[(0,b.jsx)(c.ClipboardList,{size:18}),(0,b.jsx)("h4",{className:"font-mono text-sm font-bold uppercase tracking-wider",children:"VELTRIX Daily Command Report"})]}),(0,b.jsx)("span",{className:"font-mono text-xs font-bold text-neon-purple bg-neon-purple/10 px-2 py-0.5 rounded",children:new Date(a.report_date).toLocaleDateString(void 0,{weekday:"long",year:"numeric",month:"long",day:"numeric"})})]}),(0,b.jsxs)("div",{className:"grid grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs",children:[(0,b.jsxs)("div",{className:"p-3 bg-white/3 border border-white/5 rounded-lg text-center",children:[(0,b.jsx)("span",{className:"text-[10px] text-muted-foreground block uppercase",children:"Revenue Target"}),(0,b.jsxs)("span",{className:"text-sm font-bold text-foreground",children:["$",a.revenue_target.toLocaleString()]})]}),(0,b.jsxs)("div",{className:"p-3 bg-neon-green/5 border border-neon-green/10 rounded-lg text-center",children:[(0,b.jsx)("span",{className:"text-[10px] text-muted-foreground block uppercase",children:"Closed Revenue"}),(0,b.jsxs)("span",{className:"text-sm font-bold text-neon-green",children:["$",a.closed_revenue.toLocaleString()]})]}),(0,b.jsxs)("div",{className:"p-3 bg-neon-cyan/5 border border-neon-cyan/10 rounded-lg text-center",children:[(0,b.jsx)("span",{className:"text-[10px] text-muted-foreground block uppercase",children:"Pipeline Value"}),(0,b.jsxs)("span",{className:"text-sm font-bold text-neon-cyan",children:["$",a.pipeline_value.toLocaleString()]})]}),(0,b.jsxs)("div",{className:"p-3 bg-neon-pink/5 border border-neon-pink/10 rounded-lg text-center",children:[(0,b.jsx)("span",{className:"text-[10px] text-muted-foreground block uppercase",children:"Revenue Gap"}),(0,b.jsxs)("span",{className:"text-sm font-bold text-neon-pink",children:["$",a.revenue_gap.toLocaleString()]})]})]}),a.top_priority&&(0,b.jsxs)("div",{className:"p-4 bg-neon-purple/5 border border-neon-purple/20 rounded-lg space-y-1.5",children:[(0,b.jsxs)("div",{className:"flex items-center space-x-1.5 text-neon-purple font-mono text-[10px] font-bold uppercase tracking-wider",children:[(0,b.jsx)(g.CheckSquare,{size:13}),(0,b.jsx)("span",{children:"Today’s Top Priority"})]}),(0,b.jsx)("p",{className:"text-xs text-foreground font-sans leading-relaxed select-text",children:a.top_priority})]}),(0,b.jsxs)("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-4",children:[(0,b.jsxs)("div",{className:"p-4 bg-white/2 border border-white/5 rounded-lg space-y-2",children:[(0,b.jsxs)("div",{className:"flex items-center space-x-1.5 text-neon-cyan font-mono text-[10px] font-bold uppercase tracking-wider",children:[(0,b.jsx)(d.ArrowUpRight,{size:13}),(0,b.jsx)("span",{children:"Leads to Contact"})]}),a.leads_to_contact&&a.leads_to_contact.length>0?(0,b.jsx)("ol",{className:"list-decimal list-inside space-y-1.5 text-xs text-muted-foreground font-sans",children:a.leads_to_contact.map((a,c)=>(0,b.jsx)("li",{className:"select-text",children:(0,b.jsx)("span",{className:"text-foreground font-semibold",children:a})},c))}):(0,b.jsx)("p",{className:"text-[10px] font-mono text-muted-foreground uppercase tracking-wider",children:"No leads queued"})]}),(0,b.jsxs)("div",{className:"p-4 bg-white/2 border border-white/5 rounded-lg space-y-2",children:[(0,b.jsxs)("div",{className:"flex items-center space-x-1.5 text-neon-pink font-mono text-[10px] font-bold uppercase tracking-wider",children:[(0,b.jsx)(e,{size:13}),(0,b.jsx)("span",{children:"Follow-ups Due"})]}),a.followups_due&&a.followups_due.length>0?(0,b.jsx)("ul",{className:"list-disc list-inside space-y-1.5 text-xs text-muted-foreground font-sans",children:a.followups_due.map((a,c)=>(0,b.jsx)("li",{className:"select-text",children:(0,b.jsx)("span",{className:"text-foreground",children:a})},c))}):(0,b.jsx)("p",{className:"text-[10px] font-mono text-muted-foreground uppercase tracking-wider",children:"No follow-ups queued"})]})]}),(0,b.jsxs)("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-4 pt-2",children:[a.content_to_post&&(0,b.jsxs)("div",{className:"p-4 bg-white/2 border border-white/5 rounded-lg space-y-2",children:[(0,b.jsxs)("div",{className:"flex items-center space-x-1.5 text-neon-green font-mono text-[10px] font-bold uppercase tracking-wider",children:[(0,b.jsx)(f.FileCode,{size:13}),(0,b.jsx)("span",{children:"Content to Post"})]}),(0,b.jsx)("p",{className:"text-xs text-muted-foreground font-sans leading-relaxed select-text",children:a.content_to_post})]}),a.recommended_action&&(0,b.jsxs)("div",{className:"p-4 bg-neon-cyan/5 border border-neon-cyan/20 rounded-lg space-y-2",children:[(0,b.jsxs)("div",{className:"flex items-center space-x-1.5 text-neon-cyan font-mono text-[10px] font-bold uppercase tracking-wider",children:[(0,b.jsx)(h.Sparkles,{size:13}),(0,b.jsx)("span",{children:"Recommended Action"})]}),(0,b.jsx)("p",{className:"text-xs text-foreground font-sans leading-relaxed font-medium select-text",children:a.recommended_action})]})]})]})}],13551)},1027,a=>{"use strict";let b=(0,a.i(70106).default)("Zap",[["path",{d:"M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z",key:"1xq2db"}]]);a.s(["Zap",0,b],1027)},94392,25015,a=>{"use strict";var b=a.i(70106);let c=(0,b.default)("Cpu",[["rect",{width:"16",height:"16",x:"4",y:"4",rx:"2",key:"14l7u7"}],["rect",{width:"6",height:"6",x:"9",y:"9",rx:"1",key:"5aljv4"}],["path",{d:"M15 2v2",key:"13l42r"}],["path",{d:"M15 20v2",key:"15mkzm"}],["path",{d:"M2 15h2",key:"1gxd5l"}],["path",{d:"M2 9h2",key:"1bbxkp"}],["path",{d:"M20 15h2",key:"19e6y8"}],["path",{d:"M20 9h2",key:"19tzq7"}],["path",{d:"M9 2v2",key:"165o2o"}],["path",{d:"M9 20v2",key:"i2bqo8"}]]);a.s(["Cpu",0,c],94392);let d=(0,b.default)("Play",[["polygon",{points:"6 3 20 12 6 21 6 3",key:"1oa8hb"}]]);a.s(["Play",0,d],25015)},39607,a=>{"use strict";let b={ceo:{name:"Alex (CEO Agent)",role:"AI Chief of Staff",systemPrompt:`You are Alex, the CEO Agent (AI Chief of Staff) for VELTRIX COMMAND OS.
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
3. Help the team maintain a single source of truth for all client preferences and business strategy updates.`,actions:["Summarize business notes","Tag memories","Retrieve relative context"]}};a.s(["AGENTS",0,b])},98103,a=>{a.v(b=>Promise.all(["server/chunks/ssr/node_modules_next_0.8sp2o._.js"].map(b=>a.l(b))).then(()=>b(17097)))},23149,a=>{a.v(b=>Promise.all(["server/chunks/ssr/src_lib_supabase_admin_ts_0rpiasn._.js"].map(b=>a.l(b))).then(()=>b(34480)))},94558,a=>{a.v(b=>Promise.all(["server/chunks/ssr/src_lib_ai_gemini_ts_04k5ep7._.js"].map(b=>a.l(b))).then(()=>b(35887)))}];

//# sourceMappingURL=_0bmv~5~._.js.map