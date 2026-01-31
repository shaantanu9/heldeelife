import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | heldeelife',
  description:
    'Read heldeelife&apos;s Privacy Policy to understand how we collect, use, and protect your personal information.',
}

export const dynamic = 'force-static'

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/40 py-8 md:py-16">
      <div className="container px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Privacy <span className="text-orange-600">Policy</span>
          </h1>
          <p className="text-sm text-gray-500 mb-8">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <div className="prose prose-lg max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                1. Introduction
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Welcome to heldeelife. We are committed to protecting your
                privacy and ensuring the security of your personal information.
                This Privacy Policy explains how we collect, use, disclose, and
                safeguard your information when you visit our website and use
                our services.
              </p>
              <p className="text-gray-600 leading-relaxed">
                By using our website, you consent to the data practices
                described in this policy. If you do not agree with the practices
                described in this policy, please do not use our services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                2. Information We Collect
              </h2>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                2.1 Personal Information
              </h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                We may collect personal information that you provide directly to
                us, including:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-600">
                <li>
                  Name and contact information (email address, phone number,
                  mailing address)
                </li>
                <li>
                  Payment information (credit card details, billing address)
                </li>
                <li>Account credentials (username, password)</li>
                <li>Health information (for consultation services)</li>
                <li>Order history and preferences</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">
                2.2 Automatically Collected Information
              </h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                When you visit our website, we automatically collect certain
                information, including:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-600">
                <li>IP address and browser type</li>
                <li>Device information and operating system</li>
                <li>Pages visited and time spent on pages</li>
                <li>Referring website addresses</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                3. How We Use Your Information
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                We use the information we collect for various purposes,
                including:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-600">
                <li>Processing and fulfilling your orders</li>
                <li>Providing customer support and responding to inquiries</li>
                <li>
                  Sending order confirmations, updates, and shipping
                  notifications
                </li>
                <li>Managing your account and preferences</li>
                <li>Improving our website and services</li>
                <li>Sending marketing communications (with your consent)</li>
                <li>Preventing fraud and ensuring security</li>
                <li>Complying with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                4. Information Sharing and Disclosure
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                We do not sell your personal information. We may share your
                information in the following circumstances:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-600">
                <li>
                  <strong>Service Providers:</strong> With third-party service
                  providers who perform services on our behalf (payment
                  processing, shipping, email delivery)
                </li>
                <li>
                  <strong>Legal Requirements:</strong> When required by law or
                  to protect our rights and safety
                </li>
                <li>
                  <strong>Business Transfers:</strong> In connection with a
                  merger, acquisition, or sale of assets
                </li>
                <li>
                  <strong>With Your Consent:</strong> When you explicitly
                  authorize us to share your information
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                5. Data Security
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                We implement appropriate technical and organizational measures
                to protect your personal information against unauthorized
                access, alteration, disclosure, or destruction. However, no
                method of transmission over the Internet or electronic storage
                is 100% secure.
              </p>
              <p className="text-gray-600 leading-relaxed">
                We use industry-standard encryption technologies and secure
                payment processing to safeguard your sensitive information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                6. Your Rights and Choices
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                You have the following rights regarding your personal
                information:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-600">
                <li>
                  <strong>Access:</strong> Request access to your personal
                  information
                </li>
                <li>
                  <strong>Correction:</strong> Request correction of inaccurate
                  information
                </li>
                <li>
                  <strong>Deletion:</strong> Request deletion of your personal
                  information
                </li>
                <li>
                  <strong>Opt-out:</strong> Unsubscribe from marketing
                  communications
                </li>
                <li>
                  <strong>Data Portability:</strong> Request a copy of your data
                  in a portable format
                </li>
              </ul>
              <p className="text-gray-600 leading-relaxed mt-4">
                To exercise these rights, please contact us at{' '}
                <a
                  href="mailto:privacy@heldeelife.com"
                  className="text-orange-600 hover:underline"
                >
                  privacy@heldeelife.com
                </a>
                .
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                7. Cookies and Tracking Technologies
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                We use cookies and similar tracking technologies to enhance your
                browsing experience, analyze website traffic, and personalize
                content. You can control cookies through your browser settings.
              </p>
              <p className="text-gray-600 leading-relaxed">
                For more information, please see our{' '}
                <a href="/cookie" className="text-orange-600 hover:underline">
                  Cookie Policy
                </a>
                .
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                8. Children&apos;s Privacy
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Our services are not intended for children under the age of 18.
                We do not knowingly collect personal information from children.
                If you believe we have collected information from a child,
                please contact us immediately.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                9. Changes to This Privacy Policy
              </h2>
              <p className="text-gray-600 leading-relaxed">
                We may update this Privacy Policy from time to time. We will
                notify you of any changes by posting the new policy on this page
                and updating the &quot;Last updated&quot; date. Your continued
                use of our services after such changes constitutes acceptance of
                the updated policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                10. Contact Us
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                If you have any questions or concerns about this Privacy Policy
                or our data practices, please contact us:
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
