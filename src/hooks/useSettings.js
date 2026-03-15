import { useState, useEffect } from 'react';

const STORAGE_KEY = 'crm_settings';
const SETTINGS_EVENT = 'crm_settings_change';

export const DEFAULT_SETTINGS = {
  kanbanLabels: {
    'פניות חדשות': 'חדשים',
    'בטיפול': 'בטיפול',
    'סגור': 'סגורים',
  },
  eventTypes: ['יום גיבוש', 'נופש חברה', 'הרמת כוסית', 'כנס', 'אחר'],
  priorities: [
    { id: 'חם',   label: 'חם',   bg: '#FEF2F2', text: '#DC2626', border: '#FECACA', emoji: '🔥' },
    { id: 'VIP',  label: 'VIP',  bg: '#F5F3FF', text: '#7C3AED', border: '#DDD6FE', emoji: '✨' },
    { id: 'דחוף', label: 'דחוף', bg: '#FFFBEB', text: '#D97706', border: '#FDE68A', emoji: '⚠️' },
  ],
};

function mergeWithDefaults(saved) {
  return {
    kanbanLabels: { ...DEFAULT_SETTINGS.kanbanLabels, ...(saved?.kanbanLabels || {}) },
    eventTypes: Array.isArray(saved?.eventTypes) ? saved.eventTypes : DEFAULT_SETTINGS.eventTypes,
    priorities: Array.isArray(saved?.priorities) ? saved.priorities : DEFAULT_SETTINGS.priorities,
  };
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? mergeWithDefaults(JSON.parse(raw)) : { ...DEFAULT_SETTINGS };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function useSettings() {
  const [settings, setSettings] = useState(() => load());

  useEffect(() => {
    const handler = () => setSettings(load());
    window.addEventListener(SETTINGS_EVENT, handler);
    return () => window.removeEventListener(SETTINGS_EVENT, handler);
  }, []);

  const updateSettings = (patch) => {
    const next = { ...load(), ...patch };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(SETTINGS_EVENT));
  };

  const resetSettings = () => {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event(SETTINGS_EVENT));
  };

  return { settings, updateSettings, resetSettings };
}
