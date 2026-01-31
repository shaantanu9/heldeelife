'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, Award, CheckCircle2 } from 'lucide-react'

export function SidebarTrustSignals() {
  return (
    <Card className="border-2 border-green-100 bg-gradient-to-br from-green-50/50 to-white shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Shield className="h-5 w-5 text-green-600" />
          Trust & Quality
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 100% Authentic - Main Section */}
        <div className="flex items-start gap-3 p-4 bg-white rounded-lg border-2 border-green-200 shadow-sm">
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center border-2 border-green-300">
            <Shield className="h-6 w-6 text-green-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 mb-1 text-base">
              100% Authentic
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Certified Ayurvedic products
            </p>
          </div>
        </div>

        {/* Expert Verified */}
        <div className="flex items-start gap-3 p-4 bg-white rounded-lg border-2 border-blue-200 shadow-sm">
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center border-2 border-blue-300">
            <Award className="h-6 w-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 mb-1 text-base">
              Expert Verified
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Doctor-approved formulations
            </p>
          </div>
        </div>

        {/* Certifications Section */}
        <div className="pt-4 border-t-2 border-gray-200">
          <h4 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">
            Certifications
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col items-center gap-2 p-3 bg-white rounded-lg border-2 border-gray-200 shadow-sm hover:border-green-300 transition-colors">
              <span className="text-3xl">🏭</span>
              <p className="text-xs text-gray-700 font-semibold text-center">
                GMP Certified
              </p>
            </div>
            <div className="flex flex-col items-center gap-2 p-3 bg-white rounded-lg border-2 border-gray-200 shadow-sm hover:border-green-300 transition-colors">
              <span className="text-3xl">✅</span>
              <p className="text-xs text-gray-700 font-semibold text-center">
                ISO 9001
              </p>
            </div>
            <div className="flex flex-col items-center gap-2 p-3 bg-white rounded-lg border-2 border-gray-200 shadow-sm hover:border-green-300 transition-colors">
              <span className="text-3xl">🌿</span>
              <p className="text-xs text-gray-700 font-semibold text-center">
                Ayurvedic License
              </p>
            </div>
            <div className="flex flex-col items-center gap-2 p-3 bg-white rounded-lg border-2 border-gray-200 shadow-sm hover:border-green-300 transition-colors">
              <span className="text-3xl">💊</span>
              <p className="text-xs text-gray-700 font-semibold text-center">
                FDA Approved
              </p>
            </div>
          </div>
        </div>

        {/* Quality Rating Badge */}
        <div className="pt-4 border-t-2 border-gray-200">
          <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-green-50 via-blue-50 to-green-50 rounded-lg border-2 border-green-200">
            <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-gray-900">4.8/5 Rating</p>
              <p className="text-xs text-gray-600">From 10,000+ reviews</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
