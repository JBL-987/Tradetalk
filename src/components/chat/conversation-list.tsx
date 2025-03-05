import { Conversation } from "@/types";
import { Plus, Save, Trash2 } from "lucide-react";

interface ConversationListProps {
  conversations: Conversation[];
  currentConversation: Conversation;
  onSelect: (conversation: Conversation) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
  onSave: () => void;
  formatDate: (date: Date) => string;
}

export function ConversationList({
  conversations,
  currentConversation,
  onSelect,
  onDelete,
  onNew,
  onSave,
  formatDate
}: ConversationListProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-4">
        <button
          onClick={onNew}
          className="w-full bg-white hover:bg-gray-200 text-black rounded-lg py-3 flex items-center justify-center space-x-2 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>New Conversation</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-2">
        {conversations.map(conv => (
          <div 
            key={conv.id}
            className={`
              p-3 rounded-lg cursor-pointer transition-colors
              ${currentConversation.id === conv.id 
                ? "bg-gray-800" 
                : "hover:bg-gray-800/50"}
              flex items-center justify-between group
            `}
            onClick={() => onSelect(conv)}
          >
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate text-sm">{conv.title}</div>
              <div className="text-xs text-gray-400">
                {formatDate(conv.updatedAt)}
              </div>
            </div>
            
            <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSave();
                }}
                className="p-1 hover:bg-gray-700 rounded"
                aria-label="Save conversation"
              >
                <Save className="h-4 w-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(conv.id);
                }}
                className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-red-500"
                aria-label="Delete conversation"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}