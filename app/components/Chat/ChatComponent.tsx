import {useCallback, useState, useRef, useEffect} from 'react';
import {httpClient} from "~/lib/request";
import {v4 as uuidv4} from 'uuid';
import {useSelector} from "react-redux";
import {useParams} from "react-router-dom";
import {Brain, Globe, Sparkles, Square, ArrowUp} from "lucide-react";

import '~/css/ChatComponent.css'
import {getChatHistory} from "~/components/Chat/service";
import {addChatHistory} from "~/store/chatHistorySlice";
import {setSelectedModel, fetchModels} from "~/store/modelSlice";
import {message} from "~/components/Message";
import type {ChatMessage} from "~/services/data";
import {ModelSelector} from "./ModelSelector";
import type {RootState} from "~/store";
import {useAppDispatch} from "~/store";
import {CHAT_LIST_REFRESH_EVENT, NEW_CHAT_EVENT} from "~/lib/constants";
import ChatMessageView from "./ChatMessageView";
import {parseReasoning, isReasoningStreaming} from "./reasoning";
import {readChatStream, type SearchMeta} from "./streamUtils";

/** 统一的开关样式：选中态紫蓝渐变 + 光晕，未选中态柔和浅底；两个开关完全一致 */
const toggleClass = (active: boolean) =>
    `group relative flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-all duration-200 ${
        active
            ? "border-transparent bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 font-medium text-white shadow-md shadow-purple-500/30"
            : "border-border/80 bg-muted/40 text-foreground/75 hover:border-purple-300 hover:bg-muted hover:text-foreground"
    }`;

/** 开关左侧的状态指示灯：选中时发白光 */
const toggleDotClass = (active: boolean) =>
    active
        ? "size-1.5 rounded-full bg-white shadow-[0_0_6px_2px_rgba(255,255,255,0.55)]"
        : "size-1.5 rounded-full bg-border transition-colors group-hover:bg-purple-400";

const SUGGESTIONS = [
    "帮我分析一个问题",
    "写一段产品介绍文案",
    "解释一个技术概念",
    "制定一份学习计划",
];

