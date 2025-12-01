
import { ContentItem, StreamingSource, Genre, Season, ViewingHistoryItem, Torrent, CategoryState } from '../types';

const API_KEY = '704eac84ae43110c55d1265dccaec186';
const API_BASE_URL = 'https://api.themoviedb.org/3';

// In-memory cache to prevent redundant network requests and improve smoothness
const apiCache = new Map<string, { data: any, timestamp: number }>();
const CACHE_DURATION = 1000 * 60 * 10; // 10 minutes cache

interface GenreResponse {
  genres: Genre[];
}

const fetchFromTMDB = async <T>(endpoint: string, params: string = '', signal?: AbortSignal): Promise<T> => {
  const includeAdult = localStorage.getItem('cineStreamAdult') === 'true';
  const cacheKey = `${endpoint}?${params}&include_adult=${includeAdult}`;
  
  const cached = apiCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
      return cached.data;
  }

  const url = `${API_BASE_URL}/${endpoint}?api_key=${API_KEY}&language=en-US&include_adult=${includeAdult}&${params}`;
  try {
      const response = await fetch(url, { signal });
      if (!response.ok) {
        throw new Error(`Failed to fetch from TMDB: ${response.statusText}`);
      }
      const data = await response.json();
      apiCache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
  } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
          throw error;
      }
      console.error("TMDB Fetch Error:", error);
      throw error;
  }
};

