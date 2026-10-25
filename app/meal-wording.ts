/** Keep exclusions explicit while shortening itinerary meal wording. */
export function mealWording(text:string){
 return text.replace(/\bnot included\b/gi,'on your own')
  .replace(/\b(?:is|are) included\b/gi,match=>match.toLowerCase().startsWith('are')?'are':'is')
  .replace(/\bincluded\s+/gi,'')
  .replace(/\s+included\b/gi,'');
}
