/**
 * ObjectUI Demo Page
 *
 * Demonstrates the @object-ui integration in ObjectOS.
 * Shows how to use @object-ui/react components with the ObjectStack backend.
 *
 * Route: /settings/objectui-demo
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ObjectUIExample } from '@/components/objectui';
import { CheckCircle2 } from 'lucide-react';

export default function ObjectUIDemoPage() {
  const [selectedObject, setSelectedObject] = useState('contacts');
  const [selectedView, setSelectedView] = useState('grid');

  const demoObjects = [
    { name: 'contacts', label: 'Contacts' },
    { name: 'accounts', label: 'Accounts' },
    { name: 'opportunities', label: 'Opportunities' },
  ];

  const views = [
    { name: 'grid', label: 'Grid View' },
    { name: 'form', label: 'Form View' },
    { name: 'kanban', label: 'Kanban View' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">ObjectUI Integration</h2>
        <p className="text-muted-foreground">
          Demonstration of @object-ui components integrated with ObjectStack backend.
        </p>
      </div>

      {/* Installation Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="size-5 text-green-600" />
            ObjectUI Packages Installed
          </CardTitle>
          <CardDescription>
            The following @object-ui packages are now available in development:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">@object-ui/core@2.0.0</Badge>
            <Badge variant="secondary">@object-ui/react@2.0.0</Badge>
            <Badge variant="secondary">@object-ui/components@2.0.0</Badge>
            <Badge variant="secondary">@object-ui/layout@2.0.0</Badge>
            <Badge variant="secondary">@object-ui/fields@2.0.0</Badge>
            <Badge variant="secondary">@object-ui/data-objectstack@2.0.0</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Interactive Demo */}
      <Card>
        <CardHeader>
          <CardTitle>Interactive Demo</CardTitle>
          <CardDescription>
            Select an object and view mode to see the ObjectUI components in action.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Object Selector */}
          <div>
            <label className="text-sm font-medium mb-2 block">Select Object</label>
            <div className="flex gap-2">
              {demoObjects.map((obj) => (
                <Button
                  key={obj.name}
                  variant={selectedObject === obj.name ? 'default' : 'outline'}
                  onClick={() => setSelectedObject(obj.name)}
                  size="sm"
                >
                  {obj.label}
                </Button>
              ))}
            </div>
          </div>

          {/* View Selector */}
          <div>
            <label className="text-sm font-medium mb-2 block">Select View</label>
            <div className="flex gap-2">
              {views.map((view) => (
                <Button
                  key={view.name}
                  variant={selectedView === view.name ? 'default' : 'outline'}
                  onClick={() => setSelectedView(view.name)}
                  size="sm"
                >
                  {view.label}
                </Button>
              ))}
            </div>
          </div>

          {/* ObjectUI Renderer */}
          <div className="border rounded-lg p-4 bg-muted/50">
            <ObjectUIExample objectName={selectedObject} view={selectedView} />
          </div>
        </CardContent>
      </Card>

      {/* Documentation */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Guide</CardTitle>
          <CardDescription>How to use @object-ui components in your application</CardDescription>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none">
          <h3 className="text-base font-semibold">Basic Usage</h3>
          <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
            {`import { SchemaRenderer } from '@object-ui/react';
import { objectUIAdapter } from '@/lib/object-ui-adapter';

function MyComponent() {
  return (
    <SchemaRenderer
      adapter={objectUIAdapter}
      objectName="contacts"
      view="grid"
    />
  );
}`}
          </pre>

          <h3 className="text-base font-semibold mt-4">Available Packages</h3>
          <ul className="list-disc list-inside space-y-1">
            <li>
              <code>@object-ui/core</code> - Core logic and types
            </li>
            <li>
              <code>@object-ui/react</code> - React components and SchemaRenderer
            </li>
            <li>
              <code>@object-ui/components</code> - Standard UI components (Shadcn-based)
            </li>
            <li>
              <code>@object-ui/layout</code> - Application shell components
            </li>
            <li>
              <code>@object-ui/fields</code> - Field renderers
            </li>
            <li>
              <code>@object-ui/data-objectstack</code> - ObjectStack data adapter
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
