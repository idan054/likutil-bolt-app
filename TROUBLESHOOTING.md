# מדריך תקלות — Likutil

מסמך זה נועד לזיהוי ופתרון מהיר של תקלות שכבר ראינו, כדי שבפעם הבאה נפתור אותן בדקה.

> **פרטי גישה (SSH, סיסמאות, מפתחות):** נמצאים בדרייב של **ספיידר תלת־ממד** (Google Drive). לא נשמרים בריפוזיטורי הזה בשום צורה.

---

## 1. הסימפטום: באפליקציה מופיע "אין חיבור לשרת"

### איך מזהים מיידית
פותחים בדפדפן: <https://api.likutil.co.il/>

- אם חוזר JSON עם `"status":"ok"` → **השרת בסדר**, הבעיה בצד הלקוח/דפדפן.
- אם חוזר **502 Bad Gateway** או timeout → **שירות ה־API נפל בשרת**. עוברים לסעיף 2.

### בדיקה מהירה נוספת (אם יש גישת SSH)
מתחברים לשרת ה־API ומריצים:
```
systemctl is-active fastapi.service
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8000/
```
- `active` + `200` → השרת חי.
- כל דבר אחר → שירות ה־API נפל.

---

## 2. הפתרון: הקמת שירות ה־API מחדש

```
systemctl restart fastapi.service
systemctl status fastapi.service --no-pager | head -20
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8000/
```

לאחר מכן אמור לחזור `200` גם מ־<https://api.likutil.co.il/>.

> **הגנה אוטומטית:** השירות מוגדר עם `Restart=always` + `RestartSec=5`,
> כך שאם הוא קורס הוא קם לבד תוך 5 שניות. אם בכל זאת הוא נשאר נפול —
> בדקו `journalctl -u fastapi.service -n 100 --no-pager` כדי לראות למה הוא לא מצליח לעלות
> (לרוב: שגיאת קוד ב־deploy אחרון, או חוסר בזיכרון).

---

## 3. הפתרון בצד הלקוח (אם השרת תקין)

אם <https://api.likutil.co.il/> מחזיר 200 אבל באפליקציה עדיין כתוב "אין חיבור לשרת":

1. רענון קשיח של הדפדפן (`Ctrl+Shift+R`).
2. לוודא שגרסת האפליקציה הנוכחית עלתה לפרודקשן — לבדוק את מספר הגרסה בפינת המסך
   ולהשוות ל־`APP_VERSION` בקובץ `src/App.tsx`.
3. אם הגרסה ישנה — דחיפה ל־`main` ב־GitHub מפעילה דיפלוי אוטומטי ב־Netlify.

---

## 4. ארכיטקטורה — מה רץ איפה

| רכיב | היכן | איך מתחזקים |
|------|-------|--------------|
| Frontend (React + Vite) | Netlify, דומיין `my.likutil.co.il` | דיפלוי אוטומטי מ־`main` ב־GitHub |
| Backend (FastAPI) | שרת Ubuntu, דומיין `api.likutil.co.il` | `systemctl restart fastapi.service` |
| Reverse Proxy | nginx על אותו שרת | `/etc/nginx/sites-enabled/fastapi` |
| בסיס נתונים | Firebase / Firestore | קונסול Firebase |

לוגים שימושיים בשרת:
- `journalctl -u fastapi.service -n 200 --no-pager` — לוגים של ה־API
- `tail -n 200 /var/log/nginx/error.log` — לוגים של nginx (תופס 502)

---

## 5. מה שלא לעשות

- לא לשמור סיסמאות, מפתחות SSH או טוקנים בקבצים בריפו.
- לא להוסיף `OPENAI_API_KEY` או מפתחות אחרים בקוד — רק במשתני סביבה בשרת.
- אם מבצעים שינוי בקובץ השירות `/etc/systemd/system/fastapi.service` — חובה לגבות קודם
  ולהריץ `systemctl daemon-reload` אחרי השינוי.
