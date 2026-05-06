# Design Editor — Functional Specification

> **Purpose:** This document describes the complete functional behaviour, API integration, and feature set of the existing Design-editor. Use it to build a **brand-new designer** with the same backend contracts but a completely different, premium UI. Do not replicate the existing visual design — build fresh from the UI direction below.

---

## 0. UI Direction & Engineering Standards

### Product Vision
Build a **Figma-class premium badge and certificate designer**. The experience must feel native, snappy, and professional — comparable to Canva or Figma in interaction quality. Every interaction should feel intentional and polished. The agent building this has full latitude to choose specific components, icons, and UI patterns — the mandate is the quality bar, not the implementation path.

### Tech Stack (new build)
- **Framework:** React 18 + TypeScript (strict mode)
- **UI Component Library:** MUI v6 (Material UI) — the chosen foundation; use it for all UI chrome
- **Canvas Engine:** Fabric.js 6/7 (same as current — retain canvas logic, do not rewrite it)
- **State Management:** Zustand or Redux Toolkit (hooks only — no class components)
- **Build:** Vite + TypeScript

### Theme
- **Primary colour:** Orange (`#FF6B35` base — a warm, confident orange)
- **Tone:** Clean white surfaces, very light grey backgrounds, dark near-black text
- **Accent:** Orange used for active states, selected objects, primary actions, and progress indicators
- **No gradients on UI chrome** — flat, modern, purposeful
- **Depth:** Subtle shadows on floating panels and elevated elements only — not decorative

### Layout Philosophy
The editor is a **full-viewport single-page application** — no scroll on the outer shell. Three-column layout:
- **Left panel** (fixed width, collapsible): Asset browser — templates, shapes, elements
- **Centre** (flex-grow): Canvas workarea with toolbar above and controls below
- **Right panel** (fixed width, collapsible): Property inspector — context-sensitive controls for the selected object

All panels slide in/out with smooth transitions. No jarring reflows.

### Interaction Quality Standards
- **Hover states** on every interactive element — no dead zones
- **Tooltips** on all icon-only controls — short delay, descriptive label
- **Keyboard accessible** — every action reachable without mouse
- **Loading states** — skeleton loaders on panels, spinner on canvas while loading template
- **Error states** — inline, non-blocking, dismissible — never blocking alert dialogs
- **Optimistic UI** — save shows inline progress, not a blocking modal
- **Transitions** — panel collapse/expand ~200ms. Object selection highlight: instant. Zoom: smooth.

### Component & Code Standards
- All components are functional React with TypeScript — no class components, no `PropTypes`
- No `any` types except at the Fabric.js boundary
- All colour and spacing values driven by a central theme — no hardcoded hex values inside components
- A consistent icon set used throughout — agent's choice of library, but must be one coherent family
- Production-ready, error-free TypeScript — no `ts-ignore`, no loose types
- Every canvas operation wrapped in null/error guards
- No commented-out code, no dead imports
- Folder structure: `src/components/`, `src/canvas/`, `src/store/`, `src/hooks/`, `src/api/`, `src/types/`
- API layer fully separated from UI — all fetch calls in `src/api/`

---

## 1. Application Modes & Routes

### Route Definitions
The application runs on 4 main routes, all rendering the same `ImageMapEditor` component:

| Route | URL Pattern | Mode Type | Purpose |
|-------|---|---|---|
| Certificate Designer | `/certificate-designer?designCode=DCL...` | User Edit | Design certificates (A4 portrait/landscape) |
| Badge Designer | `/badge-designer?designCode=DCL...` | User Edit | Design badges (600x600px square) |
| Admin Certificate Designer | `/admin-certificate-designer?designCode=DCL...` | Admin | Manage certificate templates as admin |
| Admin Badge Designer | `/admin-badge-designer?designCode=DCL...` | Admin | Manage badge templates as admin |

**Root route** `/` redirects to `/certificate-designer`.

### URL Query Parameters
All query parameters parsed in `editorSession.js`:

| Parameter | Type | Example | Purpose |
|-----------|------|---------|---------|
| `designCode` | String | `DCL`, `DCT`, `LDC`, `GSI` | Determines API base URL (see section 17) |
| `edit` | String | `'true'` | Loads existing design for editing |
| `id` | String | UUID | Design ID to load (user designs) |
| `cid` | String | UUID | Credential ID (parent context) |
| `bid` | String | UUID | Badge ID (parent context) |
| `ctid` | String | UUID | Certificate template ID (parent context) |
| `dt` | String | `'true'` | Design is a template, not a user design |
| `sk` | String | `'0'` | Skip parameter (pagination for template manager) |

### Route Detection Logic (from `parseEditorSession`)
```javascript
const isAdminPath = currentPath.includes('admin');
const isCertificatePath = currentPath.includes('certificate-designer');
const isBadgePath = currentPath.includes('badge-designer');
const isAdminBadgePath = currentPath.includes('admin-badge-designer');
```

---

## 2. Session & Authentication Flow

### Session Establishment Sequence
1. **On component mount** (`componentDidMount`):
   - Parse URL via `parseEditorSession()`
   - Call `loadDesignerSession()` → `GET /templates/getusertoken/{designCode}`
   
2. **API Response** (session object):
   ```json
   {
     "accessToken": "Bearer ...",
     "type": "certificate" | "badge",
     "designId": UUID | null,
     "designCode": "DCL..."
   }
   ```
   
3. **Route Validation**:
   - If `session.type` is `'badge'` but URL is certificate designer, redirect to badge-designer
   - If `session.type` is `'certificate'` but URL is badge designer, redirect to certificate-designer

4. **Design Loading**:
   - If `session.designId` exists → load as "edit existing"
   - If `edit=true` and `id=xyz` → load specific design
   - Otherwise → create new blank template

### Token Lifecycle
- **Obtained**: During `loadDesignerSession()`
- **Stored**: In component state as `userData.accessToken`
- **Used in**: All subsequent API calls via `authHeaders(accessToken)` which adds: `Authorization: Bearer {token}`
- **Expiration**: Session token expires on server; no refresh logic in UI
- **Error Handling**: If token invalid on save, API returns 400 → design cleared from URL

### Design Code Routing
The `designCode` URL parameter (first 3 letters) determines API base URL. Values set in `constant.js`:

| Code Prefix | API Base URL | Environment |
|---|---|---|
| `DCL` | `https://api.thesolo.network/api` | Production |
| `DCT` | `https://testapi.thesolo.network/api` | Testing |
| `LDC` | `https://leafapi.thesolo.network/api` | Leaf |
| `GSI` | `https://astateqaapi.thesolo.network/api` | AState QA |
| `DCD` | `https://devapi.thesolo.network/api` | Dev |
| `LTE` | `https://learn2earnapi.thesolo.network/api` | Learn2Earn |
| `VPS` | `https://vialtopartnersapi.thesolo.network/api` | Vialto Partners |
| `LTS` | `https://learn2earnapi.thesolo.network/api` | Learn2Earn Staging |
| `BTS` | `https://brilliancytechapi.thesolo.network/api` | Brilliancy Tech |
| `TEST` | `https://astatedevapi.thesolo.network/api` | AState Dev |
| `DCA` | `https://arkansasapi.thesolo.network/api` | Arkansas |

Additionally, `ru` parameter (base64-encoded) can override to `localhost:4900` or custom host.

### Session Error Handling
Errors caught in `loadDesignerSession()` → `.catch()`:
- `isOptionalDesignerSessionError()` returns `true` if:
  - Message is `"Missing design code."`
  - Message is `"Designer API is not configured for this design code."`
- If optional error: shown silently, editor loads blank
- If other error: shows toast `"Unable to start designer session."`, editor loads blank

---

## 3. Canvas & Workarea

### Canvas Dimensions Per Mode

**Badge (Square)**
- Workarea: 600px × 600px
- Background: Transparent (PNG)
- Scale: `scaleX: 1.2, scaleY: 1.2`
- Layout: `'fixed'`

