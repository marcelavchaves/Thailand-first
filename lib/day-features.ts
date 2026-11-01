export const featureKeys=['announcement','memories','trivia','language'] as const;
export type DayFeature=typeof featureKeys[number];
export type DayFeatures=Record<DayFeature,boolean>;
export const hiddenDayFeatures=():DayFeatures=>({announcement:false,memories:false,trivia:false,language:false});
export function cleanDayFeatures(value:unknown):DayFeatures{
 const v=value&&typeof value==='object'?value as Record<string,unknown>:{};
 return Object.fromEntries(featureKeys.map(key=>[key,v[key]===true])) as DayFeatures;
}
