'use client';

import { useState } from 'react';
import { Check, ChevronDown, Plus, Building2 } from 'lucide-react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { cn } from '@/lib/utils';

interface WorkspaceSwitcherProps {
  locale: string;
  onCreateNew?: () => void;
}

export function WorkspaceSwitcher({ locale, onCreateNew }: WorkspaceSwitcherProps) {
  const { workspaces, currentWorkspace, setCurrentWorkspace, loading } = useWorkspace();
  const [isOpen, setIsOpen] = useState(false);

  const t = {
    selectWorkspace: locale === 'tr' ? 'Çalışma Alanı Seç' : 'Select Workspace',
    createNew: locale === 'tr' ? 'Yeni Oluştur' : 'Create New',
    personal: locale === 'tr' ? 'Kişisel' : 'Personal',
  };

  if (loading || workspaces.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center">
          {currentWorkspace?.logoUrl ? (
            <img
              src={currentWorkspace.logoUrl}
              alt={currentWorkspace.name}
              className="w-6 h-6 rounded"
            />
          ) : (
            <Building2 className="w-4 h-4 text-primary-600" />
          )}
        </div>
        <span className="font-medium text-gray-900 max-w-[120px] truncate">
          {currentWorkspace?.name || t.personal}
        </span>
        <ChevronDown className={cn(
          'w-4 h-4 text-gray-400 transition-transform',
          isOpen && 'rotate-180'
        )} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
            <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase">
              {t.selectWorkspace}
            </div>

            {workspaces.map((workspace) => (
              <button
                key={workspace.id}
                onClick={() => {
                  setCurrentWorkspace(workspace);
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                  {workspace.logoUrl ? (
                    <img
                      src={workspace.logoUrl}
                      alt={workspace.name}
                      className="w-6 h-6 rounded"
                    />
                  ) : (
                    <Building2 className="w-4 h-4 text-gray-600" />
                  )}
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium text-gray-900 truncate">{workspace.name}</div>
                  <div className="text-xs text-gray-500">{workspace.planType}</div>
                </div>
                {currentWorkspace?.id === workspace.id && (
                  <Check className="w-4 h-4 text-primary-600 shrink-0" />
                )}
              </button>
            ))}

            {onCreateNew && (
              <>
                <div className="my-2 border-t border-gray-100" />
                <button
                  onClick={() => {
                    onCreateNew();
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 transition-colors text-primary-600"
                >
                  <div className="w-8 h-8 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                    <Plus className="w-4 h-4" />
                  </div>
                  <span className="font-medium">{t.createNew}</span>
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
