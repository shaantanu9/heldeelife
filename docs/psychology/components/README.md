# Reusable Component Patterns

This section provides reusable component patterns for implementing psychological principles in Next.js applications.

## 🧩 Available Components

### Social Proof Components

#### 1. Social Proof Badge
Display customer counts, ratings, and statistics

```tsx
<SocialProofBadge
  customerCount={50000}
  averageRating={4.8}
  reviewCount={1250}
/>
```

#### 2. Recent Purchases Indicator
Show recent activity to create urgency

```tsx
<RecentPurchases
  count={12}
  timeFrame="last hour"
/>
```

#### 3. Sales Count Display
Display sales numbers for social proof

```tsx
<SalesCount
  count={500}
  timeFrame="this month"
/>
```

### Urgency Components

#### 1. Stock Indicator
Show low stock warnings

```tsx
<StockIndicator
  quantity={5}
  lowStockThreshold={10}
  showUrgency={true}
/>
```

#### 2. Countdown Timer
Time-limited offers

```tsx
<CountdownTimer
  endDate={new Date('2025-02-01')}
  label="Sale ends in"
/>
```

#### 3. Limited Availability Badge
Highlight scarcity

```tsx
<LimitedAvailabilityBadge
  remaining={3}
  message="Only {count} left!"
/>
```

### Trust Components

#### 1. Trust Badges
Display certifications and guarantees

```tsx
<TrustBadges
  badges={[
    { icon: 'shield', text: 'Secure Payment' },
    { icon: 'truck', text: 'Free Shipping' },
    { icon: 'refresh', text: 'Easy Returns' }
  ]}
/>
```

#### 2. Guarantee Display
Show guarantees and warranties

```tsx
<GuaranteeDisplay
  title="100% Authentic Guarantee"
  description="We guarantee authentic products or your money back"
  icon="check-circle"
/>
```

#### 3. Security Badges
SSL, payment security indicators

```tsx
<SecurityBadges
  ssl={true}
  paymentMethods={['visa', 'mastercard', 'paypal']}
/>
```

### CTA Components

#### 1. Primary CTA Button
High-converting call-to-action

```tsx
<PrimaryCTA
  text="Shop Now"
  href="/shop"
  size="lg"
  variant="primary"
/>
```

#### 2. Secondary CTA
Supporting action button

```tsx
<SecondaryCTA
  text="Learn More"
  href="/about"
  variant="outline"
/>
```

#### 3. Floating CTA
Sticky action button

```tsx
<FloatingCTA
  text="Add to Cart"
  onClick={handleAddToCart}
  showOnScroll={true}
/>
```

### Progress Components

#### 1. Progress Indicator
Show completion status

```tsx
<ProgressIndicator
  current={2}
  total={4}
  labels={['Cart', 'Shipping', 'Payment', 'Review']}
/>
```

#### 2. Completion Badge
Show task completion

```tsx
<CompletionBadge
  completed={3}
  total={5}
  label="Profile completion"
/>
```

### Testimonial Components

#### 1. Testimonial Card
Customer review display

```tsx
<TestimonialCard
  name="John Doe"
  rating={5}
  text="Great product!"
  verified={true}
  image="/avatar.jpg"
/>
```

#### 2. Testimonial Grid
Multiple testimonials

```tsx
<TestimonialGrid
  testimonials={testimonials}
  columns={3}
  showRatings={true}
/>
```

## 🎨 Styling Guidelines

### Colors
- **Primary CTA**: High contrast action color
- **Trust**: Green for positive signals
- **Urgency**: Red/orange for limited offers
- **Neutral**: Gray for secondary elements

### Sizing
- **Mobile**: Minimum 44x44px touch targets
- **Desktop**: Proportional scaling
- **Text**: Readable (16-18px body)

### Spacing
- **Between elements**: Consistent rhythm
- **Padding**: Generous for breathing room
- **Mobile**: Reduced but proportional

## 📱 Mobile Optimization

All components are:
- **Responsive**: Work on all screen sizes
- **Touch-friendly**: Adequate touch targets
- **Performance-optimized**: Minimal re-renders
- **Accessible**: ARIA labels and keyboard navigation

## 🔧 Implementation

### Installation
```bash
# Copy component files to your project
cp -r docs/psychology/components/* your-project/components/psychology/
```

### Usage
```tsx
import { SocialProofBadge } from '@/components/psychology/social-proof'
import { StockIndicator } from '@/components/psychology/urgency'
import { TrustBadges } from '@/components/psychology/trust'
```

### Customization
All components accept props for:
- Colors and styling
- Content and messaging
- Behavior and interactions
- Responsive breakpoints

## 📊 Expected Impact

Using these components can lead to:
- **15-25% increase in conversions** (Social Proof)
- **10-20% immediate purchases** (Urgency)
- **10-15% trust increase** (Trust Badges)
- **Better user engagement** (Progress Indicators)

## 🔗 Related Resources

- [Implementation Guides](../implementation/)
- [Principles](../principles/)
- [Research](../research/)









