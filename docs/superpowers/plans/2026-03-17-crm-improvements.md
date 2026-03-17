# CRM טל שני — שיפורים ותיקונים Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** תיקון באגים ושיפור UX ב-CRM טל שני — פילטרים במובייל, ניקוי קוד מת, תיקון גרף, dark mode, debounce.

**Architecture:** שינויים ממוקדים בקומפוננטות קיימות בלבד. אין קבצים חדשים, אין שינוי ל-API או לוגיקה עסקית. כל שינוי עצמאי ומבודד.

**Tech Stack:** React 19, Framer Motion, Tailwind CSS 4, Lucide React

**Spec:** `docs/superpowers/specs/2026-03-17-crm-improvements-design.md`

---

## Chunk 1: תיקוני באגים קריטיים

### Task 1: הסרת MobileList מת מ-KanbanBoard.jsx

**Files:**
- Modify: `src/components/KanbanBoard.jsx`

- [ ] **Step 1: הסר את קומפוננטת MobileList (שורות 14-82) ואת כל האימפורטים שנמצאים רק בה**

בתחילת הקובץ, הסר מהשורה הראשונה:
```js
// לפני:
import { MessageCircle, Phone } from 'lucide-react';
// אחרי: הסר שורה זו לגמרי
```

הסר את כל בלוק `const MobileList = ...` (שורות 14-82).

הסר מהJSX של KanbanBoard את הבלוק הבא (שורות 197-200):
```jsx
// הסר:
{/* Mobile: simple list */}
<div className="md:hidden w-full h-full overflow-y-auto">
  <MobileList inquiries={inquiries} />
</div>
```

- [ ] **Step 2: וודא שהקובץ תקין — ה-return של KanbanBoard צריך להיות:**
```jsx
return (
  <div className="hidden md:flex gap-6 h-full w-full overflow-x-auto overflow-y-hidden snap-x snap-mandatory pb-4 hide-scrollbar">
    {columns.map((col, index) => {
      const columnInquiries = columnMap[col.id];
      return (
        <div key={col.id} id={index === 0 ? 'kanban-column-1' : undefined} className="min-w-[320px] w-[320px] max-w-[320px] flex-shrink-0 flex flex-col snap-center">
          <KanbanColumn
            id={col.id}
            title={col.title}
            inquiries={columnInquiries}
            onDropRecord={handleDropRecord}
            onDeleteRecord={handleDeleteRecord}
          />
        </div>
      );
    })}
  </div>
);
```

- [ ] **Step 3: Commit**
```bash
git add src/components/KanbanBoard.jsx
git commit -m "fix: remove dead MobileList code from KanbanBoard"
```

---

### Task 2: החלת פילטרים על רשימת מובייל ב-Dashboard.jsx

**Files:**
- Modify: `src/components/Dashboard.jsx`

- [ ] **Step 1: מצא את בלוק המובייל (שורה ~431) — שורת הסינון הנוכחית:**
```js
// נוכחי (מסנן רק searchQuery):
const q = searchQuery.toLowerCase();
const list = inquiries
  .filter(i => !q || [i.Name, i.Company, i.Phone, i['Event Type']].filter(Boolean).some(v => v.toLowerCase().includes(q)))
  .sort(...)
```

- [ ] **Step 2: החלף בסינון מלא הכולל את כל הפילטרים:**
```js
const q = searchQuery.toLowerCase();
const list = inquiries
  .filter(i => {
    if (focusMode) {
      const isNew = i.Status === 'פניות חדשות' || !i.Status;
      const hasUpcoming = i._rawDate && (new Date(i._rawDate) - new Date()) / (1000 * 60 * 60 * 24) <= 3;
      if (!isNew && !hasUpcoming) return false;
    }
    if (filters.status && (i.Status || 'פניות חדשות') !== filters.status) return false;
    if (filters.priority && i.Priority !== filters.priority) return false;
    if (filters.eventType && i['Event Type'] !== filters.eventType) return false;
    if (!q) return true;
    return [i.Name, i.Company, i.Phone, i['Event Type']].filter(Boolean).some(v => v.toLowerCase().includes(q));
  })
  .sort((a, b) => (STATUS_ORDER[a.Status || 'פניות חדשות'] || 0) - (STATUS_ORDER[b.Status || 'פניות חדשות'] || 0));
```