**Certificate Portrait (A4)**
- Workarea: 618px × 800px  
- Background: White (#fff)
- Layout: `'fixed'`

**Certificate Landscape (A4)**
- Workarea: 800px × 618px
- Background: White (#fff)
- Layout: `'fixed'`

All defined in `constant.js` as `JSON_CONSTANT.BADGE`, `JSON_CONSTANT.PORTRAIT_CERTIFICATE`, `JSON_CONSTANT.LANDSCAPE_CERTIFICATE`.

### Canvas Container Styling
```javascript
// Badge
{ width: '600px', height: '600px' }

// Portrait
{
  width: '618px', height: '800px',
  backgroundColor: '#FFFFFF',
  boxShadow: '2px 2px 16px 0px rgb(242,244,248)'
}

// Landscape
{
  width: '800px', height: '618px',
  backgroundColor: '#FFFFFF',
  boxShadow: '2px 2px 16px 0px rgb(242,244,248)'
}
```

### Zoom Behavior
- **Min zoom**: 1x (100%)
- **Max zoom**: 500x (50000%)
- **Zoom step**: 0.05 (5% per action)
- **Methods**:
  - `zoomIn()`: multiply zoom by (1 + step)
  - `zoomOut()`: divide zoom by (1 + step)
  - `zoomOneToOne()`: set to 100%
  - `zoomToFit()`: fit workarea in viewport
  - `zoomToRatio(ratio)`: set to specific ratio (0.5, 0.75, 1.25, 1.5, 2, etc.)
- **Keyboard shortcuts**: `+`/`-` to zoom, `O` for 100%, `P` for fit

### Grid, Rulers, Guides
**Grid**
- `enabled`: toggle in state (default: false)
- `grid`: 10px spacing
- `snapToGrid`: separate toggle, enables snapping (default: false)
- `lineColor`: `'rgba(255, 108, 54, 0.13)'`
- `borderColor`: `'rgba(255, 108, 54, 0.28)'`

**Rulers**
- `enabled`: toggle in state (default: true)
- Shows tick marks at 100px intervals
- Top ruler: 7 ticks for badges (0-600), 9 ticks for certificates (0-800)

**Guides**
- `enabled`: toggle in state (default: true)
- Shows alignment guides when dragging objects near other objects

**Selection Color**: `'rgba(255, 136, 94, 0.3)'` (orange overlay on selection)

### Canvas Coordinate System
- **Origin**: Top-left of workarea
- **X-axis**: Left to right
- **Y-axis**: Top to bottom
- **Units**: Pixels
- **Transformations**: Objects support `left`, `top`, `angle`, `scaleX`, `scaleY`, `flipX`, `flipY`

---

## 4. Object Types & Their Properties

All objects are **Fabric.js** objects with custom extensions. Each object has:
- `id`: unique identifier (required for persistence)
- `name`: user-facing label
- `type`: shape/element type
- `superType`: category (e.g., 'element', 'svg')
- `locked`: prevents drag/resize
- `visible`: show/hide on canvas
- `left`, `top`: position
- `width`, `height`: dimensions
- `scaleX`, `scaleY`: scale factors
- `angle`: rotation (0-360)
- `fill`: color
- `stroke`, `strokeWidth`: border
- `opacity`: 0-1
- `shadow`: drop shadow config

### Object Type: `textbox` (Multi-line Text)
**Properties in right panel**:
- **General**: locked, visible, name, width, height, left, top, angle
- **Text**: text content, font family, font size, bold, italic, underline, strikethrough, alignment (left/center/right), line height, char spacing
- **Style**: fill (text color), stroke, strokeWidth
- **Shadow**: enabled, blur, offsetX, offsetY

**Special features**:
- Editable on double-click in canvas
- Supports variable tokens like `[RecipientName]`
- `calcTextHeight()` method for proof validation
- `fontFamily` supports system fonts (Arial, Helvetica, etc.) and web fonts (loaded via FontAwesome, Google Fonts)

### Object Type: `i-text` (Interactive/Inline Text)
**Properties**:
- Same as `textbox` plus **Icon** section
- **Icon** section allows selecting Font Awesome icons
- Sets font to "Font Awesome 5" variants (Brands, Regular, Free)
- Converts icon unicode to text character

### Object Type: `image`
**Properties**:
- **General**: locked, visible, name, width, height, left, top, angle
- **Image**: load type (file upload or URL), file or src
- **Filter**: gamma, brightness, contrast, saturation, hue, noise, pixelate, blur (each toggle + values)
- **Style**: fill, stroke, strokeWidth
- **Shadow**: enabled, blur, offsetX, offsetY

**Special features**:
- Supports drag/drop from panel
- Can crop (via header toolbar crop button)
- Apply filters non-destructively

### Object Type: `rect` (Rectangle)
**Properties**:
- **General**: locked, visible, name, width, height, left, top, angle
- **Style**: fill, stroke, strokeWidth, rx (corner radius X), ry (corner radius Y)
- **Shadow**: enabled, blur, offsetX, offsetY

### Object Type: `circle`
**Properties**:
- **General**: locked, visible, name, width, height, left, top, angle
- **Style**: fill, stroke, strokeWidth
- **Shadow**: enabled, blur, offsetX, offsetY

### Object Type: `triangle`
**Properties**:
- **General**: locked, visible, name, width, height, left, top, angle
- **Style**: fill, stroke, strokeWidth
- **Shadow**: enabled, blur, offsetX, offsetY

### Object Type: `line` (Drawing)
**Properties**:
- **General**: locked, visible, name, left, top, angle
- **Style**: stroke, strokeWidth
- **Shadow**: enabled, blur, offsetX, offsetY

### Object Type: `arrow` (Drawing)
Same as line, but with arrow head.

### Object Type: `svg` (Vector)
**Properties**:
- **General**: locked, visible, name, width, height, left, top, angle
- **Style**: fill, stroke, strokeWidth
- **Shadow**: enabled, blur, offsetX, offsetY

**Special features**:
- Can be added from SVG modal (paste raw SVG)
- Sanitized via `sanitizeSvgText()` to prevent XSS
- Rendered as Fabric Group containing SVG elements

### Object Type: `group` (Selection/Grouping)
**Properties**:
- **General**: locked, visible, name, left, top, angle
- **Shadow**: enabled, blur, offsetX, offsetY

**Actions**:
- **Group**: select multiple objects → right-click "Group" → creates single group
- **Ungroup**: select group → right-click "Ungroup" → breaks back to individual objects
- Bounding box = union of all child objects

### Object Type: `element` (HTML/Chart)
**Properties**:
- **General**: locked, visible, name, left, top, width, height, angle (no rotation for elements)
- Type-specific: varies by element kind (chart, iframe, video, etc.)

**Special features**:
- Renders as actual HTML/CSS over canvas
- Charts use `ChartProperty` with script input
- Videos use VideoProperty with autoplay, loop, muted options
- iFrames use IframeProperty with src

---

## 5. Left Panel — Assets & Templates

### Panel Structure
Fixed-width sidebar with vertical tab navigation (rail) on far left, expandable content panel on right.

**Tab Navigation** (top to bottom):
1. **Designs** (badge/cert, admin-hidden)
   - Icon: `AppstoreOutlined`
   - Shows: `BadgeDesign.js` or `Design.js` component
   
2. **Templates** (certificate path)
   - Icon: `ProfileOutlined`
   - Shows: `Templates.js` component
   - Displays: templates grouped by page size (portrait/landscape)
   
3. **Templates** (badge path) → Shows badge backgrounds
   - Icon: `ProfileOutlined`
   - Shows: `BadgeBackground.js`
   
4. **Shapes** (badge path only)
   - Icon: `PictureOutlined`
   - Shows: component library (rect, circle, text, etc.)

5. **Components**
   - Icon: `LayoutOutlined`
   - Searchable component library loaded from `Descriptors.json`
   - Supports drag-to-canvas or click-to-add
   
6. **Attributes**
   - Icon: `TagOutlined`
   - Special elements (QR code, badges, credential metadata)

### Collapse/Expand
- Minimize button (far left) collapses content area
- Collapsed state: `minimize` CSS class applied
- When collapsed: only icons visible, text hidden

### Component/Template Rendering
All items (components, templates, designs) render as draggable buttons:

```jsx
<button
  draggable
  onDragStart={e => this.events.onDragStart(e, item)}
  onClick={handleClick}  // or handleTemplateClick for templates
>
  <span className="rde-editor-items-item-icon"><Icon /></span>
  <span className="rde-editor-items-item-text">{item.name}</span>
</button>
```

**Drop Handling**:
- Drag over canvas → `dragover` event fires
- Drop on canvas → `drop` event fires
- Position calculated from drop coordinates
- Calls `handler.add(option, false)` with calculated position

### Template Browser (`Templates.js`)
**Load Flow**:
1. `useEffect` calls `loadDesignerSession()` on mount
2. GET `/templates/getAllCertificateTemplates` with auth header
3. Response: `{ templates: [...] }`
4. Filter into portrait/landscape by `pageSize` field
5. Render in responsive grid

**Click Handler** (`handleTemplateClick`):
1. Loader shown (`mainLoader(true)`)
2. GET `/templates/getCertificateTemplate/{id}` with auth
3. Parse response: extract `data.templateCode` → `getCanvasObjects()`
4. Call `onPageSizeChange(pageSize)` to resize canvas
5. Call `handler.clear(true)` → `handler.importJSON(objects)`
6. Call `onApplyCanvasAsset()` and `onCanvasChange(true)`

### Badge Design Browser (`BadgeDesign.js`)
**Load Flow**:
1. GET `/templates/getalluserbadgeTemplates` with auth
2. Response: `{ badges: [...] }`
3. Render grid

**Click Handler**:
1. GET `/templates/getuserBadgeTemplate/{id}`
2. Get objects, prepend `CONSTANTS.JSON_CONSTANT.BADGE`
3. Same import flow as template browser

### Badge Background Browser (`BadgeBackground.js`)
Similar to BadgeDesign but loads template backgrounds (not user designs).

---

## 6. Layer Panel

Accessed via **layer list button** in header toolbar (icon: `layer-group`). Popover shows all layers.

### Layer Display
```
Search box (filter by name or type)
Up/Down buttons (for reordering)
---
[Icon] Layer Name
  [Duplicate] [Delete]
[Icon] Another Layer
  [Duplicate] [Delete]
...
```

### Features
- **Search**: Filter layers by name or type (case-insensitive)
- **Reorder**: Up/Down buttons move selected layer in z-order
- **Select**: Click layer → `handler.select(obj)`
- **Duplicate**: Duplicate button (no undo) → `handler.duplicateById(obj.id)`
- **Delete**: Delete button → `handler.removeById(obj.id)`
- **Double-click**: Zoom to center of layer → `handler.zoomHandler.zoomToCenter()`
- **Icon**: Shows layer type (text, image, shape, etc.)
- **Highlight**: Selected layer row highlighted with `selected-item` class

### Empty State
- If no layers: "No layers yet" + "Add text, images, or shapes to build the design."
- If search query matches nothing: "No matching layers" + "Try a different layer name or type."

### Hidden Layers
Objects with `id === 'workarea'` or `id === 'grid'` or `superType === 'port'` are **excluded** from layer list.

---

## 7. Right Panel — Property Inspector

Dynamically shown/hidden based on **selected object type**. Rendered via `ImageMapConfigurations` component which:

1. Gets `selectedItem` from props
2. Looks up object type in `PropertyDefinition`
3. Renders each property section component

### Property Sections by Type

| Type | Sections | Notes |
|------|----------|-------|
| `textbox` | General, Text, Style, Shadow | Text-specific font/alignment controls |
| `i-text` | General, Icon, Style, Shadow | Icon picker for Font Awesome |
| `image` | General, Image, Filter, Style, Shadow | Image source, filters (gamma, brightness, etc.) |
| `rect`, `circle`, `triangle` | General, Style, Shadow | Basic shape properties |
| `line`, `arrow` | General, Style, Shadow | Drawing objects |
| `svg` | General, Style, Shadow | Vector fill/stroke |
| `group` | General, Shadow | Grouped objects |
| `map` | Map, Image | Special map property |

### General Section (`GeneralProperty.js`)
Common to all types:
- **Locked** (toggle): `lockMovementX`, `lockMovementY`, `hasControls`, cursor → `'pointer'`
- **Visible** (toggle): controls `visible` property
- **Name** (text input): object name (disabled if `name === 'attribute'`)
- **Width** (number): scaled width = `width * scaleX`
- **Height** (number): scaled height = `height * scaleY`
- **Left** (number): X position
- **Top** (number): Y position
- **Angle** (slider 0-360): rotation

### Text Section (`TextProperty.js`)
For `textbox` and `i-text`:
- **Font Family** (select): searchable dropdown of all fonts
- **Font Size** (number): 6-240px
- **Bold** (toggle): `fontWeight: 'bold'` or `'normal'`
- **Italic** (toggle): `fontStyle: 'italic'` or `'normal'`
- **Underline** (toggle): `textDecoration: 'underline'`
- **Strikethrough** (toggle): `textDecoration: 'line-through'`
- **Text Alignment** (radio): left/center/right/justify
- **Line Height** (number): multiplier
- **Character Spacing** (number): pixels
- **Text Content** (textarea): raw text with variable token support

### Image Section (`ImageProperty.js`)
For `image` objects:
- **Image Load Type** (radio): `'file'` or `'src'`
- If `'file'`: **File Upload** button → drag/upload PNG
- If `'src'`: **URL Modal** → paste image URL

### Style Section (`StyleProperty.js`)
For all objects:
- **Fill Color** (color picker): object fill color
- **Stroke Color** (color picker): object stroke/border color
- **Stroke Width** (select 1-12): border thickness
- **Corner Radius** (for rect only):
  - **RX** (number): horizontal corner radius
  - **RY** (number): vertical corner radius

### Filter Section (`ImageFilterProperty.js`)
For `image` objects only:
- **Gamma** (3 sliders R/G/B): color balance
- **Brightness** (slider): overall brightness
- **Contrast** (slider): contrast
- **Saturation** (slider): color saturation
- **Hue** (slider): color rotation
- **Noise** (slider): noise amount
- **Pixelate** (slider): pixelation block size
- **Blur** (slider): blur radius

Each filter has enable/disable toggle.

### Shadow Section (`ShadowProperty.js`)
For all objects:
- **Enabled** (toggle): turn shadow on/off
- If enabled:
  - **Blur** (number): blur radius
  - **Offset X** (number): horizontal offset
  - **Offset Y** (number): vertical offset

### Animation Section (if applicable)
- **Type** (select): 'none', 'fade', 'slide', etc.
- **Loop** (toggle): repeat animation
- **Autoplay** (toggle): start automatically
- **Duration** (number): milliseconds

### Form Change Propagation
All property changes trigger `onChange(selectedItem, changedValues, allValues)`:

```javascript
onPropertyChange = (selectedItem, changedValues, allValues) => {
  const changedKey = Object.keys(changedValues)[0];
  const changedValue = changedValues[changedKey];
  
  // Special handling for specific keys:
  if (changedKey === 'width' || changedKey === 'height') {
    handler.scaleToResize(allValues.width, allValues.height);
    return;
  }
  if (changedKey === 'angle') {
    handler.rotate(allValues.angle);
    return;
  }
  // ... more special cases
  
  // Default: set on active object
  handler.set(changedKey, changedValue);
};
```

---

## 8. Toolbar Features (Header)

Located above canvas in `ImageMapHeaderToolbar.js`.

### Page Size Switcher
**For certificates only** (hidden on badges):
- Dropdown: "Page Size"
- Options: `'a4portrait'`, `'a4landscape'`
- On change: `handlePageSizeChange()` → resizes workarea and re-imports JSON with new background preset

### Collapse/Expand Inspector
- Button: Toggle arrow (`angle-double-left` / `angle-double-right`)
- Effect: Adds `'minimize'` class to inspector panel
- Tooltip: "Collapse inspector" / "Expand inspector"

### Layer List Button
- Button: Layer icon (`layer-group`)
- Opens popover with `ImageMapList` component
- Pressing `ESC` closes popover
- Tooltip: "Canvas layers"

### Undo/Redo Buttons
- **Undo**: Icon `undo-alt`, disabled if `!transactionHandler.undos.length`
- **Redo**: Icon `redo-alt`, disabled if `!transactionHandler.redos.length`
- Shortcuts: `Ctrl+Z` (undo), `Ctrl+Y` / `Ctrl+Shift+Z` (redo)
- Disabled during crop mode

### Object Action Buttons (when object selected)
Shown only if `selectedItem` is not null:

- **Save Image**: Icon `image` → `handler.saveImage()` → downloads object as PNG
- **Duplicate**: Icon `clone` → `handler.duplicate()`
- **Delete**: Icon `trash` → `handler.remove()`

### Advanced Object Actions (Popover or Expanded)
Toggled by "More" button (ellipsis) or expanded if `collapse` state is true:

**Ordering**:
- **Bring Forward**: Icon `angle-up` → `handler.bringForward()`
- **Send Backwards**: Icon `angle-down` → `handler.sendBackwards()`
- **Bring to Front**: Icon `angle-double-up` → `handler.bringToFront()`
- **Send to Back**: Icon `angle-double-down` → `handler.sendToBack()`

**Alignment**:
- **Align Left**: Icon `align-left` → `alignmentHandler.left()`
- **Align Center**: Icon `align-center` → `alignmentHandler.center()`
- **Align Middle**: Icon `arrows-alt-v` → `alignmentHandler.middle()`
- **Align Right**: Icon `align-right` → `alignmentHandler.right()`

**Grouping**:
- **Group**: Icon `object-group` → `handler.toGroup()` (combine selected into group)
- **Ungroup**: Icon `object-ungroup` → `handler.toActiveSelection()` (break apart group)

### Crop Controls (conditional)
Only shown if object type supports cropping and is selected:

- **Start Crop**: Icon `crop` → `handler.cropHandler.start()` (disabled if not croppable)
- **Finish Crop**: Icon `check` → `handler.cropHandler.finish()` (disabled if no crop rect)
- **Cancel Crop**: Icon `times` → `handler.cropHandler.cancel()` (disabled if no crop rect)

All buttons disabled during crop mode except crop-specific buttons.

---

## 9. Toolbar Features (Footer)

Located below canvas in `ImageMapFooterToolbar.js`.

### Interaction Mode Buttons
Two-button group (left/right rounded):

**Selection Mode** (`Q` key):
- Icon: `mouse-pointer`
- Activates object selection/manipulation mode
- Disables drawing mode
- Primary when `interactionMode === 'selection'`

**Grab/Pan Mode** (`W` key or hold `Space`):
- Icon: `hand-rock`
- Activates canvas pan/drag mode
- Disables selection
- Primary when `interactionMode === 'grab'`

### Zoom Controls
Four-button group (full width, left-right-center-right rounded):

**Zoom Out** (`-` key):
- Icon: `search-minus`
- Calls `handler.zoomHandler.zoomOut()`

**Zoom Presets** (dropdown):
- Display: Current zoom percentage (e.g., `"100%"`)
- Popover options:
  - Fit canvas
  - 50%
  - 75%
  - 100%
  - 125%
  - 150%
  - 200%
- ESC key closes popover

**Zoom to Fit** (`P` key):
- Icon: `expand`
- Calls `handler.zoomHandler.zoomToFit()`

**Zoom In** (`+` key):
- Icon: `search-plus`
- Calls `handler.zoomHandler.zoomIn()`

### Canvas Aids (toggles)
Four-button group with primary styling when active:

**Grid** (`th` icon):
- Toggles `gridEnabled` state
- Shows/hides 10px grid
- Primary when `gridEnabled === true`

**Snap** (`magnet` icon):
- Toggles `snapToGrid` state
- Snap-to-grid enabled → grid auto-enabled
- Primary when `snapToGrid === true`

**Guides** (`ruler-combined` icon):
- Toggles `guidesEnabled` state
- Shows/hides smart alignment guides
- Primary when `guidesEnabled === true`

**Rulers** (`ruler-horizontal` icon):
- Toggles `rulersEnabled` state
- Shows/hides pixel rulers along edges
- Primary when `rulersEnabled === true`

### Help (Keyboard Shortcuts)
- Icon: `keyboard`
- Popover displays:
  ```
  Q    Select
  W    Pan canvas
  Space    Hold to pan temporarily
  Alt    Temporary pan while dragging
  +/-    Zoom in/out
  O    100% zoom
  P    Fit canvas
  Ctrl+Z    Undo
  ```

---

## 10. Save & Publish Flow

### Full Save Sequence (User Click → API Response)

1. **User clicks "Save & Close" button**
   - Validates design name: `!normalizeDesignName(inputData)` → shows error toast, return
   - Runs proof validation: `runDesignProofValidation({ showMessage: false })`
   - If blocking issues exist: return (prevents save)
   - Sets `isSaving: true` → button disabled, loading spinner

2. **Export Canvas Objects**
   ```javascript
   const objects = handler.exportJSON().filter(obj => obj.id); // remove null IDs
   objects.shift(); // remove background/workarea
   
   // Prefix with correct background
   if (isCertificatePath) {
     if (pageSize === 'a4landscape') {
       objects.unshift(CONSTANTS.JSON_CONSTANT.LANDSCAPE_CERTIFICATE);
     } else {
       objects.unshift(CONSTANTS.JSON_CONSTANT.PORTRAIT_CERTIFICATE);
     }
   }
   ```

3. **Create FormData**
   ```javascript
   const blob = dataUrlToBlob(getCanvasImageDataUrl(option)); // PNG image
   const formData = new FormData();
   formData.append('image', blob, 'image.png');
   formData.append('name', designName);
   formData.append('pageSize', pageSize); // 'a4portrait'|'a4landscape'|undefined
   formData.append('designCode', designCode);
   
   if (isAdminPath) {
     formData.append('templateCode', JSON.stringify(exportDatas));
     if (isBadgePath && hasAttribute) {
       formData.append('type', 'template'); // or 'background'
     }
   } else {
     formData.append('jsonCode', JSON.stringify(exportDatas));
   }
   ```
   
   Where `exportDatas = { objects, animations, styles, dataSources }`

4. **Determine Endpoint**
   | Path | Design Type | Endpoint |
   |------|---|---|
   | Admin Certificate, Create | New | `/templates/createcertificateTemplate` (POST) |
   | Admin Certificate, Edit | Existing | `/templates/editCertificateTemplate/{id}` (PATCH) |
   | Admin Badge, Create | New | `/templates/createBadgeTemplate` (POST) |
   | Admin Badge, Edit | Existing | `/templates/editBadgeTemplate/{id}` (PATCH) |
   | User Certificate, Create | New | `/templates/saveCertificateDesign` (POST) |
   | User Certificate, Edit | Existing | `/templates/editCertificateDesign/{id}` (PATCH) |
   | User Badge, Create | New | `/templates/saveBadgeDesign` (POST) |
   | User Badge, Edit | Existing | `/templates/editBadgeDesign/{id}` (PATCH) |

5. **Send Request**
   ```javascript
   const response = await fetchDesignerJson(endpoint, {
     method: 'POST' | 'PATCH',
     headers: authHeaders(accessToken),
     body: formData
   });
   ```

6. **Handle Response**
   - Success (2xx):
     ```javascript
     {
       "id": UUID,
       "name": "Design Name",
       "TemplateName": "Design Name" (admin only)
     }
     ```
     - Update state: `inputData`, `isInputEmpty`, `editing = false`
     - Show success toast (10 sec timeout)
     - Update URL: remove edit params, set `sk=0`
     - Redirect if not in a design template context:
       - Admin: → `/template-manager?type=certificate|badge&pg=ls|pt&sk=0`
       - User template: → `/template-designs?type=certificate|badge&pg=ls|pt`
       - User credential: → `/credential-template?type=...&cid=...&bid=...&ctid=...&design=true&pg=...`

   - Error:
     - Toast shows error message
     - `editing` remains true
     - Design NOT cleared from state

### Auto-Save Mechanism
- **Interval**: Every 30 seconds (`setInterval(..., 30000)`)
- **Condition**: Only if `createTemplateCalled === true` AND `editing === true`
- **Method**: Calls `editTemplate('autoSave')` internally
- **Differences**:
  - No design name validation
  - No toast on success (silent)
  - No redirect on success
  - Stores `autoSaveId` for future saves
  - Shows "autosaved" message in title area (10 sec)
- **Cleanup**: `clearInterval(this.autoSave)` on unmount

### Create vs Edit Difference
**Create** (new design):
- Called when no `session.designId` and no `edit=true`
- Endpoint: `...createCertificateTemplate` or `...saveBadgeDesign`
- Method: POST
- Response includes `id` → stored as `autoSaveId`
- Next save uses this `id` as edit

**Edit** (existing design):
- Called when `edit=true` and `id` provided, or `session.designId` exists
- Endpoint: `...editCertificateTemplate/{id}` or `...editBadgeDesign/{id}`
- Method: PATCH
- Response includes updated `id` (usually same)

### Admin vs User Save
**Admin Path** (`isAdminPath === true`):
- Includes `templateCode` (full JSON) in FormData
- Includes `type` field for badges ('template' or 'background')
- Used for template management (can be applied to many credentials)
- Returns to template manager

**User Path** (`isAdminPath === false`):
- Includes `jsonCode` (full JSON) in FormData
- Tied to specific credential/badge ID via URL params
- Used for customizing designs for specific credentials
- Returns to credential template page

### Error Handling
- Network error: Shows error toast, `isSaving = false`, design NOT saved
- 400 response: `statusCode === 400` → clears URL query, resets design
- Other API errors: Toast with message from `error.message` or `error.error`
- Validation error (proof): Blocks save with warning toast

---

## 11. Load / Edit Flow

### Load Existing Design (Edit Mode)

**Trigger**: URL has `edit=true` and `id=xyz`, OR `session.designId` is set

1. **Fetch design from API**:
   ```javascript
   const endpoint = isAdminPath
     ? isBadgePath
       ? `/templates/getBadgeTemplate/{id}`
       : `/templates/getCertificateTemplate/{id}`
     : isBadgePath
     ? `/templates/getUserBadgeTemplate/{id}`
     : `/templates/getUserCertificateTemplate/{id}`;
   
   const data = await fetchDesignerJson(endpoint, {
     headers: authHeaders(accessToken),
     allowErrorPayload: true  // returns 400 with body instead of error
   });
   ```

2. **Check response**:
   - If `statusCode === 400`: Design not found
     - Clear URL: `window.history.replaceState()` removes `id` and `edit`
     - Reset state to blank
     - Return (user can create new)
   
   - If `statusCode !== 400` and has `templateCode`:
     - Extract: `const objects = getCanvasObjects(data.templateCode)`
     - Set `pageSize` state from `data.pageSize`
     - Set `inputData` (design name) from `data.name`

3. **Import objects to canvas**:
   ```javascript
   const importObjects = isBadgePath 
     ? [CONSTANTS.JSON_CONSTANT.BADGE, ...objects]
     : objects; // certificates already have background
   
   handler.clear(true);
   setTimeout(() => {
     handler.importJSON(importObjects);
   }, 50); // Small delay to ensure canvas ready
   ```

4. **UI state**:
   - `loading: false`
   - `inputData: designName`
   - `isInputEmpty: false`
   - `selectedPageSize: pageSize`
   - `editing: false` (just loaded, no changes yet)

### Template Loading (from Template Browser)

**Trigger**: User clicks template in left panel

1. **Fetch template** (same as edit, different endpoint)
2. **Extract objects** from `templateCode`
3. **Apply page size** if certificate:
   ```javascript
   onPageSizeChange(template.pageSize);
   ```
4. **Clear and import**:
   ```javascript
   handler.clear(true);
   handler.importJSON(objects);
   ```
5. **Mark changed**: `onCanvasChange(true)` → sets `editing: true`

### JSON Import Flow (from file upload)

**Trigger**: User clicks "Upload" button (admin only) or imports JSON

1. **File input dialog**: Filter: `.json` files only
2. **Read file**: `FileReader.readAsText(file)`
3. **Parse JSON**:
   ```javascript
   const parsed = JSON.parse(rawJson);
   if (!Array.isArray(parsed.objects)) {
     throw new Error('...does not contain valid designer objects.');
   }
   const { objects, animations = [], styles = [], dataSources = [] } = parsed;
   ```

4. **Validate structure**:
   - Must have `objects` array
   - Must not be malformed JSON

5. **Import**:
   ```javascript
   const importObjects = isBadgePath
     ? [CONSTANTS.JSON_CONSTANT.BADGE, ...objects]
     : objects;
   
   handler.clear(true);
   handler.importJSON(importObjects);
   
   setState({
     animations,
     styles,
     dataSources,
     editing: true,
     proofIssues: []
   });
   ```

6. **Error handling**: Catches JSON parse errors, shows toast "Unable to import design JSON."

### Load Failure Handling
- **Canvas not ready**: "Canvas is still loading. Please try again in a moment."
- **API error**: "Unable to load the selected design."
- **Invalid JSON**: "The selected JSON file does not contain valid designer objects."
- **Session expired**: "Designer session expired. Refresh and try again."

---

## 12. Variable System

### Variable Tokens (Complete List)
All defined in `designVariables.js`:

**Issuer Variables**:
- `[IssuerName]` → Issuing organization name
- `[IssuerLogo]` → Issuer's logo image
- `[IssuerWebsite]` → Issuer's website URL

**Credential Variables**:
- `[CredentialId]` → Unique credential identifier
- `[CredentialName]` → Credential title/name
- `[IssueDate]` → Date credential was issued
- `[ExpiryDate]` → Date credential expires
- `[startDate]` → Credential validity start
- `[endDate]` → Credential validity end
- `[Url]` → Credential verification URL
- `[Uuid]` → Unique credential UUID
- `[Level]` → Achievement level/tier
- `[QRCode]` → QR code for credential link

**Recipient Variables**:
- `[RecipientName]` → Name of badge/cert earner

### How They Work in Text Elements
1. User types text in textbox/i-text
2. User can insert token names: `"Congratulations, [RecipientName]!"`
3. On export/proof: system detects tokens via regex: `/\[[A-Za-z0-9_]+\]/g`
4. Unknown tokens (not in list above) trigger proof warning: `"uses unknown variable token(s): ..."`
5. On final render (backend): tokens replaced with actual data from credential metadata

### Proof Validation of Tokens
**Unknown Token Check** (in `designProof.js`):
```javascript
function getUnknownVariableTokens(text) {
  const matches = text.match(/\[[A-Za-z0-9_]+\]/g) || [];
  return Array.from(new Set(matches))
    .filter(token => !DESIGN_VARIABLE_TOKENS.includes(token));
}

if (unknownTokens.length > 0) {
  issues.push({
    severity: 'warning',
    message: `${label} uses unknown variable token(s): ${unknownTokens.join(', ')}.`
  });
}
```

**Text Overflow Check**:
```javascript
const textHeight = object.calcTextHeight();
if (textHeight > object.height + SAFE_AREA_TOLERANCE) {
  issues.push({
    severity: 'warning',
    message: `${label} may overflow its text box after variable replacement.`
  });
}
```

Note: `SAFE_AREA_TOLERANCE` is undefined in code (likely should be 0-10px), but check is still performed.

---

## 13. Proof / Validation System

### What Checks Run
Located in `getDesignProofIssues()` (designProof.js):

For **each canvas object** (excluding workarea and grid):

1. **Size Check**: 
   - Warning: `"has no printable size."` if `width === 0` or `height === 0`

2. **Unknown Variables Check**:
   - Warning: Lists unknown token names if found in text

3. **Text Overflow Check**:
   - Warning: Text box height less than content height

4. **QR Code Checks** (if object is `name === 'attribute-qr'`):
   - Warning: No image source (`!src`)
   - Warning: Size < 80px × 80px (for reliable scanning)

5. **General Issues**:
   - Error: Canvas workarea not ready (if handler or workarea missing)

### When They Run
**On-Demand** (user clicks "Proof" button):
- Calls `runDesignProofValidation({ showMessage: true })`
- Shows toast with summary: "Proof check: {first issue} (+N more)"
- Opens modal if button clicked showing full issue list

**On Save** (user clicks "Save & Close"):
- Calls `runDesignProofValidation({ showMessage: false })`
- Extracts blocking issues (severity === 'error')
- If blocking issues exist: prevents save with error toast

**On Mount**:
- Not automatically run on load
- Only run on-demand

### Blocking vs Warning
- **Severity: 'error'**: Blocks save (blocking issue)
- **Severity: 'warning'**: Doesn't block save, but shown in proof modal

**Blocking Issues Only**:
- Canvas workarea not ready

**Warning Issues**:
- All others (size, variables, overflow, QR code)

### Proof Modal
Accessible via:
- "Proof" button in header (always visible)
- "Proof checks: N issue(s)" button (appears when issues found during edit)

**Content**:
- If issues: bulleted list with severity badge + message
- If no issues: "No proof issues found" + "The current design passes all variable, overflow, and scan-size checks."

---

## 14. Export

### PNG Export
Triggered by **"Save Image"** button in header toolbar:

```javascript
handler.saveImage();
```

**Process**:
1. Cache viewport transform
2. Hide grid objects
3. Set viewport to identity matrix (no zoom)
4. Call `canvas.toDataURL({ left: 0, top: 0, width, height, multiplier: 1, enableRetinaScaling: true })`
5. Convert dataURL to blob
6. Trigger download: `<a href={dataUrl} download={name}.png>`
7. Restore viewport and grid visibility

**Result**: PNG image file of selected object (just the object, not canvas background)

**Canvas Image** (via `handler.saveCanvasImage()`):
- Exports entire workarea as PNG
- Includes background (white for certificates, transparent for badges)
- Used internally for thumbnail generation before save

### JSON Export
Triggered by **Download button** (admin only):

```javascript
handler.exportJSON()
  .filter(obj => obj.id)  // Remove objects without IDs
```

**Format**:
```json
{
  "objects": [
    { "id": "...", "type": "textbox", "text": "...", ... },
    { "id": "...", "type": "image", "src": "...", ... },
    ...
  ],
  "animations": [],
  "styles": [],
  "dataSources": []
}
```

**Download**: Triggers browser download as `{designName}.json`

### What's Excluded from Export
- `id === 'workarea'`: Background layer (re-added on import)
- `id === 'grid'`: Grid overlay (not needed)
- Objects without `id` property
- Port objects (`superType === 'port'`)

---

## 15. Keyboard Shortcuts

### Keyboard Handler (in `ImageMapEditor`)

| Key | Action |
|-----|--------|
| `Ctrl+Z` | Undo last action |
| `Ctrl+Y` or `Ctrl+Shift+Z` | Redo |
| `Ctrl+A` | Select all objects |
| `Ctrl+C` | Copy selected |
| `Ctrl+X` | Cut selected |
| `Ctrl+V` | Paste from clipboard |
| `Delete` or `Backspace` | Delete selected |
| `Escape` | Deselect all, clear active |
| `Q` | Switch to selection mode |
| `W` | Switch to grab/pan mode |
| `Space` (hold) | Temporary grab/pan (released on keyup) |
| `+` or `=` | Zoom in |
| `-` or `_` | Zoom out |
| `O` | Zoom to 100% (one-to-one) |
| `P` | Zoom to fit canvas |

### Conditions
Shortcuts ignored if:
- Target is `input`, `textarea`, or `select` element
- `contentEditable` element is focused
- Ant Design modal, dropdown, or popover is open
- Canvas wrapper is not `document.activeElement` (canvas not focused)

### Implementation
- `handleEditorShortcutKeyDown`: on keydown event
- `handleEditorShortcutKeyUp`: on keyup (only for Space key)
- `shouldIgnoreEditorShortcut()`: checks if shortcut should be ignored

---

## 16. API Endpoints — Complete List

All endpoints prefixed with API base URL (from design code routing).

### Session / Auth Endpoints

| Method | Path | Purpose | Auth | Params | Response |
|--------|------|---------|------|--------|----------|
| GET | `/templates/getusertoken/{designCode}` | Get session token | None | `{designCode}` | `{ accessToken, type, designId, designCode }` |

### Certificate Template Endpoints

| Method | Path | Purpose | Auth | Params | Request | Response |
|--------|------|---------|------|--------|---------|----------|
| GET | `/templates/getAllCertificateTemplates` | List all cert templates | Bearer | (query header) | - | `{ templates: [{ id, name, pageSize, ... }] }` |
| GET | `/templates/getCertificateTemplate/{id}` | Get admin cert template | Bearer | `{id}` (URL) | - | `{ templateCode, name, pageSize, ... }` |
| POST | `/templates/createcertificateTemplate` | Create new cert template (admin) | Bearer | - | FormData: image, name, pageSize, designCode, templateCode, type | `{ id, TemplateName }` |
| PATCH | `/templates/editCertificateTemplate/{id}` | Update cert template (admin) | Bearer | `{id}` (URL) | FormData: image, name, pageSize, designCode, templateCode, type | `{ id, TemplateName }` |
| GET | `/templates/getUserCertificateTemplate/{id}` | Get user cert design | Bearer | `{id}` (URL) | - | `{ templateCode, name, pageSize, ... }` |
| POST | `/templates/saveCertificateDesign` | Create user cert design | Bearer | - | FormData: image, name, pageSize, designCode, jsonCode | `{ id, name }` |
| PATCH | `/templates/editCertificateDesign/{id}` | Update user cert design | Bearer | `{id}` (URL) | FormData: image, name, pageSize, designCode, jsonCode | `{ id, name }` |

### Badge Template Endpoints

| Method | Path | Purpose | Auth | Params | Request | Response |
|--------|------|---------|------|--------|---------|----------|
| GET | `/templates/getBadgeTemplate/{id}` | Get admin badge template | Bearer | `{id}` (URL) | - | `{ templateCode, name, ... }` |
| POST | `/templates/createBadgeTemplate` | Create new badge template (admin) | Bearer | - | FormData: image, name, pageSize, designCode, templateCode, type | `{ id, TemplateName }` |
| PATCH | `/templates/editBadgeTemplate/{id}` | Update badge template (admin) | Bearer | `{id}` (URL) | FormData: image, name, pageSize, designCode, templateCode, type | `{ id, TemplateName }` |
| GET | `/templates/getuserBadgeTemplate/{id}` | Get user badge design | Bearer | `{id}` (URL) | - | `{ templateCode, name, ... }` |
| GET | `/templates/getalluserbadgeTemplates` | List user badge designs | Bearer | - | - | `{ badges: [{ id, name, ... }] }` |
| POST | `/templates/saveBadgeDesign` | Create user badge design | Bearer | - | FormData: image, name, designCode, jsonCode | `{ id, name }` |
| PATCH | `/templates/editBadgeDesign/{id}` | Update user badge design | Bearer | `{id}` (URL) | FormData: image, name, designCode, jsonCode | `{ id, name }` |

### Badge Background Endpoints (implied, not explicitly shown in code)
Similar pattern: `/templates/getBadgeBackground`, `/templates/getAllBadgeBackgrounds`, etc.

### Form Data Fields

**For admin create/edit**:
```
image: File (PNG blob)
name: string (design name)
pageSize: 'a4portrait' | 'a4landscape' (cert only)
designCode: string
templateCode: string (JSON.stringify of { objects, animations, styles, dataSources })
type: 'template' | 'background' (badge admin only)
```

**For user create/edit**:
```
image: File (PNG blob)
name: string
pageSize: 'a4portrait' | 'a4landscape' (cert only)
designCode: string
jsonCode: string (same as templateCode)
```

### Response Shapes

**List endpoint**:
```json
{
  "templates": [
    { "id": "uuid", "name": "Template 1", "pageSize": "a4portrait", "TemplateName": "Template 1", ... },
    ...
  ]
}
```

**Get/Create/Update endpoint**:
```json
{
  "id": "uuid",
  "name": "Design Name",
  "TemplateName": "Design Name",
  "pageSize": "a4portrait",
  "templateCode": "{\"objects\":[...]}",
  "jsonCode": "{\"objects\":[...]}",
  ...
}
```

**Error response**:
```json
{
  "statusCode": 400,
  "message": "Design not found" | "Invalid request" | ...
}
```

---

## 17. Multi-tenant / Design Code System

### How Design Codes Work
Design codes are **tenant identifiers** that route requests to tenant-specific API servers.

**Format**: 3+ letter prefix (case-insensitive)
- Example: `DCL`, `DCT`, `LDC`, `GSI`, `DCD`, `LTE`, `VPS`, `LTS`, `BTS`, `TEST`, `DCA`

**Validation**: Regex pattern in `editorSession.js`: `/^[A-Za-z0-9_-]{1,128}$/i`
- Must be 1-128 chars
- Alphanumeric, underscore, hyphen
- Case-insensitive matching

**Routing** (in `constant.js`):
```javascript
const normalizedDesignCode = (designCode || '').toUpperCase();

if (normalizedDesignCode.startsWith('DCL')) {
  apiBaseUrl = 'https://api.thesolo.network/api';
} else if (normalizedDesignCode.startsWith('DCT')) {
  apiBaseUrl = 'https://testapi.thesolo.network/api';
}
// ... etc
```

### API Base URL Assignment
1. **By design code prefix** (first 3 letters)
2. **Fallback**: Environment variable `REACT_APP_API_BASE_URL` or `API_BASE_URL`
3. **Runtime override**: `ru` parameter (base64-encoded hostname)

### Known Prefixes & Environments
| Prefix | API URL | Env | Purpose |
|--------|---------|-----|---------|
| `DCL` | `https://api.thesolo.network/api` | Production | Main Solo production |
| `DCT` | `https://testapi.thesolo.network/api` | Testing | Testing/staging |
| `LDC` | `https://leafapi.thesolo.network/api` | Leaf | Leaf partner tenant |
| `GSI` | `https://astateqaapi.thesolo.network/api` | AState QA | AState QA environment |
| `DCD` | `https://devapi.thesolo.network/api` | Dev | Development |
| `LTE` | `https://learn2earnapi.thesolo.network/api` | Learn2Earn | Learn2Earn tenant |
| `VPS` | `https://vialtopartnersapi.thesolo.network/api` | Vialto | Vialto Partners |
| `LTS` | `https://learn2earnapi.thesolo.network/api` | L2E Staging | Learn2Earn staging |
| `BTS` | `https://brilliancytechapi.thesolo.network/api` | Brilliancy | Brilliancy Tech tenant |
| `TEST` | `https://astatedevapi.thesolo.network/api` | AState Dev | AState development |
| `DCA` | `https://arkansasapi.thesolo.network/api` | Arkansas | Arkansas tenant |

### URL Parameter Passing
Design code passed via URL: `?designCode=DCL...`

Example: `https://solo.app/certificate-designer?designCode=DCL-CERT-001&edit=true&id=abc123`

---

## 18. Admin vs User Mode

### Admin Path (`isAdminPath === true`)
- URL includes `/admin-certificate-designer` or `/admin-badge-designer`
- Query param check: `currentPath.includes('admin')`

**Features**:
- **Template Management**: Creates/edits templates that can be applied to many credentials
- **Template Browser**: Shows all templates (not designs) in left panel
- **Additional Buttons**: Download (export JSON), Upload (import JSON), Save Image
- **Type Field**: Badge templates can be marked as `'template'` or `'background'`
- **Endpoints**: Uses `/templates/createcertificateTemplate`, `/templates/editCertificateTemplate`, etc.
- **FormData**: Includes `templateCode` (full object JSON)
- **Redirect on Save**: Returns to `/template-manager?type=certificate|badge&pg=...`

### User Path (`isAdminPath === false`)
- URL is `/certificate-designer` or `/badge-designer`
- User designs/customizations for specific credentials

**Features**:
- **Design Browser**: Shows user's previous designs (not templates)
- **Template Browser**: Shows available templates to customize from
- **No Export Buttons**: Can't download/upload JSON
- **Endpoints**: Uses `/templates/saveCertificateDesign`, `/templates/editCertificateDesign`, etc.
- **FormData**: Includes `jsonCode` instead of `templateCode`
- **Redirect on Save**: Returns to `/credential-template?type=...&cid=...&bid=...&ctid=...&design=true`
- **Context**: Tied to specific credential via URL params (`cid`, `bid`, `ctid`)

### Left Panel Differences

**Admin Mode**:
- **Designs tab**: Hidden
- **Templates/Shapes tab**: Shows template browser
- **Components tab**: Shows component library
- **Attributes tab**: Shows attributes (QR, badges, etc.)

**User Mode**:
- **Designs tab**: Shows user's previous designs
- **Templates tab**: Shows available templates to apply
- **Components tab**: Shows component library
- **Attributes tab**: Shows attributes

### Redirect Differences on Save

**Admin**:
```javascript
window.location.href = `${REACT_APP_BASE_URL}/template-manager?type=certificate&pg=ls&sk=0`;
```

**User (regular credential)**:
```javascript
window.location.href = `${REACT_APP_BASE_URL}/credential-template?type=certificate&cid=${credId}&bid=${badgeId}&ctid=${certId}&design=true&pg=ls`;
```

**User (design template)**:
```javascript
window.location.href = `${REACT_APP_BASE_URL}/template-designs?type=certificate&pg=ls`;
```

---

## 19. State Management

### ImageMapEditor Component State (Full List)

```javascript
{
  selectedItem: null,                    // Currently selected canvas object
  zoomRatio: 1,                          // Current zoom (1 = 100%)
  preview: false,                        // Preview mode toggle
  loading: false,                        // Global loading spinner
  progress: 0,                           // File upload progress
  animations: [],                        // Animation configurations
  styles: [],                            // CSS styles
  dataSources: [],                       // Data source configs
  editing: false,                        // Design has unsaved changes
  descriptors: {},                       // Component library (from JSON)
  objects: undefined,                    // Export of canvas objects (preview)
  isInputEmpty: true,                    // Design name is empty
  inputData: '',                         // Design name (user input)
  selectedPageSize: 'a4landscape',       // 'a4portrait' | 'a4landscape' (cert only)
  currentPath: '',                       // Current URL pathname
  editId: '',                            // ID of design being edited
  templateData: [],                      // (unused)
  isEdit: false,                         // Is editing vs creating new
  isAdminPath: false,                    // Admin mode
  isCertificatePath: false,              // Certificate vs badge
  isBadgePath: false,                    // Badge vs certificate
  designCode: '',                        // Tenant code (e.g., 'DCL')
  credId: '',                            // Credential ID (user context)
  userData: '',                          // Session token data
  badgeId: '',                           // Badge ID (context)
  certId: '',                            // Cert ID (context)
  isSaving: false,                       // Save button loading state
  autoSaveId: '',                        // ID of auto-saved design
  createTemplateCalled: false,           // Has create/load been called
  successMessage: '',                    // Success toast message
  errorMessage: '',                      // Error toast message
  isDesignTemplate: false,               // Design is a template, not credential
  isAdminBadgePath: false,               // Admin badge path
  previewVisible: false,                 // Preview modal open
  previewImage: '',                      // Preview modal image data URL
  toolbarClass: '',                      // Inspector collapse class
  skip: 0,                               // Pagination skip (from URL)
  proofIssues: [],                       // Proof validation issues
  proofModalVisible: false,              // Proof modal open
  gridEnabled: false,                    // Grid display toggle
  snapToGrid: false,                     // Snap to grid toggle
  guidesEnabled: true,                   // Guides display toggle
  rulersEnabled: true,                   // Rulers display toggle
  interactionMode: 'selection'           // 'selection' | 'grab' | 'crop'
}
```

### State Change Triggers

| State | Triggered By | Effect |
|-------|---|---|
| `selectedItem` | Canvas click, layer list click | Right panel updates with properties |
| `editing` | Any canvas change | "Unsaved" indicator shown, save enabled |
| `loading` | API calls, file operations | Spinner shown |
| `inputData` | Title input field | Design name validation |
| `selectedPageSize` | Page size dropdown | Canvas resized, objects re-scaled |
| `proofIssues` | "Proof" button click or save attempt | Modal shown with issues |
| `gridEnabled` | Grid toggle button | Grid display toggled |
| `snapToGrid` | Snap toggle | Auto-enables grid if true |
| `interactionMode` | Q/W keys or footer buttons | Canvas interaction mode changed |
| `preview` | Preview toggle | (legacy, mostly unused) |

### Lifecycle Hooks

**Mount** (`componentDidMount`):
- Attach event listeners (resize, beforeunload, keyboard)
- Load descriptors JSON
- Parse session from URL
- Load design (create new or fetch existing)
- Start auto-save interval (30sec)

**Unmount** (`componentWillUnmount`):
- Remove event listeners
- Clear timers (importObjects, success message, auto-save)
- Destroy canvas handler

**Props Change**: None typically (component receives no props)

---

## 20. Known Limitations & Gaps

### Incomplete Features
1. **Preview Mode** (`this.state.preview`): State exists but UI toggle is commented out. Likely planned but not implemented.

2. **Chart Option Script**: `chartOption` property has custom sandbox execution (`SandBox.compile()`), but full chart editing is incomplete. Props exist but UI minimal.

3. **Trigger/Animation/UserProperty**: Properties exist in form definitions but limited UI. Likely for future workflow/interactivity features.

4. **DataSources**: State field exists but no UI to manage them. Likely for backend-driven content.

5. **Styles**: State field exists but `onChangeStyles` handler is defined but styles UI is not shown in right panel.

6. **Animations**: State field exists with `onChangeAnimations` handler, but animation UI limited.

### Proof Validation Gaps
1. **SAFE_AREA_TOLERANCE constant**: Defined as undefined, should likely be a number (0-20px). This affects text overflow calculation.

2. **No validation for**:
   - Object overlap/collision
   - Contrast ratio (text on background)
   - Missing images (broken src)
   - Font availability warnings
   - Color space (RGB vs CMYK for print)

3. **QR Code validation** only checks if `name === 'attribute-qr'`. Could be more generic for QR detection.

### Architecture/UI Gaps
1. **No undo/redo for property changes**: Only canvas object mutations tracked. Property panel changes not transactional.

2. **No undo for page size change**: Resizing canvas doesn't create transaction history entry (could lose work).

3. **No multi-page support**: Badges and certs are single-page only. No tab/pagination for designing multi-page documents.

4. **No collaboration/comments**: Designer is single-user, no real-time sync or design review workflow.

5. **No version history**: Only current version stored, no rollback to previous versions.

6. **No export formats**: Only PNG and JSON. No SVG, PDF, or other formats.

7. **No font file upload**: Fonts hardcoded. Can't add custom fonts.

8. **No color swatches/library**: Color picker is freeform. No brand colors or palette management.

### Performance
1. **No virtual scrolling** in component library when many items. Could be slow with 1000+ components.

2. **No debounce on property changes** except `onModified` (300ms). Rapid property changes might cause lag.

3. **Canvas export to PNG** not optimized. Large canvases (4K+) could be slow.

4. **No image compression**: Uploaded images stored as-is, could bloat saved design files.

### Error Handling
1. **Silent failures** in some cases (e.g., if canvas never loads, certain operations fail silently).

2. **No retry logic** for failed API calls. User must refresh and try again.

3. **No detailed error messages** from API propagated to user. Generic toasts shown instead.

4. **Network timeout not handled**: No timeout set on fetch calls, request could hang.

### Accessibility
1. **Canvas interaction** not keyboard-accessible beyond shortcuts. Can't tab between objects.

2. **No ARIA labels** on many toolbar buttons. Screen reader users might not understand icons.

3. **Right panel property labels** not associated with inputs via `<label>` tags.

4. **Color picker** might not be accessible to color-blind users (no patterns/textures).

### Mobile/Responsive
1. **Not designed for mobile** (no touch support, no mobile layout). Desktop-only.

2. **Fixed panel widths** don't adapt to screen size. Could overflow on small screens.

3. **No touch gestures** for zoom/pan (could add pinch-zoom, swipe).

---

## Appendix: Configuration & Defaults

### Default Canvas Options (from constants)
```javascript
const defaults = {
  propertiesToInclude: [
    'id', 'name', 'locked', 'file', 'src', 'link', 'tooltip',
    'animation', 'layout', 'workareaWidth', 'workareaHeight',
    'videoLoadType', 'autoplay', 'shadow', 'muted', 'loop',
    'code', 'icon', 'userProperty', 'trigger', 'configuration',
    'superType', 'points', 'svg', 'loadType'
  ],
  objectOption: {
    stroke: 'rgba(255, 255, 255, 0)',
    strokeUniform: true,
    resource: {},
    link: { enabled: false, type: 'resource', state: 'new', dashboard: {} },
    tooltip: { enabled: true, type: 'resource', template: '<div>{{message.name}}</div>' },
    animation: { type: 'none', loop: true, autoplay: true, duration: 1000 },
    userProperty: {},
    trigger: { enabled: false, type: 'alarm', script: 'return message.value > 0;', effect: 'style' }
  },
  workareaOption: { layout: 'fixed', ... },
  gridOption: { enabled: false, grid: 10, snapToGrid: false, ... },
  canvasOption: { selectionColor: 'rgba(255, 136, 94, 0.3)', ... }
};
```

### Key Timings
- **Auto-save interval**: 30,000ms (30 sec)
- **Import objects delay**: 50ms (allow canvas ready)
- **Success message duration**: 10,000ms (10 sec)
- **Debounce on modify**: 300ms
- **Key event debounce**: 160ms (resize fit)

---

---

## Implementation Mandate

This specification captures every functional detail, API contract, state flow, and interaction pattern of the existing Design-editor. When building the new designer:

1. **Keep all API contracts exactly as documented** — same endpoints, same request/response shapes, same auth headers, same design code routing
2. **Keep the Fabric.js canvas engine** — same object types, same JSON format, same export logic
3. **Discard all existing UI code** — build fresh with MUI v6, React 18 hooks, TypeScript strict; do not carry forward any legacy component patterns
4. **Apply the Section 0 UI direction throughout** — orange theme, premium Figma-like feel; agent decides specific components, icons, and patterns
5. **Prioritise interaction quality** — the canvas and property inspector must feel instant and responsive
6. **Ship production-ready code** — typed, tested, no dead code, no console errors
