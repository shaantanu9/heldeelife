# Psychology Patterns: Detailed Implementation Guide

## PART 1: CODE IMPLEMENTATION EXAMPLES

### React Component Examples Using Psychology Principles

---

## 1. COGNITIVE LOAD REDUCTION - Progressive Disclosure Component

```jsx
// ProgressiveDisclosure.jsx - Reduce cognitive load by revealing info gradually

import React, { useState } from 'react';
import './styles.css';

export const ProgressiveDisclosure = () => {
  const [expandedSections, setExpandedSections] = useState({
    basic: true,    // Start with basic info visible
    advanced: false, // Hide advanced options initially
    help: false
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <div className="progressive-disclosure">
      {/* BASIC INFORMATION - Always visible */}
      <div className="section">
        <h2>Essential Information</h2>
        <form>
          <label htmlFor="name">Name *</label>
          <input 
            id="name"
            type="text" 
            placeholder="Enter your full name"
            aria-label="Full name"
            required
          />

          <label htmlFor="email">Email *</label>
          <input 
            id="email"
            type="email" 
            placeholder="your@email.com"
            aria-label="Email address"
            required
          />
        </form>
      </div>

      {/* PROGRESSIVE DISCLOSURE - Accordion */}
      <div className="accordion-section">
        <button 
          className="accordion-header"
          onClick={() => toggleSection('advanced')}
          aria-expanded={expandedSections.advanced}
          aria-controls="advanced-content"
        >
          <span className="accordion-title">Advanced Options</span>
          <span className="accordion-icon">
            {expandedSections.advanced ? '▼' : '▶'}
          </span>
        </button>

        {expandedSections.advanced && (
          <div id="advanced-content" className="accordion-content">
            <label htmlFor="company">Company</label>
            <input 
              id="company"
              type="text" 
              placeholder="Your company name"
            />

            <label htmlFor="phone">Phone</label>
            <input 
              id="phone"
              type="tel" 
              placeholder="Your phone number"
            />

            <label htmlFor="timezone">Timezone</label>
            <select id="timezone">
              <option>Select timezone...</option>
              <option>GMT</option>
              <option>EST</option>
              <option>PST</option>
              <option>IST</option>
            </select>
          </div>
        )}
      </div>

      {/* HELP SECTION */}
      <div className="accordion-section">
        <button 
          className="accordion-header"
          onClick={() => toggleSection('help')}
          aria-expanded={expandedSections.help}
          aria-controls="help-content"
        >
          <span className="accordion-title">Need Help?</span>
          <span className="accordion-icon">
            {expandedSections.help ? '▼' : '▶'}
          </span>
        </button>

        {expandedSections.help && (
          <div id="help-content" className="accordion-content help-content">
            <p>
              <strong>What is this form for?</strong>
              <br />
              This form collects your basic information to set up your account.
            </p>
            <p>
              <strong>Why do we need this?</strong>
              <br />
              We need your email for password resets and notifications.
            </p>
          </div>
        )}
      </div>

      {/* ACTION BUTTONS - Limited choices */}
      <div className="button-group">
        <button className="btn btn-primary">Continue</button>
        <button className="btn btn-secondary">Save as Draft</button>
      </div>
    </div>
  );
};
```

---

## 2. GESTALT PRINCIPLES - Component Grouping

