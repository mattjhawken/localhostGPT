from typing import Dict, List, Optional

import requests
from bs4 import BeautifulSoup


class WebScraper:
    """Web scraper for search results and content extraction."""
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
    
    def search_duckduckgo(self, query: str, max_results: int = 5) -> List[Dict]:
        """Search DuckDuckGo and return results with snippets."""
        try:
            # DuckDuckGo Instant Answer API
            params = {
                'q': query,
                'format': 'json',
                'no_html': '1',
                'skip_disambig': '1'
            }
            
            response = self.session.get('https://api.duckduckgo.com/', params=params)
            data = response.json()
            
            results = []
            
            # Get related topics and results
            for topic in data.get('RelatedTopics', [])[:max_results]:
                if 'Text' in topic and 'FirstURL' in topic:
                    results.append({
                        'title': topic.get('Text', '')[:100] + '...' if len(topic.get('Text', '')) > 100 else topic.get('Text', ''),
                        'url': topic.get('FirstURL', ''),
                        'snippet': topic.get('Text', ''),
                        'source': 'duckduckgo'
                    })
            
            return results
            
        except Exception as e:
            print(f"DuckDuckGo search error: {e}")
            return []
    
    def scrape_content(self, url: str, max_chars: int = 2000) -> Optional[str]:
        """Scrape and clean content from a URL."""
        try:
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Remove script and style elements
            for script in soup(["script", "style", "nav", "header", "footer", "aside"]):
                script.decompose()
            
            # Get text content
            text = soup.get_text()
            
            # Clean up text
            lines = (line.strip() for line in text.splitlines())
            chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
            text = ' '.join(chunk for chunk in chunks if chunk)
            
            # Truncate if too long
            if len(text) > max_chars:
                text = text[:max_chars] + "..."
            
            return text
            
        except Exception as e:
            print(f"Error scraping {url}: {e}")
            return None
