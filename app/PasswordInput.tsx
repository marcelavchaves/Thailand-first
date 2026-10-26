"use client";
import {useState, type InputHTMLAttributes} from 'react';
import './password-input.css';

export default function PasswordInput(props: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>) {
 const [visible, setVisible] = useState(false);
 return <span className="password-input"><input {...props} type={visible ? 'text' : 'password'}/><button className="password-visibility" type="button" aria-label={visible ? 'Hide password' : 'Show password'} aria-pressed={visible} disabled={props.disabled} onMouseDown={e=>e.preventDefault()} onClick={()=>setVisible(value=>!value)}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>{visible&&<path d="m3 3 18 18"/>}</svg></button></span>;
}
