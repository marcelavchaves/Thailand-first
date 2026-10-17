"use client";
import {useState} from "react";
export default function PdfDownload({url,label="Download PDF",disabled=false}:{url:string;label?:string;disabled?:boolean}){
 const [busy,setBusy]=useState(false),[error,setError]=useState("");
 async function download(){setBusy(true);setError("");try{const response=await fetch(url);if(!response.ok)throw new Error("Please try again in a moment.");const blob=await response.blob();if(!blob.type.includes("application/pdf"))throw new Error("The PDF could not be created. Please try again.");const address=URL.createObjectURL(blob),a=document.createElement("a");a.href=address;a.download=response.headers.get("Content-Disposition")?.match(/filename="([^"]+)"/)?.[1]||"KD-101-Journey.pdf";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(address),60000);}catch(e){setError(e instanceof Error?e.message:"Unable to download. Please try again.");}finally{setBusy(false);}}
 return <div className="pdf-download-control"><button className="pdf-export-button" disabled={busy||disabled} onClick={download}>{busy?"Preparing your PDF…":label}</button>{busy&&<p role="status">This may take a moment. Please keep this page open.</p>}{error&&<p role="alert">{error}</p>}</div>;
}
