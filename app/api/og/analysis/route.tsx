import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const score = searchParams.get('score') || '85';
  const hookScore = searchParams.get('hookScore') || '80';
  const viralPotential = searchParams.get('viralPotential') || '75';
  const tip1 = searchParams.get('tip1') || 'Optimize your hook in first 3 seconds';
  const tip2 = searchParams.get('tip2') || 'Add more engaging captions';
  const locale = searchParams.get('locale') || 'tr';

  const isEnglish = locale === 'en';
  const title = isEnglish ? 'Video Analysis Results' : 'Video Analiz Sonuçları';
  const overallLabel = isEnglish ? 'Overall Score' : 'Genel Skor';
  const hookLabel = isEnglish ? 'Hook Score' : 'Hook Skoru';
  const viralLabel = isEnglish ? 'Viral Potential' : 'Viral Potansiyel';
  const tipsLabel = isEnglish ? 'Key Recommendations' : 'Önemli Öneriler';

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%)',
          padding: '40px',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '30px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                background: 'white',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
              }}
            >
              ⚡
            </div>
            <span style={{ color: 'white', fontSize: '28px', fontWeight: 'bold' }}>
              ViralForge AI
            </span>
          </div>
          <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '20px' }}>{title}</span>
        </div>

        {/* Main Content */}
        <div
          style={{
            display: 'flex',
            flex: 1,
            gap: '30px',
          }}
        >
          {/* Scores */}
          <div
            style={{
              flex: 1,
              background: 'rgba(255,255,255,0.15)',
              borderRadius: '24px',
              padding: '30px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
          >
            {/* Overall Score */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '20px',
                background: 'white',
                borderRadius: '16px',
              }}
            >
              <span style={{ fontSize: '16px', color: '#6b7280', marginBottom: '8px' }}>
                {overallLabel}
              </span>
              <span
                style={{
                  fontSize: '72px',
                  fontWeight: 'bold',
                  color: parseInt(score) >= 70 ? '#10b981' : parseInt(score) >= 50 ? '#f59e0b' : '#ef4444',
                }}
              >
                {score}
              </span>
            </div>

            {/* Sub Scores */}
            <div style={{ display: 'flex', gap: '15px' }}>
              <div
                style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.9)',
                  borderRadius: '12px',
                  padding: '15px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontSize: '14px', color: '#6b7280' }}>{hookLabel}</span>
                <span style={{ fontSize: '32px', fontWeight: 'bold', color: '#1f2937' }}>
                  {hookScore}
                </span>
              </div>
              <div
                style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.9)',
                  borderRadius: '12px',
                  padding: '15px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontSize: '14px', color: '#6b7280' }}>{viralLabel}</span>
                <span style={{ fontSize: '32px', fontWeight: 'bold', color: '#1f2937' }}>
                  {viralPotential}
                </span>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div
            style={{
              flex: 1,
              background: 'rgba(255,255,255,0.95)',
              borderRadius: '24px',
              padding: '30px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <span
              style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#1f2937',
                marginBottom: '20px',
              }}
            >
              {tipsLabel}
            </span>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '15px',
                  background: '#f3f4f6',
                  borderRadius: '12px',
                }}
              >
                <span style={{ fontSize: '20px' }}>💡</span>
                <span style={{ fontSize: '18px', color: '#374151', lineHeight: '1.4' }}>
                  {tip1}
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '15px',
                  background: '#f3f4f6',
                  borderRadius: '12px',
                }}
              >
                <span style={{ fontSize: '20px' }}>🎯</span>
                <span style={{ fontSize: '18px', color: '#374151', lineHeight: '1.4' }}>
                  {tip2}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginTop: '20px',
          }}
        >
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '16px' }}>
            viralforge.ai
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
