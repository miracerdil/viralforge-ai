'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { applyTheme, DEFAULT_THEME, WhiteLabelTheme } from '@/lib/theme/white-label';

interface WorkspaceData {
  workspace: {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
  };
  whiteLabel: {
    appName: string;
    customLogoUrl: string | null;
    theme: WhiteLabelTheme;
    hideViralForgeBranding: boolean;
    customCss: string | null;
  } | null;
}

export default function ClientPortalPage() {
  const params = useParams();
  const workspaceSlug = params.workspaceSlug as string;
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<WorkspaceData | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    fetchWorkspaceData();
  }, [workspaceSlug]);

  useEffect(() => {
    if (data?.whiteLabel) {
      applyTheme(data.whiteLabel.theme || DEFAULT_THEME, data.whiteLabel.customCss);
    }
  }, [data]);

  const fetchWorkspaceData = async () => {
    try {
      // Get workspace by slug
      const { data: workspace, error: wsError } = await supabase
        .from('workspaces')
        .select(`
          id,
          name,
          slug,
          logo_url,
          white_label_settings(
            app_name,
            custom_logo_url,
            theme_json,
            hide_viralforge_branding,
            custom_css,
            is_active
          )
        `)
        .eq('slug', workspaceSlug)
        .eq('is_active', true)
        .single();

      if (wsError || !workspace) {
        setError('Workspace not found');
        setLoading(false);
        return;
      }

      // Check if user is authenticated and a member
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: membership } = await supabase
          .from('workspace_members')
          .select('role')
          .eq('workspace_id', workspace.id)
          .eq('user_id', user.id)
          .eq('is_active', true)
          .single();

        setIsAuthenticated(!!membership);
      }

      const whiteLabel = (workspace as any).white_label_settings?.[0];

      setData({
        workspace: {
          id: workspace.id,
          name: workspace.name,
          slug: workspace.slug,
          logoUrl: workspace.logo_url,
        },
        whiteLabel: whiteLabel ? {
          appName: whiteLabel.app_name,
          customLogoUrl: whiteLabel.custom_logo_url,
          theme: whiteLabel.theme_json || DEFAULT_THEME,
          hideViralForgeBranding: whiteLabel.hide_viralforge_branding,
          customCss: whiteLabel.custom_css,
        } : null,
      });
    } catch (err) {
      console.error('Error fetching workspace:', err);
      setError('Failed to load workspace');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Workspace Not Found</h1>
          <p className="text-gray-600">The workspace you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const { workspace, whiteLabel } = data;
  const appName = whiteLabel?.appName || workspace.name;
  const logoUrl = whiteLabel?.customLogoUrl || workspace.logoUrl;

  // If not authenticated, show login prompt
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 white-label">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            {logoUrl && (
              <img
                src={logoUrl}
                alt={appName}
                className="h-12 mx-auto mb-6"
              />
            )}
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{appName}</h1>
            <p className="text-gray-600 mb-8">
              Sign in to access your content and tools.
            </p>

            <a
              href={`/login?workspace=${workspace.slug}`}
              className="block w-full py-3 px-4 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors"
            >
              Sign In
            </a>

            {!whiteLabel?.hideViralForgeBranding && (
              <p className="text-xs text-gray-400 mt-8">
                Powered by ViralForge
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Authenticated - show client dashboard
  return (
    <div className="min-h-screen bg-gray-50 white-label">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              {logoUrl && (
                <img src={logoUrl} alt={appName} className="h-8" />
              )}
              <span className="font-semibold text-gray-900">{appName}</span>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => supabase.auth.signOut()}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Welcome to {appName}
          </h2>
          <p className="text-gray-600">
            Your client portal is ready. Content and features will appear here.
          </p>
        </div>
      </main>

      {/* Footer */}
      {!whiteLabel?.hideViralForgeBranding && (
        <footer className="fixed bottom-0 left-0 right-0 py-4 text-center">
          <p className="text-xs text-gray-400">
            Powered by ViralForge
          </p>
        </footer>
      )}
    </div>
  );
}
