module.exports=[8406,a=>{"use strict";let b=(0,a.i(70106).default)("Sparkles",[["path",{d:"M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z",key:"4pj2yx"}],["path",{d:"M20 3v4",key:"1olli1"}],["path",{d:"M22 5h-4",key:"1gvqau"}],["path",{d:"M4 17v2",key:"vumght"}],["path",{d:"M5 18H3",key:"zchphs"}]]);a.s(["Sparkles",0,b],8406)},43975,a=>{"use strict";var b=a.i(87924);a.s(["default",0,function({status:a}){return(0,b.jsx)("span",{className:`px-2 py-0.5 text-[10px] font-mono border rounded uppercase tracking-wider ${(()=>{switch(a.toLowerCase()){case"won":case"completed":case"active":case"paid":case"approved":return"bg-neon-green/10 text-neon-green border-neon-green/30";case"in progress":case"researched":case"replied":case"draft":case"drafted":case"expected":case"invoiced":case"scheduled":return"bg-neon-cyan/10 text-neon-cyan border-neon-cyan/30";case"pending":case"new":case"qualified":case"call booked":case"proposal sent":case"discovery":case"requirements":case"design":case"development":case"review":case"revision":case"delivered":return"bg-neon-purple/10 text-neon-purple border-neon-purple/30";case"blocked":case"overdue":case"rejected":case"failed":case"needs approval":case"needs revision":case"critical":case"high":return"bg-neon-pink/10 text-neon-pink border-neon-pink/30";case"lost":case"cancelled":case"abandoned":case"skipped":case"inactive":case"low":case"medium":return"bg-white/5 text-muted-foreground border-white/10";default:return"bg-white/5 text-foreground border-white/10"}})()}`,children:a})}])},33441,a=>{"use strict";let b=(0,a.i(70106).default)("Check",[["path",{d:"M20 6 9 17l-5-5",key:"1gmf2c"}]]);a.s(["Check",0,b],33441)},22520,a=>{"use strict";let b=(0,a.i(70106).default)("ArrowUpRight",[["path",{d:"M7 7h10v10",key:"1tivn9"}],["path",{d:"M7 17 17 7",key:"1vkiza"}]]);a.s(["ArrowUpRight",0,b],22520)},7877,a=>{"use strict";var b=a.i(72131),c=a.i(95445);a.s(["useRealtime",0,function(a,d){let e=!!c.supabase;(0,b.useEffect)(()=>{if(!e)return;let b=c.supabase.channel(`realtime-sync-${a}`).on("postgres_changes",{event:"*",schema:"public",table:a},()=>{d()}).subscribe();return()=>{c.supabase.removeChannel(b)}},[a,d,e])}])},32860,a=>{"use strict";let b=(0,a.i(70106).default)("ArrowRight",[["path",{d:"M5 12h14",key:"1ays0h"}],["path",{d:"m12 5 7 7-7 7",key:"xquz4c"}]]);a.s(["ArrowRight",0,b],32860)},41710,a=>{"use strict";let b=(0,a.i(70106).default)("Clock",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["polyline",{points:"12 6 12 12 16 14",key:"68esgv"}]]);a.s(["Clock",0,b],41710)},29364,a=>{"use strict";var b=a.i(87924);a.s(["default",0,function({score:a}){return(0,b.jsxs)("div",{className:"flex items-center space-x-1.5",children:[(0,b.jsx)("span",{className:`px-2 py-0.5 text-xs font-mono font-bold border rounded ${a>=8?"bg-neon-green/10 text-neon-green border-neon-green/30 shadow-[0_0_10px_rgba(16,185,129,0.15)]":a>=5?"bg-neon-cyan/10 text-neon-cyan border-neon-cyan/30":"bg-neon-pink/10 text-neon-pink border-neon-pink/30"}`,children:a.toFixed(1)}),(0,b.jsx)("span",{className:"text-[9px] font-mono text-muted-foreground uppercase tracking-widest",children:a>=8?"HIGH FIT":a>=5?"MED FIT":"LOW FIT"})]})}])},1027,a=>{"use strict";let b=(0,a.i(70106).default)("Zap",[["path",{d:"M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z",key:"1xq2db"}]]);a.s(["Zap",0,b],1027)},96221,a=>{"use strict";let b=(0,a.i(70106).default)("LoaderCircle",[["path",{d:"M21 12a9 9 0 1 1-6.219-8.56",key:"13zald"}]]);a.s(["Loader2",0,b],96221)},24669,43563,a=>{"use strict";var b=a.i(70106);let c=(0,b.default)("TrendingUp",[["polyline",{points:"22 7 13.5 15.5 8.5 10.5 2 17",key:"126l90"}],["polyline",{points:"16 7 22 7 22 13",key:"kwv8wd"}]]);a.s(["TrendingUp",0,c],24669);let d=(0,b.default)("ChartNoAxesColumn",[["line",{x1:"18",x2:"18",y1:"20",y2:"10",key:"1xfpm4"}],["line",{x1:"12",x2:"12",y1:"20",y2:"4",key:"be30l9"}],["line",{x1:"6",x2:"6",y1:"20",y2:"14",key:"1r4le6"}]]);a.s(["BarChart2",0,d],43563)},39607,a=>{"use strict";let b={ceo:{name:"Alex (CEO Agent)",role:"AI Chief of Staff",systemPrompt:`You are Alex, the CEO Agent (AI Chief of Staff) for VELTRIX COMMAND OS.
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
3. Help the team maintain a single source of truth for all client preferences and business strategy updates.`,actions:["Summarize business notes","Tag memories","Retrieve relative context"]}};a.s(["AGENTS",0,b])},94392,25015,a=>{"use strict";var b=a.i(70106);let c=(0,b.default)("Cpu",[["rect",{width:"16",height:"16",x:"4",y:"4",rx:"2",key:"14l7u7"}],["rect",{width:"6",height:"6",x:"9",y:"9",rx:"1",key:"5aljv4"}],["path",{d:"M15 2v2",key:"13l42r"}],["path",{d:"M15 20v2",key:"15mkzm"}],["path",{d:"M2 15h2",key:"1gxd5l"}],["path",{d:"M2 9h2",key:"1bbxkp"}],["path",{d:"M20 15h2",key:"19e6y8"}],["path",{d:"M20 9h2",key:"19tzq7"}],["path",{d:"M9 2v2",key:"165o2o"}],["path",{d:"M9 20v2",key:"i2bqo8"}]]);a.s(["Cpu",0,c],94392);let d=(0,b.default)("Play",[["polygon",{points:"6 3 20 12 6 21 6 3",key:"1oa8hb"}]]);a.s(["Play",0,d],25015)},98103,a=>{a.v(b=>Promise.all(["server/chunks/ssr/node_modules_next_0.8sp2o._.js"].map(b=>a.l(b))).then(()=>b(17097)))},23149,a=>{a.v(b=>Promise.all(["server/chunks/ssr/src_lib_supabase_admin_ts_0rpiasn._.js"].map(b=>a.l(b))).then(()=>b(34480)))},94558,a=>{a.v(b=>Promise.all(["server/chunks/ssr/src_lib_ai_gemini_ts_04k5ep7._.js"].map(b=>a.l(b))).then(()=>b(35887)))}];

//# sourceMappingURL=_0.j2yl6._.js.map