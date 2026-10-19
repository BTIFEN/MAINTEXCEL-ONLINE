import React, { useState } from 'react';
import { 
  Bell, 
  ChevronDown, 
  MapPin, 
  Calendar, 
  Workflow,
  SlidersHorizontal,
  Factory,
  LogOut,
  Shield
} from 'lucide-react';

interface HeaderProps {
  userName?: string;
  roleLabel?: string;
  isAdmin?: boolean;
  onAdmin?: () => void;
  onLogout?: () => void;
}

const initialsOf = (name: string) =>
  name
    .replace(/@.*/, '')
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || '?';

export function MaintexHeaderLogo() {
  return (
    <div className="flex items-center gap-2.5">
      {/* High-fidelity Logo matching PAGE DE GARDE.png: Navy blue gear with a trend chart overlaid */}
      <svg className="w-11 h-11 shrink-0" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Navy Cogwheel / Gear Outline */}
        <path d="M50 20 C42 20, 39 12, 31 15 C24 18, 26 27, 20 31 C13 35, 7 30, 5 38 C3 46, 11 49, 11 57 C11 65, 3 68, 5 76 C7 84, 13 79, 20 83 C26 87, 24 96, 31 99 C39 102, 42 94, 50 94 C58 94, 61 102, 69 99 C76 96, 74 87, 80 83 C86 79, 93 84, 95 76 C97 68, 89 65, 89 57 C89 49, 97 46, 95 38 C93 30, 86 35, 80 31 C74 27, 76 18, 69 15 C61 12, 58 20, 50 20 Z" 
              fill="none" stroke="#0B3C8F" strokeWidth="6" strokeLinejoin="round" />
        
        {/* Inner Gear Core cutout */}
        <circle cx="50" cy="57" r="22" fill="#FFFFFF" stroke="#0B3C8F" strokeWidth="4" />
        
        {/* Upward blue trend line with three nodes */}
        <path d="M35 68 L48 50 L65 42" stroke="#1C64F2" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="35" cy="68" r="6" fill="#0B3C8F" stroke="#FFFFFF" strokeWidth="2.5" />
        <circle cx="48" cy="50" r="6" fill="#1C64F2" stroke="#FFFFFF" strokeWidth="2.5" />
        <circle cx="65" cy="42" r="7.5" fill="#1C64F2" stroke="#FFFFFF" strokeWidth="2.5" />
      </svg>
      
      {/* Brand Text */}
      <div className="flex flex-col text-left">
        <div className="flex items-baseline font-extrabold tracking-tight leading-none text-2xl">
          <span className="text-[#0B3C8F]">MAIN</span>
          <span className="text-[#1C64F2]">TeX</span>
        </div>
        <span className="text-[9.5px] text-slate-500 font-extrabold tracking-wider uppercase leading-none mt-1">
          Maintenance Excellence
        </span>
      </div>
    </div>
  );
}

