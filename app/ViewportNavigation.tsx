"use client";
import {useEffect,useState,type ReactNode} from 'react';
import {createPortal} from 'react-dom';
import './viewport-navigation.css';
// Keep viewport-fixed navigation outside page containers and their compositing contexts.
export default function ViewportNavigation({children}:{children:ReactNode}){
 const [mounted,setMounted]=useState(false);
 useEffect(()=>setMounted(true),[]);
 const navigation=<nav className="bottom-nav" aria-label="Main navigation">{children}</nav>;
 return mounted?createPortal(navigation,document.body):navigation;
}