```jsx
// GestaltPrinciples.jsx - Visual organization using Gestalt laws

import React from 'react';

export const GestaltDemo = () => {
  return (
    <div className="gestalt-demo">
      
      {/* LAW OF PROXIMITY - Related items grouped together */}
      <section className="proximity-example">
        <h3>Law of Proximity</h3>
        
        <div className="form-group">
          <label htmlFor="first-name">First Name</label>
          <input id="first-name" type="text" />
          
          <label htmlFor="last-name">Last Name</label>
          <input id="last-name" type="text" />
        </div>
        
        {/* Space between unrelated groups */}
        <div className="form-group">
          <label htmlFor="address">Address</label>
          <input id="address" type="text" />
        </div>
      </section>

      {/* LAW OF SIMILARITY - Similar elements grouped */}
      <section className="similarity-example">
        <h3>Law of Similarity</h3>
        
        <div className="button-group">
          {/* All primary buttons grouped by similarity */}
          <button className="btn btn-primary">Save</button>
          <button className="btn btn-primary">Submit</button>
          <button className="btn btn-primary">Publish</button>
        </div>
        
        <div className="button-group">
          {/* Secondary buttons - different appearance */}
          <button className="btn btn-secondary">Cancel</button>
          <button className="btn btn-secondary">Clear</button>
        </div>
      </section>

      {/* LAW OF CLOSURE - Brain completes partial shapes */}
      <section className="closure-example">
        <h3>Law of Closure</h3>
        
        <div className="card-with-closure">
          {/* Partial border suggests complete box */}
          <div className="card-header">Pricing Plans</div>
          <div className="card-content">
            <p>Choose a plan that works for you</p>
          </div>
        </div>
      </section>

      {/* LAW OF CONTINUITY - Guide eye smoothly */}
      <section className="continuity-example">
        <h3>Law of Continuity</h3>
        
        <div className="breadcrumb">
          <span>Home</span>
          <span className="separator">/</span>
          <span>Products</span>
          <span className="separator">/</span>
          <span className="active">Details</span>
        </div>
      </section>

      {/* FIGURE-GROUND - Main content stands out */}
      <section className="figure-ground-example">
        <h3>Figure-Ground Principle</h3>
        
        <div className="call-to-action">
          {/* CTA button is figure, rest is ground */}
          <p>Ready to get started?</p>
          <button className="btn btn-cta">Start Free Trial</button>
          <p className="small-text">No credit card required</p>
        </div>
      </section>
    </div>
  );
};
```

---

## 3. FITTS'S LAW - Optimized Button Placement

```jsx
// FittsLawOptimization.jsx - Apply Fitts's law for better UX

import React from 'react';

export const FittsLawDemo = () => {
  return (
    <div className="fitts-demo">
      
      {/* POOR: Small button far away */}
      <section className="poor-practice">
        <h3>❌ Poor: Small button, far from user</h3>
        <div className="content-area">
          <p>Long content...</p>
          <p>More content...</p>
          <p>Even more content...</p>
          
          {/* Small button at bottom - takes longer to click */}
          <button className="btn-small">Delete</button>
        </div>
      </section>

      {/* GOOD: Large button, easily reachable */}
      <section className="good-practice">
        <h3>✅ Good: Large button, easily reachable</h3>
        <div className="content-area">
          <p>Long content...</p>
          <p>More content...</p>
          <p>Even more content...</p>
          
          {/* Large button with good spacing */}
          <button className="btn btn-primary btn-large">
            Delete (44px minimum touch target)
          </button>
        </div>
      </section>

      {/* MOBILE OPTIMIZATION - Thumb zones */}
      <section className="mobile-optimization">
        <h3>Mobile Optimization - Thumb Zones</h3>
        
        <div className="mobile-frame">
          {/* Top area - harder to reach on phone */}
          <div className="phone-header">
            <button className="small-icon">☰</button>
            <h1>App Title</h1>
          </div>

          {/* Middle area - easy reach */}
          <div className="phone-content">
            <p>Main content here</p>
            <button className="btn btn-primary btn-large">
              Primary Action (Easy reach)
            </button>
          </div>

          {/* Bottom area - best for frequent actions */}
          <div className="phone-footer">
            <button className="btn-bottom-nav active">Home</button>
            <button className="btn-bottom-nav">Search</button>
            <button className="btn-bottom-nav">Profile</button>
          </div>
        </div>
      </section>

      {/* KEYBOARD ACCESSIBILITY - Meeting Fitts's law via keyboard */}
      <section className="keyboard-access">
        <h3>Keyboard Accessibility</h3>
        
        <div className="form-keyboard">
          <label htmlFor="field1">Field 1</label>
          <input id="field1" type="text" placeholder="Tab to navigate" />
          
          <label htmlFor="field2">Field 2</label>
          <input id="field2" type="text" placeholder="All fields keyboard accessible" />
          
          {/* Visible focus state */}
          <button className="btn btn-primary" style={{
            outline: '3px solid #4A90E2',
            outlineOffset: '2px'
          }}>
            Submit (Focus visible)
          </button>
        </div>
      </section>
    </div>
  );
};
```

