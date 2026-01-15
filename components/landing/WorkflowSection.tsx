import { Sparkles, FlaskConical, Zap, ArrowRight } from 'lucide-react';

interface WorkflowSectionProps {
  locale: string;
}

export function WorkflowSection({ locale }: WorkflowSectionProps) {
  const content = {
    tr: {
      title: 'Nasıl Çalışır?',
      subtitle: '3 adımda içeriklerini optimize et',
      steps: [
        {
          number: '1',
          title: 'Hook Üret',
          description: 'Platforma özel AI hook\'lar',
          detail: 'TikTok, Reels, Shorts için optimize edilmiş dikkat çekici açılışlar oluştur',
        },
        {
          number: '2',
          title: 'Test & Analiz',
          description: 'A/B test ve performans takibi',
          detail: 'Hangi hook\'un daha iyi performans gösterdiğini gerçek verilerle öğren',
        },
        {
          number: '3',
          title: 'Otomatik Optimize',
          description: 'AI sonuçlara göre stratejiyi günceller',
          detail: 'Performans verilerine göre bir sonraki içeriğin otomatik optimize edilir',
        },
      ],
    },
    en: {
      title: 'How It Works?',
      subtitle: 'Optimize your content in 3 steps',
      steps: [
        {
          number: '1',
          title: 'Generate Hooks',
          description: 'Platform-specific AI hooks',
          detail: 'Create attention-grabbing openings optimized for TikTok, Reels, Shorts',
        },
        {
          number: '2',
          title: 'Test & Analyze',
          description: 'A/B testing and performance tracking',
          detail: 'Learn which hooks perform better with real data',
        },
        {
          number: '3',
          title: 'Auto Optimize',
          description: 'AI updates strategy based on results',
          detail: 'Your next content is automatically optimized based on performance data',
        },
      ],
    },
  };

  const t = content[locale as 'tr' | 'en'] || content.tr;

  const IconComponent = ({ index }: { index: number }) => {
    switch (index) {
      case 0:
        return <Sparkles className="w-6 h-6" />;
      case 1:
        return <FlaskConical className="w-6 h-6" />;
      case 2:
        return <Zap className="w-6 h-6" />;
      default:
        return <Sparkles className="w-6 h-6" />;
    }
  };

  const gradients = [
    'from-primary-500 to-primary-600',
    'from-accent-500 to-accent-600',
    'from-green-500 to-emerald-600',
  ];

  const bgColors = [
    'bg-primary-50',
    'bg-accent-50',
    'bg-green-50',
  ];

  return (
    <section id="how-it-works" className="py-16 sm:py-20 lg:py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12 lg:mb-16">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
            {t.title}
          </h2>
          <p className="mt-3 text-base sm:text-lg text-gray-600">
            {t.subtitle}
          </p>
        </div>

        {/* Workflow Steps */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {t.steps.map((step, index) => (
            <div key={index} className="relative group">
              {/* Connector line (hidden on mobile, shown on desktop) */}
              {index < t.steps.length - 1 && (
                <div className="hidden md:block absolute top-12 left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-0.5 bg-gray-200">
                  <ArrowRight className="absolute -right-2 -top-2 w-4 h-4 text-gray-300" />
                </div>
              )}

              <div className={`relative ${bgColors[index]} rounded-2xl p-6 lg:p-8 border border-gray-100 transition-all duration-300 hover:shadow-lg hover:-translate-y-1`}>
                {/* Step number badge */}
                <div className={`absolute -top-3 left-6 w-8 h-8 bg-gradient-to-br ${gradients[index]} text-white rounded-lg flex items-center justify-center text-sm font-bold shadow-md`}>
                  {step.number}
                </div>

                {/* Icon */}
                <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center mb-4 shadow-sm text-gray-700 group-hover:scale-110 transition-transform">
                  <IconComponent index={index} />
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-sm font-medium text-primary-600 mb-3">
                  {step.description}
                </p>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {step.detail}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Visual flow indicator for mobile */}
        <div className="flex md:hidden justify-center mt-8">
          <div className="flex items-center gap-2 text-gray-400">
            <div className="w-2 h-2 rounded-full bg-primary-500" />
            <ArrowRight className="w-4 h-4" />
            <div className="w-2 h-2 rounded-full bg-accent-500" />
            <ArrowRight className="w-4 h-4" />
            <div className="w-2 h-2 rounded-full bg-green-500" />
          </div>
        </div>
      </div>
    </section>
  );
}
