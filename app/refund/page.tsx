import { Card, CardContent } from '@/components/ui/card'
import {
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Refund Policy | heldeelife',
  description:
    'Read heldeelife&apos;s refund policy to understand return eligibility, refund process, and cancellation terms.',
}

export const dynamic = 'force-static'

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/40 py-8 md:py-16">
      <div className="container px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Refund <span className="text-orange-600">Policy</span>
          </h1>
          <p className="text-sm text-gray-500 mb-8">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Overview
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                At heldeelife, we want you to be completely satisfied with your
                purchase. This Refund Policy outlines the terms and conditions
                for returns, refunds, and exchanges.
              </p>
            </section>

            <section>
              <Card className="border border-gray-200 shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                      <Clock className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        Return Window
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        You have <strong>7 days</strong> from the date of
                        delivery to initiate a return or refund request. The
                        return window starts from the date you receive the
                        product.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Eligible Products for Return
              </h2>
              <Card className="border border-gray-200 shadow-md mb-4">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        Products Eligible for Return
                      </h3>
                      <ul className="list-disc pl-6 space-y-2 text-gray-600">
                        <li>
                          Unopened and unused products in original packaging
                        </li>
                        <li>Products with manufacturing defects</li>
                        <li>Wrong products delivered</li>
                        <li>Damaged products received</li>
                        <li>Products that don&apos;t match the description</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-gray-200 shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <XCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        Non-Returnable Products
                      </h3>
                      <ul className="list-disc pl-6 space-y-2 text-gray-600">
                        <li>Opened or used products (unless defective)</li>
                        <li>Products without original packaging</li>
                        <li>Perishable items or products with expired dates</li>
                        <li>Personalized or custom-made products</li>
                        <li>Products damaged due to misuse or negligence</li>
                        <li>Digital products or downloadable content</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            <section>
              <Card className="border border-gray-200 shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                      <RefreshCw className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        Return Process
                      </h3>
                      <ol className="list-decimal pl-6 space-y-2 text-gray-600">
                        <li>
                          Contact our customer support team within 7 days of
                          delivery
                        </li>
                        <li>Provide your order number and reason for return</li>
                        <li>
                          Our team will verify eligibility and provide a Return
                          Authorization (RA) number
                        </li>
                        <li>
                          Pack the product securely in original packaging with
                          all accessories
                        </li>
                        <li>
                          Ship the product back using the provided return label
                          or instructions
                        </li>
                        <li>
                          Once we receive and inspect the product, we&apos;ll
                          process your refund
                        </li>
                      </ol>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Refund Methods
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Refunds will be processed using the same payment method used for
                the original purchase:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-600">
                <li>
                  <strong>Credit/Debit Cards:</strong> 5-10 business days
                </li>
                <li>
                  <strong>Digital Wallets:</strong> 3-5 business days
                </li>
                <li>
                  <strong>UPI:</strong> 2-3 business days
                </li>
                <li>
                  <strong>Bank Transfer:</strong> 5-7 business days
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Refund Amount
              </h2>
              <Card className="border border-gray-200 shadow-md">
                <CardContent className="p-6">
                  <div className="space-y-3 text-gray-600">
                    <div>
                      <p className="font-semibold text-gray-900 mb-1">
                        Full Refund
                      </p>
                      <p>
                        You will receive a full refund (including shipping
                        charges) if:
                      </p>
                      <ul className="list-disc pl-6 mt-2">
                        <li>Product is defective or damaged</li>
                        <li>Wrong product was delivered</li>
                        <li>Product doesn&apos;t match description</li>
                      </ul>
                    </div>
                    <div className="pt-3 border-t border-gray-200">
                      <p className="font-semibold text-gray-900 mb-1">
                        Partial Refund
                      </p>
                      <p>For returns due to change of mind:</p>
                      <ul className="list-disc pl-6 mt-2">
                        <li>Product price will be refunded</li>
                        <li>Original shipping charges are non-refundable</li>
                        <li>
                          Return shipping charges (if applicable) will be
                          deducted
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Exchanges
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                We currently do not offer direct exchanges. If you wish to
                exchange a product:
              </p>
              <ol className="list-decimal pl-6 space-y-2 text-gray-600">
                <li>
                  Return the original product following our return process
                </li>
                <li>Place a new order for the desired product</li>
                <li>
                  We&apos;ll process your refund for the returned item
                  separately
                </li>
              </ol>
            </section>

            <section>
              <Card className="border border-orange-200 bg-orange-50">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <AlertCircle className="h-6 w-6 text-orange-600 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        Important Notes
                      </h3>
                      <ul className="list-disc pl-6 space-y-2 text-gray-600">
                        <li>
                          Products must be returned in original, unopened
                          condition (unless defective)
                        </li>
                        <li>
                          All original accessories, manuals, and packaging must
                          be included
                        </li>
                        <li>
                          Return shipping charges may apply for change-of-mind
                          returns
                        </li>
                        <li>
                          Refunds may take 7-14 business days to reflect in your
                          account
                        </li>
                        <li>
                          We reserve the right to reject returns that don&apos;t
                          meet our policy requirements
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Cancellation Policy
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                You can cancel your order before it is shipped:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-600">
                <li>
                  <strong>Before Shipping:</strong> Full refund will be
                  processed within 2-3 business days
                </li>
                <li>
                  <strong>After Shipping:</strong> Order cannot be cancelled,
                  but you can return it after delivery
                </li>
                <li>
                  To cancel, contact us immediately with your order number
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Contact Us
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                For return or refund requests, please contact us:
              </p>
              <div className="bg-gray-50 p-6 rounded-lg">
                <p className="text-gray-900 font-semibold mb-2">
                  heldeelife Customer Support
                </p>
                <p className="text-gray-600">
                  Email:{' '}
                  <a
                    href="mailto:returns@heldeelife.com"
                    className="text-orange-600 hover:underline"
                  >
                    returns@heldeelife.com
                  </a>
                </p>
                <p className="text-gray-600">Phone: +91 1800-123-4567</p>
                <p className="text-gray-600">
                  Hours: Monday - Saturday, 9 AM - 6 PM
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
