# Business-Ready Component Code Snippets

## Quick Reference: 6 Key Components

### 1. Navbar Component
**File:** `src/components/Navbar.jsx`
**Key Classes:**
- `sticky top-0 z-50` - Fixed navbar
- `hidden md:flex` - Mobile/desktop visibility
- `bg-primary-50 text-primary-700` - Active state

### 2. Dashboard Stats Cards
**File:** `src/pages/Dashboard.jsx`
**Key Classes:**
- `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6` - Responsive grid
- `bg-white rounded-xl shadow-sm` - Card base
- `hover:shadow-md transition-shadow` - Interactive

### 3. Skill Timeline Chart
**File:** `src/components/SkillTimeline.jsx`
**Key Classes:**
- `h-80` - Fixed chart height
- `bg-gradient-to-b from-primary-300 to-primary-50` - Gradient fill
- `flex flex-col sm:flex-row` - Responsive header

### 4. Teacher Panel Table
**File:** `src/pages/InstructorPanel.jsx`
**Key Classes:**
- `overflow-x-auto` - Horizontal scroll
- `hover:bg-neutral-50 transition-colors` - Row hover
- `rounded-full text-xs font-medium` - Status badges

### 5. Export Button
**File:** `src/components/ExportButton.jsx`
**Key Classes:**
- `relative group` - Dropdown container
- `opacity-0 invisible group-hover:opacity-100` - Show on hover
- `absolute right-0 mt-2` - Positioning

### 6. Responsive Layout
**File:** `src/components/Layout.jsx`
**Key Classes:**
- `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8` - Container
- `bg-white rounded-xl shadow-sm` - Card base
- `flex flex-col sm:flex-row` - Responsive flex

## Critical Tailwind Patterns

```css
/* Responsive Grid */
grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6

/* Card Styling */
bg-white rounded-xl shadow-sm border border-neutral-200 p-6

/* Button Primary */
bg-primary-600 text-white rounded-lg px-6 py-3 hover:bg-primary-700

/* Badge */
px-3 py-1 rounded-full text-xs font-medium bg-secondary-100 text-secondary-700

/* Mobile-First Visibility */
hidden md:flex md:items-center md:space-x-4
```

