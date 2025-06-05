import random
import time
from typing import Dict, List

import requests
from bs4 import BeautifulSoup
from requests_html import HTMLSession


class WebScraper:
    def __init__(self):
        # Basic headers for DuckDuckGo search
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
                          '(KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })

        # Set up requests-html session for JS rendering
        self.html_session = HTMLSession()

    def search_duckduckgo(self, query: str, max_results: int = 10) -> List[Dict]:
        """Search DuckDuckGo and return results with snippets."""
        try:
            html = self.session.get(f"https://html.duckduckgo.com/html/?q={query}").text
            soup = BeautifulSoup(html, 'html.parser')

            results = []
            for result in soup.find_all("a", class_="result__a")[:max_results]:
                title = result.get_text(strip=True)
                link = result.get("href")
                snippet = result.find_parent("div", class_="result").get_text(strip=True)
                results.append({
                    "title": title,
                    "link": link,
                    "snippet": snippet
                })

            selected_pages = random.sample(results, min(4, len(results)))

            for page in selected_pages:
                page['content'] = self.get_text_with_requests_html(page['link'])

            return selected_pages

        except Exception as e:
            print(f"[DuckDuckGo Search Error] {e}")
            return []

    def get_text_with_requests_html(self, url: str) -> str:
        """Extract text content from URL using requests-html with JS rendering."""
        try:
            # First try basic requests (faster)
            basic_response = self.html_session.get(url, timeout=10)
            basic_soup = BeautifulSoup(basic_response.text, 'html.parser')
            
            # Quick check if we got substantial content without JS
            basic_text = self._extract_text_from_soup(basic_soup)
            if len(basic_text) > 200:  # Good enough content found
                return basic_text[:1000]
            
            # Fall back to JS rendering for dynamic content
            print(f"[JS Rendering] {url}")
            basic_response.html.render(timeout=15, wait=2)
            
            # Extract text from rendered content
            return self._extract_text_from_rendered_html(basic_response.html)[:1000]

        except Exception as e:
            return f"[Error loading {url}]: {e}"

    def _extract_text_from_soup(self, soup: BeautifulSoup) -> str:
        """Extract text from BeautifulSoup object."""
        # Try to get main content by <article> first
        article = soup.find("article")
        if article:
            return article.get_text(strip=True)

        # Try main content areas
        main_content = soup.find("main") or soup.find("div", class_=lambda x: x and "content" in x.lower())
        if main_content:
            return main_content.get_text(strip=True)

        # Fall back to paragraphs
        paragraphs = soup.find_all("p")
        visible_texts = [p.get_text(strip=True) for p in paragraphs if p.get_text(strip=True)]
        return "\n".join(visible_texts[:5])

    def _extract_text_from_rendered_html(self, html_obj) -> str:
        """Extract text from requests-html rendered object."""
        try:
            # Try to get main content by <article> first
            article = html_obj.find('article', first=True)
            if article and article.text.strip():
                return article.text.strip()

            # Try main content areas
            main = html_obj.find('main', first=True)
            if main and main.text.strip():
                return main.text.strip()

            # Try content divs
            content_div = html_obj.find('div[class*="content"]', first=True)
            if content_div and content_div.text.strip():
                return content_div.text.strip()

            # Fall back to paragraphs
            paragraphs = html_obj.find('p')
            visible_texts = [p.text.strip() for p in paragraphs[:5] if p.text.strip()]
            return "\n".join(visible_texts)

        except Exception as e:
            return f"[Text extraction error]: {e}"

    def close(self):
        """Clean up resources."""
        try:
            self.html_session.close()
        except:
            pass
