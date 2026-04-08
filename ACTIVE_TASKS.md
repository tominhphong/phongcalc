# ACTIVE_TASKS.md — PhongCalc
> Cập nhật: 2026-04-06

---

## ✅ HOÀN THÀNH

- [x] **Restore localStorage lead capture** — `showEmailGate()` hoạt động đúng trong `amortization.ts`
- [x] **Add Diaflow webhook sync** — `syncToDiaflow()` trong `main.ts`, fire-and-forget, silent fail
- [x] **Xóa import `showLeadCapture`** khỏi `amortization.ts`
- [x] **TypeScript compile clean** — `npx tsc --noEmit` pass, zero errors
- [x] **E2E test qua Playwright** — modal, form submit, CSV download, webhook call đều pass
- [x] **Viết HANDOFF.md** — documentation đầy đủ cho session tiếp theo

---

## ⚠️ KNOWN ISSUES (Không block deploy)

- [ ] **HubSpot contacts blank** — Diaflow flow `HeQE0EOnt6` node `http-1` gửi Deal properties (`pipeline`, `dealstage`) thay vì Contact properties (`email`, `phone`). Fix: sửa payload trong Diaflow web UI.
  - **Priority:** Low (localStorage vẫn capture đầy đủ)
  - **Effort:** ~15 phút trong Diaflow UI

---

## 🔲 TODO — Việc cần làm tiếp

### P1 — Cao
- [ ] **Deploy PhongCalc lên production**
  - Options: Vercel (free, auto-deploy từ GitHub), Netlify, GitHub Pages
  - Build command: `npm run build`
  - Output dir: `dist/`
  - Custom domain nếu có

- [ ] **Kiểm tra calculators còn lại** — các file khác (`mortgage.ts`, `refinance.ts`, `affordability.ts`, v.v.) có đang dùng `showLeadCapture()` không?
  - Nếu có → migrate sang `showEmailGate()` tương tự `amortization.ts`
  - Grep: `grep -r "showLeadCapture" src/`

### P2 — Trung bình
- [ ] **Fix Diaflow HubSpot node** — sửa payload để map đúng Contact properties
  - Vào: `https://diaflow.io` → flow `HeQE0EOnt6` → node `http-1`
  - Sửa `properties.pipeline` → `properties.email`, `properties.phone`
  - Test: submit 1 lead từ PhongCalc → kiểm tra HubSpot

- [ ] **Admin panel xem leads** — tạo page `/admin` hoặc script để export leads từ localStorage
  - Hoặc dùng existing leads display nếu đã có trong codebase

### P3 — Thấp
- [ ] **Xóa `src/utils/lead-capture.ts`** — file này không còn được import, có thể xóa để dọn codebase
- [ ] **Tạo dedicated Diaflow flow cho PhongCalc** — flow riêng với proper Contact fields, không dùng chung với FB/IG comment flow
- [ ] **Analytics** — track calculator usage (which calculator captures most leads)

---

## 📋 QUICK COMMANDS

```bash
# Dev server
cd ~/GitHub/phongcalc && npx vite --port 5175

# TypeScript check
cd ~/GitHub/phongcalc && npx tsc --noEmit

# Build production
cd ~/GitHub/phongcalc && npm run build

# Check leads in browser console
JSON.parse(localStorage.getItem('phongto_leads') || '[]')

# Check if showLeadCapture still used anywhere
grep -r "showLeadCapture" ~/GitHub/phongcalc/src/
```

---

## 🗂️ KEY FILES

| File | Mục đích |
|---|---|
| `src/main.ts` | Email gate, saveLead, syncToDiaflow |
| `src/calculators/amortization.ts` | ✅ Đã migrate sang showEmailGate |
| `src/utils/lead-capture.ts` | ⚠️ Old system, không còn dùng |
| `HANDOFF.md` | Chi tiết session 2026-04-06 |

---

*File này track tiến độ PhongCalc. Cập nhật sau mỗi session.*
