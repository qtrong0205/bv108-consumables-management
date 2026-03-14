import { useEffect, useRef } from 'react';
import { Bot, Loader2, RotateCcw, Send } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const markdownComponents: Components = {
    h2: ({ children, ...props }) => (
        <h2 className="mt-3 mb-1 text-sm font-semibold text-foreground" {...props}>
            {children}
        </h2>
    ),
    h3: ({ children, ...props }) => (
        <h3 className="mt-3 mb-1 text-sm font-medium text-foreground" {...props}>
            {children}
        </h3>
    ),
    p: ({ children, ...props }) => (
        <p className="my-1 leading-6 text-foreground" {...props}>
            {children}
        </p>
    ),
    ul: ({ children, ...props }) => (
        <ul className="my-1 list-disc space-y-1 pl-5" {...props}>
            {children}
        </ul>
    ),
    ol: ({ children, ...props }) => (
        <ol className="my-1 list-decimal space-y-1 pl-5" {...props}>
            {children}
        </ol>
    ),
    li: ({ children, ...props }) => (
        <li className="leading-6" {...props}>
            {children}
        </li>
    ),
    table: ({ children, ...props }) => (
        <div className="my-2 overflow-x-auto rounded-md border border-border">
            <table className="w-full min-w-[520px] border-collapse text-xs" {...props}>
                {children}
            </table>
        </div>
    ),
    thead: ({ children, ...props }) => (
        <thead className="bg-muted/40" {...props}>
            {children}
        </thead>
    ),
    th: ({ children, ...props }) => (
        <th className="border border-border px-2 py-1.5 text-left font-semibold text-foreground" {...props}>
            {children}
        </th>
    ),
    td: ({ children, ...props }) => (
        <td className="border border-border px-2 py-1.5 align-top text-foreground" {...props}>
            {children}
        </td>
    ),
    strong: ({ children, ...props }) => (
        <strong className="font-semibold" {...props}>
            {children}
        </strong>
    ),
    code: ({ children, ...props }) => (
        <code className="rounded bg-muted px-1 py-0.5 text-[12px]" {...props}>
            {children}
        </code>
    ),
    a: ({ children, href, ...props }) => (
        <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-primary underline underline-offset-2 hover:opacity-90"
            {...props}
        >
            {children}
        </a>
    ),
};

export interface ChatMessage {
    role: 'user' | 'bot';
    content: string;
}

interface ChatBotDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    chatMessages: ChatMessage[];
    chatInput: string;
    onChatInputChange: (value: string) => void;
    isSendingChat: boolean;
    onSendChat: () => void;
    onResetChat: () => void;
}

const ChatBotDialog = ({
    open,
    onOpenChange,
    chatMessages,
    chatInput,
    onChatInputChange,
    isSendingChat,
    onSendChat,
    onResetChat,
}: ChatBotDialogProps) => {
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages, isSendingChat]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex flex-col sm:max-w-[85vw] w-[85vw] h-[85vh] max-h-[85vh] p-0 gap-0 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-primary/5">
                    <div>
                        <DialogTitle className="text-base font-semibold text-foreground">
                            Tư vấn đấu thầu vật tư
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                            Phân tích dữ liệu so sánh &middot; Tra cứu web bổ sung
                        </DialogDescription>
                    </div>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-4 bg-background">
                    {chatMessages.length === 0 && !isSendingChat ? (
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
                            <Bot className="w-10 h-10 text-muted-foreground/40" />
                            <p className="text-sm text-muted-foreground max-w-sm">
                                Chatbot sẽ tự động phân tích các sản phẩm đang so sánh. Bạn có thể hỏi thêm để được tư vấn chi tiết.
                            </p>
                        </div>
                    ) : (
                        chatMessages.map((msg, idx) => (
                            <div
                                key={`${msg.role}-${idx}`}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${msg.role === 'user'
                                            ? 'bg-primary text-primary-foreground whitespace-pre-wrap rounded-br-md'
                                            : 'bg-muted/50 border border-border text-foreground rounded-bl-md'
                                        }`}
                                >
                                    {msg.role === 'user' ? (
                                        msg.content
                                    ) : (
                                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                                            {msg.content}
                                        </ReactMarkdown>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                    {isSendingChat && (
                        <div className="flex justify-start">
                            <div className="bg-muted/50 border border-border text-foreground max-w-[80%] rounded-2xl rounded-bl-md px-4 py-2.5 text-sm flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                <span className="text-muted-foreground">Gemini đang phân tích...</span>
                            </div>
                        </div>
                    )}
                    <div ref={chatEndRef} />
                </div>

                <div className="px-5 py-3 border-t border-border bg-background">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onResetChat}
                            title="Làm mới hội thoại"
                            disabled={isSendingChat}
                            className="rounded-full h-9 w-9 flex-shrink-0"
                        >
                            <RotateCcw className="w-4 h-4" />
                        </Button>
                        <Input
                            className="flex-1 rounded-full bg-muted/30 border-border px-4"
                            value={chatInput}
                            onChange={(e) => onChatInputChange(e.target.value)}
                            placeholder="Hỏi ví dụ: Nên đấu thầu loại nào để tối ưu giá?"
                            disabled={isSendingChat}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    onSendChat();
                                }
                            }}
                        />
                        <Button
                            onClick={onSendChat}
                            disabled={isSendingChat || !chatInput.trim()}
                            size="icon"
                            className="rounded-full h-9 w-9 flex-shrink-0"
                        >
                            <Send className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ChatBotDialog;