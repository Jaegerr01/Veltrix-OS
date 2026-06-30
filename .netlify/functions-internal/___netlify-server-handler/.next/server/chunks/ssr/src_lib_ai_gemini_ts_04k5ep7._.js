module.exports=[35887,a=>{"use strict";var b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y;(n=b||(b={})).STRING="string",n.NUMBER="number",n.INTEGER="integer",n.BOOLEAN="boolean",n.ARRAY="array",n.OBJECT="object",(o=c||(c={})).LANGUAGE_UNSPECIFIED="language_unspecified",o.PYTHON="python",(p=d||(d={})).OUTCOME_UNSPECIFIED="outcome_unspecified",p.OUTCOME_OK="outcome_ok",p.OUTCOME_FAILED="outcome_failed",p.OUTCOME_DEADLINE_EXCEEDED="outcome_deadline_exceeded";let z=["user","model","function","system"];(q=e||(e={})).HARM_CATEGORY_UNSPECIFIED="HARM_CATEGORY_UNSPECIFIED",q.HARM_CATEGORY_HATE_SPEECH="HARM_CATEGORY_HATE_SPEECH",q.HARM_CATEGORY_SEXUALLY_EXPLICIT="HARM_CATEGORY_SEXUALLY_EXPLICIT",q.HARM_CATEGORY_HARASSMENT="HARM_CATEGORY_HARASSMENT",q.HARM_CATEGORY_DANGEROUS_CONTENT="HARM_CATEGORY_DANGEROUS_CONTENT",q.HARM_CATEGORY_CIVIC_INTEGRITY="HARM_CATEGORY_CIVIC_INTEGRITY",(r=f||(f={})).HARM_BLOCK_THRESHOLD_UNSPECIFIED="HARM_BLOCK_THRESHOLD_UNSPECIFIED",r.BLOCK_LOW_AND_ABOVE="BLOCK_LOW_AND_ABOVE",r.BLOCK_MEDIUM_AND_ABOVE="BLOCK_MEDIUM_AND_ABOVE",r.BLOCK_ONLY_HIGH="BLOCK_ONLY_HIGH",r.BLOCK_NONE="BLOCK_NONE",(s=g||(g={})).HARM_PROBABILITY_UNSPECIFIED="HARM_PROBABILITY_UNSPECIFIED",s.NEGLIGIBLE="NEGLIGIBLE",s.LOW="LOW",s.MEDIUM="MEDIUM",s.HIGH="HIGH",(t=h||(h={})).BLOCKED_REASON_UNSPECIFIED="BLOCKED_REASON_UNSPECIFIED",t.SAFETY="SAFETY",t.OTHER="OTHER",(u=i||(i={})).FINISH_REASON_UNSPECIFIED="FINISH_REASON_UNSPECIFIED",u.STOP="STOP",u.MAX_TOKENS="MAX_TOKENS",u.SAFETY="SAFETY",u.RECITATION="RECITATION",u.LANGUAGE="LANGUAGE",u.BLOCKLIST="BLOCKLIST",u.PROHIBITED_CONTENT="PROHIBITED_CONTENT",u.SPII="SPII",u.MALFORMED_FUNCTION_CALL="MALFORMED_FUNCTION_CALL",u.OTHER="OTHER",(v=j||(j={})).TASK_TYPE_UNSPECIFIED="TASK_TYPE_UNSPECIFIED",v.RETRIEVAL_QUERY="RETRIEVAL_QUERY",v.RETRIEVAL_DOCUMENT="RETRIEVAL_DOCUMENT",v.SEMANTIC_SIMILARITY="SEMANTIC_SIMILARITY",v.CLASSIFICATION="CLASSIFICATION",v.CLUSTERING="CLUSTERING",(w=k||(k={})).MODE_UNSPECIFIED="MODE_UNSPECIFIED",w.AUTO="AUTO",w.ANY="ANY",w.NONE="NONE",(x=l||(l={})).MODE_UNSPECIFIED="MODE_UNSPECIFIED",x.MODE_DYNAMIC="MODE_DYNAMIC";class A extends Error{constructor(a){super(`[GoogleGenerativeAI Error]: ${a}`)}}class B extends A{constructor(a,b){super(a),this.response=b}}class C extends A{constructor(a,b,c,d){super(a),this.status=b,this.statusText=c,this.errorDetails=d}}class D extends A{}class E extends A{}(y=m||(m={})).GENERATE_CONTENT="generateContent",y.STREAM_GENERATE_CONTENT="streamGenerateContent",y.COUNT_TOKENS="countTokens",y.EMBED_CONTENT="embedContent",y.BATCH_EMBED_CONTENTS="batchEmbedContents";class F{constructor(a,b,c,d,e){this.model=a,this.task=b,this.apiKey=c,this.stream=d,this.requestOptions=e}toString(){var a,b;let c=(null==(a=this.requestOptions)?void 0:a.apiVersion)||"v1beta",d=(null==(b=this.requestOptions)?void 0:b.baseUrl)||"https://generativelanguage.googleapis.com",e=`${d}/${c}/${this.model}:${this.task}`;return this.stream&&(e+="?alt=sse"),e}}async function G(a){var b,c;let d,e=new Headers;e.append("Content-Type","application/json"),e.append("x-goog-api-client",(c=a.requestOptions,d=[],(null==c?void 0:c.apiClient)&&d.push(c.apiClient),d.push("genai-js/0.24.1"),d.join(" "))),e.append("x-goog-api-key",a.apiKey);let f=null==(b=a.requestOptions)?void 0:b.customHeaders;if(f){if(!(f instanceof Headers))try{f=new Headers(f)}catch(a){throw new D(`unable to convert customHeaders value ${JSON.stringify(f)} to Headers: ${a.message}`)}for(let[a,b]of f.entries()){if("x-goog-api-key"===a)throw new D(`Cannot set reserved header name ${a}`);if("x-goog-api-client"===a)throw new D(`Header name ${a} can only be set using the apiClient field`);e.append(a,b)}}return e}async function H(a,b,c,d,e,f){let g=new F(a,b,c,d,f);return{url:g.toString(),fetchOptions:Object.assign(Object.assign({},function(a){let b={};if((null==a?void 0:a.signal)!==void 0||(null==a?void 0:a.timeout)>=0){let c=new AbortController;(null==a?void 0:a.timeout)>=0&&setTimeout(()=>c.abort(),a.timeout),(null==a?void 0:a.signal)&&a.signal.addEventListener("abort",()=>{c.abort()}),b.signal=c.signal}return b}(f)),{method:"POST",headers:await G(g),body:e})}}async function I(a,b,c,d,e,f={},g=fetch){let{url:h,fetchOptions:i}=await H(a,b,c,d,e,f);return J(h,i,g)}async function J(a,b,c=fetch){let d;try{d=await c(a,b)}catch(c){var e=c,f=a;let b=e;throw"AbortError"===b.name?(b=new E(`Request aborted when fetching ${f.toString()}: ${e.message}`)).stack=e.stack:e instanceof C||e instanceof D||((b=new A(`Error fetching from ${f.toString()}: ${e.message}`)).stack=e.stack),b}return d.ok||await K(d,a),d}async function K(a,b){let c,d="";try{let b=await a.json();d=b.error.message,b.error.details&&(d+=` ${JSON.stringify(b.error.details)}`,c=b.error.details)}catch(a){}throw new C(`Error fetching from ${b.toString()}: [${a.status} ${a.statusText}] ${d}`,a.status,a.statusText,c)}function L(a){return a.text=()=>{if(a.candidates&&a.candidates.length>0){if(a.candidates.length>1&&console.warn(`This response had ${a.candidates.length} candidates. Returning text from the first candidate only. Access response.candidates directly to use the other candidates.`),O(a.candidates[0]))throw new B(`${P(a)}`,a);return function(a){var b,c,d,e;let f=[];if(null==(c=null==(b=a.candidates)?void 0:b[0].content)?void 0:c.parts)for(let b of null==(e=null==(d=a.candidates)?void 0:d[0].content)?void 0:e.parts)b.text&&f.push(b.text),b.executableCode&&f.push("\n```"+b.executableCode.language+"\n"+b.executableCode.code+"\n```\n"),b.codeExecutionResult&&f.push("\n```\n"+b.codeExecutionResult.output+"\n```\n");return f.length>0?f.join(""):""}(a)}if(a.promptFeedback)throw new B(`Text not available. ${P(a)}`,a);return""},a.functionCall=()=>{if(a.candidates&&a.candidates.length>0){if(a.candidates.length>1&&console.warn(`This response had ${a.candidates.length} candidates. Returning function calls from the first candidate only. Access response.candidates directly to use the other candidates.`),O(a.candidates[0]))throw new B(`${P(a)}`,a);return console.warn("response.functionCall() is deprecated. Use response.functionCalls() instead."),M(a)[0]}if(a.promptFeedback)throw new B(`Function call not available. ${P(a)}`,a)},a.functionCalls=()=>{if(a.candidates&&a.candidates.length>0){if(a.candidates.length>1&&console.warn(`This response had ${a.candidates.length} candidates. Returning function calls from the first candidate only. Access response.candidates directly to use the other candidates.`),O(a.candidates[0]))throw new B(`${P(a)}`,a);return M(a)}if(a.promptFeedback)throw new B(`Function call not available. ${P(a)}`,a)},a}function M(a){var b,c,d,e;let f=[];if(null==(c=null==(b=a.candidates)?void 0:b[0].content)?void 0:c.parts)for(let b of null==(e=null==(d=a.candidates)?void 0:d[0].content)?void 0:e.parts)b.functionCall&&f.push(b.functionCall);return f.length>0?f:void 0}let N=[i.RECITATION,i.SAFETY,i.LANGUAGE];function O(a){return!!a.finishReason&&N.includes(a.finishReason)}function P(a){var b,c,d;let e="";if((!a.candidates||0===a.candidates.length)&&a.promptFeedback)e+="Response was blocked",(null==(b=a.promptFeedback)?void 0:b.blockReason)&&(e+=` due to ${a.promptFeedback.blockReason}`),(null==(c=a.promptFeedback)?void 0:c.blockReasonMessage)&&(e+=`: ${a.promptFeedback.blockReasonMessage}`);else if(null==(d=a.candidates)?void 0:d[0]){let b=a.candidates[0];O(b)&&(e+=`Candidate was blocked due to ${b.finishReason}`,b.finishMessage&&(e+=`: ${b.finishMessage}`))}return e}function Q(a){return this instanceof Q?(this.v=a,this):new Q(a)}"function"==typeof SuppressedError&&SuppressedError;let R=/^data\: (.*)(?:\n\n|\r\r|\r\n\r\n)/;async function S(a){let b=[],c=a.getReader();for(;;){let{done:a,value:d}=await c.read();if(a)return L(function(a){let b=a[a.length-1],c={promptFeedback:null==b?void 0:b.promptFeedback};for(let b of a){if(b.candidates){let a=0;for(let d of b.candidates)if(c.candidates||(c.candidates=[]),c.candidates[a]||(c.candidates[a]={index:a}),c.candidates[a].citationMetadata=d.citationMetadata,c.candidates[a].groundingMetadata=d.groundingMetadata,c.candidates[a].finishReason=d.finishReason,c.candidates[a].finishMessage=d.finishMessage,c.candidates[a].safetyRatings=d.safetyRatings,d.content&&d.content.parts){c.candidates[a].content||(c.candidates[a].content={role:d.content.role||"user",parts:[]});let b={};for(let e of d.content.parts)e.text&&(b.text=e.text),e.functionCall&&(b.functionCall=e.functionCall),e.executableCode&&(b.executableCode=e.executableCode),e.codeExecutionResult&&(b.codeExecutionResult=e.codeExecutionResult),0===Object.keys(b).length&&(b.text=""),c.candidates[a].content.parts.push(b)}a++}b.usageMetadata&&(c.usageMetadata=b.usageMetadata)}return c}(b));b.push(d)}}async function T(a,b,c,d){return function(a){let b,[c,d]=(b=a.body.pipeThrough(new TextDecoderStream("utf8",{fatal:!0})).getReader(),new ReadableStream({start(a){let c="";return function d(){return b.read().then(({value:b,done:e})=>{let f;if(e)return c.trim()?void a.error(new A("Failed to parse stream")):void a.close();let g=(c+=b).match(R);for(;g;){try{f=JSON.parse(g[1])}catch(b){a.error(new A(`Error parsing JSON response: "${g[1]}"`));return}a.enqueue(f),g=(c=c.substring(g[0].length)).match(R)}return d()}).catch(a=>{let b=a;throw b.stack=a.stack,b="AbortError"===b.name?new E("Request aborted when reading from the stream"):new A("Error reading from the stream")})}()}})).tee();return{stream:function(a){return function(a,b,c){if(!Symbol.asyncIterator)throw TypeError("Symbol.asyncIterator is not defined.");var d,e=c.apply(a,b||[]),f=[];return d={},g("next"),g("throw"),g("return"),d[Symbol.asyncIterator]=function(){return this},d;function g(a){e[a]&&(d[a]=function(b){return new Promise(function(c,d){f.push([a,b,c,d])>1||h(a,b)})})}function h(a,b){try{var c;(c=e[a](b)).value instanceof Q?Promise.resolve(c.value.v).then(i,j):k(f[0][2],c)}catch(a){k(f[0][3],a)}}function i(a){h("next",a)}function j(a){h("throw",a)}function k(a,b){a(b),f.shift(),f.length&&h(f[0][0],f[0][1])}}(this,arguments,function*(){let b=a.getReader();for(;;){let{value:a,done:c}=yield Q(b.read());if(c)break;yield yield Q(L(a))}})}(c),response:S(d)}}(await I(b,m.STREAM_GENERATE_CONTENT,a,!0,JSON.stringify(c),d))}async function U(a,b,c,d){let e=await I(b,m.GENERATE_CONTENT,a,!1,JSON.stringify(c),d);return{response:L(await e.json())}}function V(a){if(null!=a){if("string"==typeof a)return{role:"system",parts:[{text:a}]};if(a.text)return{role:"system",parts:[a]};if(a.parts)if(!a.role)return{role:"system",parts:a.parts};else return a}}function W(a){let b=[];if("string"==typeof a)b=[{text:a}];else for(let c of a)"string"==typeof c?b.push({text:c}):b.push(c);var c=b;let d={role:"user",parts:[]},e={role:"function",parts:[]},f=!1,g=!1;for(let a of c)"functionResponse"in a?(e.parts.push(a),g=!0):(d.parts.push(a),f=!0);if(f&&g)throw new A("Within a single message, FunctionResponse cannot be mixed with other type of part in the request for sending chat message.");if(!f&&!g)throw new A("No content is provided for sending chat message.");return f?d:e}function X(a){let b;return b=a.contents?a:{contents:[W(a)]},a.systemInstruction&&(b.systemInstruction=V(a.systemInstruction)),b}let Y=["text","inlineData","functionCall","functionResponse","executableCode","codeExecutionResult"],Z={user:["text","inlineData"],function:["functionResponse"],model:["text","functionCall","executableCode","codeExecutionResult"],system:["text"]};function $(a){var b;if(void 0===a.candidates||0===a.candidates.length)return!1;let c=null==(b=a.candidates[0])?void 0:b.content;if(void 0===c||void 0===c.parts||0===c.parts.length)return!1;for(let a of c.parts)if(void 0===a||0===Object.keys(a).length||void 0!==a.text&&""===a.text)return!1;return!0}let _="SILENT_ERROR";class aa{constructor(a,b,c,d={}){this.model=b,this.params=c,this._requestOptions=d,this._history=[],this._sendPromise=Promise.resolve(),this._apiKey=a,(null==c?void 0:c.history)&&(!function(a){let b=!1;for(let c of a){let{role:a,parts:d}=c;if(!b&&"user"!==a)throw new A(`First content should be with role 'user', got ${a}`);if(!z.includes(a))throw new A(`Each item should include role field. Got ${a} but valid roles are: ${JSON.stringify(z)}`);if(!Array.isArray(d))throw new A("Content should have 'parts' property with an array of Parts");if(0===d.length)throw new A("Each Content should have at least one part");let e={text:0,inlineData:0,functionCall:0,functionResponse:0,fileData:0,executableCode:0,codeExecutionResult:0};for(let a of d)for(let b of Y)b in a&&(e[b]+=1);let f=Z[a];for(let b of Y)if(!f.includes(b)&&e[b]>0)throw new A(`Content with role '${a}' can't contain '${b}' part`);b=!0}}(c.history),this._history=c.history)}async getHistory(){return await this._sendPromise,this._history}async sendMessage(a,b={}){var c,d,e,f,g,h;let i;await this._sendPromise;let j=W(a),k={safetySettings:null==(c=this.params)?void 0:c.safetySettings,generationConfig:null==(d=this.params)?void 0:d.generationConfig,tools:null==(e=this.params)?void 0:e.tools,toolConfig:null==(f=this.params)?void 0:f.toolConfig,systemInstruction:null==(g=this.params)?void 0:g.systemInstruction,cachedContent:null==(h=this.params)?void 0:h.cachedContent,contents:[...this._history,j]},l=Object.assign(Object.assign({},this._requestOptions),b);return this._sendPromise=this._sendPromise.then(()=>U(this._apiKey,this.model,k,l)).then(a=>{var b;if($(a.response)){this._history.push(j);let c=Object.assign({parts:[],role:"model"},null==(b=a.response.candidates)?void 0:b[0].content);this._history.push(c)}else{let b=P(a.response);b&&console.warn(`sendMessage() was unsuccessful. ${b}. Inspect response object for details.`)}i=a}).catch(a=>{throw this._sendPromise=Promise.resolve(),a}),await this._sendPromise,i}async sendMessageStream(a,b={}){var c,d,e,f,g,h;await this._sendPromise;let i=W(a),j={safetySettings:null==(c=this.params)?void 0:c.safetySettings,generationConfig:null==(d=this.params)?void 0:d.generationConfig,tools:null==(e=this.params)?void 0:e.tools,toolConfig:null==(f=this.params)?void 0:f.toolConfig,systemInstruction:null==(g=this.params)?void 0:g.systemInstruction,cachedContent:null==(h=this.params)?void 0:h.cachedContent,contents:[...this._history,i]},k=Object.assign(Object.assign({},this._requestOptions),b),l=T(this._apiKey,this.model,j,k);return this._sendPromise=this._sendPromise.then(()=>l).catch(a=>{throw Error(_)}).then(a=>a.response).then(a=>{if($(a)){this._history.push(i);let b=Object.assign({},a.candidates[0].content);b.role||(b.role="model"),this._history.push(b)}else{let b=P(a);b&&console.warn(`sendMessageStream() was unsuccessful. ${b}. Inspect response object for details.`)}}).catch(a=>{a.message!==_&&console.error(a)}),l}}async function ab(a,b,c,d){return(await I(b,m.COUNT_TOKENS,a,!1,JSON.stringify(c),d)).json()}async function ac(a,b,c,d){return(await I(b,m.EMBED_CONTENT,a,!1,JSON.stringify(c),d)).json()}async function ad(a,b,c,d){let e=c.requests.map(a=>Object.assign(Object.assign({},a),{model:b}));return(await I(b,m.BATCH_EMBED_CONTENTS,a,!1,JSON.stringify({requests:e}),d)).json()}class ae{constructor(a,b,c={}){this.apiKey=a,this._requestOptions=c,b.model.includes("/")?this.model=b.model:this.model=`models/${b.model}`,this.generationConfig=b.generationConfig||{},this.safetySettings=b.safetySettings||[],this.tools=b.tools,this.toolConfig=b.toolConfig,this.systemInstruction=V(b.systemInstruction),this.cachedContent=b.cachedContent}async generateContent(a,b={}){var c;let d=X(a),e=Object.assign(Object.assign({},this._requestOptions),b);return U(this.apiKey,this.model,Object.assign({generationConfig:this.generationConfig,safetySettings:this.safetySettings,tools:this.tools,toolConfig:this.toolConfig,systemInstruction:this.systemInstruction,cachedContent:null==(c=this.cachedContent)?void 0:c.name},d),e)}async generateContentStream(a,b={}){var c;let d=X(a),e=Object.assign(Object.assign({},this._requestOptions),b);return T(this.apiKey,this.model,Object.assign({generationConfig:this.generationConfig,safetySettings:this.safetySettings,tools:this.tools,toolConfig:this.toolConfig,systemInstruction:this.systemInstruction,cachedContent:null==(c=this.cachedContent)?void 0:c.name},d),e)}startChat(a){var b;return new aa(this.apiKey,this.model,Object.assign({generationConfig:this.generationConfig,safetySettings:this.safetySettings,tools:this.tools,toolConfig:this.toolConfig,systemInstruction:this.systemInstruction,cachedContent:null==(b=this.cachedContent)?void 0:b.name},a),this._requestOptions)}async countTokens(a,b={}){let c=function(a,b){var c;let d={model:null==b?void 0:b.model,generationConfig:null==b?void 0:b.generationConfig,safetySettings:null==b?void 0:b.safetySettings,tools:null==b?void 0:b.tools,toolConfig:null==b?void 0:b.toolConfig,systemInstruction:null==b?void 0:b.systemInstruction,cachedContent:null==(c=null==b?void 0:b.cachedContent)?void 0:c.name,contents:[]},e=null!=a.generateContentRequest;if(a.contents){if(e)throw new D("CountTokensRequest must have one of contents or generateContentRequest, not both.");d.contents=a.contents}else if(e)d=Object.assign(Object.assign({},d),a.generateContentRequest);else{let b=W(a);d.contents=[b]}return{generateContentRequest:d}}(a,{model:this.model,generationConfig:this.generationConfig,safetySettings:this.safetySettings,tools:this.tools,toolConfig:this.toolConfig,systemInstruction:this.systemInstruction,cachedContent:this.cachedContent}),d=Object.assign(Object.assign({},this._requestOptions),b);return ab(this.apiKey,this.model,c,d)}async embedContent(a,b={}){let c="string"==typeof a||Array.isArray(a)?{content:W(a)}:a,d=Object.assign(Object.assign({},this._requestOptions),b);return ac(this.apiKey,this.model,c,d)}async batchEmbedContents(a,b={}){let c=Object.assign(Object.assign({},this._requestOptions),b);return ad(this.apiKey,this.model,a,c)}}let af=process.env.GEMINI_API_KEY||"",ag=!!af&&"undefined"!==af,ah=null;if(ag)try{ah=new class{constructor(a){this.apiKey=a}getGenerativeModel(a,b){if(!a.model)throw new A("Must provide a model name. Example: genai.getGenerativeModel({ model: 'my-model-name' })");return new ae(this.apiKey,a,b)}getGenerativeModelFromCachedContent(a,b,c){if(!a.name)throw new D("Cached content must contain a `name` field.");if(!a.model)throw new D("Cached content must contain a `model` field.");for(let c of["model","systemInstruction"])if((null==b?void 0:b[c])&&a[c]&&(null==b?void 0:b[c])!==a[c]){if("model"===c&&(b.model.startsWith("models/")?b.model.replace("models/",""):b.model)===(a.model.startsWith("models/")?a.model.replace("models/",""):a.model))continue;throw new D(`Different value for "${c}" specified in modelParams (${b[c]}) and cachedContent (${a[c]})`)}let d=Object.assign(Object.assign({},b),{model:a.model,tools:a.tools,toolConfig:a.toolConfig,systemInstruction:a.systemInstruction,cachedContent:a});return new ae(this.apiKey,d,c)}}(af)}catch(a){console.error("Failed to initialize GoogleGenerativeAI in lib/ai/gemini:",a)}let ai=`
You are VELTRIX COMMAND OS, an enterprise-grade autonomous AI Business Operating System for VELTRIX.
VELTRIX is a futuristic AI and creative technology studio offering branding, graphic design, 2D/3D illustrations, streaming/VTuber assets, website development, Shopify storefronts, AI automations, AI chatbots, AI receptionists, AI customer service agents, and growth consulting.

Primary Goal: Help VELTRIX reach $6,000/month in revenue.
Calculations Model: Monthly Revenue = Leads * Booked Calls * Close Rate * Average Deal Value.
Safety permission constraint: Do not send any emails or message clients without explicit human approval (Level 4 approval).

Business Offer Options:
1. AI Website + Brand System ($800 - $1,500)
   Deliverables: 5-page custom website, mobile responsive, brand direction, SEO, copy, booking form.
2. AI Receptionist / Lead Booking Agent ($500 - $1,200 setup, plus $150 - $500/month retainer)
   Deliverables: Chatbot FAQ ingest, appointment scheduling, CRM sheets sync, follow-up automation.
3. Creative Tech Growth Package ($1,000 - $2,500)
   Deliverables: Brand refresh, landing page, social assets, booking funnel, automations.
`;async function aj(a,b){if(!ag||!ah)throw Error("Gemini API key is missing. Add GEMINI_API_KEY to your environment variables.");let c=null;for(let d of["gemini-2.5-flash"]){let e=1500;for(let f=1;f<=5;f++)try{let c=ah.getGenerativeModel({model:d,systemInstruction:b||ai}),e=(await c.generateContent(a)).response.text();if(!e)throw Error("Gemini returned an empty response.");return e}catch(a){if(c=a,console.warn(`Gemini API call failed for model ${d} (attempt ${f}/5):`,a.message||a),(a.message?.includes("503")||a.message?.includes("Service Unavailable")||a.message?.includes("429")||a.message?.includes("Resource Has Exhausted")||a.message?.includes("overloaded"))&&f<5)await new Promise(a=>setTimeout(a,e)),e*=2;else break}}throw Error(`AI request failed. Check API key, model name, and server logs. Details: ${c?.message||c}`)}a.s(["gemini",0,{async generateDailyReport(a,b,c,d,e){let f=a-b,g=d.map(a=>`- ${a.business_name} (${a.industry||"Unknown"}, Website: ${a.website||"None"}, Score: ${a.lead_score})`).join("\n"),h=e.map(a=>`[${a.type}] ${a.content}`).join("\n");return aj(`
Generate a VELTRIX Daily Command Report based on:
- Revenue Target: $${a}
- Current Closed Revenue: $${b}
- Pipeline Value: $${c}
- Revenue Gap: $${f}
- Qualified Leads:
${g}
- Important Memories:
${h}

Follow this exact format:
VELTRIX Daily Command Report

Revenue Target:
$${a}

Closed Revenue:
$${b}

Pipeline Value:
$${c}

Revenue Gap:
$${f}

Today’s Top Priority:
[Top priority action description]

Leads to Contact:
1. [Name of Lead 1] (Reason: [Reason])
2. [Name of Lead 2] (Reason: [Reason])
3. [Name of Lead 3] (Reason: [Reason])

Follow-ups Due:
1. [Name of Lead 4] (Action: [Action])
2. [Name of Lead 5] (Action: [Action])

Content to Post:
[Social post content idea hook + brief text]

Recommended Action:
[Specific detailed step to take right now]

Risk / Blocker:
[A logical business risk we face right now]

Next Step:
[Immediate action button destination or command]
`)},async scoreLead(a){let b=`
Analyze this business prospect details and output a JSON lead score:
Business Name: ${a.business_name}
Industry: ${a.industry||"Unknown"}
Website: ${a.website||"None"}
Pain Point: ${a.pain_point||"Not specified"}
Source: ${a.source||"Unknown"}
Notes: ${a.notes||"None"}

Rate the following factors from 1 to 10:
- website_score (1 is perfect, 10 is terrible website. The worse the website, the higher the score!)
- branding_score (1 is perfect, 10 is terrible branding. The worse their brand design, the higher the score!)
- automation_need_score (1 is low, 10 is high need for lead capture, FAQs, booking bots)
- ability_to_pay_score (1 is broke, 10 is highly profitable local business with ability to pay $1k-$2k)
- urgency_score (1 is low, 10 is high, e.g. active complaints, bad reviews, or missing bookings)

Calculate the total_score as the mathematical average of these 5 scores.
Explain the logic in the "reasoning" property.

Output ONLY a raw JSON matching this structure:
{
  "website_score": number,
  "branding_score": number,
  "automation_need_score": number,
  "ability_to_pay_score": number,
  "urgency_score": number,
  "total_score": number,
  "reasoning": "string"
}
`,c=await aj(b,"You are Lead Research Agent. You output ONLY JSON.");try{let a=c.replace(/```json/g,"").replace(/```/g,"").trim();return JSON.parse(a)}catch(a){return console.error("Error parsing lead score JSON:",a),{website_score:8,branding_score:7,automation_need_score:9,ability_to_pay_score:8,urgency_score:8,total_score:8,reasoning:"Fallback lead qualification due to parsing errors. High automation needs indicated."}}},generateOutreach:async(a,b)=>aj(`
You are Outreach Agent. Draft a personalized outreach message for this lead:
Lead Name: ${a.business_name}
Industry: ${a.industry||"Unknown"}
Website: ${a.website||"None"}
Pain Points: ${a.pain_point||"Unknown website/booking leaks"}
Notes: ${a.notes||"None"}
Target Offer: ${b}

Follow these strict rules:
1. Personalized opening referencing their industry/name.
2. One specific observation (e.g. mobile speed, lack of booking chat).
3. One clear pain point solved.
4. Soft CTA (e.g. "Can I send you a 2-minute video overview?").
5. Keep it short (3-4 sentences, no long blocks).
6. Do NOT sound needy or like a generic freelancer. Sound like a professional tech partner.
`),generateFollowup:async(a,b)=>aj(`
You are Follow-up Agent. Draft a follow-up message for:
Lead: ${a.business_name}
Industry: ${a.industry||"Unknown"}
Days since initial contact: ${b}

Follow-up rules by schedule:
- Day 3 (Soft reminder): Keep it friendly and short. Check if they received the previous note.
- Day 7 (Value-based): Provide a small helpful hint (e.g., "Here is a quick tip to speed up your page load").
- Day 14 (Final check-in): Polite break-up message ("If timing is not right, I'll close this ticket").
- Day 30 (Re-engagement): Soft check-in on how their business is doing.

Draft a message for Day ${b}. Keep the tone simple, helpful, and confident.
`),generateProposal:async(a,b,c)=>aj(`
You are Proposal Agent. Create a comprehensive, premium business proposal for:
Client: ${a.business_name}
Industry: ${a.industry||"Unknown"}
Offer Package: ${b}
Agreed/Proposed Price: $${c}
Client Pain Points: ${a.pain_point||"Needs conversion optimization"}

Format as standard markdown with sections:
- Executive Overview
- Current Problems Identified
- Our Recommended Solution
- Deliverables Included (match offer specifications)
- Setup Timeline
- Investment & Pricing Model (setup fee and retainer if applicable)
- Payment Terms
- Next Steps
`),async generateContentIdeas(a){let b=`
You are Content Agent. Generate 3 social media content ideas for VELTRIX authority posting.
Topic/Pillar: ${a}

Output ONLY a JSON array of 3 ideas matching this schema:
[
  {
    "platform": "LinkedIn" | "Instagram" | "YouTube",
    "title": "string title",
    "hook": "compelling hook phrase",
    "content": "detailed body text or layout directions",
    "content_type": "Text" | "Image" | "Short-form Video" | "Carousel"
  }
]
`,c=await aj(b,"You are Content Agent. You output ONLY JSON.");try{let a=c.replace(/```json/g,"").replace(/```/g,"").trim();return JSON.parse(a)}catch(a){return console.error("Error parsing content ideas:",a),[{id:"ci-mock-1",platform:"LinkedIn",title:"The AI Client Booking Leak",hook:"Is your service business bleeding 20% of its calls?",content:"Discussing why modern buyers prefer typing to speaking. Explain automated appointment booking widgets.",content_type:"Text",status:"Idea",created_at:new Date().toISOString(),updated_at:new Date().toISOString()}]}},async generateRoiReport(a){let{clientName:b,servicePurchased:c,setupFee:d,monthlyRetainer:e,monthsActive:f,projectStatus:g,tasksCompleted:h,tasksTotal:i,estimatedMonthlySaving:j,estimatedRoiPct:k}=a;return aj(`
You are VELTRIX's AI Value Analyst. Write a professional, client-facing ROI summary for:

Client: ${b}
Service: ${c}
Investment: $${d} setup fee${e>0?` + $${e}/mo retainer`:""}
Months Active: ${f}
Project Status: ${g}
Milestone Completion: ${h}/${i} tasks done
Estimated Monthly Value Generated: ~$${j}/mo
Estimated ROI: ${k>0?"+":""}${k}% on investment

Write exactly 3 short paragraphs (no markdown headers, plain text):
1. What was delivered and the current status — be specific about the service and milestones.
2. The measurable ROI impact — reference the investment vs. value generated numbers confidently.
3. A forward-looking recommendation — one high-impact next step that would deepen the results.

Tone: executive, confident, data-backed, client-ready. No fluff. Under 180 words total.
`,"You are a business value analyst. Output plain prose only — no headers, no bullet points, no markdown.")},callRawLLM:async(a,b)=>aj(a,b),async getEmbedding(a){if(!ag||!ah)throw Error("Gemini API key is missing. Add GEMINI_API_KEY to your environment variables.");let b=1e3;for(let c=1;c<=3;c++)try{let b=ah.getGenerativeModel({model:"gemini-embedding-001"}),c=await b.embedContent({content:{role:"user",parts:[{text:a}]},outputDimensionality:768});if(!c.embedding||!c.embedding.values)throw Error("Gemini returned an empty embedding response.");return c.embedding.values}catch(a){if(console.error(`Gemini Embedding API call failed (attempt ${c}/3):`,a),(a.message?.includes("503")||a.message?.includes("Service Unavailable")||a.message?.includes("429")||a.message?.includes("Resource Has Exhausted")||a.message?.includes("overloaded"))&&c<3)await new Promise(a=>setTimeout(a,b)),b*=2;else throw a}throw Error("Failed to generate embedding after maximum retries.")}},"isGeminiConfigured",0,ag],35887)}];

//# sourceMappingURL=src_lib_ai_gemini_ts_04k5ep7._.js.map