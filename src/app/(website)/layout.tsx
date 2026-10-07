import {readFile} from 'node:fs/promises';
import path from 'node:path';
export default async function Layout({children}:{children:React.ReactNode}){
 const [head,classes]=await Promise.all(['style-head.html','body-class.txt'].map(name=>readFile(path.join(process.cwd(),'data',name),'utf8')));
 return <html lang="en-US"><head dangerouslySetInnerHTML={{__html:head+'<link rel="stylesheet" href="/site.css">'}}/><body id="top" className={classes.trim()}>{children}</body></html>;
}
