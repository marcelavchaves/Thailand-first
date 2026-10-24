import data from './language-lessons.json';
export function languageFor(region:string){
 const location=data.locations[region as keyof typeof data.locations]??data.locations.Hanoi;
 const language=data.languages[location.language as keyof typeof data.languages];
 return {...language,phrases:[...language.phrases,...location.phrases]};
}
