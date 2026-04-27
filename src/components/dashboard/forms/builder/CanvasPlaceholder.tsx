
import { LayoutGrid } from 'lucide-react';

export function CanvasPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] border-2 border-dashed border-border rounded-lg p-8 text-center bg-transparent">
      <LayoutGrid className="h-16 w-16 text-muted-foreground mb-6" strokeWidth={1.5}/>
      <h3 className="text-xl font-medium text-foreground mb-2">Add Question or Description Fields</h3>
      <p className="text-sm text-muted-foreground">
        Drag and drop fields here to create your form.
      </p>
    </div>
  );
}
