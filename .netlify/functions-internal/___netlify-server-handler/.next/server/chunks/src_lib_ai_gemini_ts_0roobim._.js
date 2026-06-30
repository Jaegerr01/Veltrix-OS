module.exports=[28976,e=>{"use strict";var t,n,s,o,i,a,r,l,c,d,u,h,f,g,m,p,E,y,C,I,O,_,b,w;(f=t||(t={})).STRING="string",f.NUMBER="number",f.INTEGER="integer",f.BOOLEAN="boolean",f.ARRAY="array",f.OBJECT="object",(g=n||(n={})).LANGUAGE_UNSPECIFIED="language_unspecified",g.PYTHON="python",(m=s||(s={})).OUTCOME_UNSPECIFIED="outcome_unspecified",m.OUTCOME_OK="outcome_ok",m.OUTCOME_FAILED="outcome_failed",m.OUTCOME_DEADLINE_EXCEEDED="outcome_deadline_exceeded";let v=["user","model","function","system"];(p=o||(o={})).HARM_CATEGORY_UNSPECIFIED="HARM_CATEGORY_UNSPECIFIED",p.HARM_CATEGORY_HATE_SPEECH="HARM_CATEGORY_HATE_SPEECH",p.HARM_CATEGORY_SEXUALLY_EXPLICIT="HARM_CATEGORY_SEXUALLY_EXPLICIT",p.HARM_CATEGORY_HARASSMENT="HARM_CATEGORY_HARASSMENT",p.HARM_CATEGORY_DANGEROUS_CONTENT="HARM_CATEGORY_DANGEROUS_CONTENT",p.HARM_CATEGORY_CIVIC_INTEGRITY="HARM_CATEGORY_CIVIC_INTEGRITY",(E=i||(i={})).HARM_BLOCK_THRESHOLD_UNSPECIFIED="HARM_BLOCK_THRESHOLD_UNSPECIFIED",E.BLOCK_LOW_AND_ABOVE="BLOCK_LOW_AND_ABOVE",E.BLOCK_MEDIUM_AND_ABOVE="BLOCK_MEDIUM_AND_ABOVE",E.BLOCK_ONLY_HIGH="BLOCK_ONLY_HIGH",E.BLOCK_NONE="BLOCK_NONE",(y=a||(a={})).HARM_PROBABILITY_UNSPECIFIED="HARM_PROBABILITY_UNSPECIFIED",y.NEGLIGIBLE="NEGLIGIBLE",y.LOW="LOW",y.MEDIUM="MEDIUM",y.HIGH="HIGH",(C=r||(r={})).BLOCKED_REASON_UNSPECIFIED="BLOCKED_REASON_UNSPECIFIED",C.SAFETY="SAFETY",C.OTHER="OTHER",(I=l||(l={})).FINISH_REASON_UNSPECIFIED="FINISH_REASON_UNSPECIFIED",I.STOP="STOP",I.MAX_TOKENS="MAX_TOKENS",I.SAFETY="SAFETY",I.RECITATION="RECITATION",I.LANGUAGE="LANGUAGE",I.BLOCKLIST="BLOCKLIST",I.PROHIBITED_CONTENT="PROHIBITED_CONTENT",I.SPII="SPII",I.MALFORMED_FUNCTION_CALL="MALFORMED_FUNCTION_CALL",I.OTHER="OTHER",(O=c||(c={})).TASK_TYPE_UNSPECIFIED="TASK_TYPE_UNSPECIFIED",O.RETRIEVAL_QUERY="RETRIEVAL_QUERY",O.RETRIEVAL_DOCUMENT="RETRIEVAL_DOCUMENT",O.SEMANTIC_SIMILARITY="SEMANTIC_SIMILARITY",O.CLASSIFICATION="CLASSIFICATION",O.CLUSTERING="CLUSTERING",(_=d||(d={})).MODE_UNSPECIFIED="MODE_UNSPECIFIED",_.AUTO="AUTO",_.ANY="ANY",_.NONE="NONE",(b=u||(u={})).MODE_UNSPECIFIED="MODE_UNSPECIFIED",b.MODE_DYNAMIC="MODE_DYNAMIC";class A extends Error{constructor(e){super(`[GoogleGenerativeAI Error]: ${e}`)}}class T extends A{constructor(e,t){super(e),this.response=t}}class R extends A{constructor(e,t,n,s){super(e),this.status=t,this.statusText=n,this.errorDetails=s}}class N extends A{}class S extends A{}(w=h||(h={})).GENERATE_CONTENT="generateContent",w.STREAM_GENERATE_CONTENT="streamGenerateContent",w.COUNT_TOKENS="countTokens",w.EMBED_CONTENT="embedContent",w.BATCH_EMBED_CONTENTS="batchEmbedContents";class ${constructor(e,t,n,s,o){this.model=e,this.task=t,this.apiKey=n,this.stream=s,this.requestOptions=o}toString(){var e,t;let n=(null==(e=this.requestOptions)?void 0:e.apiVersion)||"v1beta",s=(null==(t=this.requestOptions)?void 0:t.baseUrl)||"https://generativelanguage.googleapis.com",o=`${s}/${n}/${this.model}:${this.task}`;return this.stream&&(o+="?alt=sse"),o}}async function M(e){var t,n;let s,o=new Headers;o.append("Content-Type","application/json"),o.append("x-goog-api-client",(n=e.requestOptions,s=[],(null==n?void 0:n.apiClient)&&s.push(n.apiClient),s.push("genai-js/0.24.1"),s.join(" "))),o.append("x-goog-api-key",e.apiKey);let i=null==(t=e.requestOptions)?void 0:t.customHeaders;if(i){if(!(i instanceof Headers))try{i=new Headers(i)}catch(e){throw new N(`unable to convert customHeaders value ${JSON.stringify(i)} to Headers: ${e.message}`)}for(let[e,t]of i.entries()){if("x-goog-api-key"===e)throw new N(`Cannot set reserved header name ${e}`);if("x-goog-api-client"===e)throw new N(`Header name ${e} can only be set using the apiClient field`);o.append(e,t)}}return o}async function k(e,t,n,s,o,i){let a=new $(e,t,n,s,i);return{url:a.toString(),fetchOptions:Object.assign(Object.assign({},function(e){let t={};if((null==e?void 0:e.signal)!==void 0||(null==e?void 0:e.timeout)>=0){let n=new AbortController;(null==e?void 0:e.timeout)>=0&&setTimeout(()=>n.abort(),e.timeout),(null==e?void 0:e.signal)&&e.signal.addEventListener("abort",()=>{n.abort()}),t.signal=n.signal}return t}(i)),{method:"POST",headers:await M(a),body:o})}}async function L(e,t,n,s,o,i={},a=fetch){let{url:r,fetchOptions:l}=await k(e,t,n,s,o,i);return D(r,l,a)}async function D(e,t,n=fetch){let s;try{s=await n(e,t)}catch(n){var o=n,i=e;let t=o;throw"AbortError"===t.name?(t=new S(`Request aborted when fetching ${i.toString()}: ${o.message}`)).stack=o.stack:o instanceof R||o instanceof N||((t=new A(`Error fetching from ${i.toString()}: ${o.message}`)).stack=o.stack),t}return s.ok||await P(s,e),s}async function P(e,t){let n,s="";try{let t=await e.json();s=t.error.message,t.error.details&&(s+=` ${JSON.stringify(t.error.details)}`,n=t.error.details)}catch(e){}throw new R(`Error fetching from ${t.toString()}: [${e.status} ${e.statusText}] ${s}`,e.status,e.statusText,n)}function x(e){return e.text=()=>{if(e.candidates&&e.candidates.length>0){if(e.candidates.length>1&&console.warn(`This response had ${e.candidates.length} candidates. Returning text from the first candidate only. Access response.candidates directly to use the other candidates.`),U(e.candidates[0]))throw new T(`${H(e)}`,e);return function(e){var t,n,s,o;let i=[];if(null==(n=null==(t=e.candidates)?void 0:t[0].content)?void 0:n.parts)for(let t of null==(o=null==(s=e.candidates)?void 0:s[0].content)?void 0:o.parts)t.text&&i.push(t.text),t.executableCode&&i.push("\n```"+t.executableCode.language+"\n"+t.executableCode.code+"\n```\n"),t.codeExecutionResult&&i.push("\n```\n"+t.codeExecutionResult.output+"\n```\n");return i.length>0?i.join(""):""}(e)}if(e.promptFeedback)throw new T(`Text not available. ${H(e)}`,e);return""},e.functionCall=()=>{if(e.candidates&&e.candidates.length>0){if(e.candidates.length>1&&console.warn(`This response had ${e.candidates.length} candidates. Returning function calls from the first candidate only. Access response.candidates directly to use the other candidates.`),U(e.candidates[0]))throw new T(`${H(e)}`,e);return console.warn("response.functionCall() is deprecated. Use response.functionCalls() instead."),G(e)[0]}if(e.promptFeedback)throw new T(`Function call not available. ${H(e)}`,e)},e.functionCalls=()=>{if(e.candidates&&e.candidates.length>0){if(e.candidates.length>1&&console.warn(`This response had ${e.candidates.length} candidates. Returning function calls from the first candidate only. Access response.candidates directly to use the other candidates.`),U(e.candidates[0]))throw new T(`${H(e)}`,e);return G(e)}if(e.promptFeedback)throw new T(`Function call not available. ${H(e)}`,e)},e}function G(e){var t,n,s,o;let i=[];if(null==(n=null==(t=e.candidates)?void 0:t[0].content)?void 0:n.parts)for(let t of null==(o=null==(s=e.candidates)?void 0:s[0].content)?void 0:o.parts)t.functionCall&&i.push(t.functionCall);return i.length>0?i:void 0}let F=[l.RECITATION,l.SAFETY,l.LANGUAGE];function U(e){return!!e.finishReason&&F.includes(e.finishReason)}function H(e){var t,n,s;let o="";if((!e.candidates||0===e.candidates.length)&&e.promptFeedback)o+="Response was blocked",(null==(t=e.promptFeedback)?void 0:t.blockReason)&&(o+=` due to ${e.promptFeedback.blockReason}`),(null==(n=e.promptFeedback)?void 0:n.blockReasonMessage)&&(o+=`: ${e.promptFeedback.blockReasonMessage}`);else if(null==(s=e.candidates)?void 0:s[0]){let t=e.candidates[0];U(t)&&(o+=`Candidate was blocked due to ${t.finishReason}`,t.finishMessage&&(o+=`: ${t.finishMessage}`))}return o}function Y(e){return this instanceof Y?(this.v=e,this):new Y(e)}"function"==typeof SuppressedError&&SuppressedError;let j=/^data\: (.*)(?:\n\n|\r\r|\r\n\r\n)/;async function B(e){let t=[],n=e.getReader();for(;;){let{done:e,value:s}=await n.read();if(e)return x(function(e){let t=e[e.length-1],n={promptFeedback:null==t?void 0:t.promptFeedback};for(let t of e){if(t.candidates){let e=0;for(let s of t.candidates)if(n.candidates||(n.candidates=[]),n.candidates[e]||(n.candidates[e]={index:e}),n.candidates[e].citationMetadata=s.citationMetadata,n.candidates[e].groundingMetadata=s.groundingMetadata,n.candidates[e].finishReason=s.finishReason,n.candidates[e].finishMessage=s.finishMessage,n.candidates[e].safetyRatings=s.safetyRatings,s.content&&s.content.parts){n.candidates[e].content||(n.candidates[e].content={role:s.content.role||"user",parts:[]});let t={};for(let o of s.content.parts)o.text&&(t.text=o.text),o.functionCall&&(t.functionCall=o.functionCall),o.executableCode&&(t.executableCode=o.executableCode),o.codeExecutionResult&&(t.codeExecutionResult=o.codeExecutionResult),0===Object.keys(t).length&&(t.text=""),n.candidates[e].content.parts.push(t)}e++}t.usageMetadata&&(n.usageMetadata=t.usageMetadata)}return n}(t));t.push(s)}}async function K(e,t,n,s){return function(e){let t,[n,s]=(t=e.body.pipeThrough(new TextDecoderStream("utf8",{fatal:!0})).getReader(),new ReadableStream({start(e){let n="";return function s(){return t.read().then(({value:t,done:o})=>{let i;if(o)return n.trim()?void e.error(new A("Failed to parse stream")):void e.close();let a=(n+=t).match(j);for(;a;){try{i=JSON.parse(a[1])}catch(t){e.error(new A(`Error parsing JSON response: "${a[1]}"`));return}e.enqueue(i),a=(n=n.substring(a[0].length)).match(j)}return s()}).catch(e=>{let t=e;throw t.stack=e.stack,t="AbortError"===t.name?new S("Request aborted when reading from the stream"):new A("Error reading from the stream")})}()}})).tee();return{stream:function(e){return function(e,t,n){if(!Symbol.asyncIterator)throw TypeError("Symbol.asyncIterator is not defined.");var s,o=n.apply(e,t||[]),i=[];return s={},a("next"),a("throw"),a("return"),s[Symbol.asyncIterator]=function(){return this},s;function a(e){o[e]&&(s[e]=function(t){return new Promise(function(n,s){i.push([e,t,n,s])>1||r(e,t)})})}function r(e,t){try{var n;(n=o[e](t)).value instanceof Y?Promise.resolve(n.value.v).then(l,c):d(i[0][2],n)}catch(e){d(i[0][3],e)}}function l(e){r("next",e)}function c(e){r("throw",e)}function d(e,t){e(t),i.shift(),i.length&&r(i[0][0],i[0][1])}}(this,arguments,function*(){let t=e.getReader();for(;;){let{value:e,done:n}=yield Y(t.read());if(n)break;yield yield Y(x(e))}})}(n),response:B(s)}}(await L(t,h.STREAM_GENERATE_CONTENT,e,!0,JSON.stringify(n),s))}async function q(e,t,n,s){let o=await L(t,h.GENERATE_CONTENT,e,!1,JSON.stringify(n),s);return{response:x(await o.json())}}function V(e){if(null!=e){if("string"==typeof e)return{role:"system",parts:[{text:e}]};if(e.text)return{role:"system",parts:[e]};if(e.parts)if(!e.role)return{role:"system",parts:e.parts};else return e}}function J(e){let t=[];if("string"==typeof e)t=[{text:e}];else for(let n of e)"string"==typeof n?t.push({text:n}):t.push(n);var n=t;let s={role:"user",parts:[]},o={role:"function",parts:[]},i=!1,a=!1;for(let e of n)"functionResponse"in e?(o.parts.push(e),a=!0):(s.parts.push(e),i=!0);if(i&&a)throw new A("Within a single message, FunctionResponse cannot be mixed with other type of part in the request for sending chat message.");if(!i&&!a)throw new A("No content is provided for sending chat message.");return i?s:o}function X(e){let t;return t=e.contents?e:{contents:[J(e)]},e.systemInstruction&&(t.systemInstruction=V(e.systemInstruction)),t}let W=["text","inlineData","functionCall","functionResponse","executableCode","codeExecutionResult"],z={user:["text","inlineData"],function:["functionResponse"],model:["text","functionCall","executableCode","codeExecutionResult"],system:["text"]};function Q(e){var t;if(void 0===e.candidates||0===e.candidates.length)return!1;let n=null==(t=e.candidates[0])?void 0:t.content;if(void 0===n||void 0===n.parts||0===n.parts.length)return!1;for(let e of n.parts)if(void 0===e||0===Object.keys(e).length||void 0!==e.text&&""===e.text)return!1;return!0}let Z="SILENT_ERROR";class ee{constructor(e,t,n,s={}){this.model=t,this.params=n,this._requestOptions=s,this._history=[],this._sendPromise=Promise.resolve(),this._apiKey=e,(null==n?void 0:n.history)&&(!function(e){let t=!1;for(let n of e){let{role:e,parts:s}=n;if(!t&&"user"!==e)throw new A(`First content should be with role 'user', got ${e}`);if(!v.includes(e))throw new A(`Each item should include role field. Got ${e} but valid roles are: ${JSON.stringify(v)}`);if(!Array.isArray(s))throw new A("Content should have 'parts' property with an array of Parts");if(0===s.length)throw new A("Each Content should have at least one part");let o={text:0,inlineData:0,functionCall:0,functionResponse:0,fileData:0,executableCode:0,codeExecutionResult:0};for(let e of s)for(let t of W)t in e&&(o[t]+=1);let i=z[e];for(let t of W)if(!i.includes(t)&&o[t]>0)throw new A(`Content with role '${e}' can't contain '${t}' part`);t=!0}}(n.history),this._history=n.history)}async getHistory(){return await this._sendPromise,this._history}async sendMessage(e,t={}){var n,s,o,i,a,r;let l;await this._sendPromise;let c=J(e),d={safetySettings:null==(n=this.params)?void 0:n.safetySettings,generationConfig:null==(s=this.params)?void 0:s.generationConfig,tools:null==(o=this.params)?void 0:o.tools,toolConfig:null==(i=this.params)?void 0:i.toolConfig,systemInstruction:null==(a=this.params)?void 0:a.systemInstruction,cachedContent:null==(r=this.params)?void 0:r.cachedContent,contents:[...this._history,c]},u=Object.assign(Object.assign({},this._requestOptions),t);return this._sendPromise=this._sendPromise.then(()=>q(this._apiKey,this.model,d,u)).then(e=>{var t;if(Q(e.response)){this._history.push(c);let n=Object.assign({parts:[],role:"model"},null==(t=e.response.candidates)?void 0:t[0].content);this._history.push(n)}else{let t=H(e.response);t&&console.warn(`sendMessage() was unsuccessful. ${t}. Inspect response object for details.`)}l=e}).catch(e=>{throw this._sendPromise=Promise.resolve(),e}),await this._sendPromise,l}async sendMessageStream(e,t={}){var n,s,o,i,a,r;await this._sendPromise;let l=J(e),c={safetySettings:null==(n=this.params)?void 0:n.safetySettings,generationConfig:null==(s=this.params)?void 0:s.generationConfig,tools:null==(o=this.params)?void 0:o.tools,toolConfig:null==(i=this.params)?void 0:i.toolConfig,systemInstruction:null==(a=this.params)?void 0:a.systemInstruction,cachedContent:null==(r=this.params)?void 0:r.cachedContent,contents:[...this._history,l]},d=Object.assign(Object.assign({},this._requestOptions),t),u=K(this._apiKey,this.model,c,d);return this._sendPromise=this._sendPromise.then(()=>u).catch(e=>{throw Error(Z)}).then(e=>e.response).then(e=>{if(Q(e)){this._history.push(l);let t=Object.assign({},e.candidates[0].content);t.role||(t.role="model"),this._history.push(t)}else{let t=H(e);t&&console.warn(`sendMessageStream() was unsuccessful. ${t}. Inspect response object for details.`)}}).catch(e=>{e.message!==Z&&console.error(e)}),u}}async function et(e,t,n,s){return(await L(t,h.COUNT_TOKENS,e,!1,JSON.stringify(n),s)).json()}async function en(e,t,n,s){return(await L(t,h.EMBED_CONTENT,e,!1,JSON.stringify(n),s)).json()}async function es(e,t,n,s){let o=n.requests.map(e=>Object.assign(Object.assign({},e),{model:t}));return(await L(t,h.BATCH_EMBED_CONTENTS,e,!1,JSON.stringify({requests:o}),s)).json()}class eo{constructor(e,t,n={}){this.apiKey=e,this._requestOptions=n,t.model.includes("/")?this.model=t.model:this.model=`models/${t.model}`,this.generationConfig=t.generationConfig||{},this.safetySettings=t.safetySettings||[],this.tools=t.tools,this.toolConfig=t.toolConfig,this.systemInstruction=V(t.systemInstruction),this.cachedContent=t.cachedContent}async generateContent(e,t={}){var n;let s=X(e),o=Object.assign(Object.assign({},this._requestOptions),t);return q(this.apiKey,this.model,Object.assign({generationConfig:this.generationConfig,safetySettings:this.safetySettings,tools:this.tools,toolConfig:this.toolConfig,systemInstruction:this.systemInstruction,cachedContent:null==(n=this.cachedContent)?void 0:n.name},s),o)}async generateContentStream(e,t={}){var n;let s=X(e),o=Object.assign(Object.assign({},this._requestOptions),t);return K(this.apiKey,this.model,Object.assign({generationConfig:this.generationConfig,safetySettings:this.safetySettings,tools:this.tools,toolConfig:this.toolConfig,systemInstruction:this.systemInstruction,cachedContent:null==(n=this.cachedContent)?void 0:n.name},s),o)}startChat(e){var t;return new ee(this.apiKey,this.model,Object.assign({generationConfig:this.generationConfig,safetySettings:this.safetySettings,tools:this.tools,toolConfig:this.toolConfig,systemInstruction:this.systemInstruction,cachedContent:null==(t=this.cachedContent)?void 0:t.name},e),this._requestOptions)}async countTokens(e,t={}){let n=function(e,t){var n;let s={model:null==t?void 0:t.model,generationConfig:null==t?void 0:t.generationConfig,safetySettings:null==t?void 0:t.safetySettings,tools:null==t?void 0:t.tools,toolConfig:null==t?void 0:t.toolConfig,systemInstruction:null==t?void 0:t.systemInstruction,cachedContent:null==(n=null==t?void 0:t.cachedContent)?void 0:n.name,contents:[]},o=null!=e.generateContentRequest;if(e.contents){if(o)throw new N("CountTokensRequest must have one of contents or generateContentRequest, not both.");s.contents=e.contents}else if(o)s=Object.assign(Object.assign({},s),e.generateContentRequest);else{let t=J(e);s.contents=[t]}return{generateContentRequest:s}}(e,{model:this.model,generationConfig:this.generationConfig,safetySettings:this.safetySettings,tools:this.tools,toolConfig:this.toolConfig,systemInstruction:this.systemInstruction,cachedContent:this.cachedContent}),s=Object.assign(Object.assign({},this._requestOptions),t);return et(this.apiKey,this.model,n,s)}async embedContent(e,t={}){let n="string"==typeof e||Array.isArray(e)?{content:J(e)}:e,s=Object.assign(Object.assign({},this._requestOptions),t);return en(this.apiKey,this.model,n,s)}async batchEmbedContents(e,t={}){let n=Object.assign(Object.assign({},this._requestOptions),t);return es(this.apiKey,this.model,e,n)}}let ei=process.env.GEMINI_API_KEY||"",ea=!!ei&&"undefined"!==ei,er=null;if(ea)try{er=new class{constructor(e){this.apiKey=e}getGenerativeModel(e,t){if(!e.model)throw new A("Must provide a model name. Example: genai.getGenerativeModel({ model: 'my-model-name' })");return new eo(this.apiKey,e,t)}getGenerativeModelFromCachedContent(e,t,n){if(!e.name)throw new N("Cached content must contain a `name` field.");if(!e.model)throw new N("Cached content must contain a `model` field.");for(let n of["model","systemInstruction"])if((null==t?void 0:t[n])&&e[n]&&(null==t?void 0:t[n])!==e[n]){if("model"===n&&(t.model.startsWith("models/")?t.model.replace("models/",""):t.model)===(e.model.startsWith("models/")?e.model.replace("models/",""):e.model))continue;throw new N(`Different value for "${n}" specified in modelParams (${t[n]}) and cachedContent (${e[n]})`)}let s=Object.assign(Object.assign({},t),{model:e.model,tools:e.tools,toolConfig:e.toolConfig,systemInstruction:e.systemInstruction,cachedContent:e});return new eo(this.apiKey,s,n)}}(ei)}catch(e){console.error("Failed to initialize GoogleGenerativeAI in lib/ai/gemini:",e)}let el=`
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
`;async function ec(e,t){if(!ea||!er)throw Error("Gemini API key is missing. Add GEMINI_API_KEY to your environment variables.");let n=null;for(let s of["gemini-2.5-flash"]){let o=1500;for(let i=1;i<=5;i++)try{let n=er.getGenerativeModel({model:s,systemInstruction:t||el}),o=(await n.generateContent(e)).response.text();if(!o)throw Error("Gemini returned an empty response.");return o}catch(e){if(n=e,console.warn(`Gemini API call failed for model ${s} (attempt ${i}/5):`,e.message||e),(e.message?.includes("503")||e.message?.includes("Service Unavailable")||e.message?.includes("429")||e.message?.includes("Resource Has Exhausted")||e.message?.includes("overloaded"))&&i<5)await new Promise(e=>setTimeout(e,o)),o*=2;else break}}throw Error(`AI request failed. Check API key, model name, and server logs. Details: ${n?.message||n}`)}e.s(["gemini",0,{async generateDailyReport(e,t,n,s,o){let i=e-t,a=s.map(e=>`- ${e.business_name} (${e.industry||"Unknown"}, Website: ${e.website||"None"}, Score: ${e.lead_score})`).join("\n"),r=o.map(e=>`[${e.type}] ${e.content}`).join("\n");return ec(`
Generate a VELTRIX Daily Command Report based on:
- Revenue Target: $${e}
- Current Closed Revenue: $${t}
- Pipeline Value: $${n}
- Revenue Gap: $${i}
- Qualified Leads:
${a}
- Important Memories:
${r}

Follow this exact format:
VELTRIX Daily Command Report

Revenue Target:
$${e}

Closed Revenue:
$${t}

Pipeline Value:
$${n}

Revenue Gap:
$${i}

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
`)},async scoreLead(e){let t=`
Analyze this business prospect details and output a JSON lead score:
Business Name: ${e.business_name}
Industry: ${e.industry||"Unknown"}
Website: ${e.website||"None"}
Pain Point: ${e.pain_point||"Not specified"}
Source: ${e.source||"Unknown"}
Notes: ${e.notes||"None"}

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
`,n=await ec(t,"You are Lead Research Agent. You output ONLY JSON.");try{let e=n.replace(/```json/g,"").replace(/```/g,"").trim();return JSON.parse(e)}catch(e){return console.error("Error parsing lead score JSON:",e),{website_score:8,branding_score:7,automation_need_score:9,ability_to_pay_score:8,urgency_score:8,total_score:8,reasoning:"Fallback lead qualification due to parsing errors. High automation needs indicated."}}},generateOutreach:async(e,t)=>ec(`
You are Outreach Agent. Draft a personalized outreach message for this lead:
Lead Name: ${e.business_name}
Industry: ${e.industry||"Unknown"}
Website: ${e.website||"None"}
Pain Points: ${e.pain_point||"Unknown website/booking leaks"}
Notes: ${e.notes||"None"}
Target Offer: ${t}

Follow these strict rules:
1. Personalized opening referencing their industry/name.
2. One specific observation (e.g. mobile speed, lack of booking chat).
3. One clear pain point solved.
4. Soft CTA (e.g. "Can I send you a 2-minute video overview?").
5. Keep it short (3-4 sentences, no long blocks).
6. Do NOT sound needy or like a generic freelancer. Sound like a professional tech partner.
`),generateFollowup:async(e,t)=>ec(`
You are Follow-up Agent. Draft a follow-up message for:
Lead: ${e.business_name}
Industry: ${e.industry||"Unknown"}
Days since initial contact: ${t}

Follow-up rules by schedule:
- Day 3 (Soft reminder): Keep it friendly and short. Check if they received the previous note.
- Day 7 (Value-based): Provide a small helpful hint (e.g., "Here is a quick tip to speed up your page load").
- Day 14 (Final check-in): Polite break-up message ("If timing is not right, I'll close this ticket").
- Day 30 (Re-engagement): Soft check-in on how their business is doing.

Draft a message for Day ${t}. Keep the tone simple, helpful, and confident.
`),generateProposal:async(e,t,n)=>ec(`
You are Proposal Agent. Create a comprehensive, premium business proposal for:
Client: ${e.business_name}
Industry: ${e.industry||"Unknown"}
Offer Package: ${t}
Agreed/Proposed Price: $${n}
Client Pain Points: ${e.pain_point||"Needs conversion optimization"}

Format as standard markdown with sections:
- Executive Overview
- Current Problems Identified
- Our Recommended Solution
- Deliverables Included (match offer specifications)
- Setup Timeline
- Investment & Pricing Model (setup fee and retainer if applicable)
- Payment Terms
- Next Steps
`),async generateContentIdeas(e){let t=`
You are Content Agent. Generate 3 social media content ideas for VELTRIX authority posting.
Topic/Pillar: ${e}

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
`,n=await ec(t,"You are Content Agent. You output ONLY JSON.");try{let e=n.replace(/```json/g,"").replace(/```/g,"").trim();return JSON.parse(e)}catch(e){return console.error("Error parsing content ideas:",e),[{id:"ci-mock-1",platform:"LinkedIn",title:"The AI Client Booking Leak",hook:"Is your service business bleeding 20% of its calls?",content:"Discussing why modern buyers prefer typing to speaking. Explain automated appointment booking widgets.",content_type:"Text",status:"Idea",created_at:new Date().toISOString(),updated_at:new Date().toISOString()}]}},async generateRoiReport(e){let{clientName:t,servicePurchased:n,setupFee:s,monthlyRetainer:o,monthsActive:i,projectStatus:a,tasksCompleted:r,tasksTotal:l,estimatedMonthlySaving:c,estimatedRoiPct:d}=e;return ec(`
You are VELTRIX's AI Value Analyst. Write a professional, client-facing ROI summary for:

Client: ${t}
Service: ${n}
Investment: $${s} setup fee${o>0?` + $${o}/mo retainer`:""}
Months Active: ${i}
Project Status: ${a}
Milestone Completion: ${r}/${l} tasks done
Estimated Monthly Value Generated: ~$${c}/mo
Estimated ROI: ${d>0?"+":""}${d}% on investment

Write exactly 3 short paragraphs (no markdown headers, plain text):
1. What was delivered and the current status — be specific about the service and milestones.
2. The measurable ROI impact — reference the investment vs. value generated numbers confidently.
3. A forward-looking recommendation — one high-impact next step that would deepen the results.

Tone: executive, confident, data-backed, client-ready. No fluff. Under 180 words total.
`,"You are a business value analyst. Output plain prose only — no headers, no bullet points, no markdown.")},callRawLLM:async(e,t)=>ec(e,t),async getEmbedding(e){if(!ea||!er)throw Error("Gemini API key is missing. Add GEMINI_API_KEY to your environment variables.");let t=1e3;for(let n=1;n<=3;n++)try{let t=er.getGenerativeModel({model:"gemini-embedding-001"}),n=await t.embedContent({content:{role:"user",parts:[{text:e}]},outputDimensionality:768});if(!n.embedding||!n.embedding.values)throw Error("Gemini returned an empty embedding response.");return n.embedding.values}catch(e){if(console.error(`Gemini Embedding API call failed (attempt ${n}/3):`,e),(e.message?.includes("503")||e.message?.includes("Service Unavailable")||e.message?.includes("429")||e.message?.includes("Resource Has Exhausted")||e.message?.includes("overloaded"))&&n<3)await new Promise(e=>setTimeout(e,t)),t*=2;else throw e}throw Error("Failed to generate embedding after maximum retries.")}},"isGeminiConfigured",0,ea],28976)}];

//# sourceMappingURL=src_lib_ai_gemini_ts_0roobim._.js.map