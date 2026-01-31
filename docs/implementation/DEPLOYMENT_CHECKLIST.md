# Deployment Checklist: heldeelife MVP

**Quick Reference Checklist for Production Deployment**

## 🔴 Critical Items (Must Complete)

### 1. Products & Data
- [ ] Add at least 5-10 products to database via `/admin/products`
- [ ] Upload product images for all products
- [ ] Set inventory quantities for all products
- [ ] Create product categories
- [ ] Test product display on `/shop` page

### 2. Email Service
- [ ] Choose email provider (Resend/SendGrid)
- [ ] Sign up and verify domain
- [ ] Install package: `npm install resend` or `npm install @sendgrid/mail`
- [ ] Create `lib/email-service.ts`
- [ ] Add email sending to order creation
- [ ] Add password reset emails
- [ ] Test email delivery
- [ ] Add `RESEND_API_KEY` or `SENDGRID_API_KEY` to environment variables

### 3. Environment Variables
- [ ] Create `.env.example` file
- [ ] Set all Supabase variables in production
- [ ] Set NextAuth variables in production
- [ ] Set Razorpay variables in production
- [ ] Set ImageKit variables in production
- [ ] Set email service variables in production
- [ ] Verify `NEXTAUTH_URL` matches production domain
- [ ] Verify `NEXT_PUBLIC_SITE_URL` matches production domain

### 4. Payment Gateway
- [ ] Create Razorpay account (production)
- [ ] Get production API keys
- [ ] Set webhook URL: `https://yourdomain.com/api/payments/webhook`
- [ ] Test payment flow in test mode
- [ ] Verify webhook receives events
- [ ] Add `NEXT_PUBLIC_RAZORPAY_KEY_ID` to environment
- [ ] Add `RAZORPAY_KEY_SECRET` to environment
- [ ] Add `RAZORPAY_WEBHOOK_SECRET` to environment

### 5. Razorpay Script
- [ ] Verify Razorpay script loads in `app/layout.tsx`
- [ ] Test payment modal opens
- [ ] Test payment completion

### 6. Testing
- [ ] Test user signup
- [ ] Test user signin
- [ ] Test product browsing
- [ ] Test add to cart
- [ ] Test checkout flow
- [ ] Test COD order creation
- [ ] Test online payment flow
- [ ] Test order confirmation
- [ ] Test admin login
- [ ] Test admin product management
- [ ] Test admin order management

## 🟡 Important Items (Should Complete)

### 7. Password Reset
- [ ] Test forgot password flow
- [ ] Verify reset email sends
- [ ] Test password reset completion
- [ ] Fix any issues

### 8. Email Verification
- [ ] Implement email verification on signup
- [ ] Send verification email
- [ ] Add verification check before login
- [ ] Add "Resend verification" option

### 9. Error Monitoring
- [ ] Choose service (Sentry recommended)
- [ ] Install: `npm install @sentry/nextjs`
- [ ] Configure Sentry
- [ ] Set up alerts
- [ ] Test error tracking

### 10. Security
- [ ] Review RLS policies in Supabase
- [ ] Verify admin routes are protected
- [ ] Check API route authentication
- [ ] Verify sensitive data is not exposed
- [ ] Test CORS settings

## 🟢 Nice to Have

### 11. Performance
- [ ] Test page load times
- [ ] Optimize images
- [ ] Set up CDN
- [ ] Configure caching
- [ ] Test mobile performance

### 12. Analytics
- [ ] Set up Google Analytics
- [ ] Add tracking code
- [ ] Test event tracking
- [ ] Set up conversion tracking

### 13. SEO
- [ ] Verify meta tags
- [ ] Test sitemap generation
- [ ] Test RSS feed
- [ ] Submit to search engines

---

## 🚀 Deployment Steps

### Step 1: Pre-Deployment
```bash
# Build for production
npm run build

# Test production build locally
npm start

# Check for errors
npm run lint

# Format code
npm run format

# Type check
npx tsc --noEmit
```