---

## 4. MILLER'S LAW - Chunking Information

```jsx
// MillersLaw.jsx - Display 7±2 items per screen

import React, { useState } from 'react';

export const MillersLawDemo = () => {
  const [selectedTab, setSelectedTab] = useState('overview');

  return (
    <div className="millers-law-demo">
      
      {/* TOO MANY CHOICES - Violates Miller's Law */}
      <section className="poor-navigation">
        <h3>❌ Poor: Too many navigation options</h3>
        
        <nav className="horizontal-nav">
          <a href="#home">Home</a>
          <a href="#products">Products</a>
          <a href="#services">Services</a>
          <a href="#blog">Blog</a>
          <a href="#case-studies">Case Studies</a>
          <a href="#pricing">Pricing</a>
          <a href="#about">About</a>
          <a href="#team">Team</a>
          <a href="#careers">Careers</a>
          <a href="#contact">Contact</a>
          <a href="#faq">FAQ</a>
          <a href="#partners">Partners</a>
          {/* Too many choices = decision paralysis */}
        </nav>
      </section>

      {/* OPTIMAL - Chunked navigation */}
      <section className="good-navigation">
        <h3>✅ Good: Chunked navigation (5-7 main items)</h3>
        
        <nav className="chunked-nav">
          <a href="#home">Home</a>
          <a href="#services">Services</a>
          <a href="#resources">Resources</a>
          <a href="#about">About</a>
          <a href="#contact">Contact</a>
          <div className="dropdown">
            <button className="dropdown-toggle">More ▼</button>
            <div className="dropdown-menu">
              <a href="#blog">Blog</a>
              <a href="#case-studies">Case Studies</a>
              <a href="#careers">Careers</a>
              <a href="#faq">FAQ</a>
            </div>
          </div>
        </nav>
      </section>

      {/* TABBED INTERFACE - Chunk content */}
      <section className="tabbed-content">
        <h3>Chunked Content Using Tabs</h3>
        
        <div className="tab-header">
          {['Overview', 'Features', 'Pricing', 'FAQ', 'Reviews'].map(tab => (
            <button
              key={tab}
              className={`tab-button ${selectedTab === tab.toLowerCase() ? 'active' : ''}`}
              onClick={() => setSelectedTab(tab.toLowerCase())}
              aria-selected={selectedTab === tab.toLowerCase()}
            >
              {tab}
            </button>
          ))}
        </div>
        
        <div className="tab-content">
          {selectedTab === 'overview' && (
            <div>Overview content with 5-7 key points</div>
          )}
          {selectedTab === 'features' && (
            <div>Features content - one focused area</div>
          )}
          {/* Other tabs... */}
        </div>
      </section>

      {/* CHUNKED FORM - Limited fields per screen */}
      <section className="multi-step-form">
        <h3>Multi-Step Form (Chunk by topic)</h3>
        
        <div className="form-progress">
          <div className="progress-step active">Step 1: Personal Info</div>
          <div className="progress-step">Step 2: Address</div>
          <div className="progress-step">Step 3: Payment</div>
          <div className="progress-step">Step 4: Confirm</div>
        </div>

        {/* Show ~5-7 fields per step */}
        <form className="form-step">
          <label htmlFor="fname">First Name</label>
          <input id="fname" type="text" required />
          
          <label htmlFor="lname">Last Name</label>
          <input id="lname" type="text" required />
          
          <label htmlFor="phone">Phone</label>
          <input id="phone" type="tel" required />
          
          <label htmlFor="email">Email</label>
          <input id="email" type="email" required />
          
          <label htmlFor="username">Username</label>
          <input id="username" type="text" required />
          
          <label htmlFor="password">Password</label>
          <input id="password" type="password" required />
          
          <button className="btn btn-primary">Next Step →</button>
        </form>
      </section>
    </div>
  );
};
```

---

## 5. SOCIAL PROOF & PERSUASION

