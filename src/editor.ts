import { Editor, Extension, Node } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { TextStyleKit } from '@tiptap/extension-text-style';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import { TableKit } from '@tiptap/extension-table';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
export const matchKey = new PluginKey('josefaMatches');
export const Layout = Extension.create({
 name:'layout',addGlobalAttributes(){return [{types:['paragraph','heading'],attributes:{
 indent:{default:0,parseHTML:e=>parseFloat(e.style.marginLeft)/24||0,renderHTML:a=>a.indent?{style:`margin-left:${a.indent*24}px`}:{}},
 lineSpacing:{default:null,parseHTML:e=>e.style.lineHeight||null,renderHTML:a=>a.lineSpacing?{style:`line-height:${a.lineSpacing}`} :{}},
 spaceAfter:{default:null,parseHTML:e=>e.style.marginBottom||null,renderHTML:a=>a.spaceAfter?{style:`margin-bottom:${a.spaceAfter}`} :{}}
 }}]},addProseMirrorPlugins(){return [new Plugin({key:matchKey,state:{init:()=>[],apply(tr,prev){const m=tr.getMeta(matchKey); if(m)return m;return tr.docChanged?[]:prev;}},props:{decorations(state){return DecorationSet.create(state.doc,(matchKey.getState(state)||[]).filter((r:any)=>r.to<=state.doc.content.size).map((r:any)=>Decoration.inline(r.from,r.to,{class:'search-match'})));}}})]}
});
export const PageBreak = Node.create({name:'pageBreak',group:'block',atom:true,parseHTML:()=>[{tag:'div[data-page-break]'}],renderHTML:()=>['div',{'data-page-break':'true',class:'page-break'}]});
export function makeEditor(element:HTMLElement,content:any='<p></p>',update?:()=>void){return new Editor({element,extensions:[StarterKit.configure({link:{openOnClick:false,protocols:['https','http','mailto','tel'],HTMLAttributes:{rel:'noopener noreferrer'}}}),TextStyleKit,TextAlign.configure({types:['heading','paragraph']}),Highlight.configure({multicolor:true}),TableKit.configure({table:{resizable:false}}),Layout,PageBreak],content,editorProps:{attributes:{'aria-label':'Document editor',role:'textbox','aria-multiline':'true',spellcheck:'true'}},onUpdate:update||(()=>{})});}
