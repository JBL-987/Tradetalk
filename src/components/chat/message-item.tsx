import { Message } from "@/types";
import { Bot, Copy, User } from "lucide-react";
import { toast } from "react-hot-toast";

interface MessageItemProps {
  message: Message;
  formatTime: (date: Date) => string;
}

export function MessageItem({ message, formatTime }: MessageItemProps) {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => toast.success("Copied to clipboard!"))
      .catch(() => toast.error("Failed to copy"));
  };

  return (
    <div className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
      <div className={`
        relative max-w-[80%] rounded-xl p-4 group
        ${message.role === "user" 
          ? "bg-white text-black" 
          : "bg-black border border-gray-800 text-white"}
        shadow-lg
      `}>
        <div className="absolute -left-10 top-2">
          {message.role === "user" ? (
            <User className="h-6 w-6 text-white" />
          ) : (
            <Bot className="h-6 w-6 text-white" />
          )}
        </div>
        
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>

        <div className="flex justify-between items-center mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => copyToClipboard(message.content)}
            className="text-gray-400 hover:text-white"
            aria-label="Copy message"
          >
            <Copy className="h-4 w-4" />
          </button>
          <span className="text-xs text-gray-400 ml-2">
            {formatTime(message.timestamp)}
          </span>
        </div>
      </div>
    </div>
  );
}