```jsx
// SocialProof.jsx - Implement persuasion principles

import React from 'react';

export const SocialProofDemo = () => {
  const testimonials = [
    {
      author: 'Sarah Johnson',
      role: 'CEO, TechCorp',
      image: 'avatar-1.jpg',
      text: 'This product changed how we work. Amazing!'
    },
    {
      author: 'Mike Chen',
      role: 'Developer, StartupXYZ',
      image: 'avatar-2.jpg',
      text: 'Best investment we made. Highly recommended.'
    },
    {
      author: 'Emily Rodriguez',
      role: 'Manager, GlobalCo',
      image: 'avatar-3.jpg',
      text: 'Implemented in 1 day. Results in 1 week.'
    }
  ];

  return (
    <div className="social-proof-demo">
      
      {/* SOCIAL PROOF: Reviews & Ratings */}
      <section className="reviews-section">
        <div className="review-header">
          <h2>Loved by Customers</h2>
          
          {/* Star Rating */}
          <div className="rating-display">
            <span className="stars">⭐⭐⭐⭐⭐</span>
            <span className="rating-number">4.8/5.0</span>
            <span className="review-count">from 2,547 reviews</span>
          </div>
        </div>

        {/* Testimonials */}
        <div className="testimonials-grid">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="testimonial-card">
              <p className="testimonial-text">"{testimonial.text}"</p>
              
              <div className="testimonial-author">
                <img 
                  src={testimonial.image} 
                  alt={testimonial.author}
                  className="author-avatar"
                />
                <div>
                  <p className="author-name">{testimonial.author}</p>
                  <p className="author-role">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SOCIAL PROOF: User Count & Stats */}
      <section className="stats-section">
        <h2>Join Thousands of Users</h2>
        
        <div className="stats-grid">
          <div className="stat-card">
            <h3 className="stat-number">500K+</h3>
            <p className="stat-label">Active Users</p>
          </div>
          
          <div className="stat-card">
            <h3 className="stat-number">50M+</h3>
            <p className="stat-label">Tasks Completed</p>
          </div>
          
          <div className="stat-card">
            <h3 className="stat-number">99.9%</h3>
            <p className="stat-label">Uptime</p>
          </div>
          
          <div className="stat-card">
            <h3 className="stat-number">24/7</h3>
            <p className="stat-label">Support</p>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF: Featured In */}
      <section className="featured-in">
        <h2>Featured In</h2>
        
        <div className="featured-logos">
          <div className="logo">TechCrunch</div>
          <div className="logo">Forbes</div>
          <div className="logo">Product Hunt</div>
          <div className="logo">Y Combinator</div>
        </div>
      </section>

      {/* URGENCY & SCARCITY - Persuasion */}
      <section className="urgency-scarcity">
        <h2>Limited Time Offer</h2>
        
        <div className="offer-card">
          <p className="urgency-badge">Only 3 seats left!</p>
          
          <h3>Annual Plan - Save 40%</h3>
          <p className="price">$99/year</p>
          
          <div className="countdown">
            <p>⏱️ Offer expires in:</p>
            <div className="countdown-timer">2:45:30</div>
          </div>
          
          <button className="btn btn-cta btn-large">Claim Now</button>
        </div>
      </section>

      {/* AUTHORITY & CERTIFICATION */}
      <section className="authority-section">
        <h2>Security & Compliance</h2>
        
        <div className="certifications">
          <div className="cert-badge">🔒 ISO 27001</div>
          <div className="cert-badge">✓ SOC 2 Type II</div>
          <div className="cert-badge">🛡️ GDPR Compliant</div>
          <div className="cert-badge">✓ HIPAA Ready</div>
        </div>
      </section>
    </div>
  );
};
```

---

## 6. HABIT FORMATION & ENGAGEMENT

