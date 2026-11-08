// Controls the links displayed on traveler guest cards, independently of saved content.
export type GuestCardFeatures={safe:boolean;mealChoices:boolean};
export const DEFAULT_GUEST_CARD_FEATURES:GuestCardFeatures={safe:true,mealChoices:true};
export function guestCardFeatures(value?:Partial<GuestCardFeatures>|null):GuestCardFeatures{
 return {safe:typeof value?.safe==='boolean'?value.safe:DEFAULT_GUEST_CARD_FEATURES.safe,mealChoices:typeof value?.mealChoices==='boolean'?value.mealChoices:DEFAULT_GUEST_CARD_FEATURES.mealChoices};
}
