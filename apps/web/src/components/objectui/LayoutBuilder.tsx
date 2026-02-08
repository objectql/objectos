/**
 * LayoutBuilder — drag-and-drop page layout configuration.
 *
 * Allows administrators to configure which fields and sections appear
 * on a record detail page. Sections can be reordered using up/down controls.
 * Uses the PageLayout / LayoutSection types from workflow.ts.
 */

import { useState, useCallback } from 'react';
import { GripVertical, Plus, Trash2, ChevronUp, ChevronDown, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import type { LayoutSection, LayoutSectionType, PageLayout } from '@/types/workflow';
import type { ObjectDefinition } from '@/types/metadata';
import { resolveFields } from '@/types/metadata';

interface LayoutBuilderProps {
  objectDef: ObjectDefinition;
  layout: PageLayout;
  onLayoutChange: (layout: PageLayout) => void;
}

const sectionTypeLabels: Record<LayoutSectionType, string> = {
  fields: 'Fields',
  related: 'Related Records',
  activity: 'Activity Timeline',
  chart: 'Chart',
};

function generateId(): string {
  return `section-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function LayoutBuilder({ objectDef, layout, onLayoutChange }: LayoutBuilderProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const availableFields = resolveFields(objectDef.fields, ['id']);

  const updateSections = useCallback(
    (sections: LayoutSection[]) => {
      onLayoutChange({ ...layout, sections });
    },
    [layout, onLayoutChange],
  );

  const addSection = useCallback(
    (type: LayoutSectionType) => {
      const newSection: LayoutSection = {
        id: generateId(),
        type,
        title: sectionTypeLabels[type],
        columns: type === 'fields' ? 2 : 1,
        fields: type === 'fields' ? [] : undefined,
      };
      updateSections([...layout.sections, newSection]);
    },
    [layout.sections, updateSections],
  );

  const removeSection = useCallback(
    (id: string) => {
      updateSections(layout.sections.filter((s) => s.id !== id));
    },
    [layout.sections, updateSections],
  );

  const moveSection = useCallback(
    (id: string, direction: 'up' | 'down') => {
      const sections = [...layout.sections];
      const idx = sections.findIndex((s) => s.id === id);
      if (idx === -1) return;
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= sections.length) return;
      [sections[idx], sections[targetIdx]] = [sections[targetIdx], sections[idx]];
      updateSections(sections);
    },
    [layout.sections, updateSections],
  );

  const updateSection = useCallback(
    (id: string, updates: Partial<LayoutSection>) => {
      updateSections(
        layout.sections.map((s) => (s.id === id ? { ...s, ...updates } : s)),
      );
    },
    [layout.sections, updateSections],
  );

  const toggleField = useCallback(
    (sectionId: string, fieldName: string) => {
      const section = layout.sections.find((s) => s.id === sectionId);
      if (!section) return;
      const fields = section.fields ?? [];
      const newFields = fields.includes(fieldName)
        ? fields.filter((f) => f !== fieldName)
        : [...fields, fieldName];
      updateSection(sectionId, { fields: newFields });
    },
    [layout.sections, updateSection],
  );

  return (
    <div className="space-y-4" data-testid="layout-builder">
      {/* Section list */}
      {layout.sections.map((section, idx) => (
        <Card key={section.id} className="relative">
          <CardHeader className="flex flex-row items-center gap-2 space-y-0 p-3">
            <GripVertical className="size-4 shrink-0 text-muted-foreground" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {sectionTypeLabels[section.type]}
                </Badge>
                <span className="text-sm font-medium">{section.title}</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="size-7 p-0"
                onClick={() => moveSection(section.id, 'up')}
                disabled={idx === 0}
                aria-label="Move section up"
              >
                <ChevronUp className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="size-7 p-0"
                onClick={() => moveSection(section.id, 'down')}
                disabled={idx === layout.sections.length - 1}
                aria-label="Move section down"
              >
                <ChevronDown className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="size-7 p-0"
                onClick={() =>
                  setExpandedSection(expandedSection === section.id ? null : section.id)
                }
                aria-label="Configure section"
              >
                <Settings className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="size-7 p-0 text-destructive hover:text-destructive"
                onClick={() => removeSection(section.id)}
                aria-label="Remove section"
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          </CardHeader>

          {/* Expanded config */}
          {expandedSection === section.id && (
            <CardContent className="border-t p-3">
              <div className="space-y-3">
                <div>
                  <Label htmlFor={`title-${section.id}`}>Section Title</Label>
                  <Input
                    id={`title-${section.id}`}
                    value={section.title}
                    onChange={(e) => updateSection(section.id, { title: e.target.value })}
                    className="mt-1"
                  />
                </div>
                {section.type === 'fields' && (
                  <div>
                    <Label>Fields</Label>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {availableFields.map((field) => {
                        const selected = section.fields?.includes(field.name);
                        return (
                          <Badge
                            key={field.name}
                            variant={selected ? 'default' : 'outline'}
                            className="cursor-pointer"
                            onClick={() => toggleField(section.id, field.name)}
                          >
                            {field.label}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          )}
        </Card>
      ))}

      {/* Add section buttons */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(sectionTypeLabels) as LayoutSectionType[]).map((type) => (
          <Button
            key={type}
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => addSection(type)}
          >
            <Plus className="size-3.5" />
            {sectionTypeLabels[type]}
          </Button>
        ))}
      </div>
    </div>
  );
}
