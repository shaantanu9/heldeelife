'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Phone, Video, Star, Clock, Users, Award } from 'lucide-react'
import Link from 'next/link'

const doctors = [
  {
    id: 1,
    name: 'Dr. Nazriya Begum',
    specialty: 'Ayurvedic Specialist',
    experience: '15+ Years',
    patients: '10,000+',
    rating: 4.9,
    image: '👩‍⚕️',
    available: true,
    nextAvailable: 'Today, 2:00 PM',
  },
  {
    id: 2,
    name: 'Dr. Rajesh Kumar',
    specialty: 'Modern Medicine Expert',
    experience: '12+ Years',
    patients: '8,500+',
    rating: 4.8,
    image: '👨‍⚕️',
    available: true,
    nextAvailable: 'Today, 3:30 PM',
  },
  {
    id: 3,
    name: 'Dr. Priya Sharma',
    specialty: 'Holistic Wellness',
    experience: '18+ Years',
    patients: '12,000+',
    rating: 4.9,
    image: '👩‍⚕️',
    available: true,
    nextAvailable: 'Today, 4:00 PM',
  },
  {
    id: 4,
    name: 'Dr. Amit Patel',
    specialty: 'Integrative Medicine',
    experience: '10+ Years',
    patients: '7,000+',
    rating: 4.7,
    image: '👨‍⚕️',
    available: true,
    nextAvailable: 'Tomorrow, 10:00 AM',
  },
]

export function Doctors() {
  return (
    <section className="py-24 bg-gradient-to-br from-slate-50 via-white to-orange-50/40">
      <div className="container px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header with Value Proposition */}
          <div className="text-center mb-16">
            <p className="text-xs uppercase tracking-[0.2em] text-orange-600 font-light mb-4">
              EXPERT MEDICAL CONSULTATIONS
            </p>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 tracking-tight">
              Consult with{' '}
              <span className="text-orange-600">Certified Experts</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Get personalized health guidance from experienced Ayurvedic
              doctors and modern medicine specialists. Book your consultation
              today and take the first step towards holistic wellness.
            </p>
          </div>

          {/* Trust Signals Bar */}
          <div className="flex flex-wrap items-center justify-center gap-8 mb-12 p-6 bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <Award className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="font-bold text-gray-900">Certified Experts</p>
                <p className="text-xs text-gray-600">All doctors verified</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="font-bold text-gray-900">Quick Appointments</p>
                <p className="text-xs text-gray-600">Available today</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                <Users className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="font-bold text-gray-900">50,000+ Consultations</p>
                <p className="text-xs text-gray-600">Trusted by thousands</p>
              </div>
            </div>
          </div>

          {/* Doctors Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {doctors.map((doctor) => (
              <Card
                key={doctor.id}
                className="border border-gray-200 shadow-md hover:shadow-xl transition-all duration-300 bg-white group"
              >
                <CardContent className="p-6">
                  {/* Doctor Image & Status */}
                  <div className="text-center mb-6">
                    <div className="relative inline-block">
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform">
                        <span className="text-5xl">{doctor.image}</span>
                      </div>
                      {doctor.available && (
                        <div className="absolute top-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                    <h3 className="font-bold text-lg mb-1 text-gray-900">
                      {doctor.name}
                    </h3>
                    <p className="text-sm text-orange-600 font-medium mb-2">
                      {doctor.specialty}
                    </p>
                    <div className="flex items-center justify-center gap-1 mb-3">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-semibold text-gray-900">
                        {doctor.rating}
                      </span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="space-y-2 mb-6 pb-6 border-b border-gray-100">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Experience</span>
                      <span className="font-semibold text-gray-900">
                        {doctor.experience}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Patients Treated</span>
                      <span className="font-semibold text-gray-900">
                        {doctor.patients}
                      </span>
                    </div>
                    {doctor.available && (
                      <div className="flex items-center justify-between text-sm pt-2">
                        <span className="text-gray-600">Next Available</span>
                        <span className="font-semibold text-green-600">
                          {doctor.nextAvailable}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 rounded-lg border-gray-300 hover:border-orange-500 hover:text-orange-600 text-xs"
                        asChild
                      >
                        <Link href={`/service?doctor=${doctor.id}&type=call`}>
                          <Phone className="h-3 w-3 mr-1" />
                          Call
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 rounded-lg border-gray-300 hover:border-orange-500 hover:text-orange-600 text-xs"
                        asChild
                      >
                        <Link href={`/service?doctor=${doctor.id}&type=video`}>
                          <Video className="h-3 w-3 mr-1" />
                          Video
                        </Link>
                      </Button>
                    </div>
                    <Button
                      className="w-full rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200 text-sm"
                      asChild
                    >
                      <Link href={`/service?doctor=${doctor.id}`}>
                        Book Appointment
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Bottom CTA */}
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              Need help choosing the right specialist?
            </p>
            <Button
              size="lg"
              className="rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200 px-8"
              asChild
            >
              <Link href="/service">View All Specialists</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