export default function Header({ userName = '', roleLabel = '', isAdmin = false, onAdmin, onLogout }: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="h-18 bg-white border-b border-slate-100 px-8 flex items-center justify-between sticky top-0 z-50 shadow-sm">
      
      {/* Left: Beautiful MAINTeX Logo block */}
      <MaintexHeaderLogo />

      {/* Center: Four rounded, clean selectors in white cards exactly matching image */}
      <div className="hidden xl:flex items-center gap-3">
        
        {/* Usine */}
        <div className="bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-4 py-2 flex items-center gap-3 cursor-pointer shadow-xs transition-all w-44">
          <div className="w-8 h-8 rounded-lg bg-blue-50/80 flex items-center justify-center text-blue-600 shrink-0 border border-blue-100/50">
            <Factory className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider leading-none">Usine</p>
            <p className="text-xs font-bold text-slate-700 leading-none mt-1.5 truncate">Châtelet</p>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        </div>

        {/* Unité */}
        <div className="bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-4 py-2 flex items-center gap-3 cursor-pointer shadow-xs transition-all w-44">
          <div className="w-8 h-8 rounded-lg bg-emerald-50/80 flex items-center justify-center text-emerald-600 shrink-0 border border-emerald-100/50">
            <Workflow className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider leading-none">Unité</p>
            <p className="text-xs font-bold text-slate-700 leading-none mt-1.5 truncate">Aciérie</p>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        </div>

        {/* Zone */}
        <div className="bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-4 py-2 flex items-center gap-3 cursor-pointer shadow-xs transition-all w-44">
          <div className="w-8 h-8 rounded-lg bg-cyan-50/80 flex items-center justify-center text-cyan-600 shrink-0 border border-cyan-100/50">
            <MapPin className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider leading-none">Zone</p>
            <p className="text-xs font-bold text-slate-700 leading-none mt-1.5 truncate">Zone 1</p>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        </div>

        {/* Période */}
        <div className="bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-4 py-2 flex items-center gap-3 cursor-pointer shadow-xs transition-all w-52">
          <div className="w-8 h-8 rounded-lg bg-amber-50/80 flex items-center justify-center text-amber-600 shrink-0 border border-amber-100/50">
            <Calendar className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider leading-none">Période</p>
            <p className="text-xs font-bold text-slate-700 leading-none mt-1.5 truncate">Jan 2026 - Déc 2026</p>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        </div>

      </div>

      {/* Right: Notifications alert bell & User Profile exactly matching image */}
      <div className="flex items-center gap-4.5">
        
        {/* Notification Bell with red rounded badge showing 3 */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2.5 rounded-full bg-slate-100/80 text-slate-500 hover:text-slate-800 hover:bg-slate-200/80 transition-colors relative"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white font-extrabold text-[10px] rounded-full flex items-center justify-center font-mono-numbers shadow-sm border border-white">
              3
            </span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-12 w-80 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden py-1 animate-in fade-in duration-150">
              <div className="px-4 py-2 bg-slate-50 border-b border-slate-150 flex items-center justify-between">
                <span className="font-bold text-xs text-slate-700">Notifications</span>
                <span className="text-[9px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold font-mono">3 NOUVELLES</span>
              </div>
              <div className="divide-y divide-slate-100 text-left">
                <div className="p-3 text-xs">
                  <p className="font-semibold text-slate-800">Standard 5S approuvé</p>
                  <span className="text-[10px] text-slate-400 font-mono">Il y a 5m</span>
                </div>
                <div className="p-3 text-xs">
                  <p className="font-semibold text-slate-800">Incident LOTO résolu</p>
                  <span className="text-[10px] text-slate-400 font-mono">Il y a 1h</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {isAdmin && onAdmin && (
          <button
            type="button"
            onClick={onAdmin}
            className="hidden md:inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50/60 px-3 py-2 text-xs font-bold text-[#0B3C8F] hover:bg-blue-100/70 transition-colors"
          >
            <Shield className="w-4 h-4" />
            Administration
          </button>
        )}

        {/* Personne connectée */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 rounded-xl px-1.5 py-1 hover:bg-slate-50"
            aria-haspopup="menu"
            aria-expanded={showUserMenu}
          >
            <div className="w-10 h-10 rounded-full bg-[#0B3C8F] text-white font-extrabold text-sm flex items-center justify-center shadow-inner border border-[#0B3C8F]/20">
              {initialsOf(userName)}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-slate-800 leading-none">{userName}</p>
              <p className="text-[10px] text-slate-400 font-semibold mt-1 leading-none">{roleLabel}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
          </button>

          {showUserMenu && (
            <div role="menu" className="absolute right-0 top-12 w-56 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden py-1">
              {isAdmin && onAdmin && (
                <button
                  role="menuitem"
                  type="button"
                  onClick={() => {
                    setShowUserMenu(false);
                    onAdmin();
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <Shield className="w-4 h-4" /> Administration
                </button>
              )}
              {onLogout && (
                <button
                  role="menuitem"
                  type="button"
                  onClick={() => {
                    setShowUserMenu(false);
                    onLogout();
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <LogOut className="w-4 h-4" /> Déconnexion
                </button>
              )}
            </div>
          )}
        </div>

      </div>

    </header>
  );
}
