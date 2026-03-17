# CRM טל שני — שיפורים ותיקונים
**תאריך:** 2026-03-17
**סטטוס:** אושר

---

## 1. תיקוני באגים

### 1.1 פילטרים לא עובדים על מובייל (Dashboard.jsx)
**בעיה:** `FilterBar` מרנדר על מובייל אבל הרשימה ב-Dashboard מסננת רק לפי `searchQuery`, מתעלמת מ-`filters.status`, `filters.priority`, `filters.eventType`.
**תיקון:** בלוק המובייל ב-Dashboard יחיל את אותו לוגיקת סינון שיש בבלוק הדסקטופ (KanbanBoard).

### 1.2 קוד מת — MobileList ב-KanbanBoard.jsx
**בעיה:** `MobileList` קיים ב-KanbanBoard (עם `md:hidden`) אבל KanbanBoard עצמו נמצא ב-`hidden md:flex` בתוך Dashboard — כך שהקומפוננט לעולם לא מרנדר. ניתוח: על מובייל, הדאשבורד מציג רשימה משלו. על דסקטופ, KanbanBoard מרנדר אבל `md:hidden` מסתיר את MobileList.
**תיקון:** הסרת קומפוננטת `MobileList` ואימפורטים של `MessageCircle, Phone` שמשמשים רק לה.

### 1.3 MonthlyChart — fallback שגוי לתאריך
**בעיה:** `const dateStr = inq.createdTime || inq._rawDate` — כ-fallback משתמש בתאריך האירוע (`_rawDate`) במקום תאריך יצירה, מה שמוטה את הגרף.
**תיקון:** שימוש ב-`createdTime` בלבד. אם חסר — לא לספור את הרשומה.

---

## 2. שיפורי UX

### 2.1 Dark Mode חסר ב-ContactCard
**בעיה:** שדות עריכה (טלפון, אימייל) ופאנל תזכורות חסרי `dark:` variants — נראים לבנים בדארק מוד.
**תיקון:** הוספת `dark:bg-[#1a1917] dark:border-[#2d2b28] dark:text-[#e8e4df]` לאלמנטים החסרים.

### 2.2 Debounce על חיפוש
**בעיה:** כל הקשה מפעילה re-render ו-filter על כל הרשומות.
**תיקון:** הוספת `useState` + `useEffect` עם `setTimeout` של 150ms ב-Dashboard. שמירת `debouncedSearch` נפרד מ-`searchQuery`. הסינון ישתמש ב-`debouncedSearch`.

### 2.3 תאריך אירוע ברשימת מובייל
**בעיה:** הרשימה במובייל לא מציגה תאריך האירוע — מידע חשוב לניהול.
**תיקון:** הוספת שורת תאריך (עם אייקון לוח שנה) לכל כרטיס ברשימת המובייל כשהתאריך קיים.

---

## 3. שיפורי קוד

### 3.1 MonthlyChart Tooltip
**תיקון:** הוספת `title` attribute על כל עמודה (HTML tooltip פשוט) + הצגת הספירה מעל העמודה תמיד (לא רק כשcount > 0).

### 3.2 FilterBar — גבול בדארק מוד
**תיקון:** `div` המפריד בין קטגוריות (`w-px h-4 bg-[#EAE3D9]`) יקבל `dark:bg-[#2d2b28]`.

---

## קבצים שישתנו
- `src/components/Dashboard.jsx` — פילטרים למובייל, debounce, הוספת תאריך לכרטיס מובייל
- `src/components/KanbanBoard.jsx` — הסרת MobileList + imports לא בשימוש
- `src/components/MonthlyChart.jsx` — תיקון fallback, tooltip
- `src/components/ContactCard.jsx` — dark mode לשדות עריכה ופאנל תזכורות
- `src/components/FilterBar.jsx` — dark mode separator
