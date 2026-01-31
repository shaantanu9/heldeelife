import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cookie Policy | heldeelife',
  description:
    'Learn about how heldeelife uses cookies and similar tracking technologies to enhance your browsing experience.',
}

export const dynamic = 'force-static'

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/40 py-8 md:py-16">
      <div className="container px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Cookie <span className="text-orange-600">Policy</span>
          </h1>
          <p className="text-sm text-gray-500 mb-8">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <div className="prose prose-lg max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                1. What Are Cookies?
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Cookies are small text files that are placed on your device when
                you visit a website. They are widely used to make websites work
                more efficiently and provide information to website owners.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Cookies allow websites to recognize your device and store some
                information about your preferences or past actions. This helps
                us provide you with a better browsing experience.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                2. How We Use Cookies
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                We use cookies for various purposes, including:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-600">
                <li>
                  <strong>Essential Cookies:</strong> Required for the website
                  to function properly (e.g., authentication, security)
                </li>
                <li>
                  <strong>Functional Cookies:</strong> Remember your preferences
                  and settings (e.g., language, region)
                </li>
                <li>
                  <strong>Analytics Cookies:</strong> Help us understand how
                  visitors interact with our website
                </li>
                <li>
                  <strong>Marketing Cookies:</strong> Used to deliver relevant
                  advertisements and track campaign effectiveness
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                3. Types of Cookies We Use
              </h2>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                3.1 Strictly Necessary Cookies
              </h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                These cookies are essential for the website to function and
                cannot be switched off. They are usually set in response to
                actions you take, such as setting privacy preferences or filling
                in forms.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                3.2 Performance Cookies
              </h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                These cookies allow us to count visits and traffic sources so we
                can measure and improve the performance of our site. They help
                us know which pages are most popular and how visitors move
                around the site.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                3.3 Functionality Cookies
              </h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                These cookies enable the website to provide enhanced
                functionality and personalization. They may be set by us or by
                third-party providers whose services we have added to our pages.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                3.4 Targeting/Advertising Cookies
              </h3>
              <p className="text-gray-600 leading-relaxed">
                These cookies may be set through our site by our advertising
                partners. They may be used to build a profile of your interests
                and show you relevant content on other sites.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                4. Third-Party Cookies
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                In addition to our own cookies, we may also use various
                third-party cookies to report usage statistics and deliver
                advertisements. These include:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-600">
                <li>Google Analytics for website analytics</li>
                <li>Social media platforms for social sharing features</li>
                <li>Payment processors for secure payment processing</li>
                <li>Advertising networks for personalized ads</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                5. Managing Cookies
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                You have the right to accept or reject cookies. Most web
                browsers automatically accept cookies, but you can usually
                modify your browser settings to decline cookies if you prefer.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Browser Settings
              </h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                You can control cookies through your browser settings. Here are
                links to instructions for popular browsers:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-600">
                <li>
                  <a
                    href="https://support.google.com/chrome/answer/95647"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-orange-600 hover:underline"
                  >
                    Google Chrome
                  </a>
                </li>
                <li>
                  <a
                    href="https://support.mozilla.org/en-US/kb/enable-and-disable-cookies-website-preferences"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-orange-600 hover:underline"
                  >
                    Mozilla Firefox
                  </a>
                </li>
                <li>
                  <a
                    href="https://support.apple.com/guide/safari/manage-cookies-and-website-data-sfri11471/mac"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-orange-600 hover:underline"
                  >
                    Safari
                  </a>
                </li>
                <li>
                  <a
                    href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-orange-600 hover:underline"
                  >
                    Microsoft Edge
                  </a>
                </li>
              </ul>

              <p className="text-gray-600 leading-relaxed mt-4">
                <strong>Note:</strong> Disabling cookies may affect the
                functionality of our website and your ability to access certain
                features.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                6. Cookie Consent
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                When you first visit our website, you will be asked to consent
                to our use of cookies. You can withdraw your consent at any time
                by adjusting your browser settings or contacting us.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Your continued use of our website after being informed about
                cookies indicates your acceptance of our Cookie Policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                7. Updates to This Policy
              </h2>
              <p className="text-gray-600 leading-relaxed">
                We may update this Cookie Policy from time to time to reflect
                changes in our practices or for other operational, legal, or
                regulatory reasons. We will notify you of any material changes
                by posting the updated policy on this page and updating the
                &quot;Last updated&quot; date.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                8. Contact Us
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                If you have any questions about our use of cookies or this
                Cookie Policy, please contact us:
              </p>
              <div className="bg-gray-50 p-6 rounded-lg">
                <p className="text-gray-900 font-semibold mb-2">
                  heldeelife Privacy Team
                </p>
                <p className="text-gray-600">
                  Email:{' '}
                  <a
                    href="mailto:privacy@heldeelife.com"
                    className="text-orange-600 hover:underline"
                  >
                    privacy@heldeelife.com
                  </a>
                </p>
                <p className="text-gray-600">Phone: +91 1800-123-4567</p>
                <p className="text-gray-600">
                  Address: Mumbai, Maharashtra 400001, India
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

