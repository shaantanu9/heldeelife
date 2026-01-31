import { ChevronDown } from 'lucide-react'

export function Hero() {
  return (
    <section className="relative min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/40 overflow-hidden">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M50 50 L90 10 L50 50 L10 10 Z' fill='%23EA580C'/%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      <div className="container relative z-10 px-4 py-32">
        <div className="grid lg:grid-cols-2 gap-16 items-center max-w-7xl mx-auto">
          {/* Left Content */}
          <div className="space-y-8">
            <p className="text-xs uppercase tracking-[0.2em] text-orange-600 font-light">
              HOLISTIC APPROACH
            </p>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 leading-[1.1] tracking-tight">
              Ayurveda and{' '}
              <span className="text-orange-600">modern medicine</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-xl leading-relaxed">
              Your trusted partner in holistic health and wellness. Access your
              personalized dashboard and continue your wellness journey.
            </p>
          </div>

          {/* Right Image */}
          <div className="relative">
            <div className="relative z-10">
              {/* Placeholder for woman image */}
              <div className="aspect-square rounded-full bg-gradient-to-br from-orange-100/50 to-orange-50/30 flex items-center justify-center overflow-hidden">
                <div className="w-full h-full bg-gradient-to-br from-white to-orange-50/20 rounded-full flex items-center justify-center">
                  <span className="text-8xl opacity-60">🧘</span>
                </div>
              </div>
            </div>
            {/* Decorative Elements */}
            <div className="absolute top-10 right-10 w-40 h-40 bg-orange-200/30 rounded-full blur-3xl" />
            <div className="absolute bottom-10 left-10 w-32 h-32 bg-orange-100/40 rounded-full blur-2xl" />
          </div>
        </div>

        {/* Background Text */}
        <div className="absolute bottom-0 left-0 right-0 text-center z-0 pointer-events-none">
          <p className="text-[120px] md:text-[200px] lg:text-[280px] font-serif font-light text-orange-50/30 select-none leading-none">
            Breath In
          </p>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-12 right-12 flex flex-col items-center gap-2 z-20">
        <ChevronDown className="h-5 w-5 text-orange-600/60 animate-bounce" />
      </div>
    </section>
  )
}
