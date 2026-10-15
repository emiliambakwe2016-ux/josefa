import { openDB } from 'idb';
export interface SavedDoc {id:string;title:string;content:any;modified:number;original?:ArrayBuffer;originalName?:string;}
const db=()=>openDB('josefa',1,{upgrade(d){d.createObjectStore('documents',{keyPath:'id'});}});
export async function saveDoc(d:SavedDoc){return (await db()).put('documents',structuredClone(d));}
export async function listDocs():Promise<SavedDoc[]>{return (await (await db()).getAll('documents')).sort((a,b)=>b.modified-a.modified);}
export async function deleteDoc(id:string){return (await db()).delete('documents',id);}