```jsx
// HabitFormation.jsx - Design for repeated engagement

import React, { useState } from 'react';

export const HabitFormationDemo = () => {
  const [streak, setStreak] = useState(15);
  const [todayCompleted, setTodayCompleted] = useState(false);

  const completeHabit = () => {
    setTodayCompleted(true);
    // Trigger celebration animation
  };

  return (
    <div className="habit-demo">
      
      {/* HABIT TRACKING - Visible Progress */}
      <section className="habit-tracker">
        <h2>Daily Habits</h2>
        
        <div className="streak-card">
          <div className="streak-count">
            <span className="streak-number">{streak}</span>
            <span className="streak-label">Day Streak 🔥</span>
          </div>
          
          <div className="habit-checkboxes">
            {[...Array(30)].map((_, i) => (
              <div 
                key={i}
                className={`habit-day ${i < streak ? 'completed' : ''} ${i === 29 && !todayCompleted ? 'today' : ''}`}
              >
                {i + 1}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DAILY ENGAGEMENT - One-Click Action */}
      <section className="daily-engagement">
        <h2>Today's Task</h2>
        
        <div className="engagement-card">
          <p className="task-title">Morning Meditation</p>
          <p className="task-description">15 minutes of mindfulness</p>
          
          {!todayCompleted ? (
            <>
              <button 
                className="btn btn-large btn-primary btn-engage"
                onClick={completeHabit}
              >
                ✓ Complete Task
              </button>
              <p className="engagement-hint">Tap to mark complete</p>
            </>
          ) : (
            <div className="celebration">
              🎉 Great job! Keep your streak alive!
            </div>
          )}
        </div>
      </section>

      {/* REWARDS & MILESTONES */}
      <section className="rewards">
        <h2>Milestones</h2>
        
        <div className="milestone-timeline">
          <div className="milestone completed">
            <div className="milestone-marker">7 Days</div>
            <p className="milestone-reward">🏅 Starter Badge</p>
          </div>
          
          <div className="milestone completed">
            <div className="milestone-marker">30 Days</div>
            <p className="milestone-reward">⭐ Dedicated User</p>
          </div>
          
          <div className="milestone active">
            <div className="milestone-marker">100 Days</div>
            <p className="milestone-reward">👑 Master (in progress)</p>
            <div className="progress-bar">
              <div className="progress" style={{width: '45%'}}></div>
            </div>
          </div>
          
          <div className="milestone">
            <div className="milestone-marker">365 Days</div>
            <p className="milestone-reward">💎 Lifetime Champion</p>
          </div>
        </div>
      </section>

      {/* NOTIFICATIONS - Habit Reminders */}
      <section className="notifications">
        <h2>Smart Reminders</h2>
        
        <div className="notification-settings">
          <label className="notification-item">
            <input type="checkbox" defaultChecked />
            <span>Morning reminder (7:00 AM)</span>
          </label>
          
          <label className="notification-item">
            <input type="checkbox" defaultChecked />
            <span>Afternoon check-in (12:00 PM)</span>
          </label>
          
          <label className="notification-item">
            <input type="checkbox" defaultChecked />
            <span>Evening summary (9:00 PM)</span>
          </label>
          
          <label className="notification-item">
            <input type="checkbox" />
            <span>Streak in danger warning (if missed)</span>
          </label>
        </div>
      </section>
    </div>
  );
};
```

---

## 7. ERROR HANDLING & VALIDATION

