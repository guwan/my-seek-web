import { useState, useRef, useEffect } from 'react';
import {httpClient} from "~/lib/request";
import { v4 as uuidv4 } from 'uuid';

import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import remarkGfm from 'remark-gfm';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';

import '@/css/ChatComponent.css'
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

interface ChatMessage {
    id: number;
    type: 'user' | 'ai';
    content: string;
    isThinking?: boolean;
}

 const ChatComponent = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
     const [conversationId, setConversationId] = useState<string | null>(null);

    // 自动滚动到底部
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

     // 用户头像组件
     const UserAvatar = () => (
         <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center ml-2">
             <span className="text-white text-sm">你</span>
         </div>
     );

     // AI头像组件
     const AIAvatar = () => (
         <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center mr-2">
             <span className="text-gray-800 dark:text-gray-200 text-sm">AI</span>
         </div>
     );
     const renderContent = (content: string) => {
         const parts = content.split(/(<think>[\s\S]*?<\/think>)/g);

         return parts.map((part, index) => {
             if (part.startsWith('<think>') && part.endsWith('</think>')) {
                 const thinkContent = part.slice(7, -8).trim();
                 if(!thinkContent){
                     return <></>
                 }
                 return (
                     <div key={`think-${index}`} className="my-4 w-full">
                         <div className="text-sm text-gray-500 mb-2">内部思考：</div>
                         <SyntaxHighlighter
                             language="text"
                             style={vscDarkPlus}
                             className="rounded-lg p-4 text-sm max-w-full overflow-x-auto"
                             customStyle={{
                                 background: '#1e1e1e',
                                 fontSize: '0.875rem',
                                 lineHeight: '1.5',
                             }}
                         >
                             {thinkContent}
                         </SyntaxHighlighter>
                     </div>
                 );
             }

             return (
                 <ReactMarkdown
                     key={`md-${index}`}
                     remarkPlugins={[remarkGfm]}
                     components={{
                         h1: ({ node, ...props }) => <h1 className="text-2xl font-bold my-4" {...props} />,
                         h2: ({ node, ...props }) => <h2 className="text-xl font-semibold my-3" {...props} />,
                         p: ({ node, ...props }) => <p className="my-3 leading-relaxed" {...props} />,
                         ul: ({ node, ...props }) => <ul className="list-disc pl-6 my-3" {...props} />,
                         ol: ({ node, ...props }) => <ol className="list-decimal pl-6 my-3" {...props} />,
                         li: ({ node, ...props }) => <li className="my-1" {...props} />,
                         blockquote: ({ node, ...props }) => (
                             <blockquote className="border-l-4 border-gray-300 pl-4 my-3 text-gray-600" {...props} />
                         ),
                         code({ node, inline, className, children, ...props }: {
                             node?: any;
                             inline?: boolean;
                             className?: string;
                             children?: React.ReactNode;
                         }) {
                             const match = /language-(\w+)/.exec(className || '');
                             return !inline && match ? (
                                 <SyntaxHighlighter
                                     style={vscDarkPlus}
                                     language={match[1]}
                                     PreTag="div"
                                     className="rounded-lg p-4 my-3 text-sm max-w-full overflow-x-auto"
                                     customStyle={{
                                         background: '#1e1e1e',
                                         fontSize: '0.875rem',
                                         lineHeight: '1.5',
                                     }}
                                     {...props}
                                 >
                                     {String(children).replace(/\n$/, '')}
                                 </SyntaxHighlighter>
                             ) : (
                                 <code
                                     className="bg-gray-100 px-1.5 py-0.5 rounded font-mono text-sm break-words"
                                     {...props}
                                 >
                                     {children}
                                 </code>
                             );
                         }
                     }}
                 >
                     {part}
                 </ReactMarkdown>
             );
         });
     };

     // 生成新的会话ID
     const generateNewConversation = () => {
         const newId = uuidv4();
         setConversationId(newId);
         return newId;
     };

    // 发送消息
    const handleSend = async () => {
        if (!input.trim()) return;

        // 如果是新会话则生成ID，否则使用现有ID
        const currentConversationId = conversationId || generateNewConversation();
        // 添加用户消息
        const userMessage: ChatMessage = {
            id: Date.now(),
            type: 'user',
            content: input,
        };

        // 添加AI消息占位
        const aiMessage: ChatMessage = {
            id: Date.now() + 1,
            type: 'ai',
            content: '',
            isThinking: true
        };

        setMessages(prev => [...prev, userMessage, aiMessage]);
        setInput('');

        try {
            // 模拟与后端交互，实际应替换为你的API调用
            const response = await httpClient.postRet('/api/ai/chat/stream', {
                conversationId: currentConversationId,
                message: input
            });

            // 处理流式响应
            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let aiContent = '';

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value);
                    aiContent += chunk;

                    setMessages(prev => prev.map(msg => {
                        if (msg.id === aiMessage.id) {
                            return { ...msg, content: aiContent, isThinking: false };
                        }
                        return msg;
                    }));
                }
            }
        } catch (error) {
            console.error('Error:', error);
            setMessages(prev => prev.map(msg => {
                if (msg.id === aiMessage.id) {
                    return { ...msg, content: '请求失败，请重试', isThinking: false };
                }
                return msg;
            }));
        }
    };

    return (
        <div className="flex flex-col h-full max-w-6xl mx-auto w-full px-4">
            {/* 会话控制栏 */}
            <div className="flex justify-between items-center mb-4 py-2 border-b">
                <div className="text-sm text-gray-500">
                    会话ID: {conversationId?.substring(0, 8)}...
                </div>
                <button
                    onClick={() => {
                        setConversationId(null);
                        setMessages([]);
                    }}
                    className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
                >
                    新会话
                </button>
            </div>

            {/* 消息列表 */}
            <div className="flex-1 overflow-auto mb-4 space-y-6">
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`flex ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'} items-start gap-3`}
                    >
                        {/* 添加flex-shrink-0防止头像被压缩 */}
                        {message.type === 'user' ? (
                            <div className="flex-shrink-0">
                                <UserAvatar />
                            </div>
                        ) : (
                            <div className="flex-shrink-0">
                                <AIAvatar />
                            </div>
                        )}

                        <div
                            className={`max-w-[calc(100%-4rem)]  min-w-[200px] p-4 rounded-xl ${
                                message.type === 'user'
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-100 dark:bg-gray-800 prose dark:prose-invert'
                            }`}
                            style={{
                                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.05)'
                            }}
                        >
                            {message.isThinking ? (
                                <div className="flex items-center gap-2">
                                    <div className="animate-pulse">思考中...</div>
                                </div>
                            ) : (
                                renderContent(message.content)
                            )}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef}/>
            </div>

            {/* 输入框 */}
            <div className="flex gap-2 pb-4">
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    className="flex-1 p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="输入消息..."
                />
                <button
                    onClick={handleSend}
                    className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
                >
                    发送
                </button>
            </div>
        </div>
    );
 };

export default ChatComponent;