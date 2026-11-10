# 0004. Design tokenlar: Deep Forest palitrasi, Playfair + Inter

- Holat: qabul qilindi (2026-11-11)
- Manba: master prompt, 6-bo‘lim "Design system"

## Qaror

| Token                  | HEX     | Vazifasi                         | Kontrast (WCAG)                        |
| ---------------------- | ------- | -------------------------------- | -------------------------------------- |
| Deep Forest            | #0F3D34 | Asosiy tugma, brend, sarlavha    | Ivory ustida 11.28:1; oq matn 12.09:1  |
| Charcoal               | #1F2937 | Asosiy matn                      | Ivory ustida 13.7:1                    |
| Warm Ivory             | #F8F7F4 | Ilova foni                       | —                                      |
| Muted Gold             | #D4AF7C | Faqat aksent; Forest ustida matn | Forest ustida 5.88:1; Ivory'da 1.92:1  |
| Sage                   | #587B70 | "Bo‘sh" holati, muvaffaqiyat     | Oq matn 4.69:1; Ivory'dagi matn 4.37:1 |
| Sage matn (qo‘shimcha) | #4A6A60 | Sage rangli kichik matn          | Ivory ustida 5.57:1                    |
| Ikkinchi matn          | #5C6370 | Izoh, metadata                   | Ivory 5.64:1, muted fon 5.2:1          |
| Xato                   | #B3403F | Xato, bekor qilish               | Ivory 5.27:1; oq matn 5.64:1           |
| Forma chegarasi        | #878276 | Input chegarasi                  | Oq 3.83:1, Ivory 3.57:1 (1.4.11)       |

Qoidalar:

1. Oddiy matn kamida 4.5:1, forma chegaralari kamida 3:1.
2. Muted Gold och fonda matn bo‘lmaydi — faqat nuqta, chiziq, belgi yoki Forest ustidagi matn.
3. Holat faqat rang bilan berilmaydi: rang + belgi + so‘z (`StatusChip`).
4. Shrift: Inter (interfeys, `font-sans`); Playfair Display (`font-display`) faqat 24 px va undan
   katta brend sarlavhalarida. Ikkalasida lotin va kirill harflari bor.
5. Tokenlar `src/app/globals.css` da; komponentlar faqat semantik nomlardan foydalanadi
   (`bg-primary`, `text-muted-foreground`), HEX kodga to‘g‘ridan-to‘g‘ri murojaat qilinmaydi.
6. MVP'da faqat yorug‘ mavzu; qorong‘i mavzu V1.

## Oqibatlar

Avvalgi Midnight Navy palitrasi (Sprint 1 qoralamasi) bekor qilindi va commit qilinmadi.
