
import React, { useState, useRef, useEffect } from 'react';
import { ChatBubbleIcon, CloseIcon, PaperAirplaneIcon, DownloadIcon, PlayIcon, ShieldCheckIcon, LoadingSpinner, ServerIcon } from './IconComponents';
import { usePWA } from '../hooks/usePWA';
import { ContentItem, Torrent } from '../types';
import { searchMulti, discoverContent, fetchMovieDownloads } from '../services/movieService';

type View = 'home' | 'series' | 'trending' | 'upcoming' | 'watch-party';

interface ChatBotProps {
  onShowInstallModal: () => void;
  isOpen: boolean;
  onToggle: () => void;
  onNavigate: (view: View) => void;
  onSelectItem: (item: ContentItem) => void;
}

interface Message {
  id: number;
  sender: 'user' | 'bot';
  text: string;
  contentItem?: ContentItem;
  downloadOptions?: {
      title: string;
      poster: string;
      files: Torrent[];
  };
  isDownloadAction?: boolean; // PWA Install
}

const QUICK_CHIPS = [
    { label: "Download Movie", action: "Download..." },
    { label: "Trending", action: "Show me trending movies" },
    { label: "Surprise Me", action: "Surprise me with a movie" },
    { label: "Install App", action: "How do I install the app?" },
];

