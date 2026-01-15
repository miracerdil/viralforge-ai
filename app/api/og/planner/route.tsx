import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const dayTitle = searchParams.get('dayTitle') || 'Day 1';
  const contentType = searchParams.get('contentType') || 'Lifestyle';
  const hook = searchParams.get('hook') || 'An engaging hook for your video';
  const tip1 = searchParams.get('tip1') || 'Post at peak engagement times';
  const tip2 = searchParams.get('tip2') || 'Use trending sounds';
  const locale = searchParams.get('locale') || 'tr';

  const isEnglish = locale === 'en';
  const title = isEnglish ? 'Weekly Content Plan' : 'Haftalık İçerik Planı';
  const contentLabel = isEnglish ? 'Content Type' : 'İçerik Tipi';
  const hookLabel = isEnglish ? 'Recommended Hook' : 'Önerilen Hook';
  const tipsLabel = isEnglish ? 'Tips' : 'İpuçları';

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 50%, #8b5cf6 100%)',
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
            flex: 1,
            background: 'rgba(255,255,255,0.95)',
            borderRadius: '24px',
            padding: '35px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Day Title */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '25px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '28px',
                }}
              >
                📅
              </div>
              <span style={{ fontSize: '36px', fontWeight: 'bold', color: '#1f2937' }}>
                {dayTitle}
              </span>
            </div>
            <div
              style={{
                background: '#e0e7ff',
                padding: '10px 20px',
                borderRadius: '10px',
              }}
            >
              <span style={{ fontSize: '16px', color: '#4f46e5', fontWeight: '600' }}>
                {contentLabel}: {contentType}
              </span>
            </div>
          </div>

          {/* Hook */}
          <div
            style={{
              background: '#f8fafc',
              borderRadius: '16px',
              padding: '25px',
              marginBottom: '20px',
              border: '2px solid #e2e8f0',
            }}
          >
            <span
              style={{
                fontSize: '14px',
                color: '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '10px',
              }}
            >
              {hookLabel}
            </span>
            <p style={{ fontSize: '22px', color: '#1f2937', lineHeight: '1.5', margin: 0 }}>
              "{hook}"
            </p>
          </div>

          {/* Tips */}
          <div
            style={{
              display: 'flex',
              gap: '15px',
            }}
          >
            <div
              style={{
                flex: 1,
                background: '#fef3c7',
                borderRadius: '12px',
                padding: '15px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <span style={{ fontSize: '20px' }}>💡</span>
              <span style={{ fontSize: '16px', color: '#92400e' }}>{tip1}</span>
            </div>
            <div
              style={{
                flex: 1,
                background: '#d1fae5',
                borderRadius: '12px',
                padding: '15px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <span style={{ fontSize: '20px' }}>🎯</span>
              <span style={{ fontSize: '16px', color: '#065f46' }}>{tip2}</span>
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
