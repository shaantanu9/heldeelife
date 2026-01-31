# Scarcity & Urgency Principle

## 📚 Overview

Scarcity and urgency are psychological triggers that create motivation to act immediately. When products or offers are perceived as limited or time-sensitive, people are more likely to make purchase decisions quickly.

## 🎯 Research Findings

- **Impact**: 10-20% immediate purchases
- **Source**: Behavioral economics research
- **Application**: Low stock warnings, time-limited offers, countdown timers

## 💡 Key Concepts

### Types of Scarcity

1. **Stock Scarcity**
   - Low stock warnings ("Only 3 left!")
   - Out of stock indicators
   - Limited quantity alerts

2. **Time Scarcity**
   - Countdown timers
   - Limited-time offers
   - Flash sales
   - Daily deals

3. **Availability Scarcity**
   - "Limited slots available"
   - "Only available today"
   - "Ending soon" messaging

4. **Exclusivity Scarcity**
   - "Members only"
   - "Limited edition"
   - "Exclusive offer"

## 🛠️ Implementation

### Stock Indicator Component

```tsx
interface StockIndicatorProps {
  quantity: number
  lowStockThreshold?: number
  showUrgency?: boolean
}

export function StockIndicator({
  quantity,
  lowStockThreshold = 10,
  showUrgency = true
}: StockIndicatorProps) {
  const isLowStock = quantity <= lowStockThreshold
  const isVeryLowStock = quantity <= 5

  if (quantity === 0) {
    return (
      <div className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
        Out of Stock
      </div>
    )
  }

  if (isVeryLowStock && showUrgency) {
    return (
      <div className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium animate-pulse">
        Only {quantity} left!
      </div>
    )
  }

  if (isLowStock) {
    return (
      <div className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
        Only {quantity} left in stock
      </div>
    )
  }

  return null
}
```

### Countdown Timer Component

```tsx
interface CountdownTimerProps {
  endDate: Date
  label?: string
  onComplete?: () => void
}

export function CountdownTimer({
  endDate,
  label = "Sale ends in",
  onComplete
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(endDate))

  useEffect(() => {
    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft(endDate)
      setTimeLeft(newTimeLeft)

      if (newTimeLeft.total <= 0) {
        clearInterval(timer)
        onComplete?.()
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [endDate, onComplete])

  if (timeLeft.total <= 0) {
    return (
      <div className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium">
        Sale Ended
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-gray-600">{label}</p>
      <div className="flex gap-2">
        <TimeUnit value={timeLeft.days} label="Days" />
        <TimeUnit value={timeLeft.hours} label="Hours" />
        <TimeUnit value={timeLeft.minutes} label="Minutes" />
        <TimeUnit value={timeLeft.seconds} label="Seconds" />
      </div>
    </div>
  )
}
```

### Limited Availability Badge

```tsx
interface LimitedAvailabilityProps {
  remaining: number
  message?: string
  variant?: 'stock' | 'slots' | 'items'
}

export function LimitedAvailabilityBadge({
  remaining,
  message,
  variant = 'stock'
}: LimitedAvailabilityProps) {
  const defaultMessages = {
    stock: `Only ${remaining} left in stock!`,
    slots: `Only ${remaining} slots available!`,
    items: `Only ${remaining} items remaining!`
  }

  const displayMessage = message || defaultMessages[variant]

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg">
      <AlertCircle className="w-4 h-4 text-red-600" />
      <span className="text-sm font-medium text-red-800">
        {displayMessage}
      </span>
    </div>
  )
}
```

## 📊 Best Practices

### 1. Be Honest
- Only show scarcity when it's real
- Don't create false urgency
- Update stock counts accurately

### 2. Use Appropriate Intensity
- Very low stock (<5): High urgency (red, pulsing)
- Low stock (5-10): Medium urgency (orange)
- Normal stock: No urgency indicator

### 3. Combine with Social Proof
- "Only 3 left, 12 people viewing"
- "5 people bought this in the last hour"
- "Limited stock, high demand"

### 4. Time-Limited Offers
- Use countdown timers for sales
- Show clear end dates
- Send reminders before expiration

### 5. Visual Design
- Use red/orange for urgency
- Add animations for very low stock
- Make it prominent but not overwhelming

## 🎨 Design Guidelines

### Colors
- **Very Urgent**: Red (#DC2626)
- **Urgent**: Orange (#EA580C)
- **Low Stock**: Yellow/Orange (#F59E0B)
- **Normal**: No indicator

### Typography
- **Numbers**: Bold, large
- **Message**: Clear, action-oriented
- **Time**: Monospace font for countdown

### Animations
- **Pulsing**: For very low stock
- **Countdown**: Smooth number transitions
- **Subtle**: Don't distract from content

## 📱 Mobile Optimization

- Stack countdown timers vertically
- Increase touch target sizes
- Simplify messaging for small screens
- Use icons to save space

## ⚠️ Ethical Considerations

### Do's
- Show real stock levels
- Use honest time limits
- Update information regularly
- Provide accurate availability

### Don'ts
- Create false scarcity
- Use deceptive countdown timers
- Show fake stock warnings
- Mislead about availability

## 🔗 Related Principles

- [Social Proof](./social-proof.md)
- [Fitts' Law](./fitts-law.md)
- [Risk Reversal](./risk-reversal.md)

## 📈 Expected Impact

- **10-20% immediate purchases**
- **15-25% reduction in cart abandonment**
- **5-10% increase in conversion rate**
- **Faster decision-making**

## 💡 Real-World Examples

### Amazon
- "Only X left in stock"
- "X bought in past hour"
- Lightning deals with countdown

### Booking.com
- "Only 2 rooms left"
- "X people viewing now"
- "Booked X times today"

### E-commerce Sites
- Flash sale countdowns
- Limited edition badges
- Stock quantity indicators









