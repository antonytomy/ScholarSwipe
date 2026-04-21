# Demo2 → ScholarSwipe Feed Integration

This document describes the integration of the demo2 folder (vanilla HTML, CSS, JavaScript) into the ScholarSwipe-master Next.js/React/TypeScript codebase as a TikTok-style scholarship discovery feed.

## Summary

The demo2 interface has been converted into modular React components with TypeScript, Tailwind CSS, and lucide-react icons. The feed is available at `/feed`.

## Directory Structure

```
ScholarSwipe-master/
├── app/
│   └── feed/
│       └── page.tsx              # Feed route - renders ScholarSwipeFeed
├── components/
│   └── feed/
│       ├── index.ts              # Barrel exports
│       ├── ScholarSwipeFeed.tsx  # Main orchestrator component
│       ├── FeedSidebar.tsx       # Sidebar: Discover, Saved, Applied, Settings
│       ├── FeedCard.tsx          # TikTok-style card + MatchPanel
│       ├── MatchPanel.tsx        # Match score, why-box, eligibility checklist
│       ├── SavedOverlay.tsx      # Saved scholarships overlay
│       ├── AppliedOverlay.tsx    # Applied scholarships overlay
│       ├── Toast.tsx             # "Shared to clipboard!" notification
│       └── NavHint.tsx           # SPACE key hint
├── hooks/
│   └── useScholarSwipeFeed.ts    # State, saved/applied, theme, keyboard nav
├── lib/
│   ├── feed-types.ts             # FeedScholarship, UserProfileData, etc.
│   └── feed-scholarships.ts      # Demo scholarship data
├── app/
│   └── globals.css               # Added .status-match, .status-miss
└── demo2/                        # Original source (unchanged)
    ├── index.html
    ├── style.css
    └── script.js
```

## Component Mapping (demo2 → React)

| demo2 Element | React Component | Notes |
|---------------|-----------------|-------|
| `aside.sidebar` | `FeedSidebar` | Nav links, settings dropdown, dark mode |
| `#feedContainer` + `.feed-item` | `ScholarSwipeFeed` + `FeedCard` | Vertical scroll-snap feed |
| `.tiktok-card` + `.card-overlay` | `FeedCard` | Gradient card, tags, amount, actions |
| `.match-panel` | `MatchPanel` | Score pill, why-box, checklist |
| `#savedOverlay` | `SavedOverlay` | Slide-in overlay for saved items |
| `#appliedOverlay` | `AppliedOverlay` | Slide-in overlay for applied items |
| `#toast` | `Toast` | Share confirmation |
| `#navHint` | `NavHint` | SPACE key hint |

## Logic Mapping (vanilla JS → React)

| Original Logic | Location | Implementation |
|----------------|----------|----------------|
| `userData`, `saved`, `applied` | `useScholarSwipeFeed` | `useState` |
| `render()` | `FeedCard` + `ScholarSwipeFeed` | Declarative React render |
| `toggleSave`, `applyScholarship` | `useScholarSwipeFeed` | `useCallback` handlers |
| `keydown` Space | `useScholarSwipeFeed` | `useEffect` + `addEventListener` |
| Dark mode toggle | `useScholarSwipeFeed` | `document.documentElement.classList` |
| Settings dropdown | `FeedSidebar` | `useState` + click-outside `useEffect` |

## Styling Migration

- **CSS variables** (`:root`) → Tailwind `--color-*` and theme in `globals.css`
- **Gradients** → Inline `style={{ background: scholarship.gradient }}`
- **Layout** → Tailwind `flex`, `grid`, `snap-y`, `snap-mandatory`
- **Icons** → Font Awesome → `lucide-react` (Rocket, Bookmark, CheckCircle2, etc.)
- **Status tags** → `.status-match`, `.status-miss` in `globals.css`

## Usage

1. **Navigate to the feed:** `/feed` or click "Discover" in the navbar
2. **Keyboard:** Press `SPACE` to scroll to the next scholarship
3. **Actions:** Save (bookmark), Share (copy to clipboard), Apply (opens link)
4. **Tabs:** Discover (feed), Saved, Applied overlays
5. **Settings:** Dark mode toggle, View Profile (signup)

## Future Enhancements

- Connect to real user profile (replace `defaultUserData` with auth context)
- Fetch scholarships from API instead of static `feedScholarships`
- Persist saved/applied to database for authenticated users
- Mobile: collapsible sidebar, swipe gestures
- Replace demo logo path with production logo
