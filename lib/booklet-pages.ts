export const BOOKLET_MAX_BYTES=5*1024*1024;
export const BOOKLET_CHUNK_BYTES=2*1024*1024;
export const bookletLayouts=['auto','single','spread','spread-reversed'] as const;
export type BookletLayout=typeof bookletLayouts[number];
export type BookletPage={pdfPage:number;side:'full'|'left'|'right'};
export function bookletPages(dimensions:{width:number;height:number}[],layout:BookletLayout='auto'):BookletPage[]{
 return dimensions.flatMap((size,index)=>{
  const split=layout==='spread'||layout==='spread-reversed'||layout==='auto'&&size.width/size.height>=1.2;
  const sides:BookletPage['side'][]=split?(layout==='spread-reversed'?['right','left']:['left','right']):['full'];
  return sides.map(side=>({pdfPage:index+1,side}));
 });
}