- [ ] **Step 3: Commit**
```bash
git add src/components/Dashboard.jsx
git commit -m "fix: apply all filters to mobile list view"
```

---

### Task 3: תיקון MonthlyChart — fallback שגוי

**Files:**
- Modify: `src/components/MonthlyChart.jsx`

- [ ] **Step 1: מצא שורה 18:**
```js
// נוכחי:
const dateStr = inq.createdTime || inq._rawDate;
```

- [ ] **Step 2: החלף — שימוש ב-createdTime בלבד:**
```js
const dateStr = inq.createdTime;
if (!dateStr) return;
```

(הסר גם את ה-`if (!dateStr) return;` שבא אחרי כי הוא כבר כלול)

הקוד הסופי של לולאת inquiries.forEach:
```js
inquiries.forEach(inq => {
  const dateStr = inq.createdTime;
  if (!dateStr) return;
  const d = new Date(dateStr);
  if (isNaN(d)) return;
  const slot = months.find(m => m.year === d.getFullYear() && m.month === d.getMonth());
  if (slot) slot.count++;
});
```

- [ ] **Step 3: Commit**
```bash
git add src/components/MonthlyChart.jsx
git commit -m "fix: MonthlyChart uses createdTime only, not event date as fallback"
```

---

## Chunk 2: שיפורי UX

### Task 4: Debounce על חיפוש ב-Dashboard.jsx

**Files:**
- Modify: `src/components/Dashboard.jsx`

- [ ] **Step 1: הוסף state של debouncedSearch לאחר הגדרת searchQuery (שורה ~40):**
```js
const [debouncedSearch, setDebouncedSearch] = useState('');
```

- [ ] **Step 2: הוסף useEffect לאחר ה-state החדש:**
```js
useEffect(() => {
  const t = setTimeout(() => setDebouncedSearch(searchQuery), 150);
  return () => clearTimeout(t);
}, [searchQuery]);
```

- [ ] **Step 3: עדכן את כל שימושי searchQuery בסינון (לא בinput!) לשימוש ב-debouncedSearch:**

שורה ~439 (מובייל):
```js
const q = debouncedSearch.toLowerCase();
```

שורה ~522 (דסקטופ KanbanBoard filter):
```js
if (!debouncedSearch) return true;
const q = debouncedSearch.toLowerCase();
return i.Name?.toLowerCase().includes(q) || i.Company?.toLowerCase().includes(q) || i.Phone?.includes(q) || i['Event Type']?.toLowerCase().includes(q);
```

- [ ] **Step 4: Commit**
```bash
git add src/components/Dashboard.jsx
git commit -m "perf: debounce search input by 150ms"
```

---

### Task 5: הוספת תאריך אירוע לכרטיס מובייל ב-Dashboard.jsx

**Files:**
- Modify: `src/components/Dashboard.jsx`

- [ ] **Step 1: הוסף Calendar לרשימת האימפורטים של lucide-react (שורה 2):**
```js
import { Plus, Link as LinkIcon, Search, Eye, EyeOff, RotateCw, FileDown, Database, HelpCircle, MessageCircle, Phone as PhoneIcon, Moon, Sun, Settings, Calendar } from 'lucide-react';
```

- [ ] **Step 2: מצא בבלוק המובייל את כרטיסי הלידים (שורה ~467) — אזור ה-Info — הוסף תאריך אחרי ה-badges:**
```jsx
{/* אחרי ה-div של badges, לפני סגירת div של Info */}
{lead['Event Date'] && (
  <div className="flex items-center gap-1 mt-1">
    <Calendar size={11} className="text-[#C5A880]" />
    <span className="text-[11px] text-[#9BACA4]">{lead['Event Date']}</span>
  </div>
)}
```

- [ ] **Step 3: Commit**
```bash
git add src/components/Dashboard.jsx
git commit -m "feat: show event date in mobile lead cards"
```

---

## Chunk 3: Dark Mode ו-UI פיניש

