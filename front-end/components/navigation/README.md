# Navigation Components

This directory contains reusable navigation components for the application.

## Components

### Navbar
The main navigation bar component displayed at the top of pages.

**Usage:**
```tsx
import { Navbar } from "@/components/navigation/Navbar";

<Navbar
  title="MY APP"
  showMobileMenu={true}
  showActions={true}
/>
```

**Props:**
- `title?`: string - The title displayed in the navbar (default: "POSTCRAFT")
- `showMobileMenu?`: boolean - Show/hide mobile menu button (default: true)
- `showActions?`: boolean - Show/hide action buttons (Connect/Settings) (default: true)
- `children?`: React.ReactNode - Custom content to replace default actions

**Features:**
- Responsive mobile menu (hamburger icon on mobile)
- Desktop action buttons (Connect Account, Settings)
- Customizable title
- Glass morphism effect

---

### Sidebar
The left navigation sidebar for desktop views.

**Usage:**
```tsx
import { Sidebar } from "@/components/navigation/Sidebar";

<Sidebar
  navItems={[
    { href: "/", label: "Dashboard", active: true },
    { href: "/analytics", label: "Analytics" }
  ]}
  showPlatforms={true}
/>
```

**Props:**
- `navItems?`: NavItem[] - Array of navigation items
  - `href`: string - Link URL
  - `label`: string - Link text
  - `active?`: boolean - Whether this is the active page
- `showPlatforms?`: boolean - Show/hide platform buttons section (default: true)

**Default Navigation Items:**
- Dashboard
- Analytics
- Calendar
- Messages

**Default Platforms:**
- Instagram
- Twitter
- LinkedIn
- YouTube

**Features:**
- Only visible on desktop (md breakpoint and up)
- Active state styling (black background for active link)
- Platform integration buttons
- Hover effects

---

### MobileNav
The mobile navigation drawer content.

**Usage:**
```tsx
import { MobileNav } from "@/components/navigation/MobileNav";

<Sheet>
  <SheetContent>
    <MobileNav
      title="MY APP"
      showPlatforms={true}
      showActions={true}
    />
  </SheetContent>
</Sheet>
```

**Props:**
- `title?`: string - The title displayed in the drawer (default: "POSTCRAFT")
- `navItems?`: NavItem[] - Array of navigation items (same as Sidebar)
- `showPlatforms?`: boolean - Show/hide platform buttons (default: true)
- `showActions?`: boolean - Show/hide Connect/Settings buttons (default: true)

**Features:**
- Full-height drawer layout
- Same navigation structure as sidebar
- Action buttons at bottom
- Scrollable content area

---

## Customization Examples

### Custom Navigation Items
```tsx
const customNav = [
  { href: "/", label: "Home", active: true },
  { href: "/projects", label: "Projects" },
  { href: "/team", label: "Team" },
  { href: "/settings", label: "Settings" }
];

<Sidebar navItems={customNav} showPlatforms={false} />
```

### Custom Navbar Actions
```tsx
<Navbar title="ADMIN PANEL">
  <div className="flex gap-2">
    <Button>Custom Action 1</Button>
    <Button>Custom Action 2</Button>
  </div>
</Navbar>
```

### Minimal Navigation
```tsx
// Simple navbar without mobile menu or actions
<Navbar
  title="VIEWER MODE"
  showMobileMenu={false}
  showActions={false}
/>
```

---

## Integration with Layouts

These navigation components are automatically used by the layout components:

- `DashboardLayout` uses `Navbar` and `Sidebar`
- `StudioLayout` uses a custom header (no navbar/sidebar)
- `Navbar` automatically includes `MobileNav` in the mobile sheet

You typically don't need to import these directly unless building a custom layout.

---

## Styling

All navigation components follow the neobrutalist design system:
- 4px black borders
- Rounded corners (xl = 12px)
- Bold typography
- Shadow effects on interactive elements
- Glass morphism effects (backdrop-blur)

---

## Responsive Behavior

### Desktop (md breakpoint: 768px+)
- Sidebar visible
- Mobile menu hidden
- Full action buttons in navbar

### Mobile (< 768px)
- Sidebar hidden
- Hamburger menu visible
- Compact navbar
- Sheet drawer for navigation

---

## TypeScript Types

```typescript
interface NavItem {
  href: string;
  label: string;
  active?: boolean;
}

interface NavbarProps {
  title?: string;
  showMobileMenu?: boolean;
  showActions?: boolean;
  children?: React.ReactNode;
}

interface SidebarProps {
  navItems?: NavItem[];
  showPlatforms?: boolean;
}

interface MobileNavProps {
  title?: string;
  navItems?: NavItem[];
  showPlatforms?: boolean;
  showActions?: boolean;
}
```