const ChatComponent = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [webSearch, setWebSearch] = useState(false);
    const [showReasoning, setShowReasoning] = useState(true);
    const [reasoningExpanded, setReasoningExpanded] = useState<Record<number, boolean>>({});
    const abortRef = useRef<AbortController | null>(null);
    const dispatch = useAppDispatch();
    const selectedModel = useSelector((state: RootState) => state.models.selectedModel);

    const { id } = useParams();

    useEffect(() => {
        dispatch(fetchModels());
    }, [dispatch]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({behavior: "smooth"});
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // 侧边栏“新建对话”通过事件重置当前会话
    useEffect(() => {
        const resetChat = () => {
            setMessages([]);
            setInput("");
            setConversationId(null);
        };
        window.addEventListener(NEW_CHAT_EVENT, resetChat);
        return () => window.removeEventListener(NEW_CHAT_EVENT, resetChat);
    }, []);

    useEffect(() => {
        const loadHistory = async () => {
            if (!id) return;
            setIsLoadingHistory(true);
            try {
                const res = await getChatHistory({ conversationId: id });
                if (res.success && res.data) {
                    const history: ChatMessage[] = res.data.map((msg: any) => {
                        const parsed = parseReasoning(msg.content || "");
                        return {
                            id: msg.id,
                            type: msg.role === 'user' ? 'user' : 'ai',
                            content: parsed.content,
                            reasoning: parsed.reasoning || undefined,
                            isThinking: false,
                        };
                    });
                    setMessages(history);
                    setConversationId(id);
                }
            } catch {
                message.error("加载历史会话失败");
            } finally {
                setIsLoadingHistory(false);
            }
        };
        if (id && id !== conversationId) {
            loadHistory();
        }
    }, [id]);

    const handleToggleReasoning = useCallback((msgId: number) => {
        setReasoningExpanded(prev => ({...prev, [msgId]: !prev[msgId]}));
    }, []);

    // 生成新的会话ID
    const generateNewConversation = () => {
        const newId = uuidv4();
        setConversationId(newId);
        return newId;
    };

    /** 执行发送 / 重新生成：text 为本次用户输入 */
    const runStream = async (text: string, convId: string, aiId: number) => {
        setIsSending(true);
        const controller = new AbortController();
        abortRef.current = controller;
        let reasoningStart = 0;
        let reasoningEnd = 0;
        let pendingSnapshot: {content: string; meta?: SearchMeta; done: boolean} | null = null;
        let frame: number | null = null;

        const flushSnapshot = () => {
            const snapshot = pendingSnapshot;
            pendingSnapshot = null;
            if (!snapshot) return;
            const parsed = parseReasoning(snapshot.content);
            const reasoningStreaming = isReasoningStreaming(snapshot.content);
            if (parsed.reasoning && !reasoningStart) reasoningStart = Date.now();
            if (reasoningStart && !reasoningEnd && !reasoningStreaming && parsed.reasoning) {
                reasoningEnd = Date.now();
            }
            setMessages(prev => prev.map(msg =>
                msg.id === aiId ? {
                    ...msg,
                    content: parsed.content,
                    reasoning: parsed.reasoning || undefined,
                    reasoningStreaming,
                    reasoningMs: reasoningEnd && reasoningStart ? reasoningEnd - reasoningStart : undefined,
                    sources: snapshot.meta?.sources ?? [],
                    searchPerformed: snapshot.meta?.performed ?? false,
                    searchEngine: snapshot.meta?.engine,
                    isThinking: !snapshot.done && !snapshot.content,
                } : msg
            ));
        };

        // 流式 chunk 可能非常密集，用 rAF 合并到每帧一次渲染。
        const applySnapshot = (snapshot: {content: string; meta?: SearchMeta; done: boolean}) => {
            pendingSnapshot = snapshot;
            if (frame !== null) return;
            frame = requestAnimationFrame(() => {
                frame = null;
                flushSnapshot();
            });
        };

        try {
            const response = await httpClient.postRet('/api/ai/chat/stream', {
                conversationId: convId,
                message: text,
                model: selectedModel,
                webSearch,
                enableThinking: showReasoning,
            }, {signal: controller.signal});

            if (!response.ok) throw new Error(`请求失败 (${response.status})`);
            await readChatStream(response, applySnapshot);
            if (frame !== null) cancelAnimationFrame(frame);
            frame = null;
            flushSnapshot();
            window.dispatchEvent(new Event(CHAT_LIST_REFRESH_EVENT));
        } catch (error: any) {
            if (error?.name === "AbortError") {
                setMessages(prev => prev.map(msg =>
                    msg.id === aiId ? {...msg, content: msg.content || "已停止生成", isThinking: false} : msg
                ));
                return;
            }
            console.error('发送消息失败:', error);
            message.error(error?.message || '请求失败，请重试');
            setMessages(prev => prev.map(msg =>
                msg.id === aiId ? {...msg, content: '请求失败，请重试', isThinking: false, error: true} : msg
            ));
        } finally {
            if (frame !== null) cancelAnimationFrame(frame);
            pendingSnapshot = null;
            setIsSending(false);
            abortRef.current = null;
        }
    };

    const handleSend = async () => {
        const text = input.trim();
        if (!text || isSending) return;

        const isNewChat = !conversationId;
        const currentConversationId = conversationId || generateNewConversation();

        if (isNewChat) {
            dispatch(addChatHistory({
                id: currentConversationId,
                title: text.length > 30 ? text.slice(0, 30) + "…" : text,
                createAt: Date.now(),
            }));
        }

        const userMessage: ChatMessage = {id: Date.now(), type: 'user', content: text};
        const aiMessage: ChatMessage = {id: Date.now() + 1, type: 'ai', content: '', isThinking: true};
        setMessages(prev => [...prev, userMessage, aiMessage]);
        setInput('');
        await runStream(text, currentConversationId, aiMessage.id);
    };

    const stopGenerating = () => abortRef.current?.abort();

    const handleRegenerate = () => {
        if (isSending) return;
        // 找到最后一条用户消息，删除其后的 AI 回复后重新生成
        const lastUserIdx = [...messages].map(m => m.type).lastIndexOf('user');
        if (lastUserIdx < 0 || !conversationId) return;
        const lastUserText = messages[lastUserIdx].content;
        const newAiId = Date.now();
        setMessages(prev => [...prev.slice(0, lastUserIdx + 1), {id: newAiId, type: 'ai', content: '', isThinking: true}]);
        void runStream(lastUserText, conversationId, newAiId);
    };

    const useSuggestion = (text: string) => {
        setInput(text);
    };

    return (
        <div className="flex h-full w-full flex-col">
            {/* 消息滚动区：滚动条在最右，顶部带柔和紫色氛围光 */}
            <div className="min-h-0 flex-1 overflow-y-auto bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(139,92,246,0.07),transparent)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(139,92,246,0.10),transparent)]">
                <div className="mx-auto w-full max-w-3xl space-y-7 px-4 py-8">
                    {messages.length === 0 && !isLoadingHistory && (
                        <div className="flex min-h-[55vh] flex-col items-center justify-center gap-6 text-center">
                            <div className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600 text-white shadow-xl shadow-purple-500/30">
                                <Sparkles className="size-8"/>
                            </div>
                            <div>
                                <h2 className="text-2xl font-semibold">我是 MySeek，很高兴见到你！</h2>
                                <p className="mt-2 text-sm text-muted-foreground">我可以回答问题、创作内容，也能联网搜索最新信息。</p>
                            </div>
                            <div className="grid w-full max-w-xl grid-cols-2 gap-3">
                                {SUGGESTIONS.map(s => (
                                    <button
                                        key={s}
                                        onClick={() => useSuggestion(s)}
                                        className="rounded-xl border bg-card px-4 py-3 text-left text-sm text-muted-foreground transition-all hover:border-violet-400/60 hover:bg-violet-50/60 hover:text-violet-700 dark:hover:bg-violet-950/20 dark:hover:text-violet-300"
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    {messages.map((msg, idx) => (
                        <ChatMessageView
                            key={msg.id}
                            msg={msg}
                            showReasoning={showReasoning}
                            reasoningExpanded={reasoningExpanded}
                            onToggleReasoning={handleToggleReasoning}
                            onRegenerate={handleRegenerate}
                            isLast={idx === messages.length - 1 && msg.type === 'ai'}
                        />
                    ))}
                    <div ref={messagesEndRef}/>
                </div>
            </div>

            {/* 输入区：固定在底部 */}
            <div className="shrink-0 bg-gradient-to-t from-background via-background to-transparent px-4 pb-3 pt-2">
                <div className="mx-auto w-full max-w-3xl">
                    <div className="rounded-2xl border bg-card p-3 shadow-sm focus-within:border-primary/50">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                                    e.preventDefault();
                                    void handleSend();
                                }
                            }}
                            className="w-full resize-none bg-transparent px-1 py-1 text-[15px] leading-6 outline-none placeholder:text-muted-foreground/60"
                            placeholder="给 MySeek 发送消息，Shift + Enter 换行"
                            rows={2}
                            aria-label="消息输入框"
                        />
                        <div className="mt-2 flex items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowReasoning(v => !v)}
                                    title="开启后模型会进行推理并展示思考过程（支持 qwen3 等混合思考模型）"
                                    className={toggleClass(showReasoning)}
                                >
                                    <Brain className="size-3.5"/>
                                    深度思考
                                    <span className={toggleDotClass(showReasoning)}/>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setWebSearch(v => !v)}
                                    title="开启后 AI 会先联网搜索实时资料再回答"
                                    className={toggleClass(webSearch)}
                                >
                                    <Globe className="size-3.5"/>
                                    智能搜索
                                    <span className={toggleDotClass(webSearch)}/>
                                </button>
                                <div className="hidden sm:block">
                                    <ModelSelector
                                        selectedModel={selectedModel}
                                        onModelChange={(model) => dispatch(setSelectedModel(model))}
                                        className="text-xs"
                                    />
                                </div>
                            </div>
                            {isSending ? (
                                <button
                                    type="button"
                                    onClick={stopGenerating}
                                    title="停止生成"
                                    className="flex size-9 shrink-0 items-center justify-center rounded-full bg-foreground text-background hover:opacity-90"
                                >
                                    <Square className="size-3.5 fill-current"/>
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleSend}
                                    disabled={!input.trim()}
                                    title="发送"
                                    className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-500 text-white shadow-md shadow-purple-500/30 transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
                                >
                                    <ArrowUp className="size-5"/>
                                </button>
                            )}
                        </div>
                    </div>
                    <p className="mt-2 text-center text-[11px] text-muted-foreground">内容由 AI 生成，请仔细甄别</p>
                </div>
            </div>
        </div>
    );
};

export default ChatComponent;
