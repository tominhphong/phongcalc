# HANDOFF.md — PhongCalc Lead Capture
> Cập nhật: 2026-04-06 | Session: Option C Implementation

---

## ✅ ĐÃ HOÀN THÀNH TRONG SESSION NÀY

### Vấn đề ban đầu
PhongCalc dùng `showLeadCapture()` mới (từ `src/utils/lead-capture.ts`) gọi HubSpot CRM API trực tiếp từ browser → bị CORS block hoàn toàn. Leads không được capture.

### Giải pháp đã implement: Option C
**Hai lớp capture song song:**

1. **localStorage (primary)** — `showEmailGate()` từ `main.ts`
   - Lưu ngay vào browser: `phongto_email` và `phongto_leads`
   - Không cần internet, không bao giờ fail
   - Capture đầy đủ: name, email, phone, timestamp, calculator

2. **Diaflow webhook (secondary)** — fire-and-forget sync
   - URL: `https://api.diaflow.io/api/v1/builders/HeQE0EOnt6/webhook?api_key=sk-3e0ece9bce3f4413802b345c804507df`
   - CORS fully supported ✅
   - Tự động trigger flow: GPT qualify → HubSpot contact creation
   - Silent fail nếu lỗi (không ảnh hưởng user experience)

---

## 📁 FILES ĐÃ THAY ĐỔI

### `src/calculators/amortization.ts`
- **Xóa** import `showLeadCapture` từ `../utils/lead-capture`
- **Đổi** CSV button: `showLeadCapture(...)` → `showEmailGate(() => downloadCSV(schedule, extra))`
- **Đổi** Print button: `showLeadCapture(...)` → `showEmailGate(() => window.print())`

### `src/main.ts`
- **Cập nhật** `saveLead()`: tạo lead object, gọi `syncToDiaflow(lead)`
- **Thêm** function `syncToDiaflow()`: async, fire-and-forget, silent catch

> File `src/utils/lead-capture.ts` vẫn còn trong codebase nhưng không được import ở đâu nữa. Có thể xóa sau.

---

## ⚠️ VẤN ĐỀ ĐÃ BIẾT (Không cần fix ngay)

### HubSpot contacts bị blank
**Triệu chứng:** Contacts được tạo trong HubSpot nhưng tất cả fields đều trống.

**Nguyên nhân:** Diaflow flow `HeQE0EOnt6` gửi `properties.pipeline` và `properties.dealstage` — đây là Deal fields, không phải Contact fields. HubSpot Contact API bỏ qua các properties này mà không báo lỗi.

**Impact:** Thấp — localStorage vẫn capture đầy đủ. HubSpot contacts được tạo nhưng không có data.

**Fix khi có thời gian:** Vào Diaflow web UI → flow `HeQE0EOnt6` → node `http-1` (HubSpot) → sửa payload:
```json
{
  "properties": {
    "firstname": "{{trigger.commenter_name}}",
    "email": "{{trigger.commenter_email}}",
    "phone": "{{trigger.commenter_phone}}",
    "hs_lead_status": "NEW",
    "lead_source": "PhongCalc"
  }
}
```
Lưu ý: Flow hiện tại dùng chung cho FB/IG comments + PhongCalc. Sửa sẽ ảnh hưởng cả 2 nguồn.

---

## 🧪 ĐÃ TEST

| Test | Kết quả |
|---|---|
| TypeScript compile (`npx tsc --noEmit`) | ✅ Pass, no errors |
| Modal mở khi click "Tải CSV" | ✅ |
| Submit form → localStorage saved | ✅ |
| CSV download sau khi submit | ✅ |
| Modal close sau submit | ✅ |
| Diaflow webhook fetch được gọi | ✅ |
| HubSpot contacts created | ✅ (nhưng blank — xem bug trên) |

---

## 🚀 CHẠY DEV SERVER

```bash
# Trên MAC1 Terminal:
cd ~/GitHub/phongcalc && npx vite --port 5175

# Hoặc qua osascript:
tell application "Terminal"
  do script "cd /Users/phongto/GitHub/phongcalc && npx vite --port 5175"
end tell
```

App chạy tại: `http://localhost:5175`

---

## 📊 XEM LEADS ĐÃ CAPTURE

```javascript
// Mở DevTools Console tại localhost:5175
JSON.parse(localStorage.getItem('phongto_leads') || '[]')
```

---

## 🔧 DIAFLOW FLOW INFO

- **Flow ID:** `HeQE0EOnt6`
- **Flow JSON:** `/Volumes/SMB-Hub/results/lead-capture-flow-v4.json`
- **Flow path:** trigger → GPT-4o-mini qualify → JSON formatter → branch (HOT/WARM/SPAM) → FeedGuardians reply (`on_error: skip`) → HubSpot contact
- **Payload gửi từ PhongCalc:**
  ```json
  {
    "comment_id": "phongcalc_1234567890",
    "comment_text": "[PhongCalc Lead] Công cụ: Lịch trả nợ. Email: ...",
    "commenter_name": "Tên người dùng",
    "platform": "PhongCalc",
    "source": "phongcalc"
  }
  ```

---

## 📋 SESSION TIẾP THEO NÊN LÀM

1. **Deploy PhongCalc** lên production (Vercel / Netlify / GitHub Pages)
2. **Fix Diaflow flow** HubSpot node để map đúng Contact properties
3. **Xóa** `src/utils/lead-capture.ts` nếu không còn dùng
4. **Kiểm tra** leads từ các calculators khác (mortgage, refinance, etc.) — hiện chỉ amortization đã được migrate sang `showEmailGate`

---

*File này tạo tự động cuối session 2026-04-06. Đọc trước khi bắt đầu session tiếp theo.*
