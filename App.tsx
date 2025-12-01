
import React, { useState, useEffect, useCallback, lazy, Suspense, useRef, useTransition } from 'react';
import { inject } from '@vercel/analytics';
import { ContentItem, Genre, Season, CategoryState } from './types';
import { 
  fetchHeroContent,
  getHomeCategoryConfigs,
  fetchCategory,
  getMovieDetails,
  discoverContent,
  getGenreList,
  getRecommendationsForUser,
  getSeasonDetails
} from './services/movieService';
import { useMyList } from './hooks/useMyList';
import { useToast } from './hooks/useToast';
import { useViewingHistory } from './hooks/useViewingHistory';
import Header from './components/Header';
import HomeView from './components/HomeView';
import Toast from './components/Toast';
import Sidebar from './components/Sidebar';
import SettingsModal from './components/SettingsModal';
import DownloadModal from './components/DownloadModal';
import InstallModal from './components/InstallModal';
import HelpModal from './components/HelpModal';
import ChatBot from './components/ChatBot';
import { LoadingSpinner, TrendingIcon, ComingSoonIcon, BackIcon } from './components/IconComponents';
import Footer from './components/Footer';
import IntroAnimation from './components/IntroAnimation';
import WatchParty from './components/WatchParty';
import MovieGrid from './components/MovieGrid';

const MovieDetail = lazy(() => import('./components/MovieDetail'));
const VideoPlayer = lazy(() => import('./components/VideoPlayer'));
const AllSeriesPage = lazy(() => import('./components/AllSeriesPage'));

interface PlayingContentState {
  content: ContentItem;
  season?: number;
  episode?: number;
  mode?: 'trailer' | 'sources';
}

type View = 'home' | 'series' | 'trending' | 'upcoming' | 'watch-party';
type Theme = 'light' | 'dark';

