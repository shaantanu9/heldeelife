# Fitts' Law (Accessibility & Interaction)

## 📚 Overview

Fitts' Law predicts that the time required to move to a target area is a function of the distance to the target and the size of the target. In web design, this means larger, closer targets are easier to interact with.

## 🎯 Research Findings

- **Impact**: 20-30% improvement in interaction success
- **Source**: Human-computer interaction research
- **Application**: Button sizing, touch targets, mobile optimization

## 💡 Key Concepts

### Formula

**Time = a + b × log₂(D/W + 1)**

Where:
- **D** = Distance to target
- **W** = Width of target
- **a, b** = Constants

### Implications

1. **Larger Targets**: Easier to click/tap
2. **Closer Targets**: Faster to reach
3. **Touch Targets**: Minimum 44x44px on mobile
4. **Spacing**: Adequate gap between interactive elements

## 🛠️ Implementation

### Button Sizing Guidelines

```tsx
// Mobile: Minimum 44x44px (Apple HIG)
// Desktop: Minimum 32x32px (WCAG)
// Recommended: 48x48px for primary actions

export function PrimaryButton({ children, ...props }) {
  return (
    <button
      className="px-6 py-3 text-base font-medium rounded-lg"
      style={{ minHeight: '48px', minWidth: '120px' }}
      {...props}
    >
      {children}
    </button>
  )
}

// Mobile-optimized button
export function MobileButton({ children, ...props }) {
  return (
    <button
      className="px-6 py-4 text-base font-medium rounded-lg w-full"
      style={{ minHeight: '48px' }}
      {...props}
    >
      {children}
    </button>
  )
}
```

### Touch Target Spacing

```tsx
// Minimum spacing: 8px between touch targets
// Recommended: 16px for better usability

export function ButtonGroup({ buttons }) {
  return (
    <div className="flex gap-4"> {/* 16px spacing */}
      {buttons.map((button, i) => (
        <button
          key={i}
          className="px-6 py-3 min-h-[48px] min-w-[120px]"
        >
          {button.label}
        </button>
      ))}
    </div>
  )
}
```

### Floating Action Button (FAB)

```tsx
// Place important actions in easy-to-reach locations
// Bottom-right corner for mobile (thumb zone)

export function FloatingActionButton({ onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center"
      aria-label={label}
    >
      {icon}
    </button>
  )
}
```

## 📊 Best Practices

### 1. Button Sizing
- **Mobile**: Minimum 44x44px (48px recommended)
- **Desktop**: Minimum 32x32px (40px recommended)
- **Primary CTAs**: Larger (48-56px height)

### 2. Spacing
- **Between buttons**: 8-16px minimum
- **From edges**: Adequate padding
- **Touch targets**: No overlapping

### 3. Placement
- **Primary actions**: Above the fold
- **Important buttons**: Near relevant content
- **Mobile**: Bottom-right for thumb reach

### 4. Visual Feedback
- Clear hover states
- Active/pressed states
- Loading states
- Disabled states

### 5. Mobile Optimization
- Larger touch targets
- Thumb-friendly zones
- Bottom navigation
- Floating action buttons

## 🎨 Design Guidelines

### Sizing Standards

| Element Type | Mobile | Desktop |
|-------------|--------|---------|
| Primary Button | 48x48px | 40x40px |
| Secondary Button | 44x44px | 32x32px |
| Icon Button | 44x44px | 32x32px |
| Link | 44x44px | 24x24px |
| Checkbox | 44x44px | 24x24px |

### Spacing Standards

- **Between buttons**: 8-16px
- **Button padding**: 12-16px horizontal
- **Section padding**: 16-24px
- **Touch target gap**: Minimum 8px

### Thumb Zones (Mobile)

```
┌─────────────────┐
│  Hard to reach  │
│  ┌───────────┐  │
│  │   Easy    │  │
│  │   Zone    │  │
│  └───────────┘  │
│  ┌───────────┐  │
│  │   Easy    │  │
│  └───────────┘  │
└─────────────────┘
```

## 📱 Mobile Optimization

### Thumb-Friendly Design
- Place primary actions in bottom 1/3 of screen
- Use bottom navigation
- Floating action buttons in bottom-right
- Avoid top corners for important actions

### Touch Target Optimization
```tsx
// Good: Large, well-spaced
<button className="w-full py-4 px-6 mb-4">Action</button>

// Bad: Small, cramped
<button className="px-2 py-1 mr-1">Action</button>
```

## 🔗 Related Principles

- [Gestalt Principles](./gestalt-principles.md)
- [Visual Hierarchy](./visual-hierarchy.md)
- [Mobile Optimization](../guides/mobile-optimization.md)

## 📈 Expected Impact

- **20-30% improvement in interaction success**
- **15-20% reduction in errors**
- **Better mobile experience**
- **Increased user satisfaction**

## 💡 Real-World Examples

### Apple iOS
- 44x44px minimum touch targets
- Generous spacing between buttons
- Bottom navigation for easy access

### Material Design
- 48x48px touch targets
- 8dp spacing minimum
- Floating action buttons

### E-commerce Sites
- Large "Add to Cart" buttons
- Prominent checkout buttons
- Mobile-optimized navigation

## ⚠️ Common Mistakes

1. **Too Small**: Buttons smaller than 44px on mobile
2. **Too Close**: Insufficient spacing between targets
3. **Hard to Reach**: Important actions in top corners
4. **No Feedback**: Missing hover/active states
5. **Inconsistent**: Varying sizes for similar actions









