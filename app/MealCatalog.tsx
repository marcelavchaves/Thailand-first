'use client';
import {createContext,useContext,useEffect,useState,type ReactNode} from 'react';
import {menus as defaults,type MealMenu} from '../lib/meal-choices';
const Context=createContext({menus:defaults,refresh:async()=>{}});
export function MealCatalogProvider({children}:{children:ReactNode}){
 const [menus,setMenus]=useState(defaults);
 async function refresh(){const r=await fetch('/api/meal-choices?action=catalog',{cache:'no-store'});if(r.ok){const b=await r.json();if(Array.isArray(b.menus))setMenus(b.menus as MealMenu[]);}}
 useEffect(()=>{void refresh().catch(()=>{});const update=()=>void refresh().catch(()=>{});window.addEventListener('focus',update);return()=>window.removeEventListener('focus',update);},[]);
 return <Context.Provider value={{menus,refresh}}>{children}</Context.Provider>;
}
export const useMealCatalog=()=>useContext(Context);
