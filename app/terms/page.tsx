import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service | heldeelife',
  description:
    'Read heldeelife&apos;s Terms of Service to understand the rules and regulations for using our website and services.',
}

export const dynamic = 'force-static'

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/40 py-8 md:py-16">
      <div className="container px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Terms of <span className="text-orange-600">Service</span>
          </h1>
          <p className="text-sm text-gray-500 mb-8">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <div className="prose prose-lg max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                1. Acceptance of Terms
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                By accessing and using the heldeelife website and services, you
                accept and agree to be bound by these Terms of Service. If you
                do not agree to these terms, please do not use our services.
              </p>
              <p className="text-gray-600 leading-relaxed">
                We reserve the right to modify these terms at any time. Your
                continued use of our services after changes are posted
                constitutes acceptance of the modified terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                2. Use of Services
              </h2>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                2.1 Eligibility
              </h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                You must be at least 18 years old to use our services. By using
                our services, you represent and warrant that you are of legal
                age and have the capacity to enter into these terms.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                2.2 Account Registration
              </h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                When you create an account, you agree to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-600">
                <li>Provide accurate, current, and complete information</li>
                <li>Maintain and update your information as necessary</li>
                <li>Maintain the security of your account credentials</li>
                <li>
                  Accept responsibility for all activities under your account
                </li>
                <li>Notify us immediately of any unauthorized access</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">
                2.3 Prohibited Activities
              </h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                You agree not to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-600">
                <li>
                  Use our services for any illegal or unauthorized purpose
                </li>
                <li>Violate any laws or regulations in your jurisdiction</li>
                <li>Infringe upon the rights of others</li>
                <li>Transmit viruses, malware, or harmful code</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Interfere with or disrupt our services</li>
                <li>
                  Use automated systems to access our website without permission
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                3. Products and Services
              </h2>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                3.1 Product Information
              </h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                We strive to provide accurate product descriptions, images, and
                pricing. However, we do not warrant that product descriptions or
                other content are error-free, complete, or current.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                3.2 Pricing
              </h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                All prices are in Indian Rupees (INR) unless otherwise stated.
                We reserve the right to change prices at any time. Prices
                displayed are subject to availability and may be withdrawn or
                revised without notice.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                3.3 Medical Consultation Services
              </h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                Our consultation services are provided by qualified healthcare
                professionals. However:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-600">
                <li>
                  Consultations are not a substitute for emergency medical care
                </li>
                <li>
                  For medical emergencies, contact your local emergency services
                  immediately
                </li>
                <li>We do not guarantee specific treatment outcomes</li>
                <li>
                  You should follow the advice of your primary healthcare
                  provider
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                4. Orders and Payment
              </h2>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                4.1 Order Acceptance
              </h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                Your order is an offer to purchase products. We reserve the
                right to accept or reject any order. If we accept your order,
                you will receive a confirmation email.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                4.2 Payment
              </h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                Payment must be made at the time of order. We accept various
                payment methods including credit cards, debit cards, and digital
                wallets. All payments are processed securely through our payment
                partners.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                4.3 Order Cancellation
              </h3>
              <p className="text-gray-600 leading-relaxed">
                You may cancel your order before it is shipped. Once shipped,
                cancellation is subject to our refund policy. Please see our{' '}
                <a href="/refund" className="text-orange-600 hover:underline">
                  Refund Policy
                </a>{' '}
                for details.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                5. Intellectual Property
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                All content on our website, including text, graphics, logos,
                images, and software, is the property of heldeelife or its
                content suppliers and is protected by copyright and other
                intellectual property laws.
              </p>
              <p className="text-gray-600 leading-relaxed">
                You may not reproduce, distribute, modify, or create derivative
                works from any content without our express written permission.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                6. Limitation of Liability
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                To the maximum extent permitted by law, heldeelife shall not be
                liable for any indirect, incidental, special, consequential, or
                punitive damages, including loss of profits, data, or use,
                arising from your use of our services.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Our total liability for any claims arising from your use of our
                services shall not exceed the amount you paid to us in the 12
                months preceding the claim.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                7. Indemnification
              </h2>
              <p className="text-gray-600 leading-relaxed">
                You agree to indemnify and hold heldeelife harmless from any
                claims, damages, losses, liabilities, and expenses (including
                legal fees) arising from your use of our services, violation of
                these terms, or infringement of any rights of another party.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                8. Termination
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                We may terminate or suspend your account and access to our
                services immediately, without prior notice, for any reason,
                including breach of these terms.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Upon termination, your right to use our services will cease
                immediately. All provisions of these terms that by their nature
                should survive termination shall survive.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                9. Governing Law
              </h2>
              <p className="text-gray-600 leading-relaxed">
                These Terms of Service shall be governed by and construed in
                accordance with the laws of India. Any disputes arising from
                these terms or your use of our services shall be subject to the
                exclusive jurisdiction of the courts in Mumbai, Maharashtra.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                10. Contact Information
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                If you have any questions about these Terms of Service, please
                contact us:
              </p>
              <div className="bg-gray-50 p-6 rounded-lg">
                <p className="text-gray-900 font-semibold mb-2">
                  heldeelife Legal Team
                </p>
                <p className="text-gray-600">
                  Email:{' '}
                  <a
                    href="mailto:legal@heldeelife.com"
                    className="text-orange-600 hover:underline"
                  >
                    legal@heldeelife.com
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
