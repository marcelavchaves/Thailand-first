export default function ClassicSafeIcon(){return <svg className="classic-safe-icon" viewBox="0 0 100 70" aria-hidden="true" focusable="false">
 <rect x="8" y="57" width="13" height="9" rx="2" fill="var(--brand-green, #315C4F)"/><rect x="79" y="57" width="13" height="9" rx="2" fill="var(--brand-green, #315C4F)"/>
 <rect x="3" y="4" width="94" height="58" rx="8" fill="var(--brand-green, #315C4F)"/>
 <rect x="10" y="11" width="80" height="44" rx="3" fill="none" stroke="#C9A962" strokeWidth="2.5"/>
 <circle cx="24" cy="34" r="7" fill="#C9A962"/><circle cx="24" cy="34" r="3" fill="var(--brand-green, #315C4F)"/><rect x="23" y="31" width="25" height="6" rx="3" fill="#C9A962"/>
 <g fill="#C9A962">{[23,32,41].flatMap(y=>[57,66,75].map(x=><rect key={`${x}-${y}`} x={x} y={y} width="6" height="6" rx="1"/>))}<rect x="87" y="17" width="4" height="10" rx="1"/><rect x="87" y="40" width="4" height="10" rx="1"/></g>
 </svg>;}
