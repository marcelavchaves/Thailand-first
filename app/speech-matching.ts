// Keep accents and tone marks: this checks recognized words, not pronunciation quality.
export function normalizeSpeech(text:string){
 return text.normalize('NFC').toLocaleLowerCase().replace(/[\p{P}\p{Z}\p{Cf}\s]/gu,'');
}
export function understoodPhrase(expected:string,heard:string,language:string){
 const target=normalizeSpeech(expected),actual=normalizeSpeech(heard);
 if(!target||!actual)return false;
 if(target===actual)return true;
 return language.startsWith('th')&&['ครับ','ค่ะ','คะ'].some(ending=>actual===target+ending);
}
