import { Scissors } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { EditingInstruction } from '@/lib/types/database';

interface EditingSectionProps {
  instructions: EditingInstruction[];
  title: string;
  noInstructionsText: string;
  timeRangeLabel: string;
}

export function EditingSection({
  instructions,
  title,
  noInstructionsText,
  timeRangeLabel,
}: EditingSectionProps) {
  if (instructions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scissors className="w-5 h-5 text-gray-400" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">{noInstructionsText}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scissors className="w-5 h-5 text-primary-500" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {instructions.map((instruction, index) => (
            <div key={index} className="border-l-4 border-primary-500 pl-4 py-2">
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                <span className="font-medium">{timeRangeLabel}:</span>
                <span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-mono">
                  {instruction.start_sec}s - {instruction.end_sec}s
                </span>
              </div>
              <p className="text-gray-700">{instruction.instruction}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
