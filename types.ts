
export interface StreamingSource {
  name: string;
  url: string;
}

export interface Genre {
  id: number;
  name:string;
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

export interface Video {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
}

export interface Episode {
  id: number;
  episode_number: number;
  name: string;
  overview: string;
  still_path: string | null;
}

export interface Season {
  id: number;
  season_number: number;
  name: string;
  episode_count: number;
  episodes?: Episode[];
}

export interface Torrent {
    url: string;
    hash: string;
    quality: string;
    type: string;
    seeds: number;
    peers: number;
    size: string;
    date_uploaded: string;
}

// A unified interface for both movies and TV shows
export interface ContentItem {
  id: number;
  imdb_id?: string; // Added for download lookup
  title: string; // Normalized from movie's `title` or TV's `name`
  overview: string;
  poster_path: string;
  backdrop_path: string;
  vote_average: number;
  release_date: string; // Normalized from `release_date` or `first_air_date`
  media_type: 'movie' | 'tv';
  genres: Genre[];
  genre_ids?: number[];
  credits?: {
    cast: CastMember[];
  };
  videos?: {
    results: Video[];
  };
  // TV Show specific properties
  number_of_seasons?: number;
  seasons?: Season[];
  // For "Continue Watching"
  progress?: number; 
}

export interface CategoryState {
  title: string;
  items: ContentItem[];
  isLoading: boolean;
}

export interface ViewingHistoryItem {
  content: ContentItem;
  lastWatched: number; // Timestamp
  progress: number; // 0 to 1
  lastSeason?: number;
  lastEpisode?: number;
}