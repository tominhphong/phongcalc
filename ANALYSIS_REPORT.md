# 📊 Báo Cáo Phân Tích — PhongCalc
> Ngày: 2026-04-06 | Phân tích bởi: Agent Team (Scout + Code Review + Architecture)

---

## 1. TỔNG QUAN DỰ ÁN

**PhongCalc** là ứng dụng web máy tính tài chính bất động sản, được xây dựng cho Realtor Phong Tô phục vụ cộng đồng Việt-Mỹ tại DFW, Texas.

| Thông số | Giá trị |
|---|---|
| Tech Stack | TypeScript + Vite + Chart.js |
| Số calculators | 10 |
| Tổng dòng code | ~1,700+ dòng |
| Framework UI | Không có (Vanilla TS) |
| PWA | ✅ Có manifest.json |
| Ngôn ngữ | Tiếng Việt (hard-coded) |
| Lead Capture | ✅ Email gate + localStorage |

---

## 2. CẤU TRÚC DỰ ÁN

```
phongcalc/
├── index.html                        (PWA shell, email gate modal)
├── src/
│   ├── main.ts                       (Router + Email gate, 130 dòng)
│   ├── style.css                     (Design system, 735 dòng)
│   ├── calculators/
│   │   ├── mortgage.ts               (Trả góp hàng tháng, 153 dòng)
│   │   ├── amortization.ts           (Lịch trả nợ, 192 dòng)
│   │   ├── affordability.ts          (Khả năng mua nhà, 123 dòng)
│   │   ├── seller-net.ts             (Tiền bán nhà nhận về, 105 dòng)
│   │   ├── buyer-costs.ts            (Chi phí người mua, 96 dòng)
│   │   ├── refinance.ts              (Tái cấp vốn, 106 dòng)
│   │   ├── investment-cashflow.ts    (Dòng tiền đầu tư, 160 dòng)
│   │   ├── loan-compare.ts           (So sánh 2 khoản vay, 117 dòng)
│   │   ├── rent-estimator.ts         (Ước tính tiền thuê, 148 dòng)
│   │   └── rent-vs-buy.ts            (Thuê vs Mua, 133 dòng)
│   └── utils/
│       ├── math.ts                   (Công thức tài chính, 216 dòng)
│       ├── format.ts                 (USD/pct/num format, 44 dòng)
│       └── charts.ts                 (Chart.js wrapper, 220 dòng)
├── public/
│   └── manifest.json                 (PWA config)
└── package.json
```

### Kiến trúc tổng thể:
```
index.html
    └── main.ts (Router + Email Gate)
            ├── 10 Calculators (render + init + calculate)
            │       ├── utils/math.ts    (financial formulas)
            │       ├── utils/format.ts  (display helpers)
            │       └── utils/charts.ts  (Chart.js)
            └── style.css (Dark theme design system)
```

**Pattern:** Module ES6, Event-driven, String-based HTML rendering, localStorage state

---

## 3. ĐÁNH GIÁ ĐIỂM MẠNH

| # | Điểm mạnh | Chi tiết |
|---|---|---|
| ✅ | Công thức tài chính chính xác | PMT, amortization, DTI — đúng chuẩn US lending |
| ✅ | Phù hợp thị trường Texas | Property tax 2.2%, HOA support, DTI 36% |
| ✅ | Đầy đủ 10 calculators | Bao phủ toàn bộ workflow của Realtor |
| ✅ | Chart.js memory-safe | Destroy chart cũ trước khi tạo mới |
| ✅ | Dark theme đẹp | CSS variables nhất quán, mobile-first |
| ✅ | Lead capture thông minh | Email gate + localStorage + timestamp tracking |
| ✅ | PWA-ready | Manifest, theme-color, mobile viewport |
| ✅ | Seller-net calculator | **Độc nhất** — Zillow và NerdWallet đều không có |
| ✅ | Real-time calculation | Nhập là tính ngay, không cần bấm nút |

---

## 4. VẤN ĐỀ CẦN SỬA

### 🔴 Nghiêm trọng (Critical)

#### 1. `parseNum()` bị duplicate 9 lần
```typescript
// Hàm GIỐNG HỆT nhau tồn tại trong 9 files:
function parseNum(id: string): number {
  return parseFloat((document.getElementById(id) as HTMLInputElement)
    .value.replace(/[^0-9.-]/g, '')) || 0;
}
```
**Hậu quả:** Bug fix phải sửa 9 chỗ. Vi phạm DRY principle nghiêm trọng.

#### 2. Thiếu PMI (Private Mortgage Insurance)
Khi down payment < 20%, phải tính thêm PMI (~$100-200/tháng cho loan $200k). Hiện tại bị bỏ qua hoàn toàn → affordability và mortgage calculations bị underestimate.

#### 3. Không validate input
Không có validation cho: lãi suất âm, năm = 0, giá trị bất hợp lý. Người dùng nhập sai → kết quả sai mà không có thông báo lỗi.

### 🟡 Trung bình (Medium)

| Vấn đề | Vị trí | Mô tả |
|---|---|---|
| Magic numbers | rent-estimator.ts | `0.85`, `1.1`, `1.15` không có comment giải thích |
| Mixed concerns | Tất cả calculators | Render + Logic + DOM lẫn lộn trong 1 file |
| Hardcoded closing costs | buyer-costs.ts | 8 items cố định, không parameterized |
| Chỉ tiếng Việt | Toàn bộ app | Client non-Vietnamese không đọc được |
| Không export results | Toàn bộ app | Không có PDF/share — khách hàng không lưu được kết quả |
| LTV hardcode 80% | refinance.ts | Nên là config constant |