const App: React.FC = () => {
  const [categories, setCategories] = useState<CategoryState[]>([]);
  const [heroItems, setHeroItems] = useState<ContentItem[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [filteredContent, setFilteredContent] = useState<ContentItem[]>([]);
  
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [playingContent, setPlayingContent] = useState<PlayingContentState | null>(null);

  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
  
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false); 
  const [error, setError] = useState<string | null>(null);
  const [showIntro, setShowIntro] = useState(true);
  
  const [downloadModalContent, setDownloadModalContent] = useState<ContentItem | null>(null);
  const [downloadSeason, setDownloadSeason] = useState<number | undefined>(undefined);
  const [downloadEpisode, setDownloadEpisode] = useState<number | undefined>(undefined);
  
  const { myList, addItem: addItemToList, removeItem: removeItemFromList, isItemInList, clearList } = useMyList();
  const { toastMessage, showToast } = useToast();
  const { viewingHistory, addItemToHistory, getHistoryForItem, clearHistory } = useViewingHistory();
  const [personalizedCategories, setPersonalizedCategories] = useState<CategoryState[]>([]);
  const [currentView, setCurrentView] = useState<View>('home');
  const [theme, setTheme] = useState<Theme>('dark');

  const [isPending, startTransition] = useTransition();

  const selectedContentRef = useRef(selectedContent);
  const viewingHistoryRef = useRef(viewingHistory);

  useEffect(() => { selectedContentRef.current = selectedContent; }, [selectedContent]);
  useEffect(() => { viewingHistoryRef.current = viewingHistory; }, [viewingHistory]);

  // Initialize Analytics
  useEffect(() => {
    inject();
  }, []);

  useEffect(() => {
    setShowIntro(true);

    const savedTheme = localStorage.getItem('cineStreamTheme') as Theme;
    const initialTheme = savedTheme || 'dark';
    setTheme(initialTheme);
    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    const initLoad = async () => {
      setIsInitialLoading(true);
      try {
        const [genreList, heroData] = await Promise.all([
            getGenreList(),
            fetchHeroContent()
        ]);
        
        setGenres(genreList);
        setHeroItems(heroData);
        setIsInitialLoading(false);

        const allConfigs = getHomeCategoryConfigs();
        
        const batchA = allConfigs.slice(0, 2);
        const resultsA = await Promise.all(batchA.map(fetchCategory));
        setCategories(prev => [...prev, ...resultsA]);

        const batchB = allConfigs.slice(2, 6);
        Promise.all(batchB.map(fetchCategory)).then(resultsB => {
            setCategories(prev => [...prev, ...resultsB]);

            const batchC = allConfigs.slice(6);
            Promise.all(batchC.map(fetchCategory)).then(resultsC => {
                setCategories(prev => [...prev, ...resultsC]);
            });
        });

        setError(null);
      } catch (err) {
        setError("Failed to load movie data. Please try again later.");
        console.error(err);
        setIsInitialLoading(false);
      }
    };
    initLoad();
  }, []);
  
  const handleIntroComplete = () => {
    setShowIntro(false);
    sessionStorage.setItem('hasSeenIntro', 'true');
  };

  const handleReplayIntro = () => {
    setShowIntro(true);
  };

  useEffect(() => {
    const handleIncomingLink = async () => {
      const params = new URLSearchParams(window.location.search);
      const contentId = params.get('id');
      const contentType = params.get('type');

      if (contentId && (contentType === 'movie' || contentType === 'tv')) {
        window.history.replaceState({}, document.title, window.location.pathname);

        try {
          const detailedContent = await getMovieDetails(Number(contentId), contentType);
          setSelectedContent(detailedContent);
        } catch (err) {
          showToast("Could not load shared content.");
          console.error(err);
        }
      }
    };
    handleIncomingLink();
  }, [showToast]);

  useEffect(() => {
    const generatePersonalizedContent = async () => {
      if (viewingHistory.length > 0) {
        const continueWatchingItems = viewingHistory
          .filter(item => item.progress > 0 && item.progress < 1)
          .sort((a, b) => b.lastWatched - a.lastWatched)
          .map(item => ({ ...item.content, progress: item.progress }));

        const recommendations = await getRecommendationsForUser(viewingHistory);
        
        const newPersonalizedCategories: CategoryState[] = [];
        if (continueWatchingItems.length > 0) {
            newPersonalizedCategories.push({ title: 'Continue Watching', items: continueWatchingItems, isLoading: false });
        }
        if (recommendations.length > 0) {
            newPersonalizedCategories.push({ title: 'Recommended For You', items: recommendations, isLoading: false });
        }
        setPersonalizedCategories(newPersonalizedCategories);
      } else {
        setPersonalizedCategories([]);
      }
    };
    generatePersonalizedContent();
  }, [viewingHistory]);


  useEffect(() => {
    const performFilter = async () => {
        if (!selectedGenre) {
            setFilteredContent([]);
            setIsFiltering(false);
            return;
        }

        setIsFiltering(true);
        try {
            const content = await discoverContent({ genreId: selectedGenre });
            setFilteredContent(content);
        } catch (err)
 {
            setError("Failed to filter content.");
            console.error(err);
        } finally {
            setIsFiltering(false);
        }
    };
    performFilter();
  }, [selectedGenre]);

  
  const handleSelectItem = useCallback((item: ContentItem) => {
    if (selectedContentRef.current?.id === item.id) return;
    setSelectedContent(item);
  }, []);

  const handlePlayItem = useCallback((content: ContentItem, season?: number, episode?: number) => {
    addItemToHistory(content, season, episode);
    setPlayingContent({ content, season, episode, mode: 'sources' });
  }, [addItemToHistory]);

  const handlePlayTrailer = useCallback((content: ContentItem) => {
    setPlayingContent({ content, mode: 'trailer' });
  }, []);

  const handleSmartPlay = useCallback(async (content: ContentItem) => {
    if (content.media_type === 'movie') {
      handlePlayItem(content);
      return;
    }

    const historyItem = viewingHistoryRef.current.find(item => item.content.id === content.id);
    let seasonToPlay = 1;
    let episodeToPlay = 1;

    if (historyItem && historyItem.lastSeason && historyItem.lastEpisode) {
        seasonToPlay = historyItem.lastSeason;
        episodeToPlay = historyItem.lastEpisode;
    }
    
    handlePlayItem(content, seasonToPlay, episodeToPlay);
  }, [handlePlayItem]);
  
  const handleDownloadItem = useCallback((content: ContentItem, season?: number, episode?: number) => {
    setDownloadModalContent(content);
    setDownloadSeason(season);
    setDownloadEpisode(episode);
  }, []);
  
  const handleNavigate = useCallback((view: View) => {
    startTransition(() => {
        setCurrentView(view);
        setSelectedGenre(null);
        setFilteredContent([]);
        setIsFiltering(false);
        setIsSidebarOpen(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }, []);

  const handleGenreChange = useCallback((genreId: number | null) => {
    startTransition(() => {
        setSelectedGenre(genreId);
    });
  }, []);
  
  const toggleTheme = useCallback(() => {
    setTheme(prevTheme => {
        const newTheme = prevTheme === 'light' ? 'dark' : 'light';
        localStorage.setItem('cineStreamTheme', newTheme);
        if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        return newTheme;
    });
  }, []);

  const handleCloseDetail = useCallback(() => setSelectedContent(null), []);
  const handleClosePlayer = useCallback(() => setPlayingContent(null), []);

  const handleAddItemToList = useCallback((item: ContentItem) => {
    addItemToList(item);
    showToast(`${item.title} added to My List`);
  }, [addItemToList, showToast]);

  const handleRemoveItemFromList = useCallback((item: ContentItem) => {
    removeItemFromList(item.id);
    showToast(`${item.title} removed from My List`);
  }, [removeItemFromList, showToast]);

  const handleClearHistory = useCallback(() => {
    clearHistory();
    showToast("Watch history cleared.");
  }, [clearHistory, showToast]);

  const handleClearMyList = useCallback(() => {
    clearList();
    showToast("My List cleared.");
  }, [clearList, showToast]);

  useEffect(() => {
    const isBlockingModalOpen = !!playingContent || !!selectedContent || isSettingsOpen || !!downloadModalContent || isInstallModalOpen || isHelpModalOpen;
    if (isBlockingModalOpen) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = '';
    }
  }, [playingContent, selectedContent, isSettingsOpen, downloadModalContent, isInstallModalOpen, isHelpModalOpen]);
  

  const renderGenericGridView = (title: string, categoryTitle: string, Icon: React.FC<React.SVGProps<SVGSVGElement>>) => {
      const category = categories.find(c => c.title === categoryTitle);
      const items = category ? category.items : [];
      const isLoading = isInitialLoading;

      return (
        <div className="min-h-screen pt-24 pb-12 px-4 md:px-8 lg:px-12 animate-fade-in-up">
            <div className="container mx-auto max-w-7xl">
                 <div className="mb-6">
                    <button 
                      onClick={() => handleNavigate('home')}
                      className="w-fit group flex items-center gap-2 px-5 py-2.5 rounded-full font-bold transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg bg-white text-gray-900 border border-gray-200 hover:bg-red-600 hover:text-white dark:bg-gray-800 dark:text-white dark:border-gray-700 dark:hover:bg-red-600"
                    >
                      <BackIcon className="w-5 h-5" />
                      <span>Back to Home</span>
                    </button>
                </div>

                <div className="flex items-center mb-8 pb-4 border-b-4 border-red-600">
                     <Icon className="w-10 h-10 text-red-600 mr-4" />
                     <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white drop-shadow-lg">
                        {title}
                    </h1>
                </div>
                
                {isLoading ? (
                     <div className="flex justify-center items-center h-64"><LoadingSpinner className="w-12 h-12 text-red-500" /></div>
                ) : items.length > 0 ? (
                    <MovieGrid items={items} onSelectItem={handleSelectItem} onSmartPlayItem={handleSmartPlay} onDownloadItem={handleDownloadItem} />
                ) : (
                    <div className="text-center py-16">
                         <h2 className="text-2xl font-bold text-slate-600 dark:text-slate-300">No {title} found.</h2>
                         <p className="text-slate-500 dark:text-slate-400 mt-2">Please check back later.</p>
                    </div>
                )}
            </div>
        </div>
      )
  };

  if (playingContent) {
    return (
      <Suspense fallback={<div className="fixed inset-0 bg-black z-50 flex items-center justify-center"><LoadingSpinner className="w-12 h-12 text-red-500"/></div>}>
        <VideoPlayer 
          content={playingContent.content} 
          seasonNumber={playingContent.season}
          episodeNumber={playingContent.episode}
          onClose={handleClosePlayer} 
          initialMode={playingContent.mode}
        />
      </Suspense>
    );
  }

  return (
    <div className="bg-gray-100 dark:bg-transparent text-gray-800 dark:text-white min-h-screen flex flex-col transition-colors duration-300 w-full overflow-x-hidden">
      {showIntro && <IntroAnimation onComplete={handleIntroComplete} />}
      
       <Sidebar 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)} 
          onNavigate={handleNavigate} 
          currentView={currentView} 
          showToast={showToast}
          theme={theme}
          toggleTheme={toggleTheme}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onShowInstallModal={() => setIsInstallModalOpen(true)}
          onOpenHelp={() => setIsHelpModalOpen(true)}
       />
      <Header 
        onOpenSidebar={() => setIsSidebarOpen(true)}
        onSelectItem={handleSelectItem}
        onNavigate={handleNavigate}
        currentView={currentView}
        showToast={showToast}
        onShowInstallModal={() => setIsInstallModalOpen(true)}
       />
      <main className="flex-grow w-full">
        {currentView === 'home' && (
          <HomeView 
            isInitialLoading={isInitialLoading}
            error={error}
            categories={categories}
            heroItems={heroItems}
            genres={genres}
            selectedGenre={selectedGenre}
            isFiltering={isFiltering}
            filteredContent={filteredContent}
            personalizedCategories={personalizedCategories}
            myList={myList}
            onSmartPlay={handleSmartPlay}
            onSelectItem={handleSelectItem}
            onPlayTrailer={handlePlayTrailer}
            onGenreChange={handleGenreChange}
            onDownload={handleDownloadItem}
          />
        )}
        {currentView === 'series' && (
          <Suspense fallback={<div className="p-8 text-center"><LoadingSpinner className="w-12 h-12 text-red-500 mx-auto"/></div>}>
            <AllSeriesPage 
              onSmartPlay={handleSmartPlay} 
              onSelectItem={handleSelectItem} 
              onPlay={handlePlayItem} 
              onDownload={handleDownloadItem}
              onBack={() => handleNavigate('home')}
            />
          </Suspense>
        )}
        {currentView === 'trending' && renderGenericGridView('Trending Movies', 'Trending Movies', TrendingIcon)}
        {currentView === 'upcoming' && renderGenericGridView('Upcoming Releases', 'Upcoming Releases', ComingSoonIcon)}
        {currentView === 'watch-party' && <WatchParty onOpenSearch={() => {}} />}
      </main>
      <Footer onOpenFeedback={() => setIsChatOpen(true)} />
      <ChatBot 
          isOpen={isChatOpen} 
          onToggle={() => setIsChatOpen(!isChatOpen)} 
          onShowInstallModal={() => setIsInstallModalOpen(true)} 
          onNavigate={handleNavigate}
          onSelectItem={handleSelectItem}
      />
      <Toast message={toastMessage} />
      
      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        theme={theme}
        toggleTheme={toggleTheme}
        onClearHistory={handleClearHistory}
        onClearMyList={handleClearMyList}
        onReplayIntro={handleReplayIntro}
      />

      <InstallModal 
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />

      <HelpModal 
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />

      {downloadModalContent && (
         <DownloadModal
            isOpen={!!downloadModalContent}
            onClose={() => setDownloadModalContent(null)}
            content={downloadModalContent}
            season={downloadSeason}
            episode={downloadEpisode}
         />
      )}

      {selectedContent && (
        <Suspense fallback={<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"><LoadingSpinner className="w-12 h-12 text-red-500" /></div>}>
          <MovieDetail 
            content={selectedContent} 
            onClose={handleCloseDetail} 
            onSmartPlay={handleSmartPlay} 
            onPlayEpisode={handlePlayItem}
            onDownload={handleDownloadItem}
            isLoading={false} 
            isItemInList={isItemInList(selectedContent.id)}
            onAddItem={handleAddItemToList}
            onRemoveItem={handleRemoveItemFromList}
            onSelectRecommendation={handleSelectItem}
            viewingHistory={viewingHistory}
            showToast={showToast}
          />
        </Suspense>
      )}
    </div>
  );
};

export default App;