### Task 6: Dark Mode ב-ContactCard.jsx

**Files:**
- Modify: `src/components/ContactCard.jsx`

- [ ] **Step 1: תקן שדות עריכה שחסרי dark mode (שורות 299, 303) — שדות טלפון ואימייל:**
```jsx
// שורה 299 — שדה טלפון:
// לפני:
className="w-full text-base p-2 border border-[#EAE3D9] rounded-lg focus:border-[#C5A880] outline-none text-right transition-colors"
// אחרי:
className="w-full text-base p-2 border border-[#EAE3D9] dark:border-[#2d2b28] bg-white dark:bg-[#1a1917] text-[#333333] dark:text-[#e8e4df] rounded-lg focus:border-[#C5A880] outline-none text-right transition-colors"

// שורה 303 — שדה אימייל:
// לפני:
className="w-full text-base p-2 border border-[#EAE3D9] rounded-lg focus:border-[#C5A880] outline-none text-right transition-colors"
// אחרי:
className="w-full text-base p-2 border border-[#EAE3D9] dark:border-[#2d2b28] bg-white dark:bg-[#1a1917] text-[#333333] dark:text-[#e8e4df] rounded-lg focus:border-[#C5A880] outline-none text-right transition-colors"
```

- [ ] **Step 2: תקן פאנל תזכורות (שורה ~589) — הוסף dark mode:**
```jsx
// שורה ~589 — className של motion.div:
// לפני:
className="flex flex-col gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 overflow-hidden"
// אחרי:
className="flex flex-col gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 overflow-hidden"
```

- [ ] **Step 3: תקן inputs בתוך פאנל תזכורות (שורות ~594, ~601):**
```jsx
// input טקסט:
className="w-full text-sm p-2 rounded-lg border border-amber-200 dark:border-amber-700 bg-white dark:bg-[#1a1917] dark:text-[#e8e4df] outline-none focus:border-amber-400 transition-colors"

// input תאריך:
className="w-full text-sm p-2 rounded-lg border border-amber-200 dark:border-amber-700 bg-white dark:bg-[#1a1917] dark:text-[#e8e4df] outline-none focus:border-amber-400 transition-colors"
```

- [ ] **Step 4: Commit**
```bash
git add src/components/ContactCard.jsx
git commit -m "fix: add dark mode to edit fields and reminder panel in ContactCard"
```

---

### Task 7: Dark Mode ב-FilterBar.jsx

**Files:**
- Modify: `src/components/FilterBar.jsx`

- [ ] **Step 1: מצא את שני ה-dividers (שורות 50, 62) והוסף dark mode:**
```jsx
// לפני:
<div className="w-px h-4 bg-[#EAE3D9] mx-0.5" />
// אחרי:
<div className="w-px h-4 bg-[#EAE3D9] dark:bg-[#2d2b28] mx-0.5" />
```
(שינוי זהה לשני הגבולות)

- [ ] **Step 2: Commit**
```bash
git add src/components/FilterBar.jsx
git commit -m "fix: dark mode dividers in FilterBar"
```

---

### Task 8: MonthlyChart — tooltip ו-count תמיד גלוי

**Files:**
- Modify: `src/components/MonthlyChart.jsx`

- [ ] **Step 1: בכרטיס של כל עמודה, הוסף `title` attribute לספירה ולעמודה עצמה:**

מצא את ה-`div` העוטף כל עמודה (שורה ~47) והוסף:
```jsx
<div key={i} className="flex-1 flex flex-col items-center gap-1.5" title={`${bar.label}: ${bar.count} פניות`}>
```

- [ ] **Step 2: הצג count תמיד (לא רק כש > 0):**
```jsx
// לפני:
<span className="text-[10px] font-bold text-[#333333] dark:text-[#e8e4df]">{bar.count > 0 ? bar.count : ''}</span>
// אחרי:
<span className="text-[10px] font-bold text-[#333333] dark:text-[#e8e4df]">{bar.count > 0 ? bar.count : '·'}</span>
```

- [ ] **Step 3: Commit**
```bash
git add src/components/MonthlyChart.jsx
git commit -m "feat: MonthlyChart tooltip and always-visible count"
```