---

## 5. ĐIỂM SỐ TỔNG THỂ

| Tiêu chí | Điểm | Nhận xét |
|---|---|---|
| Correctness (công thức) | 8/10 | Chính xác, nhưng thiếu PMI |
| Code Quality | 5/10 | DRY violations nghiêm trọng |
| Architecture | 6/10 | Functional nhưng khó scale |
| UX/Design | 7.5/10 | Đẹp, mobile-ready, thiếu bilingual + export |
| Business Value | 9/10 | Đầy đủ tính năng cho Realtor DFW |
| **TỔNG** | **6.5/10** | Nền tảng tốt, cần cải thiện code quality |

---

## 6. GỢI Ý CẢI THIỆN (3 Phương Án)

---

### 🟢 OPTION A: Quick Wins — Vanilla TS (1-2 ngày)

**Mục tiêu:** Sửa các lỗi quan trọng + thêm tính năng ngay lập tức

| Task | Thời gian | Impact |
|---|---|---|
| Extract `parseNum()` → `utils/parse.ts` | 20 phút | 🔴 Fix DRY violation |
| Thêm PMI calculation | 1 giờ | 🔴 Fix affordability accuracy |
| Magic numbers → named constants | 30 phút | 🟡 Maintainability |
| Input validation + error messages | 1.5 giờ | 🟡 Better UX |
| **Bilingual Việt/Anh** | 2 giờ | 🟢 Phục vụ cả 2 ngôn ngữ |
| **PDF export kết quả** | 3 giờ | 🟢 Client giữ được kết quả |
| **Session history** | 2 giờ | 🟢 Xem lại calculations cũ |
| Extract `_base.ts` shared logic | 3 giờ | 🟡 -50% boilerplate |

**Kết quả:** Bundle ~65KB, không đổi tech stack

---

### 🟡 OPTION B: Moderate Refactor (1 tuần)

**Mục tiêu:** Routing, state management, PWA first-class

Thêm vào Option A:
- **URL routing** (`/#/mortgage`, `/#/seller-net`, etc.) → back button hoạt động
- **Centralized state** → không còn DOM queries tản mát
- **Comparison mode** → so sánh 2 scenarios song song
- **Shareable link** → `phongcalc.com/share/abc123` cho client
- **Service worker** → offline support hoàn chỉnh

**Kết quả:** Bundle ~100KB, PWA-grade app

---

### 🔵 OPTION C: Full Modern Stack (1 tháng)

**Mục tiêu:** Platform cho team Realtors, CRM integration, analytics

| Layer | Tech |
|---|---|
| Frontend | React 19 + TypeScript + Zustand |
| Charts | Recharts (React-native) |
| Backend | Supabase (DB + Auth + Realtime) |
| Deploy | Vercel + Edge functions |
| Testing | Vitest + React Testing Library |

Tính năng mới:
- **Database-backed results** — lưu mọi calculation
- **Team collaboration** — share với đồng nghiệp Realtor
- **HubSpot CRM sync** — auto-update contact khi client dùng calculator
- **Analytics dashboard** — calculator nào được dùng nhiều nhất
- **React Native** — mobile app riêng

**Chi phí:** ~$60/tháng (Vercel Pro + Supabase)

---

## 7. PHÂN TÍCH CẠNH TRANH

| Tính năng | Zillow | NerdWallet | PhongCalc |
|---|---|---|---|
| Mortgage calculator | ✅ | ✅ | ✅ |
| Seller-net calculator | ❌ | ❌ | **✅ ĐỘC NHẤT** |
| Investment cashflow | ✅ | ✅ | ✅ |
| Tiếng Việt | ❌ | ❌ | ✅ |
| Phục vụ Realtor | ❌ | ❌ | ✅ |
| CRM integration | ❌ | ❌ | ✅ (HubSpot) |
| Offline/PWA | ❌ | ❌ | ⏳ |
| Team collaboration | ❌ | ❌ | ⏳ (Option C) |

**USP (Điểm khác biệt độc đáo):**
1. Chuyên dành cho Realtor — không phải generic financial tool
2. Tiếng Việt — phục vụ cộng đồng Việt-Mỹ DFW
3. Seller-net calculator — không công cụ nào khác có
4. Tích hợp HubSpot lead capture flow

---

## 8. ROADMAP GỢI Ý

```
Tuần này (Option A):
  ✅ Extract parseNum() → utils/parse.ts
  ✅ Add PMI calculation
  ✅ Bilingual Việt/Anh toggle
  ✅ PDF export

Tháng 2 (Option B):
  ✅ URL routing
  ✅ Shareable links
  ✅ Comparison mode
  ✅ Service worker (offline)

Tháng 3-4 (Option C — optional):
  ✅ React migration
  ✅ Supabase backend
  ✅ Team features
  ✅ Analytics
```

---

## 9. TOP 5 ACTIONS ƯU TIÊN CAO NHẤT

1. **[30 min]** Extract `parseNum()` vào `utils/parse.ts` — fix DRY violation ngay
2. **[1 giờ]** Add PMI calculation — fix accuracy cho affordability
3. **[2 giờ]** Thêm bilingual toggle Việt/Anh — phục vụ cả 2 ngôn ngữ
4. **[3 giờ]** PDF export kết quả — client giữ được kết quả để tham khảo
5. **[1.5 giờ]** Input validation + error messages — UX tốt hơn

---

*Báo cáo được tạo bởi Agent Team: Scout + Code Review + Architecture Analyst*
*Thời gian phân tích: ~3 phút (parallel processing)*