```jsx
// ErrorHandling.jsx - Psychology-based error messages

import React, { useState } from 'react';

export const ErrorHandlingDemo = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const newErrors = {};
    
    // Validate email
    if (!formData.email.includes('@')) {
      newErrors.email = 'Please enter a valid email address (e.g., user@example.com)';
    }
    
    // Validate password
    if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    }
    
    setErrors(newErrors);
  };

  return (
    <div className="error-handling-demo">
      
      {/* GOOD ERROR MESSAGES */}
      <section className="error-examples">
        <h2>Psychology-Based Error Handling</h2>
        
        <form onSubmit={handleSubmit} noValidate>
          
          {/* EMAIL FIELD */}
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'email-error' : undefined}
              className={errors.email ? 'input-error' : ''}
            />
            
            {errors.email && (
              <div 
                id="email-error" 
                className="error-message"
                role="alert"
                aria-live="polite"
              >
                <span className="error-icon">⚠️</span>
                <span className="error-text">{errors.email}</span>
              </div>
            )}
            
            <p className="field-hint">We'll use this to send your password reset link</p>
          </div>
          
          {/* PASSWORD FIELD */}
          <div className="form-group">
            <label htmlFor="password">Password</label>
            
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? 'password-error' : 'password-hint'}
              className={errors.password ? 'input-error' : ''}
            />
            
            {errors.password && (
              <div 
                id="password-error" 
                className="error-message"
                role="alert"
                aria-live="polite"
              >
                <span className="error-icon">⚠️</span>
                <span className="error-text">{errors.password}</span>
              </div>
            )}
            
            <p id="password-hint" className="field-hint">
              Must contain at least 8 characters
            </p>
          </div>
          
          <button type="submit" className="btn btn-primary">
            Sign In
          </button>
        </form>
      </section>

      {/* ERROR MESSAGE PRINCIPLES */}
      <section className="error-principles">
        <h2>Error Message Best Practices</h2>
        
        <div className="principles-grid">
          
          <div className="principle-card">
            <h3>❌ Poor Error Message</h3>
            <p className="error-example">Error 500: Unexpected failure</p>
            <p className="principle-reason">
              Too technical, doesn't explain what went wrong
            </p>
          </div>
          
          <div className="principle-card">
            <h3>✅ Good Error Message</h3>
            <p className="error-example">
              We couldn't connect to the server. Try again or contact support.
            </p>
            <p className="principle-reason">
              Clear, explains issue, suggests action
            </p>
          </div>
          
          <div className="principle-card">
            <h3>❌ Confusing</h3>
            <p className="error-example">Invalid format</p>
            <p className="principle-reason">
              Vague - doesn't explain what format is expected
            </p>
          </div>
          
          <div className="principle-card">
            <h3>✅ Helpful</h3>
            <p className="error-example">
              Phone number must be in format: (123) 456-7890
            </p>
            <p className="principle-reason">
              Shows expected format, easy to fix
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
```

---

## CSS Styles for Psychology Principles

```css
/* Progressive Disclosure */
.accordion-section {
  margin: 16px 0;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
}

.accordion-header {
  width: 100%;
  padding: 16px;
  background: #f5f5f5;
  border: none;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 500;
  transition: background 200ms ease;
}

.accordion-header:hover {
  background: #e8e8e8;
}

.accordion-content {
  padding: 16px;
  animation: slideDown 200ms ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Gestalt - Proximity */
.form-group {
  margin-bottom: 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* Fitts's Law - Button sizing */
.btn-large {
  padding: 16px 24px;
  font-size: 16px;
  min-height: 44px;
  min-width: 44px;
  border-radius: 8px;
}

/* Miller's Law - Chunking */
.chunked-nav {
  display: flex;
  gap: 20px;
  justify-content: center;
  flex-wrap: wrap;
}

.chunked-nav a {
  padding: 8px 16px;
  text-decoration: none;
  color: #333;
}

/* Social Proof */
.rating-display {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
}

.stars {
  font-size: 20px;
}

.review-count {
  color: #666;
  font-size: 14px;
}

/* Error Messages */
.error-message {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #d32f2f;
  font-size: 14px;
  margin-top: 4px;
  padding: 8px 12px;
  background: #ffebee;
  border-left: 4px solid #d32f2f;
  border-radius: 4px;
  animation: shake 200ms ease;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

/* Focus States for Accessibility */
input:focus,
button:focus,
select:focus,
textarea:focus {
  outline: 3px solid #4A90E2;
  outline-offset: 2px;
}

/* Habit Streak */
.streak-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 24px;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
}

.streak-number {
  display: block;
  font-size: 48px;
  font-weight: bold;
}

.streak-label {
  display: block;
  font-size: 16px;
  margin-top: 8px;
}

/* Mobile Thumb Zones */
.phone-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 56px;
  display: flex;
  justify-content: space-around;
  background: #f5f5f5;
  border-top: 1px solid #e0e0e0;
}

.btn-bottom-nav {
  flex: 1;
  padding: 8px;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

.btn-bottom-nav.active {
  background: #f0f0f0;
  border-top: 3px solid #007bff;
}
```

---

This implementation guide provides working code examples using React that demonstrate psychology principles for web application development. Each component can be copied and adapted to your specific use cases.