const processContentItem = (item: any, media_type: 'movie' | 'tv'): ContentItem => ({
  id: item.id,
  imdb_id: item.external_ids?.imdb_id || item.imdb_id,
  title: item.title || item.name,
  overview: item.overview,
  poster_path: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : 'https://via.placeholder.com/500x750.png?text=No+Image',
  backdrop_path: item.backdrop_path ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}` : 'https://via.placeholder.com/1280x720.png?text=No+Image',
  vote_average: item.vote_average,
  release_date: item.release_date || item.first_air_date || 'N/A',
  media_type,
  genres: item.genres || [],
  genre_ids: item.genre_ids || [],
  credits: item.credits,
  videos: item.videos,
  number_of_seasons: item.number_of_seasons,
  seasons: item.seasons,
});

const processContentList = (items: any[], media_type: 'movie' | 'tv' | 'all'): ContentItem[] => {
    return items
      .filter(item => item.poster_path && item.backdrop_path)
      .map(item => processContentItem(item, media_type === 'all' ? item.media_type : media_type));
}

export const fetchCategory = async (config: { title: string; endpoint: string; params?: string; media_type?: 'movie' | 'tv' | 'all'; limit?: number }) => {
  const { title, endpoint, params = '', media_type = 'movie', limit } = config;
  try {
    const data = await fetchFromTMDB<{ results: any[] }>(endpoint, params);
    let items = data.results;
    if (limit) {
      items = items.slice(0, limit);
    }
    const processedItems = processContentList(items, media_type);
    return { title, items: processedItems, isLoading: false };
  } catch (error) {
    console.error(`Failed to fetch category "${title}":`, error);
    return { title, items: [], isLoading: false };
  }
};

export const fetchSeriesPage = async (page: number = 1): Promise<ContentItem[]> => {
    const data = await fetchFromTMDB<{ results: any[] }>('discover/tv', `sort_by=popularity.desc&page=${page}`);
    return processContentList(data.results, 'tv');
};

export const fetchHeroContent = async (): Promise<ContentItem[]> => {
    const heroConfig = { title: 'Trending Now', endpoint: 'trending/all/day', media_type: 'all' as const };
    try {
        const result = await fetchCategory(heroConfig);
        const items = result.items.slice(0, 5);
        
        if (items.length > 0) {
            try {
                const firstItemDetails = await getMovieDetails(items[0].id, items[0].media_type);
                items[0] = firstItemDetails;
            } catch (e) {
                console.warn("Failed to enrich first hero item", e);
            }
        }
        return items;
    } catch (error) {
        console.error("Hero fetch error", error);
        return [];
    }
};

export const getHomeCategoryConfigs = () => {
    return [
        { title: 'Trending Movies & TV Shows', endpoint: 'trending/all/week', media_type: 'all' as const },
        { title: 'Popular TV Series', endpoint: 'tv/popular', media_type: 'tv' as const },
        { title: 'Upcoming Releases', endpoint: 'movie/upcoming', media_type: 'movie' as const },
        { title: 'Top 10 Hollywood Blockbusters', endpoint: 'discover/movie', params: 'with_origin_country=US&sort_by=revenue.desc', media_type: 'movie' as const, limit: 10 },
        { title: 'Hollywood Movies', endpoint: 'discover/movie', params: 'with_origin_country=US&sort_by=popularity.desc', media_type: 'movie' as const },
        { title: 'Bollywood Movies', endpoint: 'discover/movie', params: 'with_origin_country=IN&sort_by=popularity.desc', media_type: 'movie' as const },
        { title: 'South Indian Hits', endpoint: 'discover/movie', params: 'with_origin_country=IN&with_original_language=ta|te|ml|kn&sort_by=popularity.desc', media_type: 'movie' as const },
        { title: 'Top Rated Anime', endpoint: 'discover/tv', params: 'with_genres=16&sort_by=vote_average.desc&vote_count.gte=100', media_type: 'tv' as const },
        { title: 'Action Anime Battles', endpoint: 'discover/tv', params: 'with_genres=16,10759&sort_by=popularity.desc', media_type: 'tv' as const },
        { title: 'Action Movies', endpoint: 'discover/movie', params: 'with_genres=28', media_type: 'movie' as const },
        { title: 'Superhero Movies (Marvel & DC)', endpoint: 'discover/movie', params: 'with_keywords=9715&sort_by=popularity.desc', media_type: 'movie' as const },
        { title: 'Comedy Movies', endpoint: 'discover/movie', params: 'with_genres=35', media_type: 'movie' as const },
        { title: 'Horror Movies', endpoint: 'discover/movie', params: 'with_genres=27', media_type: 'movie' as const },
        { title: 'Korean Drama Series', endpoint: 'discover/tv', params: 'with_origin_country=KR&sort_by=popularity.desc', media_type: 'tv' as const },
    ];
};

export const getGenreList = async (): Promise<Genre[]> => {
    if (apiCache.has('genres_combined')) return apiCache.get('genres_combined')?.data;

    const movieGenresPromise = fetchFromTMDB<GenreResponse>('genre/movie/list');
    const tvGenresPromise = fetchFromTMDB<GenreResponse>('genre/tv/list');
    const [movieGenres, tvGenres] = await Promise.all([movieGenresPromise, tvGenresPromise]);

    const allGenres = new Map<number, string>();
    movieGenres.genres.forEach(genre => allGenres.set(genre.id, genre.name));
    tvGenres.genres.forEach(genre => allGenres.set(genre.id, genre.name));
    
    const sortedGenres = Array.from(allGenres, ([id, name]) => ({ id, name })).sort((a,b) => a.name.localeCompare(b.name));
    apiCache.set('genres_combined', { data: sortedGenres, timestamp: Date.now() });
    return sortedGenres;
};

export const getMovieDetails = async (id: number, media_type: 'movie' | 'tv'): Promise<ContentItem> => {
  const details = await fetchFromTMDB<any>(`${media_type}/${id}`, 'append_to_response=videos,credits,seasons,external_ids');
  return processContentItem(details, media_type);
};

export const getSeasonDetails = async (tvId: number, seasonNumber: number): Promise<Season> => {
    return await fetchFromTMDB<Season>(`tv/${tvId}/season/${seasonNumber}`);
};

export const discoverContent = async (options: { genreId?: number | null }): Promise<ContentItem[]> => {
    const params = options.genreId ? `with_genres=${options.genreId}` : 'sort_by=popularity.desc';
    const moviePromise = fetchFromTMDB<{ results: any[] }>('discover/movie', params).then(data => processContentList(data.results, 'movie'));
    const tvPromise = fetchFromTMDB<{ results: any[] }>('discover/tv', params).then(data => processContentList(data.results, 'tv'));
    const [movieResults, tvResults] = await Promise.all([moviePromise, tvPromise]);
    return [...movieResults, ...tvResults].sort(() => 0.5 - Math.random());
};

export const searchMulti = async (query: string, signal?: AbortSignal): Promise<ContentItem[]> => {
    if (!query) return [];
    try {
        const data = await fetchFromTMDB<{ results: any[] }>('search/multi', `query=${encodeURIComponent(query)}`, signal);
        const validResults = data.results.filter(
          (item) => (item.media_type === 'movie' || item.media_type === 'tv') && item.poster_path && item.backdrop_path
        );
        return processContentList(validResults, 'all');
    } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') throw e;
        console.error("Search multi error", e);
        return [];
    }
};

export const searchTVShows = async (query: string, signal?: AbortSignal): Promise<ContentItem[]> => {
    if (!query) return [];
    try {
        const data = await fetchFromTMDB<{ results: any[] }>('search/tv', `query=${encodeURIComponent(query)}`, signal);
        return processContentList(data.results, 'tv');
    } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') throw e;
        console.error("Search TV error", e);
        return [];
    }
};

export const getRecommendations = async (id: number, media_type: 'movie' | 'tv'): Promise<ContentItem[]> => {
    const data = await fetchFromTMDB<{ results: any[] }>(`${media_type}/${id}/recommendations`);
    return processContentList(data.results, media_type);
};

export const getSimilarByGenre = async (idToExclude: number, media_type: 'movie' | 'tv', genres: Genre[]): Promise<ContentItem[]> => {
    if (!genres || genres.length === 0) {
        return [];
    }
    const genreId = genres[0].id; 
    const endpoint = media_type === 'movie' ? 'discover/movie' : 'discover/tv';
    const params = `with_genres=${genreId}&sort_by=popularity.desc`;
    const data = await fetchFromTMDB<{ results: any[] }>(endpoint, params);
    
    let similarContent = processContentList(data.results, media_type);
    similarContent = similarContent.filter(item => item.id !== idToExclude).slice(0, 10);
    return similarContent;
}

export const getRecommendationsForUser = async (history: ViewingHistoryItem[]): Promise<ContentItem[]> => {
    if (history.length === 0) return [];

    const genreCounts = new Map<number, number>();
    history.forEach(item => {
        item.content.genre_ids?.forEach(genreId => {
            genreCounts.set(genreId, (genreCounts.get(genreId) || 0) + 1);
        });
    });

    const sortedGenres = Array.from(genreCounts.entries()).sort((a, b) => b[1] - a[1]);
    const topGenre = sortedGenres.length > 0 ? sortedGenres[0][0] : null;

    if (topGenre) {
        return discoverContent({ genreId: topGenre });
    }

    const latestWatched = history.sort((a,b) => b.lastWatched - a.lastWatched)[0];
    return getRecommendations(latestWatched.content.id, latestWatched.content.media_type);
}

export const getStreamingSources = (id: number, media_type: 'movie' | 'tv', season: number = 1, episode: number = 1): StreamingSource[] => {
    const sources: StreamingSource[] = [];

    // 1. VidSrc.cc (Main / Fast)
    const vidSrcCcUrl = media_type === 'tv'
        ? `https://vidsrc.cc/v2/embed/tv/${id}/${season}/${episode}`
        : `https://vidsrc.cc/v2/embed/movie/${id}`;
    sources.push({ name: 'Server 1: VidSrc.cc (Fast)', url: vidSrcCcUrl });

    // 2. VidLink (Multi-Language / Dubbed Support)
    const vidLinkUrl = media_type === 'tv'
        ? `https://vidlink.pro/tv/${id}/${season}/${episode}`
        : `https://vidlink.pro/movie/${id}`;
    sources.push({ name: 'Server 2: VidLink (Multi-Lang)', url: vidLinkUrl });

    // 3. SuperEmbed (Backup 1)
    const superEmbedUrl = media_type === 'tv'
        ? `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${season}&e=${episode}`
        : `https://multiembed.mov/?video_id=${id}&tmdb=1`;
    sources.push({ name: 'Server 3: SuperEmbed', url: superEmbedUrl });

    // 4. MoviesAPI (Backup 2)
    const moviesApiUrl = media_type === 'tv'
        ? `https://moviesapi.club/tv/${id}-${season}-${episode}`
        : `https://moviesapi.club/movie/${id}`;
    sources.push({ name: 'Server 4: MoviesAPI', url: moviesApiUrl });

    return sources;
}

