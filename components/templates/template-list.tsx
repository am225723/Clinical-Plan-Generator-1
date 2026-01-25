import { FileText, Star, Edit2, Trash2, Copy, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Template {
  id: string;
  name: string;
  template_type: string;
  ai_prompt: string;
  is_default: boolean;
}

interface TemplateListProps {
  templates: Template[];
  onEdit: (template: Template) => void;
  onDuplicate: (template: Template) => void;
  onDelete: (templateId: string) => void;
  onSetDefault: (templateId: string) => void;
  onCreate: () => void;
}

const TEMPLATE_TYPES: Record<string, { label: string; color: string }> = {
  treatment_plan: { label: 'Treatment Plan', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  darp_note: { label: 'DARP Note', color: 'bg-green-500/10 text-green-500 border-green-500/20' },
  psych_note: { label: 'Psych Note', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
  progress_note: { label: 'Progress Note', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
  discharge_summary: { label: 'Discharge', color: 'bg-rose-500/10 text-rose-500 border-rose-500/20' },
  custom: { label: 'Custom', color: 'bg-gray-500/10 text-gray-500 border-gray-500/20' },
};

export function TemplateList({
  templates,
  onEdit,
  onDuplicate,
  onDelete,
  onSetDefault,
  onCreate,
}: TemplateListProps) {
  return (
    <div className="glass-panel rounded-3xl overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-border bg-card/30 dark:bg-card/20">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Document Templates</h3>
            <p className="text-xs text-muted-foreground">{templates.length} templates configured</p>
          </div>
        </div>
        <Button onClick={onCreate} className="btn-gradient text-white gap-2">
          <FileText className="h-4 w-4" />
          New Template
        </Button>
      </div>

      <div className="divide-y divide-border">
        {templates.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <h4 className="text-lg font-semibold text-foreground mb-2">No Templates Yet</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first document template to get started
            </p>
            <Button onClick={onCreate} variant="outline">
              Create Template
            </Button>
          </div>
        ) : (
          templates.map((template) => {
            const typeInfo = TEMPLATE_TYPES[template.template_type] || TEMPLATE_TYPES.custom;
            return (
              <div
                key={template.id}
                className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center border ${typeInfo.color}`}
                  >
                    <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-foreground">{template.name}</h4>
                      {template.is_default && (
                        <Badge variant="outline" className="text-xs gap-1 text-primary border-primary/20">
                          <Star className="h-3 w-3 fill-current" />
                          Default
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className={`text-xs ${typeInfo.color}`}>
                        {typeInfo.label}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {template.ai_prompt?.length || 0} char prompt
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(template)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity gap-2"
                  >
                    <Edit2 className="h-4 w-4" />
                    Edit
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(template)}>
                        <Edit2 className="h-4 w-4 mr-2" />
                        Edit Template
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onDuplicate(template)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                      {!template.is_default && (
                        <DropdownMenuItem onClick={() => onSetDefault(template.id)}>
                          <Star className="h-4 w-4 mr-2" />
                          Set as Default
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => onDelete(template.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
