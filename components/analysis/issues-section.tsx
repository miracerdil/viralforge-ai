'use client';

import { AlertTriangle, CheckCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface IssuesSectionProps {
  issues: string[];
  title: string;
  noIssuesText: string;
}

export function IssuesSection({ issues, title, noIssuesText }: IssuesSectionProps) {
  const hasIssues = issues.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {hasIssues ? (
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          ) : (
            <CheckCircle className="w-5 h-5 text-green-500" />
          )}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hasIssues ? (
          <ul className="space-y-2">
            {issues.map((issue, index) => (
              <li key={index} className="flex items-start gap-2 text-gray-700">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 flex-shrink-0" />
                <span>{issue}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">{noIssuesText}</p>
        )}
      </CardContent>
    </Card>
  );
}
