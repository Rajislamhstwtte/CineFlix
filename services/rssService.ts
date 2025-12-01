
import { fetchCategory } from './movieService';

export const generateRssFeed = async (): Promise<string> => {
    // Fetch latest trending movies for the feed
    const { items } = await fetchCategory({
        title: 'RSS Feed',
        endpoint: 'trending/all/day',
        media_type: 'all',
        limit: 20
    });

    const date = new Date().toUTCString();
    
    let xml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>Cineflix Trending Feed</title>
  <link>https://cineflix.dpdns.org</link>
  <description>The latest trending movies and TV shows on Cineflix.</description>
  <language>en-us</language>
  <lastBuildDate>${date}</lastBuildDate>
  <atom:link href="https://cineflix.dpdns.org/rss.xml" rel="self" type="application/rss+xml" />
`;

    items.forEach(item => {
        const link = `https://cineflix.dpdns.org?id=${item.id}&type=${item.media_type}`;
        const title = item.title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const description = item.overview.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const releaseYear = item.release_date?.split('-')[0] || 'N/A';
        const rating = item.vote_average?.toFixed(1) || 'N/A';
        
        xml += `
  <item>
    <title>${title} (${releaseYear})</title>
    <link>${link}</link>
    <guid isPermaLink="true">${link}</guid>
    <description><![CDATA[<img src="${item.poster_path}" align="left" hspace="5" /> ${description} <br/> <strong>Rating:</strong> ${rating}/10]]></description>
    <pubDate>${date}</pubDate>
  </item>`;
    });

    xml += `
</channel>
</rss>`;

    return xml;
};

export const downloadRssFeed = async () => {
    try {
        const xml = await generateRssFeed();
        const blob = new Blob([xml], { type: 'application/rss+xml' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'cineflix-rss.xml';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        return true;
    } catch (e) {
        console.error("Failed to generate RSS", e);
        return false;
    }
};