### Step 2: Environment Setup
1. Create production environment variables
2. Set all required variables
3. Verify all variables are set
4. Document in `.env.example`

### Step 3: Database Setup
1. Run all migrations in Supabase
2. Verify RLS policies
3. Create admin user
4. Add products
5. Upload product images

### Step 4: Payment Testing
1. Set up Razorpay test account
2. Configure test API keys
3. Test payment flow end-to-end
4. Test webhook handling
5. Verify order creation
6. Test payment success/failure scenarios

### Step 5: Deploy
1. Deploy to hosting platform (Vercel/Netlify/Railway)
2. Set environment variables
3. Configure custom domain (if needed)
4. Verify deployment succeeds
5. Check build logs for errors

### Step 6: Post-Deployment Configuration
1. Update Razorpay webhook URL
2. Switch to production Razorpay keys
3. Configure email service domain
4. Set up monitoring (Sentry)
5. Configure analytics

### Step 7: Production Testing
1. Test all critical flows
2. Verify email sending
3. Test payment flow (with real payment)
4. Test admin functions
5. Check error logs
6. Monitor performance
7. Test mobile experience

### Step 8: Go-Live Verification
1. All smoke tests pass
2. Payment works correctly
3. Emails send successfully
4. No critical errors
5. Performance is acceptable
6. Security verified

---

## 📋 Quick Command Reference

```bash
# Development
npm run dev

# Production Build
npm run build

# Production Start
npm start

# Linting
npm run lint

# Format Code
npm run format

# Install Email Service
npm install resend
# OR
npm install @sendgrid/mail

# Install Error Monitoring
npm install @sentry/nextjs
```

---

## 🔍 Verification Checklist

### Payment Flow Testing

**Test Environment Setup**:
- [ ] Razorpay test account created
- [ ] Test API keys configured
- [ ] Webhook URL configured
- [ ] Test cards ready

**Payment Test Cases**:
- [ ] COD order creation works
- [ ] Online payment modal opens
- [ ] Successful payment flow works
- [ ] Payment verification works
- [ ] Payment failure handling works
- [ ] Payment cancellation works
- [ ] Webhook receives events
- [ ] Order status updates correctly
- [ ] Inventory updates on payment
- [ ] Error messages are user-friendly

**Edge Cases**:
- [ ] Network disconnection during payment
- [ ] Invalid payment data
- [ ] Expired session
- [ ] Empty cart handling
- [ ] Out-of-stock product
- [ ] Invalid coupon code

### Production Deployment Verification

**Pre-Deployment**:
- [ ] Code linted and formatted
- [ ] Build succeeds without errors
- [ ] Type checking passes
- [ ] All environment variables documented
- [ ] No sensitive data in code

**Deployment**:
- [ ] Deployment platform configured
- [ ] Environment variables set
- [ ] Custom domain configured (if needed)
- [ ] SSL/HTTPS enabled
- [ ] Build logs show no errors

**Post-Deployment**:
- [ ] Homepage loads correctly
- [ ] Shop page shows products
- [ ] Product detail pages work
- [ ] Cart functionality works
- [ ] Checkout flow completes
- [ ] Orders are created in database
- [ ] Payment flow works (production)
- [ ] Admin panel accessible
- [ ] Email notifications send
- [ ] No console errors
- [ ] Mobile responsive
- [ ] Fast page loads (<3s)
- [ ] Lighthouse score >90
- [ ] Security headers configured
- [ ] Error monitoring active
- [ ] Analytics configured

**Production Payment Testing**:
- [ ] Production Razorpay keys configured
- [ ] Production webhook URL set
- [ ] Test payment with real card (small amount)
- [ ] Verify production webhook works
- [ ] Check payment logs
- [ ] Verify order updates

**Monitoring**:
- [ ] Error monitoring set up (Sentry)
- [ ] Uptime monitoring configured
- [ ] Performance monitoring active
- [ ] Analytics tracking working
- [ ] Alerts configured

---

**Last Updated**: 2025-01-27

