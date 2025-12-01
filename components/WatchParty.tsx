import React, { useState, useEffect, useRef } from 'react';
import { SearchIcon, ChatBubbleIcon, PaperAirplaneIcon, UsersIcon, CloseIcon, ClipboardIcon, BackIcon } from './IconComponents';
import { ContentItem } from '../types';
import { searchMulti } from '../services/movieService';
import { LoadingSpinner } from './IconComponents';
import MovieCard from './MovieCard';

interface WatchPartyProps {
  onOpenSearch: () => void;
}

const WatchParty: React.FC<WatchPartyProps> = ({ onOpenSearch }) => {
  const [view, setView] = useState<'lobby' | 'room'>('lobby');
  const [roomCode, setRoomCode] = useState('');
  const [messages, setMessages] = useState<{ user: string; text: string; time: string }[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [username, setUsername] = useState('Guest');
  const [participants, setParticipants] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<ContentItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMovie, setSelectedMovie] = useState<ContentItem | null>(null);

  // Generate a random room code
  const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleCreateRoom = () => {
    const code = generateRoomCode();
    setRoomCode(code);
    setParticipants([username]);
    setView('room');
    addSystemMessage(`Room ${code} created! Share the code with friends.`);
  };

  const handleJoinRoom = () => {
    if (roomCode.trim().length !== 6) {
      alert('Please enter a valid 6-character room code.');
      return;
    }
    setParticipants([username, 'Host', 'Alice', 'Bob']); // Simulating other users
    setView('room');
    addSystemMessage(`Joined room ${roomCode}`);
  };

  const addSystemMessage = (text: string) => {
    setMessages(prev => [...prev, { user: 'System', text, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!messageInput.trim()) return;

    const newMessage = {
      user: username,
      text: messageInput,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newMessage]);
    setMessageInput('');

    // Simulate reply
    if (Math.random() > 0.5) {
      setTimeout(() => {
        setMessages(prev => [...prev, {
          user: 'Alice',
          text: ['Cool movie!', 'Can\'t wait!', 'Who has the popcorn?'][Math.floor(Math.random() * 3)],
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      }, 1500);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    alert('Room code copied!');
  };

  // Search with debounce and AbortController
  useEffect(() => {
    if (searchQuery.length <= 2) {
      setSearchResults([]);
      return;
    }

    const controller = new AbortController();
    const signal = controller.signal;

    const timeoutId = setTimeout(async () => {
      try {
        const results = await searchMulti(searchQuery, signal);
        if (!signal.aborted) {
             setSearchResults(results.slice(0, 4));
        }
      } catch (error: any) {
        if (error.name !== 'AbortError') {
            console.error(error);
        }
      }
    }, 300);

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [searchQuery]);

  const handleSelectMovie = (movie: ContentItem) => {
      setSelectedMovie(movie);
      setSearchQuery('');
      setSearchResults([]);
      addSystemMessage(`${username} selected ${movie.title} to watch.`);
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 md:px-8 animate-fade-in-up">
      <div className="container mx-auto max-w-6xl">
        
        <div className="flex items-center mb-8">
            <UsersIcon className="w-10 h-10 text-red-600 mr-4" />
            <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white drop-shadow-lg">
                Watch Together
            </h1>
        </div>

        {view === 'lobby' ? (
          <div className="grid md:grid-cols-2 gap-12">
            {/* Create Room */}
            <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 flex flex-col items-center text-center hover:border-red-500 transition-all duration-300">
              <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6">
                <UsersIcon className="w-10 h-10 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Create a Party</h2>
              <p className="text-slate-500 dark:text-slate-400 mb-8">Host a new room and invite your friends to watch movies together in sync.</p>
              <div className="w-full max-w-xs space-y-4">
                 <input 
                    type="text" 
                    placeholder="Your Nickname" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-gray-100 dark:bg-black border border-gray-300 dark:border-gray-700 focus:border-red-500 focus:ring-2 focus:ring-red-500/50 outline-none transition-all"
                 />
                 <button 
                    onClick={handleCreateRoom}
                    className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-lg shadow-red-600/30 transform hover:scale-105 active:scale-95 transition-all"
                 >
                    Create Room
                 </button>
              </div>
            </div>

            {/* Join Room */}
            <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 flex flex-col items-center text-center hover:border-blue-500 transition-all duration-300">
               <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-6">
                <ChatBubbleIcon className="w-10 h-10 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Join a Party</h2>
              <p className="text-slate-500 dark:text-slate-400 mb-8">Enter a room code to join an existing party and chat with friends.</p>
               <div className="w-full max-w-xs space-y-4">
                 <input 
                    type="text" 
                    placeholder="Room Code (e.g. X7Y2Z)" 
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    maxLength={6}
                    className="w-full px-4 py-3 rounded-lg bg-gray-100 dark:bg-black border border-gray-300 dark:border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all text-center tracking-widest font-bold uppercase"
                 />
                 <button 
                    onClick={handleJoinRoom}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-lg shadow-blue-600/30 transform hover:scale-105 active:scale-95 transition-all"
                 >
                    Join Room
                 </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6 h-[80vh]">
            {/* Main Content Area */}
            <div className="lg:col-span-2 flex flex-col gap-4">
                {/* Room Header */}
                <div className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow-md border border-gray-200 dark:border-gray-800 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Room: <span className="text-red-600">{roomCode}</span></h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{participants.length} watching now</p>
                    </div>
                    <button onClick={handleCopyCode} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors" title="Copy Code">
                        <ClipboardIcon className="w-6 h-6 text-slate-500 dark:text-slate-300" />
                    </button>
                </div>

                {/* Movie Selection / Player Placeholder */}
                <div className="flex-grow bg-black rounded-xl overflow-hidden relative flex items-center justify-center border border-gray-800 shadow-2xl">
                    {selectedMovie ? (
                         <div className="w-full h-full relative group">
                            <img src={selectedMovie.backdrop_path} alt={selectedMovie.title} className="w-full h-full object-cover opacity-50" />
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <h3 className="text-3xl font-bold text-white mb-4 drop-shadow-md">{selectedMovie.title}</h3>
                                <button className="px-8 py-3 bg-red-600 text-white font-bold rounded-full hover:bg-red-700 transition-all shadow-lg transform hover:scale-105">
                                    Start Movie
                                </button>
                                <button onClick={() => setSelectedMovie(null)} className="mt-4 text-slate-300 hover:text-white underline">
                                    Change Movie
                                </button>
                            </div>
                         </div>
                    ) : (
                        <div className="text-center p-8 w-full max-w-md">
                            <h3 className="text-2xl font-bold text-white mb-4">Select a Movie</h3>
                            <div className="relative">
                                <div className="flex items-center bg-gray-800 rounded-full px-4 py-2 border border-gray-700 focus-within:border-red-500">
                                    <SearchIcon className="w-5 h-5 text-slate-400" />
                                    <input 
                                        type="text" 
                                        placeholder="Search movies..." 
                                        className="bg-transparent border-none focus:ring-0 text-white w-full ml-2"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                {searchResults.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900 border border-gray-800 rounded-xl shadow-xl z-10 overflow-hidden">
                                        {searchResults.map(movie => (
                                            <div 
                                                key={movie.id} 
                                                className="p-3 hover:bg-gray-800 cursor-pointer flex items-center gap-3 transition-colors"
                                                onClick={() => handleSelectMovie(movie)}
                                            >
                                                <img src={movie.poster_path} alt={movie.title} className="w-10 h-14 object-cover rounded" />
                                                <div className="text-left">
                                                    <p className="font-bold text-white text-sm line-clamp-1">{movie.title}</p>
                                                    <p className="text-xs text-slate-400">{movie.release_date?.split('-')[0]}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950">
                    <h3 className="font-bold text-gray-900 dark:text-white">Live Chat</h3>
                </div>
                
                <div className="flex-grow overflow-y-auto p-4 space-y-4 scrollbar-thin">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex flex-col ${msg.user === username ? 'items-end' : 'items-start'}`}>
                            <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                                msg.user === 'System' 
                                    ? 'bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-center self-center w-full italic text-xs py-1' 
                                    : msg.user === username 
                                        ? 'bg-red-600 text-white rounded-tr-none' 
                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-none'
                            }`}>
                                {msg.user !== username && msg.user !== 'System' && <p className="text-xs font-bold opacity-70 mb-1">{msg.user}</p>}
                                <p>{msg.text}</p>
                            </div>
                            {msg.user !== 'System' && <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.time}</span>}
                        </div>
                    ))}
                </div>

                <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 flex gap-2">
                    <input 
                        type="text" 
                        placeholder="Type a message..." 
                        className="flex-grow px-4 py-2 rounded-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none text-sm dark:text-white"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                    />
                    <button type="submit" className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled={!messageInput.trim()}>
                        <PaperAirplaneIcon className="w-5 h-5 transform rotate-90" />
                    </button>
                </form>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default WatchParty;