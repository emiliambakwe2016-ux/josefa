import {Document,Packer,Paragraph,TextRun} from 'docx';
import JSZip from 'jszip';
export async function headingFixture(variant='structured'):Promise<ArrayBuffer>{
 const styles:any={paragraphStyles:[
 {id:'ClosingBase',name:'Closing section',paragraph:{outlineLevel:1},run:{size:24}},
 {id:'LocalClosing',name:'Section ending',basedOn:'ClosingBase'},
 {id:'NamedIntro',name:'Heading 1',run:{size:28}},
 {id:'AliasHeading',name:'Custom title',aliases:['Heading 3']},
 ]};
 const p=(text:string,style?:string,bold=false)=>new Paragraph({style,children:[new TextRun({text,bold})]});
 const content:any[]=[p('Introduction','NamedIntro'),p('This introduction explains how the conclusion will be reached. '+ 'The claimant seeks payment on the evidence presented. '.repeat(20))];
 for(let i=0;i<6;i++)content.push(p(`Evidence section ${i+1}. The conclusion must follow the facts. `+'The parties reviewed the agreement and the outstanding balance carefully. '.repeat(18)));
 content.push(p('Conclusion',variant==='visual'?undefined:'LocalClosing',variant==='visual'));
 content.push(p('The conclusion is that payment remains due. No unrelated wording should change.'));
 if(variant==='duplicate'){content.push(p('A further section distinguishes the findings.'));content.push(p('Conclusion','LocalClosing'));content.push(p('This final conclusion concerns another section.'));}
 if(variant==='direct')content.push(new Paragraph({outlineLevel:2,children:[new TextRun('Direct outline heading')]}));
 if(variant==='alias')content.push(p('Alias section','AliasHeading'));
 const bytes=await Packer.toBuffer(new Document({styles,sections:[{children:content}]}));
 // Real DOCX fixture: custom IDs, display names and inherited outline metadata, not editor demo state.
 if(variant==='alias'){const zip=await JSZip.loadAsync(bytes);const xml=await zip.file('word/styles.xml')!.async('string');zip.file('word/styles.xml',xml.replace('<w:name w:val="Custom title"/>','<w:name w:val="Custom title"/><w:aliases w:val="Heading 3"/>'));return zip.generateAsync({type:'arraybuffer'});}
 if(variant==='body-override'){const zip=await JSZip.loadAsync(bytes);let xml=await zip.file('word/document.xml')!.async('string');xml=xml.replace('<w:pStyle w:val="LocalClosing"/>','<w:pStyle w:val="LocalClosing"/><w:outlineLvl w:val="9"/>');zip.file('word/document.xml',xml);return zip.generateAsync({type:'arraybuffer'});}
 return bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength) as ArrayBuffer;
}
