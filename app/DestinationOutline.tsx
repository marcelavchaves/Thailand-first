/** Quiet destination line art; decorative and excluded from the reading order. */
export default function DestinationOutline({region}:{region:string}) {
 const singapore=region==='Singapore',java=/Java|Yogyakarta/.test(region),islands=/Flores|Komodo/.test(region);
 return <svg className="home-destination-outline" viewBox="0 0 420 140" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
 <path d="M10 124H410M30 132H380"/>
 {singapore?<><path d="M92 120V40h27v80m22 0V40h27v80m22 0V40h27v80M75 35q78-22 158-4l-14 10H90Z"/>{[100,110,149,159,198,208].map(x=><path key={x} d={`M${x} 46v69`}/>)}<path d="M260 122V80m-20-19 20 19 23-22m-52 2q29 22 62-2m-52-7q20 10 40 0M330 122V68m-27-23 27 23 28-28m-65 3q36 21 70 0"/><path d="M297 44q32 18 67-3M310 34q22 9 43-2M20 122V99h24v23m4 0V89h21v33"/></>:java?<><path d="m20 122 66-67 64 67m-28 0 61-92 72 92M155 121v-17h102v17m-85-18V89h67v14m-55-15V72h42v16m-31-17V56h20v15m-10-15V39m-64 80v-20m133 20V99M300 122l23-47 22 47m-34-24h25m-19-16h13"/></>:islands?<><path d="m10 122 63-46 39 23 60-73 78 88 48-47 51 39 29-21 32 37M132 79l40-53 25 49m-12 56h116m-252 8h94M300 45l10-4 11 4m13-18 8-4 9 4"/><path d="M242 119v-38l28 32h-28m0 0h-22l9 8h38l9-8h-34"/></>:<><path d="m18 121 63-49 52 48m-22 0 69-83 75 83M270 122V98m-31 0h61l-30-17Zm4-17h52l-26-16Zm5-16h42l-21-15Zm7-15h28l-14-14ZM346 121q-5-48 8-73m-1 2q-28-14-42 2m43-3q23-19 46-1m-46 1q28-3 40 16m-41-16q-20-4-28 14"/></>}
 </svg>;
}