const ChatBot: React.FC<ChatBotProps> = ({ onShowInstallModal, isOpen, onToggle, onNavigate, onSelectItem }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, sender: 'bot', text: 'Hi! I am the Cineflix Agent. \n\nI can help you search, stream, or find download links for movies. \n\nTry saying "Download Iron Man".' }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { installApp, isIOS } = usePWA();
  const [hasUnread, setHasUnread] = useState(true);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen, isTyping]);

  const handleToggle = () => {
      onToggle();
      if (!isOpen) setHasUnread(false);
  };

  const processUserMessage = async (userText: string) => {
      setIsTyping(true);
      const lowerText = userText.toLowerCase();
      let botResponse: Message = { id: Date.now() + 1, sender: 'bot', text: '' };

      try {
        // --- INTENT: DIRECT DOWNLOAD ---
        if (lowerText.startsWith('download') || lowerText.startsWith('get ') || lowerText.startsWith('save ')) {
            const query = lowerText.replace('download', '').replace('get', '').replace('save', '').trim();
            
            if (query.length > 1) {
                // 1. Find the movie metadata first
                setLoadingText("Searching database...");
                const searchResults = await searchMulti(query);
                const movie = searchResults.find(i => i.media_type === 'movie');
                const tvShow = searchResults.find(i => i.media_type === 'tv');

                if (movie) {
                    setLoadingText("Searching for valid files...");
                    
                    // Fetch real file data
                    let downloads: Torrent[] = [];
                    try {
                        // For chatbot, we might not have imdb_id immediately unless we fetch details
                        // Use 'movie' type and let service try fallback
                        downloads = await fetchMovieDownloads(movie.title, 'movie', movie.imdb_id);
                    } catch (e) {
                        console.error(e);
                    }

                    if (downloads.length > 0) {
                        botResponse.text = `Found files for **${movie.title}**. \n\nClick below to start downloading directly via magnet.`;
                        botResponse.downloadOptions = {
                            title: movie.title,
                            poster: movie.poster_path,
                            files: downloads.slice(0, 3) // Limit to top 3
                        };
                    } else {
                        botResponse.text = `Download not available for "${movie.title}" — try streaming instead.`;
                        botResponse.contentItem = movie;
                    }
                } else if (tvShow) {
                    botResponse.text = `**${tvShow.title}** is available for streaming! \n\nFor TV show downloads, please use the download button on the episode page. Watch now:`;
                    botResponse.contentItem = tvShow;
                } else {
                    botResponse.text = `I couldn't find a movie named "${query}". Please check the spelling.`;
                }
            } else {
                botResponse.text = "Which movie do you want to download? Try saying 'Download Avengers'.";
            }
        }
        // --- INTENT: SEARCH ---
        else if (lowerText.startsWith('search for') || lowerText.startsWith('find ')) {
            const query = lowerText.replace('search for', '').replace('find', '').trim();
            if (query.length > 1) {
                const results = await searchMulti(query);
                if (results.length > 0) {
                    botResponse.text = `Here is what I found for "${query}":`;
                    botResponse.contentItem = results[0]; 
                } else {
                    botResponse.text = `I couldn't find anything matching "${query}".`;
                }
            } else {
                botResponse.text = "Please tell me what to search for.";
            }
        }
        // --- INTENT: SURPRISE ---
        else if (lowerText.includes('surprise') || lowerText.includes('random')) {
            const results = await discoverContent({}); 
            const randomPick = results[Math.floor(Math.random() * results.length)];
            botResponse.text = "Check this out! A random pick just for you:";
            botResponse.contentItem = randomPick;
        }
        // --- INTENT: APP INSTALL ---
        else if (lowerText.includes('install') || lowerText.includes('app')) {
             if (isIOS) {
               botResponse.text = "On iOS, tap the 'Share' button in Safari, then 'Add to Home Screen'.";
            } else {
               botResponse.text = "Tap below to install the Cineflix App for the best experience.";
            }
            botResponse.isDownloadAction = true;
        }
        // --- FALLBACK ---
        else if (lowerText.includes('hello') || lowerText.includes('hi')) {
             botResponse.text = "Hello! I can help you find download links. Try 'Download The Dark Knight'.";
        } else {
            botResponse.text = "I can help you watch or download content. Try saying 'Download [Movie Name]'.";
        }
      } catch (e) {
          botResponse.text = "I'm having trouble connecting to the server. Please try again.";
      }

      setTimeout(() => {
          setIsTyping(false);
          setLoadingText('');
          setMessages(prev => [...prev, botResponse]);
      }, 1000); 
  };

  const handleSend = async (e?: React.FormEvent, manualText?: string) => {
    e?.preventDefault();
    const textToSend = manualText || input;
    if (!textToSend.trim()) return;

    const newMessage: Message = { id: Date.now(), sender: 'user', text: textToSend };
    setMessages(prev => [...prev, newMessage]);
    setInput('');

    await processUserMessage(textToSend);
  };

  const handleDownloadClick = async () => {
      const success = await installApp();
      if (!success) {
          onShowInstallModal();
      }
  };

  return (
    <>
        <button
            onClick={handleToggle}
            className={`fixed bottom-6 right-6 z-[1000] p-3 md:p-3.5 rounded-full shadow-xl transition-all duration-300 transform hover:scale-110 active:scale-95 border border-white/10 opacity-100 pointer-events-auto ${isOpen ? 'bg-red-600 rotate-90 text-white' : 'bg-white dark:bg-gray-800 text-red-600'}`}
            style={{ boxShadow: '0 10px 25px -5px rgba(220, 38, 38, 0.4)' }}
            aria-label="Toggle Chat Assistant"
        >
            {isOpen ? <CloseIcon className="w-6 h-6" /> : <ChatBubbleIcon className="w-6 h-6" />}
            {!isOpen && hasUnread && (
                <span className="absolute top-0 right-0 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
            )}
        </button>

        {isOpen && (
            <div className="fixed bottom-24 right-6 z-[1000] w-[calc(100vw-2rem)] md:w-96 h-[500px] md:h-[550px] max-h-[70vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden animate-fade-in-up origin-bottom-right pointer-events-auto backdrop-blur-sm bg-white/95 dark:bg-gray-900/95">
                {/* Header */}
                <div className="p-4 bg-gradient-to-r from-red-600 to-red-700 text-white font-bold flex items-center gap-3 shadow-md shrink-0">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center border border-white/20">
                        <ChatBubbleIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <p className="text-base leading-tight">Cineflix Agent</p>
                        <div className="flex items-center gap-1.5 opacity-90">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_5px_#4ade80]"/>
                            <p className="text-xs font-medium">Online</p>
                        </div>
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-grow overflow-y-auto p-4 space-y-4 scrollbar-thin bg-gray-50 dark:bg-black/40">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} animate-fade-in-up`}>
                            {/* Text Bubble */}
                            {msg.text && (
                                <div className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-sm leading-relaxed whitespace-pre-wrap ${
                                    msg.sender === 'user' 
                                    ? 'bg-red-600 text-white rounded-br-none' 
                                    : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-none border border-gray-100 dark:border-gray-700'
                                }`}>
                                    {msg.text}
                                </div>
                            )}
                            
                            {/* Rich Content: MLWBD Style Download Panel */}
                            {msg.downloadOptions && (
                                <div className="mt-2 w-full max-w-[280px] bg-white dark:bg-gray-900 rounded-xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700">
                                    <div className="bg-red-600 p-3 text-white flex gap-3">
                                        <img src={msg.downloadOptions.poster} className="w-10 h-14 object-cover rounded bg-black/20" alt="Poster" />
                                        <div className="min-w-0 flex flex-col justify-center">
                                            <h3 className="font-bold text-sm line-clamp-1">{msg.downloadOptions.title}</h3>
                                            <p className="text-[10px] opacity-90">Select Quality • Direct Download</p>
                                        </div>
                                    </div>
                                    
                                    <div className="p-2 space-y-2 bg-white dark:bg-gray-900">
                                        {msg.downloadOptions.files.map((file, idx) => (
                                            <div key={idx} className="border border-gray-100 dark:border-gray-800 rounded-lg p-2 bg-gray-50 dark:bg-gray-800/50 hover:border-red-200 dark:hover:border-red-900 transition-colors">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="font-bold text-sm text-gray-800 dark:text-gray-200">
                                                        {file.quality} 
                                                        <span className="ml-2 text-[10px] font-normal text-gray-500 bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded uppercase">{file.type}</span>
                                                    </span>
                                                    <span className="text-xs text-gray-500 font-mono">{file.size}</span>
                                                </div>
                                                
                                                <div className="flex gap-2">
                                                    <a 
                                                         href={`magnet:?xt=urn:btih:${file.hash}&dn=${encodeURIComponent(msg.downloadOptions!.title)}`}
                                                         className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded text-center transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                                                         title="Start Download"
                                                    >
                                                        <DownloadIcon className="w-3 h-3" />
                                                        Download
                                                    </a>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="bg-gray-50 dark:bg-black/20 p-2 text-center border-t border-gray-100 dark:border-gray-800">
                                        <p className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                                            <ShieldCheckIcon className="w-3 h-3 text-green-500" />
                                            Virus Scanned • P2P
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Rich Content: Streaming Card */}
                            {msg.contentItem && !msg.downloadOptions && (
                                <div className="mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700 transform transition-transform hover:scale-105 cursor-pointer" onClick={() => onSelectItem(msg.contentItem!)}>
                                    <div className="aspect-[2/3] relative">
                                        <img src={msg.contentItem.poster_path} alt={msg.contentItem.title} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-2">
                                            <p className="text-white font-bold text-xs line-clamp-2">{msg.contentItem.title}</p>
                                        </div>
                                    </div>
                                    <button className="w-full py-2 bg-red-600 text-white text-xs font-bold hover:bg-red-700 flex items-center justify-center gap-1">
                                        <PlayIcon className="w-3 h-3" /> Stream Now
                                    </button>
                                </div>
                            )}

                            {/* Action: Install PWA */}
                            {msg.isDownloadAction && (
                                <button 
                                    onClick={handleDownloadClick}
                                    className="mt-2 flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all shadow-md animate-pulse"
                                >
                                    <DownloadIcon className="w-4 h-4" />
                                    Install App
                                </button>
                            )}
                        </div>
                    ))}
                    
                    {isTyping && (
                         <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-xs text-slate-400 ml-2 animate-pulse">
                                <LoadingSpinner className="w-3 h-3 text-red-500" />
                                {loadingText || "Agent is typing..."}
                            </div>
                            <div className="bg-white dark:bg-gray-800 p-3 rounded-2xl rounded-bl-none border border-gray-100 dark:border-gray-700 shadow-sm w-fit">
                                <div className="flex gap-1">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                                </div>
                            </div>
                         </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Quick Actions Chips */}
                <div className="px-4 py-2 bg-gray-50 dark:bg-black/20 border-t border-gray-100 dark:border-gray-800 overflow-x-auto whitespace-nowrap scrollbar-thin flex gap-2 shrink-0">
                    {QUICK_CHIPS.map((chip, idx) => (
                        <button
                            key={idx}
                            onClick={() => {
                                if (chip.label === "Download Movie") {
                                    setInput("Download ");
                                } else {
                                    handleSend(undefined, chip.action);
                                }
                            }}
                            className="px-3 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-800 transition-colors"
                        >
                            {chip.label}
                        </button>
                    ))}
                </div>

                {/* Input Area */}
                <form onSubmit={(e) => handleSend(e)} className="p-3 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex gap-2 shrink-0">
                    <input 
                        type="text" 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type 'Download Avatar'..." 
                        className="flex-grow px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 dark:text-white transition-all border border-transparent focus:border-red-500"
                    />
                    <button 
                        type="submit" 
                        className="p-2.5 bg-red-600 text-white rounded-full hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-red-600/20" 
                        disabled={!input.trim()}
                    >
                        <PaperAirplaneIcon className="w-4 h-4 transform rotate-90" />
                    </button>
                </form>
            </div>
        )}
    </>
  );
};

export default ChatBot;
