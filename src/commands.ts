import { Editor } from '@tiptap/core';
import { closeHistory } from '@tiptap/pm/history';
import { matchKey } from './editor';
export interface Range {from:number;to:number;label?:string;kind?:string;level?:number;possibleHeading?:boolean;context?:string;section?:string;}
export interface Result {message:string;pending?:()=>Result;matches?:Range[];needsChoice?:boolean;ok?:boolean;}
const nums:Record<string,number>={first:1,second:2,third:3,fourth:4,fifth:5,sixth:6,seventh:7,eighth:8,ninth:9,tenth:10,last:-1,one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,eleven:11,twelve:12,thirteen:13,fourteen:14,fifteen:15,sixteen:16,eighteen:18,twenty:20,'twenty four':24,'thirty six':36};
const number=(s:string)=>nums[s]??Number(s.replace(/(st|nd|rd|th)$/,''));
const norm=(s:string)=>s.toLowerCase().replace(/[‘’]/g,"'").replace(/\s+/g,' ').trim();
const clean=(s:string)=>s.trim().replace(/^["“']|["”'.]$/g,'');
export class CommandEngine {
 matches:Range[]=[]; index=0; unresolvedTarget=false; pendingChoice:{actions:string[];doc:Editor['state']['doc']}|null=null; previous:Range|null=null; clipboard:any=null; lastText='';
 constructor(public editor:Editor){}
 blocks(type?:string){const a:Range[]=[];let section='';this.editor.state.doc.descendants((n,p)=>{if(n.type.name==='heading')section=n.textContent;if(n.isTextblock){let allBold=!!n.textContent;n.descendants(child=>{if(child.isText&&child.text?.trim()&&!child.marks.some(m=>m.type.name==='bold'))allBold=false;});const text=n.textContent;const possible=n.type.name==='paragraph'&&text.trim().length>1&&text.length<=140&&text.trim().split(/\s+/).length<=14&&(allBold||(/[A-Z]/.test(text)&&text===text.toUpperCase()));a.push({from:p+1,to:p+n.nodeSize-1,label:text,kind:n.type.name,level:n.attrs.level,possibleHeading:possible,section});}});for(let i=0;i<a.length;i++){if(a[i].kind==='heading'||a[i].possibleHeading)a[i].context=[i>0?'Before: '+(a[i-1].label||'').slice(-65):'',i+1<a.length?'After: '+(a[i+1].label||'').slice(0,100):''].filter(Boolean).join(' · ');}return type?a.filter(b=>b.kind===type):a;}
 clearMatches(){this.unresolvedTarget=false;this.pendingChoice=null;this.matches=[];this.markMatches();}
 choose(index:number):Result {
 if(!this.matches.length)return {message:'There are no search results. Find a passage first.',ok:false};
 if(!Number.isInteger(index)||index<0||index>=this.matches.length)return {message:`Choose a result number from 1 to ${this.matches.length}.`,ok:false,matches:this.matches,needsChoice:true};
 const waiting=this.pendingChoice;
 if(waiting&&waiting.doc!==this.editor.state.doc){this.clearMatches();return {message:'The document changed. The pending instruction was cancelled to avoid editing the wrong text. Find the passage again.',ok:false,matches:[]};}
 const shown=this.show(index);this.unresolvedTarget=false;this.pendingChoice=null;
 if(waiting){const applied=this.applyActions(waiting.actions);return {...applied,message:`Selected result ${index+1}. ${applied.message}`,matches:this.matches};}
 return {...shown,message:`Selected result ${index+1}: “${this.matches[index].label}”.`,needsChoice:false};
 }
 applyActions(actions:string[]):Result {
 const before=this.editor.state;const messages:string[]=[];this.editor.view.dispatch(closeHistory(this.editor.state.tr));
 for(const action of actions){const r=this.execute(action);if(r.ok===false||r.pending||r.needsChoice){this.editor.view.updateState(before);return {message:r.pending?'Run this confirmation-requiring action separately.':r.message,ok:false,matches:this.matches};}messages.push(r.message);}
 this.editor.view.dispatch(closeHistory(this.editor.state.tr));this.markMatches();return {message:messages.join(' '),matches:this.matches};
 }
 canDefer(actions:string[]){const ref='(?:it|this|that|the (?:heading|selected (?:text|sentence|paragraph)))';return actions.every(a=>new RegExp(`^(?:(?:make|set) ${ref} (?:bold|italic|italics|underlined|underline|uppercase|highlighted)|(?:bold|underline|italicise|italicize|highlight|strikethrough|centre|center) ${ref}|align ${ref} (?:to (?:the )?)?(?:left|right|centre|center|justify))$`,'i').test(a.trim()));}
 scan(phrase:string,blocks=this.blocks()):Range[]{const q=norm(phrase);const found:Range[]=[];for(const b of blocks){const text=this.editor.state.doc.textBetween(b.from,b.to,'');const raw=text.toLowerCase().replace(/[‘’]/g,"'");let lower='';const positions:number[]=[];for(let k=0;k<raw.length;k++){const char=/\s/.test(raw[k])?' ':raw[k];if(char===' '&&lower.endsWith(' '))continue;lower+=char;positions.push(k);}let start=0;while(start<=lower.length){const i=lower.indexOf(q,start);if(i<0)break;const from=positions[i],to=positions[i+q.length-1]+1;found.push({...b,from:b.from+from,to:b.from+to,context:(b.kind==='heading'||b.possibleHeading)?b.context:(from>55?'…':'')+text.slice(Math.max(0,from-55),Math.min(text.length,to+90))+(to+90<text.length?'…':'')});start=i+Math.max(1,q.length);}}return found;}
 findHeading(phrase:string):Result {
 this.pendingChoice=null;this.unresolvedTarget=false;phrase=clean(phrase);if(!phrase)throw Error('Say the heading name.');const q=norm(phrase);
 const title=(text:string)=>norm(text).replace(/^(?:\d+(?:\.\d+)*[.)]?\s+|[ivxlcdm]+[.)]\s+)/i,'').replace(/[:.]$/,'').trim();
 const headings=this.blocks('heading');const exact=headings.filter(h=>title(h.label||'')===title(q));this.matches=exact.length?exact:headings.filter(h=>norm(h.label||'').includes(q));this.index=-1;
 if(this.matches.length){this.markMatches();if(this.matches.length===1){this.show(0);return {message:`Found heading “${this.matches[0].label}”.`,matches:this.matches};}this.unresolvedTarget=true;return {message:`${this.matches.length} recognised headings match “${phrase}”. Choose a result by tapping it or saying “Choose result two”.`,matches:this.matches,needsChoice:true};}
 this.matches=this.scan(phrase);this.unresolvedTarget=true;this.markMatches();return {message:this.matches.length?`No recognised heading named “${phrase}”. These are ordinary text matches; possible unstructured headings are labelled. Choose a result to use it. The document structure has not changed.`:`No recognised heading or text match for “${phrase}”.`,matches:this.matches,needsChoice:!!this.matches.length,ok:!!this.matches.length};
 }

 markMatches(){this.editor.view.dispatch(this.editor.state.tr.setMeta(matchKey,this.matches));}
 select(r:Range){const s=this.editor.state.selection;this.previous={from:s.from,to:s.to};this.editor.commands.setTextSelection({from:r.from,to:r.to});this.editor.commands.scrollIntoView();this.editor.view.focus();return r;}
 show(index:number){if(!this.matches.length)throw Error('There are no search results. Find some text first.');this.index=(index+this.matches.length)%this.matches.length;this.select(this.matches[this.index]);this.markMatches();return {message:`Match ${this.index+1} of ${this.matches.length}.${this.pendingChoice?` Say “Choose result ${this.index+1}” or tap this result to apply the waiting instruction.`:""}`,matches:this.matches};}
 find(phrase:string,all=false):Result {
 phrase=clean(phrase.replace(/^(?:the )?(?:words?|phrase)\s+/i,''));if(!phrase)throw Error('Please say which words to find.');const q=norm(phrase);this.matches=[];this.index=0;
 this.pendingChoice=null;this.unresolvedTarget=false;this.matches=this.scan(phrase);
 let approximate=false;
 if(!this.matches.length){const words=q.replace(/^(where i (?:discussed|mentioned|wrote about)|the paragraph (?:about|on))\s+/,'').match(/[a-z0-9]+/g)?.filter(w=>!['the','a','an','of','and','to','in','is','was','i','about','where','my'].includes(w))||[];
 const scores=this.blocks().map(b=>{const t=norm(b.label||'');return {b,score:words.length?words.filter(w=>t.includes(w)).length/words.length:0};}).filter(x=>x.score>=0.5).sort((a,b)=>b.score-a.score);this.matches=scores.slice(0,12).map(x=>x.b);approximate=true;}
 this.markMatches();if(!this.matches.length)throw Error(`No match for “${phrase}”. Try a shorter phrase.`);
 if(approximate){this.unresolvedTarget=true;return {message:`${this.matches.length} possible passage${this.matches.length===1?'':'s'} from keyword matching. Choose a result before editing.`,matches:this.matches,needsChoice:true};}
 this.show(0);return {message:all?`${this.matches.length} matches. Choose a result or say “Next result”.`:`${this.matches.length===1?'Found':`Match 1 of ${this.matches.length}:`} “${phrase}”.`,matches:this.matches,needsChoice:this.matches.length>1};
 }
 target(raw:string):Range {
 let t=clean(raw).toLowerCase().replace(/^(?:the|a)\s+/,'');const s=this.editor.state.selection;
 if(/^(it|this|that|selected text|selection|selected sentence|selected paragraph|this paragraph|that heading|current paragraph|heading|title|paragraph|selected heading)$/.test(t)||!t){
 if(this.unresolvedTarget)throw Error('Choose a search result first so I know which passage to format.');
 if(t==='title'){const h=this.blocks('heading')[0];if(h)return h;}
 if(!s.empty)return {from:s.from,to:s.to};
 if(/paragraph|heading/.test(t)){const a=this.blocks(t.includes('heading')?'heading':undefined).find(b=>s.from>=b.from&&s.from<=b.to);if(a)return a;}
 throw Error('Select or find the text first so I know what to change.');}
 const namedHeading=/^heading (.+)$/i.exec(t);if(namedHeading&&!/^(?:\d+|first|second|third|last)$/.test(namedHeading[1])){const found=this.findHeading(namedHeading[1]);if(found.needsChoice||!this.matches.length)throw Error(found.message);return this.matches[0];}
 let m=/^(?:(\w+|\d+(?:st|nd|rd|th)?) (paragraph|heading|sentence)|(paragraph|heading|sentence) (\w+|\d+))$/.exec(t);
 if(m){const kind=m[2]||m[3],n=number(m[1]||m[4]);let bs=this.blocks(kind==='heading'?'heading':kind==='paragraph'?'paragraph':undefined);if(kind==='sentence')bs=bs.flatMap(b=>{const text=this.editor.state.doc.textBetween(b.from,b.to,'');return Array.from(text.matchAll(/[^.!?]+(?:[.!?]+|$)/g)).map(x=>({from:b.from+x.index!,to:b.from+x.index!+x[0].length,label:x[0]}));});const b=bs[n===-1?bs.length-1:n-1];if(!b)throw Error(`That ${kind} does not exist.`);return b;}
 m=/^(?:paragraph|heading) beginning (?:with )?(.+)$/.exec(t);if(m){const list=this.blocks(t.startsWith('heading')?'heading':undefined).filter(b=>norm(b.label||'').startsWith(norm(m![1])));if(list.length!==1)throw Error(list.length?'Several passages begin that way. Use Find to choose one.':'No passage begins with those words.');return list[0];}
 const r=this.find(clean(raw));if(this.matches.length!==1||r.message.includes('possible'))throw Error('Several or approximate matches: choose the intended passage, then say “Make it bold” or another action.');return this.matches[0];
 }
 format(operation:string,target:string):Result {
 const r=this.target(target);this.select(r);const e=this.editor;let ok=false;
 if(operation==='bold')ok=e.commands.setBold();if(operation==='italic')ok=e.commands.setItalic();if(operation==='underline')ok=e.commands.setUnderline();if(operation==='strike')ok=e.commands.setStrike();if(operation==='highlight')ok=e.commands.setHighlight({color:'#fff0a3'});
 if(operation==='uppercase'){const text=e.state.doc.textBetween(r.from,r.to,'\n');if(!text)throw Error('No text selected.');ok=e.commands.insertContentAt(r,text.toUpperCase().replace(/&/g,'&amp;').replace(/</g,'&lt;'));e.commands.setTextSelection({from:r.from,to:r.from+text.length});}
 if(!ok)throw Error('That formatting could not be applied here.');return {message:`Applied ${operation}.`};
 }
 preset(name:string):Result {return {message:`Apply ${name} layout? Wording stays the same. Headings and paragraph styles will change throughout the document.`,pending:()=>{
 this.editor.view.dispatch(closeHistory(this.editor.state.tr));const tr=this.editor.state.tr;const legal=/legal|academic/.test(name),letter=/letter/.test(name);tr.doc.descendants((n,p)=>{if(n.type.name==='heading')tr.setNodeMarkup(p,undefined,{...n.attrs,textAlign:'left',lineSpacing:'1.2',spaceAfter:'12pt'});if(n.type.name==='paragraph')tr.setNodeMarkup(p,undefined,{...n.attrs,textAlign:legal?'justify':'left',lineSpacing:letter?'1.15':legal?'2':'1.5',spaceAfter:'8pt'});});tr.addMark(0,tr.doc.content.size,this.editor.schema.marks.textStyle.create({fontFamily:legal?'Times New Roman':'Arial',fontSize:'12pt'}));tr.doc.descendants((n,p)=>{if(n.type.name==='heading'&&n.content.size){tr.addMark(p+1,p+n.nodeSize-1,this.editor.schema.marks.textStyle.create({fontFamily:legal?'Times New Roman':'Arial',fontSize:(n.attrs.level===1?'20':n.attrs.level===2?'16':'14')+'pt'}));tr.addMark(p+1,p+n.nodeSize-1,this.editor.schema.marks.bold.create());}});this.editor.view.dispatch(tr);return {message:`${name} layout applied. Undo is available.`};}};}
 execute(input:string,confirmed=false):Result {
 try {const text=input.trim().replace(/[.!?]+$/,'');if(!text)throw Error('Enter or say an instruction.');this.lastText=input;
 if(/^find all occurrences of .+ and highlight (?:them|all matches)$/i.test(text)){const phrase=text.replace(/^find all occurrences of /i,'').replace(/ and highlight (?:them|all matches)$/i,'');const found=this.find(phrase,true);if(found.message.includes('possible'))return found;const ranges=[...this.matches];return {message:`Highlight all ${ranges.length} exact matches?`,pending:()=>{const tr=this.editor.state.tr;for(const r of ranges)tr.addMark(r.from,r.to,this.editor.schema.marks.highlight.create({color:'#fff0a3'}));this.editor.view.dispatch(closeHistory(tr));return {message:`Highlighted ${ranges.length} matches.`};}};}
 // Split only at action boundaries; do not split ordinary target wording.
 const parts=text.split(/(?:,\s*|\s+and\s+|\s+then\s+)(?=(?:make|bold|underline|italicise|italicize|highlight|centre|center|align|insert|go to|select)\b)/i);
 if(parts.length>1){
 const before=this.editor.state;const first=this.execute(parts[0],confirmed);if(first.ok===false)return first;
 if(first.needsChoice||(first.matches&&first.matches.length>1)){
 const actions=parts.slice(1);if(!this.canDefer(actions))return {...first,message:first.message+' Run the remaining instruction separately after choosing a result.'};
 this.unresolvedTarget=true;this.pendingChoice={actions,doc:this.editor.state.doc};return {...first,needsChoice:true,message:first.message+` Waiting to ${actions.join(' and ')}. Tap a result or say “Choose result two” to complete it.`};
 }
 if(first.pending)return {message:'Run this confirmation-requiring action separately.',ok:false};
 const rest=this.applyActions(parts.slice(1));if(rest.ok===false){this.editor.view.updateState(before);return rest;}return {...rest,message:first.message+' '+rest.message};
 }

 const t=text.toLowerCase();const e=this.editor;let m:RegExpExecArray|null;
 if(m=/^(?:choose|select|use) (?:the )?(?:result (\w+)|(\w+) result)$/i.exec(text))return this.choose((m[1]||m[2]).toLowerCase()==='last'?this.matches.length-1:number((m[1]||m[2]).toLowerCase())-1);
 if(/^(?:choose|select|use) (?:this|that|the selected) result$/i.test(text))return this.choose(this.index);
 if(/^(?:choose|select|use) (?:the )?heading$/i.test(text)){const hs=this.matches.map((r,i)=>({r,i})).filter(x=>x.r.kind==='heading');return hs.length===1?this.choose(hs[0].i):{message:'Choose the heading by its result number.',matches:this.matches,needsChoice:true};}
 if(/^cancel (?:the )?(?:pending )?(?:instruction|command)$/i.test(text)){this.pendingChoice=null;return {message:'Pending instruction cancelled. No document change was made.'};}
 if(/^(undo|undo that|undo the last change)$/.test(t))return {message:e.commands.undo()?'Last change undone.':'Nothing to undo.'};
 if(/^(redo|redo that)$/.test(t))return {message:e.commands.redo()?'Change restored.':'Nothing to redo.'};
 if(/^(next|previous) result$/.test(t))return this.show(this.index+(t.startsWith('next')?1:-1));
 if(t==='show all matches')return {message:`${this.matches.length} matches.`,matches:this.matches};
 if(t==='return to where i was'){if(!this.previous)throw Error('There is no previous location.');this.select(this.previous);return {message:'Returned to your previous location.'};}
 if(/^(go to (?:the )?|)(beginning|end|start)$/.test(t)){const end=t.endsWith('end');this.select({from:end?e.state.doc.content.size-1:1,to:end?e.state.doc.content.size-1:1});return {message:end?'At the end.':'At the beginning.'};}
 if(m=/^go to (?:the )?(next|previous) (heading|paragraph)$/.exec(t)){const a=this.blocks(m[2]==='heading'?'heading':'paragraph'),pos=e.state.selection.from;const r=m[1]==='next'?a.find(b=>b.from>pos):a.filter(b=>b.from<pos).at(-1);if(!r)throw Error(`No ${m[1]} ${m[2]}.`);this.select(r);return {message:`Selected ${m[1]} ${m[2]}.`};}
 if(m=/^(?:find|go to|select) (?:the )?(paragraph|heading) beginning (?:with )?(.+)$/i.exec(text)){this.select(this.target(`${m[1]} beginning with ${m[2]}`));return {message:`Selected matching ${m[1]}.`};}
 if(m=/^(?:find|go to|select) (?:the )?heading (.+)$/i.exec(text))return this.findHeading(m[1]);
 if(m=/^(find|go to) (?:all occurrences of )?(.+)$/i.exec(text))return this.find(m[2],/all occurrences/i.test(text));
 if(m=/^select (.+)$/i.exec(text)){this.select(this.target(m[1]));return {message:'Passage selected.'};}
 if(m=/^(?:apply |format (?:this|the document) as (?:a )?)(professional(?: document| formatting)?|business letter|academic(?: document)?|formal report(?: layout)?|legal(?: document)?)$/i.exec(text))return this.preset(m[1]);
 if(/^(make all (?:the )?headings consistent|standardise (?:the )?paragraph spacing|correct (?:the )?numbering|remove unnecessary blank lines|make all (?:the )?headings bold|find all occurrences of .+ and highlight them)$/.test(t)){
 const apply=():Result=>{const tr=e.state.tr;const remove:Range[]=[];tr.doc.descendants((n,p)=>{if(t.includes('headings')&&n.type.name==='heading'){if(t.endsWith('bold'))tr.addMark(p+1,p+n.nodeSize-1,e.schema.marks.bold.create());else tr.setNodeMarkup(p,undefined,{...n.attrs,textAlign:'left',lineSpacing:'1.2',spaceAfter:'12pt'});}if(t.includes('spacing')&&n.type.name==='paragraph')tr.setNodeMarkup(p,undefined,{...n.attrs,lineSpacing:'1.5',spaceAfter:'8pt'});if(t.includes('blank lines')&&n.type.name==='paragraph'&&!n.textContent&&p>0)remove.push({from:p,to:p+n.nodeSize});if(t.includes('numbering')&&n.type.name==='orderedList')tr.setNodeMarkup(p,undefined,{...n.attrs,start:1});});for(const r of remove.reverse())tr.delete(r.from,r.to);e.view.dispatch(closeHistory(tr));return {message:'Document-wide formatting applied. Undo is available.'};};return confirmed?apply():{message:`${text}? This affects the whole document.`,pending:apply};}
 if(m=/^(?:replace all(?: occurrences of)?|replace) (.+?) with (.+)$/i.exec(text)){const old=clean(m[1]),replacement=clean(m[2]),all=/^replace all/i.test(text);const selected={from:e.state.selection.from,to:e.state.selection.to};this.find(old,true);if(this.matches.some(r=>norm(e.state.doc.textBetween(r.from,r.to,''))!==norm(old)))throw Error('No exact replacement target. Approximate results are for navigation only.');const ranges=all?[...this.matches]:[this.matches[this.index]];if(!all&&this.matches.length>1){const r=this.matches.find(r=>r.from===selected.from&&r.to===selected.to);if(r)ranges[0]=r;}
 const apply=()=>{const tr=e.state.tr;for(const r of [...ranges].reverse()){const marks=tr.doc.resolve(r.from).marks();tr.replaceWith(r.from,r.to,e.schema.text(replacement,marks));}e.view.dispatch(closeHistory(tr));this.matches=[];return {message:`Replaced ${ranges.length} occurrence${ranges.length===1?'':'s'}. Undo is available.`};};return all||this.matches.length>1?{message:`Replace ${all?'all '+ranges.length:'one of '+this.matches.length} occurrence(s) of “${old}” with “${replacement}”?`,pending:apply}:apply();}
 if(m=/^move (?:the )?(?:paragraph (\w+)|(\w+) paragraph) (above|below) (?:the )?(.+)$/i.exec(text)){
 const source=this.target('paragraph '+(m[1]||m[2]));let dest:Range;if(m[4].toLowerCase()==='heading'){const hs=this.blocks('heading');const cursor=e.state.selection.from;const h=hs.find(h=>cursor>=h.from&&cursor<=h.to)||(hs.length===1?hs[0]:null);if(!h)throw Error('Find the intended heading first, then repeat the move command.');dest=h;}else dest=this.target(m[4]);if(source.from===dest.from)throw Error('Those are the same paragraph.');const apply=()=>{const start=source.from-1,end=source.to+1;const node=e.state.doc.nodeAt(start);if(!node)throw Error('Paragraph not found.');const tr=e.state.tr;tr.delete(start,end);const pos=m![3]==='above'?dest.from-1:dest.to+1;tr.insert(tr.mapping.map(pos),node);e.view.dispatch(closeHistory(tr));return {message:'Paragraph moved. Undo is available.'};};return {message:'Move this paragraph? Document order will change.',pending:apply};}
 if(m=/^delete (.+)$/i.exec(text)){const r=this.target(m[1]);return {message:`Delete “${e.state.doc.textBetween(r.from,r.to,' ').slice(0,100)}”?`,pending:()=>{e.commands.deleteRange(r);return {message:'Text deleted. Undo is available.'};}};}
 if(/^copy (?:the )?selected text$/i.test(text)){const s=e.state.selection;if(s.empty)throw Error('Select text to copy.');this.clipboard=e.state.doc.slice(s.from,s.to);return {message:'Selection copied inside Josefa. Use Paste or a paste command.'};}
 if(m=/^paste(?: after (?:the )?(.+))?$/i.exec(text)){if(!this.clipboard)throw Error('Copy text inside Josefa first, or use your device’s Paste.');let pos=e.state.selection.to;if(m[1])pos=this.target(m[1]).to+1;const tr=e.state.tr.replaceRange(pos,pos,this.clipboard);e.view.dispatch(tr);return {message:'Copied content pasted.'};}
 if(/^insert (?:a )?new paragraph$/i.test(text)){e.commands.insertContent({type:'paragraph'});return {message:'Paragraph inserted.'};}
 if(m=/^insert (?:the |a )?heading (.+)$/i.exec(text)){e.commands.insertContent({type:'heading',attrs:{level:2},content:[{type:'text',text:m[1]}]});return {message:'Heading inserted.'};}
 if(m=/^insert (?:a )?page break(?: before (.+))?$/i.exec(text)){if(m[1]){const r=this.target(m[1]);e.commands.insertContentAt(Math.max(0,r.from-1),{type:'pageBreak'});}else e.commands.insertContent({type:'pageBreak'});return {message:'Page break inserted.'};}
 if(m=/^(?:remove|clear) (?:the )?(bold|underline|italics?|highlight)(?: from (.+))?$/i.exec(text)){const r=this.target(m[2]||'it');this.select(r);const cmd:any={bold:'unsetBold',underline:'unsetUnderline',italic:'unsetItalic',italics:'unsetItalic',highlight:'unsetHighlight'}; (e.commands as any)[cmd[m[1].toLowerCase()]]();return {message:'Formatting removed.'};}
 if(m=/^(?:change|set|make) (.+?) (?:to )?font size (.+)$/i.exec(text)){const r=this.target(m[1]);const n=number(m[2].toLowerCase());if(!n||n<6||n>96)throw Error('Choose a font size from 6 to 96.');this.select(r);e.commands.setFontSize(n+'pt');return {message:`Font size set to ${n}.`};}
 if(m=/^(?:centre|center|align) (.+?)(?: (?:to (?:the )?)?(left|right|centre|center|justified|justify))?$/i.exec(text)){const r=this.target(m[1]);this.select(r);const align=m[2]||'center';e.commands.setTextAlign(align==='centre'?'center':align==='justified'?'justify':align);return {message:'Paragraph alignment updated.'};}
 if(m=/^(?:apply|set) (double|single|1\.5) spacing$/i.exec(text)){const r=this.target('this paragraph');this.select(r);e.commands.updateAttributes('paragraph',{lineSpacing:m[1]==='double'?'2':m[1]==='single'?'1':'1.5'});e.commands.updateAttributes('heading',{lineSpacing:m[1]==='double'?'2':m[1]==='single'?'1':'1.5'});return {message:'Line spacing updated.'};}
 if(m=/^(indent|outdent) (.+)$/i.exec(text)){const r=this.target(m[2]);this.select(r);const tr=e.state.tr;tr.doc.nodesBetween(r.from,r.to,(n,p)=>{if(n.isTextblock)tr.setNodeMarkup(p,undefined,{...n.attrs,indent:Math.max(0,Math.min(8,(n.attrs.indent||0)+(m![1]==='indent'?1:-1)))});});e.view.dispatch(tr);return {message:'Paragraph indentation updated.'};}
 if(m=/^(?:make|set) (.+?) (bold|italic|italics|underlined|underline|uppercase|highlighted)$/i.exec(text))return this.format(({italics:'italic',underlined:'underline',highlighted:'highlight'} as any)[m[2].toLowerCase()]||m[2].toLowerCase(),m[1]);
 if(m=/^(bold|italicise|italicize|underline|highlight|strikethrough) (.+)$/i.exec(text))return this.format(({italicise:'italic',italicize:'italic',strikethrough:'strike'} as any)[m[1].toLowerCase()]||m[1].toLowerCase(),m[2]);
 throw Error('I don’t recognise that instruction. Try “Find witness statement”, “Make it bold” or open the command guide.');
 }catch(err){return {message:err instanceof Error?err.message:String(err),ok:false};}
 }
}
