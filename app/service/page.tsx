'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Calendar, Clock, User, Phone, Mail } from 'lucide-react'
import { useState } from 'react'

export default function ServicePage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    service: '',
    date: '',
    time: '',
    message: '',
  })

  const services = [
    'General Consultation',
    'Allergy Testing',
    'Respiratory Health Check',
    'Ayurvedic Consultation',
    'Follow-up Consultation',
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission
    alert("Consultation request submitted! We'll contact you soon.")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/40 py-8 md:py-16">
      <div className="container px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Book a <span className="text-orange-600">Consultation</span>
        </h1>
        <p className="text-xl text-gray-600 mb-12 max-w-2xl">
          Schedule a consultation with our expert doctors. Fill out the form
          below and we&apos;ll get back to you.
        </p>

        <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Form */}
          <Card className="border border-gray-200 shadow-xl bg-white">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Consultation Request
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label
                    htmlFor="name"
                    className="text-sm font-semibold text-gray-900 flex items-center gap-2"
                  >
                    <User className="h-4 w-4" />
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="rounded-lg mt-1"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <Label
                    htmlFor="email"
                    className="font-light flex items-center gap-2"
                  >
                    <Mail className="h-4 w-4" />
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="rounded-lg mt-1"
                    placeholder="your.email@example.com"
                  />
                </div>

                <div>
                  <Label
                    htmlFor="phone"
                    className="font-light flex items-center gap-2"
                  >
                    <Phone className="h-4 w-4" />
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="rounded-lg mt-1"
                    placeholder="+91 1234567890"
                  />
                </div>

                <div>
                  <Label htmlFor="service" className="font-light">
                    Service Type
                  </Label>
                  <select
                    id="service"
                    required
                    value={formData.service}
                    onChange={(e) =>
                      setFormData({ ...formData, service: e.target.value })
                    }
                    className="flex h-12 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm transition-all duration-200 focus-visible:outline-none focus-visible:border-orange-500 focus-visible:ring-2 focus-visible:ring-orange-100 disabled:cursor-not-allowed disabled:opacity-50 mt-1"
                  >
                    <option value="">Select a service</option>
                    {services.map((service) => (
                      <option key={service} value={service}>
                        {service}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label
                      htmlFor="date"
                      className="font-light flex items-center gap-2"
                    >
                      <Calendar className="h-4 w-4" />
                      Preferred Date
                    </Label>
                    <Input
                      id="date"
                      type="date"
                      required
                      value={formData.date}
                      onChange={(e) =>
                        setFormData({ ...formData, date: e.target.value })
                      }
                      className="rounded-lg mt-1"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="time"
                      className="font-light flex items-center gap-2"
                    >
                      <Clock className="h-4 w-4" />
                      Preferred Time
                    </Label>
                    <Input
                      id="time"
                      type="time"
                      required
                      value={formData.time}
                      onChange={(e) =>
                        setFormData({ ...formData, time: e.target.value })
                      }
                      className="rounded-lg mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="message" className="font-light">
                    Additional Message
                  </Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    className="rounded-lg border-gray-300 bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all duration-200 mt-1 min-h-[100px]"
                    placeholder="Tell us about your concerns or any specific questions..."
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200 mt-6"
                >
                  Book Consultation
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Info Card */}
          <div className="space-y-6">
            <Card className="border border-gray-200 shadow-xl bg-gradient-to-br from-orange-600 to-orange-700 text-white">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-4">
                  Why Choose Our Consultation?
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <span>✓</span>
                    <span>
                      Expert Ayurvedic and modern medicine practitioners
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>✓</span>
                    <span>Personalized treatment plans</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>✓</span>
                    <span>Online and in-person consultations available</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>✓</span>
                    <span>Follow-up care and support</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardContent className="p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Contact Information
                </h3>
                <div className="space-y-3 text-gray-600">
                  <p>
                    <strong>Email:</strong> support@heldeelife.com
                  </p>
                  <p>
                    <strong>Phone:</strong> +91 1800-123-4567
                  </p>
                  <p>
                    <strong>Hours:</strong> Mon-Sat, 9 AM - 6 PM
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
