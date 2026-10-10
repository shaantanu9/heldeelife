import Link from 'next/link'
import { SITE } from '@/lib/seo/site'

export function Footer() {
  return (
    <footer className="border-t border-border bg-background pb-16 md:pb-0">
      <div className="container px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {/* Logo and Copyright */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-2xl font-light tracking-wider text-foreground hover:text-orange-600 transition-colors">
                heldeelife
              </span>
            </Link>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} heldeelife. All rights reserved.
            </p>
          </div>

          {/* Overview */}
          <div>
            <h3 className="font-semibold mb-4 text-foreground">OVERVIEW</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/about"
                  className="text-muted-foreground hover:text-orange-600 transition-colors"
                >
                  About us
                </Link>
              </li>
              <li>
                <Link
                  href="/service"
                  className="text-muted-foreground hover:text-orange-600 transition-colors"
                >
                  Service
                </Link>
              </li>
              <li>
                <Link
                  href="/shop"
                  className="text-muted-foreground hover:text-orange-600 transition-colors"
                >
                  Shop
                </Link>
              </li>
              <li>
                <Link
                  href="/resource"
                  className="text-muted-foreground hover:text-orange-600 transition-colors"
                >
                  Resource
                </Link>
              </li>
              <li>
                <Link
                  href="/search"
                  className="text-muted-foreground hover:text-orange-600 transition-colors"
                >
                  Search
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="font-semibold mb-4 text-foreground">
              CUSTOMER SERVICE
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/contact"
                  className="text-muted-foreground hover:text-orange-600 transition-colors"
                >
                  Contact Info
                </Link>
              </li>
              <li>
                <Link
                  href="/faq"
                  className="text-muted-foreground hover:text-orange-600 transition-colors"
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  href="/help"
                  className="text-muted-foreground hover:text-orange-600 transition-colors"
                >
                  Help
                </Link>
              </li>
              <li>
                <Link
                  href="/shipping"
                  className="text-muted-foreground hover:text-orange-600 transition-colors"
                >
                  Shipping Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/refund"
                  className="text-muted-foreground hover:text-orange-600 transition-colors"
                >
                  Refund Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-muted-foreground hover:text-orange-600 transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-muted-foreground hover:text-orange-600 transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/cookie"
                  className="text-muted-foreground hover:text-orange-600 transition-colors"
                >
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact / NAP — kept identical to the Organization JSON-LD */}
          <div>
            <h3 className="font-semibold mb-4 text-foreground">
              CONNECT WITH US
            </h3>
            <address className="not-italic space-y-2 text-sm text-muted-foreground">
              <p>
                {SITE.address.addressLocality}, {SITE.address.addressRegion},
                India
              </p>
              <p>
                <a
                  href={`mailto:${SITE.contact.email}`}
                  className="hover:text-orange-600 transition-colors"
                >
                  {SITE.contact.email}
                </a>
              </p>
              <p>
                <a
                  href={`tel:${SITE.contact.phone.replace(/[^+\d]/g, '')}`}
                  className="hover:text-orange-600 transition-colors"
                >
                  {SITE.contact.phone}
                </a>
              </p>
              <p>{SITE.contact.hoursLabel}</p>
            </address>
            {SITE.social.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-3 text-sm">
                {SITE.social.map((url) => (
                  <li key={url}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer me"
                      className="text-muted-foreground hover:text-orange-600 transition-colors"
                    >
                      {new URL(url).hostname.replace(/^www\./, '')}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </footer>
  )
}
