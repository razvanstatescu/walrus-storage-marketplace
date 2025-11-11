# Layout Components

This directory contains reusable layout components for the application. These components provide consistent structure and styling across all pages.

## Components

### AppShell
The outermost container for the entire application. Provides the main background gradient and padding.

**Usage:**
```tsx
import { AppShell } from "@/components/layouts/AppShell";

export default function Page() {
  return (
    <AppShell>
      {/* Your layout content */}
    </AppShell>
  );
}
```

**Props:**
- `children`: React.ReactNode - The content to render
- `className?`: string - Optional additional CSS classes

---

### DashboardLayout
Complete dashboard layout with navbar and sidebar. Provides the standard two-column grid structure.

**Usage:**
```tsx
import { AppShell } from "@/components/layouts/AppShell";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";

export default function Dashboard() {
  return (
    <AppShell>
      <DashboardLayout>
        {/* Your page content */}
      </DashboardLayout>
    </AppShell>
  );
}
```

**Props:**
- `children`: React.ReactNode - The main content area
- `title?`: string - Navbar title (default: "POSTCRAFT")
- `showSidebar?`: boolean - Show/hide sidebar (default: true)
- `showMobileMenu?`: boolean - Show/hide mobile menu (default: true)
- `showNavbarActions?`: boolean - Show/hide navbar action buttons (default: true)

---

### StudioLayout
Specialized layout for studio pages with navigation header (back/home buttons).

**Usage:**
```tsx
import { AppShell } from "@/components/layouts/AppShell";
import { StudioLayout } from "@/components/layouts/StudioLayout";

export default function StudioPage() {
  return (
    <AppShell>
      <StudioLayout>
        {/* Your studio content */}
      </StudioLayout>
    </AppShell>
  );
}
```

**Props:**
- `children`: React.ReactNode - The content to render
- `title?`: string - Header title (default: "POSTCRAFT STUDIO")
- `backHref?`: string - Back button URL (default: "/")
- `homeHref?`: string - Home button URL (default: "/")
- `showBackButton?`: boolean - Show/hide back button (default: true)
- `showHomeButton?`: boolean - Show/hide home button (default: true)

---

### PageContainer
Reusable glassmorphic container with neobrutalist styling. Used as a wrapper for page content.

**Usage:**
```tsx
import { PageContainer } from "@/components/layouts/PageContainer";

export default function CustomPage() {
  return (
    <PageContainer>
      {/* Your content */}
    </PageContainer>
  );
}
```

**Props:**
- `children`: React.ReactNode - The content to render
- `className?`: string - Optional additional CSS classes
- `variant?`: "default" | "fullscreen" - Container variant (default: "default")

---

## Navigation Components

See [../navigation/README.md](../navigation/README.md) for details on:
- `Navbar` - Top navigation bar
- `Sidebar` - Left navigation sidebar
- `MobileNav` - Mobile navigation drawer

---

## Creating a New Page

### Dashboard-style Page
```tsx
import { AppShell } from "@/components/layouts/AppShell";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";

export default function MyPage() {
  return (
    <AppShell>
      <DashboardLayout title="MY PAGE">
        <div>
          <h2 className="text-xl sm:text-2xl font-black mb-4">MY CONTENT</h2>
          {/* Your content here */}
        </div>
      </DashboardLayout>
    </AppShell>
  );
}
```

### Studio-style Page
```tsx
import { AppShell } from "@/components/layouts/AppShell";
import { StudioLayout } from "@/components/layouts/StudioLayout";

export default function MyStudio() {
  return (
    <AppShell>
      <StudioLayout title="MY STUDIO">
        {/* Your studio content */}
      </StudioLayout>
    </AppShell>
  );
}
```

### Custom Page (without pre-built layouts)
```tsx
import { AppShell } from "@/components/layouts/AppShell";
import { PageContainer } from "@/components/layouts/PageContainer";
import { Navbar } from "@/components/navigation/Navbar";

export default function CustomPage() {
  return (
    <AppShell>
      <PageContainer>
        <Navbar title="CUSTOM PAGE" showMobileMenu={false} />
        <div className="p-6">
          {/* Your custom layout */}
        </div>
      </PageContainer>
    </AppShell>
  );
}
```

---

## Layout Architecture

```
AppShell (background + padding)
  └── DashboardLayout or StudioLayout or PageContainer
      ├── Navbar (top navigation)
      ├── Sidebar (left navigation, desktop only)
      └── Content area (your page content)
```

---

## Benefits

✅ **DRY Principle**: No code duplication across pages
✅ **Consistency**: Same styling and structure everywhere
✅ **Flexibility**: Easy to customize with props
✅ **Maintainability**: Changes to layout apply globally
✅ **Scalability**: Easy to add new pages and layouts
✅ **TypeScript**: Fully typed for better DX

---

## Migration Guide

### Old Pattern (Don't do this)
```tsx
export default function Page() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-2 sm:p-4 md:p-8">
      <div className="w-full max-w-7xl mx-auto backdrop-blur-xl bg-white/30 border-4 border-black rounded-3xl...">
        <header className="border-b-4 border-black...">
          {/* navbar code */}
        </header>
        <div className="grid md:grid-cols-[280px_1fr]">
          <div className="sidebar...">
            {/* sidebar code */}
          </div>
          <div className="content">
            {/* content */}
          </div>
        </div>
      </div>
    </div>
  );
}
```

### New Pattern (Do this)
```tsx
import { AppShell } from "@/components/layouts/AppShell";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";

export default function Page() {
  return (
    <AppShell>
      <DashboardLayout>
        {/* content only */}
      </DashboardLayout>
    </AppShell>
  );
}
```

**Result**: ~150 lines → ~15 lines 🎉
