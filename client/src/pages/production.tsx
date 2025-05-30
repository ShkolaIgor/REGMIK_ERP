import { KanbanBoard } from "@/components/KanbanBoard";

export default function Production() {
  return (
    <div className="flex-1 overflow-auto">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Планування виробництва</h2>
            <p className="text-gray-600">Kanban дошка для управління виробничими завданнями</p>
          </div>
        </div>
      </header>

      <KanbanBoard />
    </div>
  );
}
