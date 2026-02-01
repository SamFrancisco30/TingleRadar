# TingleRadar Filter & Tag System TODO

> Snapshot of the current tasks we want to tackle next for the ranking UI.

## 1. Filter Structure Refactor

### 1.1 Separate Trigger Type vs Talking Style
- **Current:**
  - `Type` chips混在一起：tapping / whisper / soft spoken / no talking / roleplay / ...
- **Target:**
  - 独立 filter 区块：
    1. **Trigger Type**
       - Tapping
       - Scratching
       - Crinkling
       - Brushing
       - Ear cleaning
       - Mouth sounds
       - White noise
       - Binaural
       - Visual ASMR
       - Layered sounds
       - Roleplay
    2. **Talking Style**（默认展开）
       - Whisper
       - Soft spoken
       - No talking
    3. **Language**（保持现在的 EN / JA / KO / ZH）
    4. **Duration**（保持现有 buckets）

### 1.2 Multi-select behaviour
- **Trigger Type:**
  - 改成多选数组 `triggerFilters: string[]`。
  - 过滤逻辑：
    - 如果 `triggerFilters` 为空 → 不按 trigger 过滤。
    - 如果非空 → 保留 `item.type_tags` 中包含任一所选 trigger 的视频（OR）。

- **Talking Style:**
  - 新增 `talkingStyleFilters: string[]`。
  - 内部 tag id: `whisper`, `soft_spoken`, `no_talking`。
  - 过滤逻辑：
    - `talkingStyleFilters` 为空 → 不按 talking style 过滤。
    - 非空 → `item.type_tags` 至少包含其中一个（OR）。

- **Language:**
  - 改为 `languageFilters: string[]`。
  - 过滤逻辑：
    - 为空 → 不过滤。
    - 非空 → `item.language` 必须在所选集合内（OR）。

- **Overall filter:**
  - Duration AND Trigger AND Talking Style AND Language。
  - 每个维度内部是 OR，维度之间是 AND。

## 2. Roleplay & Scenes

### 2.1 Roleplay trigger
- 保留 `roleplay` 作为一个 trigger 类型（在 `triggerFilters` 中）。

### 2.2 Roleplay scene chips
- 当 `roleplay` 被选中时，在 UI 中展开一个子区域：
  - **Roleplay scene:**
    - Haircut  → `rp_haircut`
    - Cranial nerve exam → `rp_cranial`
    - Dentist → `rp_dentist`
- 状态：`roleplayScenes: string[]`。
- 过滤逻辑：
  - 如果 `roleplayScenes.length === 0`：
    - 仅要求 `item.type_tags` 包含 `roleplay`（由 Trigger 维度负责）。
  - 如果 `roleplayScenes.length > 0`：
    - 必须包含 `roleplay`；且
    - 至少包含一个所选 scene tag (`rp_haircut` / `rp_cranial` / `rp_dentist`)。

## 3. Implementation Notes

### 3.1 Data source
- 前端已经通过 `NEXT_PUBLIC_BACKEND_URL` 从 FastAPI 拉取：`/rankings/weekly`。
- 每条 video 对象包含：
  - `computed_tags`（从 backend `compute_tags_for_video` 得到）。
- `RankingExplorer` 中：
  - 优先使用 `video.computed_tags` 作为 `type_tags`；
  - 若不存在则 fallback 到 `detectTypeTags`（基于 `typeKeywords`）。

### 3.2 Tag naming
- 内部使用 snake_case：
  - `white_noise`, `ear_cleaning`, `soft_spoken`, `no_talking`, `rp_haircut`, etc.
- 显示层通过 `typeLabels` / `displayTag` 转成：
  - `White noise`, `Ear cleaning`, `Soft spoken`, `No talking`, `Haircut`, etc.

### 3.3 Next steps for implementation
1. 在 `RankingExplorer.tsx` 中：
   - 添加 `triggerFilters`, `talkingStyleFilters`, `languageFilters`, `roleplayScenes` 状态。
   - 拆分现有 Type 区为 Trigger + Talking Style 区。
   - 调整顶层 filter 函数逻辑为 AND-of-ORs。
2. 确保本地 `npm run build` 通过（含 TS + ESLint）。
3. 一步步 commit：
   - Step 1: Talking Style 区域（默认展开）+ `talkingStyleFilters` 逻辑。
   - Step 2: Trigger 多选（`triggerFilters`）。
   - Step 3: Language 多选（`languageFilters`）。
   - Step 4: Roleplay 场景 chips + `roleplayScenes` 过滤。

---

> 本文件是当前 filter / tagging 重构任务的待办清单，后续修改时请保持更新。