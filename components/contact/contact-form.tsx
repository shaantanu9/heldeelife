'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Send } from 'lucide-react'
import { useState } from 'react'

export function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission
    alert('Thank you for contacting us! We&apos;ll get back to you soon.')
    setFormData({ name: '', email: '', phone: '', subject: '', message: '' })
  }

  return (
    <Card className="border border-gray-200 shadow-xl bg-white">
      <CardContent className="p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Send us a Message
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label
              htmlFor="name"
              className="text-sm font-semibold text-gray-900"
            >
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
              className="text-sm font-semibold text-gray-900"
            >
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
              className="text-sm font-semibold text-gray-900"
            >
              Phone Number
            </Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              className="rounded-lg mt-1"
              placeholder="+91 1234567890"
            />
          </div>

          <div>
            <Label
              htmlFor="subject"
              className="text-sm font-semibold text-gray-900"
            >
              Subject
            </Label>
            <Input
              id="subject"
              required
              value={formData.subject}
              onChange={(e) =>
                setFormData({ ...formData, subject: e.target.value })
              }
              className="rounded-lg mt-1"
              placeholder="What is this regarding?"
            />
          </div>

          <div>
            <Label
              htmlFor="message"
              className="text-sm font-semibold text-gray-900"
            >
              Message
            </Label>
            <Textarea
              id="message"
              required
              value={formData.message}
              onChange={(e) =>
                setFormData({ ...formData, message: e.target.value })
              }
              className="rounded-lg border-gray-300 bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all duration-200 mt-1 min-h-[120px]"
              placeholder="Tell us how we can help you..."
            />
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200 mt-6"
          >
            <Send className="h-4 w-4 mr-2" />
            Send Message
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}









