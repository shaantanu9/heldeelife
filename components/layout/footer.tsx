import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white pb-16 md:pb-0">
      <div className="container px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {/* Logo and Copyright */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-2xl font-light tracking-wider text-gray-900 hover:text-orange-600 transition-colors">
                heldeelife
              </span>
            </Link>
            <p className="text-sm text-gray-600">
              © {new Date().getFullYear()} heldeelife. All rights reserved.
            </p>
          </div>

          {/* Overview */}
          <div>
            <h3 className="font-semibold mb-4 text-gray-900">OVERVIEW</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/about"
                  className="text-gray-600 hover:text-orange-600 transition-colors"
                >
                  About us
                </Link>
              </li>
              <li>
                <Link
                  href="/service"
                  className="text-gray-600 hover:text-orange-600 transition-colors"
                >
                  Service
                </Link>
              </li>
              <li>
                <Link
                  href="/shop"
                  className="text-gray-600 hover:text-orange-600 transition-colors"
                >
                  Shop
                </Link>
              </li>
              <li>
                <Link
                  href="/resource"
                  className="text-gray-600 hover:text-orange-600 transition-colors"
                >
                  Resource
                </Link>
              </li>
              <li>
                <Link
                  href="/search"
                  className="text-gray-600 hover:text-orange-600 transition-colors"
                >
                  Search
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="font-semibold mb-4 text-gray-900">
              CUSTOMER SERVICE
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/contact"
                  className="text-gray-600 hover:text-orange-600 transition-colors"
                >
                  Contact Info
                </Link>
              </li>
              <li>
                <Link
                  href="/faq"
                  className="text-gray-600 hover:text-orange-600 transition-colors"
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  href="/help"
                  className="text-gray-600 hover:text-orange-600 transition-colors"
                >
                  Help
                </Link>
              </li>
              <li>
                <Link
                  href="/shipping"
                  className="text-gray-600 hover:text-orange-600 transition-colors"
                >
                  Shipping Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/refund"
                  className="text-gray-600 hover:text-orange-600 transition-colors"
                >
                  Refund Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-gray-600 hover:text-orange-600 transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-gray-600 hover:text-orange-600 transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/cookie"
                  className="text-gray-600 hover:text-orange-600 transition-colors"
                >
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Connect With Us - TODO: Add social media URLs post-launch */}
          <div>
            <h3 className="font-semibold mb-4 text-gray-900">
              CONNECT WITH US
            </h3>
            <p className="text-sm text-gray-600">
              Follow us on social media for updates and wellness tips.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