// ---- DOWNLOAD SERVICE ----

const parseTorrentName = (name: string) => {
    const quality = name.match(/2160p|4k|1080p|720p|480p/i)?.[0] || 'Unknown';
    let type = name.match(/bluray|web-dl|webrip|hdrip|dvdrip/i)?.[0] || 'WEBRip';
    
    // Check for high efficiency codecs
    if (name.match(/x265|hevc/i)) {
        type += ' (HEVC)';
    } else if (name.match(/x264/i)) {
        type += ' (x264)';
    }

    return { quality: quality.toUpperCase(), type: type.toUpperCase() };
};

const cleanImdbId = (id?: string) => id ? id.replace('tt', '') : null;

// Updated signature to support better searching
export const fetchMovieDownloads = async (query: string, type: 'movie' | 'tv' = 'movie', imdbId?: string): Promise<Torrent[]> => {
    if (!query) return [];
    
    let allTorrents: Torrent[] = [];
    const promises = [];
    const cleanQuery = query.trim();
    const encodedQuery = encodeURIComponent(cleanQuery);

    // --- Source 1: YTS (Movies Only - High Quality) ---
    // YTS requires IMDB ID for best accuracy, or exact title
    if (type === 'movie') {
        promises.push(
            (async () => {
                try {
                    let ytsUrl = `https://yts.mx/api/v2/list_movies.json?query_term=${encodedQuery}&limit=10`;
                    // If we have IMDB ID, use it for perfect match
                    if (imdbId) {
                        ytsUrl = `https://yts.mx/api/v2/list_movies.json?query_term=${imdbId}&limit=1`;
                    }
                    
                    const proxyUrl = `https://corsproxy.io/?url=${encodeURIComponent(ytsUrl)}`;
                    const response = await fetch(proxyUrl);
                    const data = await response.json();
                    
                    if (data.data?.movies?.[0]?.torrents) {
                        return data.data.movies[0].torrents.map((t: any) => ({
                            url: t.url,
                            hash: t.hash,
                            quality: t.quality,
                            type: t.type,
                            seeds: t.seeds,
                            peers: t.peers,
                            size: t.size,
                            date_uploaded: t.date_uploaded
                        }));
                    }
                } catch (e) {
                    console.warn("YTS fetch failed", e);
                }
                return [];
            })()
        );
    }

    // --- Source 2: EZTV (TV Shows Only) ---
    // EZTV is best for TV shows, requires numeric IMDB ID (stripped of 'tt')
    if (type === 'tv' && imdbId) {
        const numericId = cleanImdbId(imdbId);
        if (numericId) {
            promises.push(
                (async () => {
                    try {
                        const eztvUrl = `https://eztv.re/api/get-torrents?imdb_id=${numericId}&limit=50`; // Increased limit
                        const proxyUrl = `https://corsproxy.io/?url=${encodeURIComponent(eztvUrl)}`;
                        const response = await fetch(proxyUrl);
                        const data = await response.json();

                        if (data.torrents && Array.isArray(data.torrents)) {
                            // Filter specifically for the requested season/episode if query contains SxxExx
                            // The query usually comes in as "Title S01E01"
                            const seasonEpisodeMatch = cleanQuery.match(/S(\d+)E(\d+)/i);
                            let results = data.torrents;

                            if (seasonEpisodeMatch) {
                                const s = seasonEpisodeMatch[1];
                                const e = seasonEpisodeMatch[2];
                                const regex = new RegExp(`S${s}E${e}`, 'i');
                                results = results.filter((t: any) => regex.test(t.title));
                            }

                            return results.slice(0, 8).map((t: any) => {
                                 const meta = parseTorrentName(t.title);
                                 return {
                                    url: t.magnet_url,
                                    hash: t.hash,
                                    quality: meta.quality === 'UNKNOWN' ? 'HD' : meta.quality,
                                    type: meta.type,
                                    seeds: t.seeds,
                                    peers: t.peers,
                                    size: `${(t.size_bytes / 1048576).toFixed(0)} MB`,
                                    date_uploaded: new Date(t.date_released_unix * 1000).toDateString()
                                 } as Torrent;
                            });
                        }
                    } catch (e) {
                        console.warn("EZTV fetch failed", e);
                    }
                    return [];
                })()
            );
        }
    }

    // --- Source 3: APIBay (The Pirate Bay - Backup for Everything) ---
    promises.push(
        (async () => {
            try {
                const apibayUrl = `https://apibay.org/q.php?q=${encodedQuery}`;
                const proxyUrl = `https://corsproxy.io/?url=${encodeURIComponent(apibayUrl)}`;
                const response = await fetch(proxyUrl);
                const results = await response.json();
                
                if (Array.isArray(results) && results.length > 0 && results[0].id !== '0') {
                    return results.slice(0, 8).map((item: any) => {
                        const meta = parseTorrentName(item.name);
                        const sizeBytes = parseInt(item.size);
                        const sizeStr = sizeBytes > 1073741824 
                            ? `${(sizeBytes / 1073741824).toFixed(2)} GB` 
                            : `${(sizeBytes / 1048576).toFixed(2)} MB`;

                        return {
                            url: `magnet:?xt=urn:btih:${item.info_hash}&dn=${encodeURIComponent(item.name)}&tr=udp://tracker.coppersurfer.tk:6969/announce&tr=udp://tracker.openbittorrent.com:6969/announce`,
                            hash: item.info_hash,
                            quality: meta.quality === 'UNKNOWN' ? 'HD' : meta.quality,
                            type: meta.type,
                            seeds: parseInt(item.seeders),
                            peers: parseInt(item.leechers),
                            size: sizeStr,
                            date_uploaded: 'Recent'
                        } as Torrent;
                    });
                }
            } catch (e) {
                console.warn("APIBay fetch failed", e);
            }
            return [];
        })()
    );

    // --- Source 4: SolidTorrents (Backup) ---
    promises.push(
        (async () => {
            try {
               const solidUrl = `https://solidtorrents.to/api/v1/search?q=${encodedQuery}&category=Video`;
               const proxyUrl = `https://corsproxy.io/?url=${encodeURIComponent(solidUrl)}`;
               const response = await fetch(proxyUrl);
               const data = await response.json();
               
               if (data.results && data.results.length > 0) {
                   return data.results.slice(0, 8).map((item: any) => {
                       const meta = parseTorrentName(item.title);
                       return {
                           url: item.magnet,
                           hash: item.infoHash,
                           quality: meta.quality === 'UNKNOWN' ? 'HD' : meta.quality,
                           type: meta.type,
                           seeds: item.swarm.seeders,
                           peers: item.swarm.leechers,
                           size: `${(item.size / 1073741824).toFixed(2)} GB`, 
                           date_uploaded: 'Recent'
                       } as Torrent;
                   });
               }
            } catch (e) {
                console.warn("SolidTorrents fetch failed", e);
            }
            return [];
        })()
    );

    const results = await Promise.allSettled(promises);
    
    results.forEach(result => {
        if (result.status === 'fulfilled' && Array.isArray(result.value)) {
            allTorrents = [...allTorrents, ...result.value];
        }
    });

    // Remove duplicates based on hash
    const uniqueTorrents = Array.from(new Map(allTorrents.map(item => [item.hash, item])).values());

    // Filter out dead torrents to ensure availability
    return uniqueTorrents.filter(t => t.seeds > 0).sort((a, b) => b.seeds - a.seeds);
};

export const getDownloadLink = (content: ContentItem, season: number = 1, episode: number = 1): string => {
    // Deprecated for direct use, logic moved to DownloadModal
    return '';
};
