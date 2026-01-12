import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

export interface WidgetHtmlProps {
  content: string;
  type?: 'html' | 'markdown';
}

export const WidgetHtml: React.FC<WidgetHtmlProps> = ({ content, type = 'html' }) => {
  return (
    <Card>
      <CardContent className="pt-6">
        <div 
            className="prose dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: content }} 
        />
      </CardContent>
    </Card>
  );
};
