# DARE AI Assistant - Web UI

Modern, responsive web interface for the DARE AI Assistant. Built with Next.js, React, and Tailwind CSS.

## Features

🎯 **Conversational Chat**
- Real-time chat with AI assistant
- Context-aware responses
- Source citations with confidence scoring
- Message history and persistence

🔍 **Smart Search**
- Semantic document search
- DSpace integration
- Advanced filtering
- Relevance scoring

📚 **Collection Browser**
- Browse all institutional collections
- Collection statistics
- Direct DSpace access

🎨 **Modern UI/UX**
- Responsive design (mobile, tablet, desktop)
- Dark mode support
- Smooth animations
- Accessibility-first

🚀 **Performance**
- Next.js App Router
- Client-side state management (Zustand)
- Optimized API calls
- Lazy loading

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **UI**: React 18
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Markdown**: React Markdown
- **Icons**: Lucide React
- **TypeScript**: Full type safety
- **Build**: Next.js built-in

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- ROSERAG backend running
- Rasa assistant running
- DSpace instance (optional)

### Installation

```bash
# Clone and navigate
cd ui/dare-ai

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Edit .env.local with your URLs
nano .env.local

# Start development server
npm run dev

# Open browser to http://localhost:3001
```

### Build & Deploy

```bash
# Production build
npm run build

# Start production server
npm start

# Or with Docker
docker build -t dare-ai:latest .
docker run -p 3001:3001 \
  -e NEXT_PUBLIC_API_URL=http://backend:8000/api \
  -e NEXT_PUBLIC_RASA_URL=http://rasa:5005 \
  dare-ai:latest
```

## Project Structure

```
ui/dare-ai/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Main page
│   └── api/               # API routes (optional)
│
├── components/             # React components
│   ├── Header.tsx         # Top navigation
│   ├── Sidebar.tsx        # Left sidebar
│   ├── ChatPanel.tsx      # Chat interface
│   ├── MessageBubble.tsx  # Message display
│   ├── SearchPanel.tsx    # Search interface
│   └── CollectionsPanel.tsx # Collections browser
│
├── lib/                    # Utilities and logic
│   ├── store.ts           # Zustand store (state management)
│   ├── api.ts             # API client functions
│   └── utils.ts           # Helper functions
│
├── styles/                 # Global styles
│   └── globals.css        # Tailwind + custom CSS
│
├── public/                 # Static assets
│   └── favicon.ico
│
├── Dockerfile             # Container image
├── package.json           # Dependencies
├── tsconfig.json          # TypeScript config
├── tailwind.config.js     # Tailwind config
├── next.config.js         # Next.js config
├── postcss.config.js      # PostCSS config
└── .env.example           # Environment template
```

## Components

### Header
- App logo and branding
- Theme toggle (light/dark)
- User menu
- Quick settings

### Sidebar
- Navigation tabs (Chat, Search, Collections)
- New conversation button
- Conversation history
- Quick tips

### ChatPanel
- Message display with animations
- Input field with suggestions
- Loading states
- Error handling
- Message actions (copy, like, dislike)

### MessageBubble
- Markdown rendering
- Source citations with links
- Confidence scores
- Relevance visualization
- Copy functionality

### SearchPanel
- Search input with debouncing
- Filter buttons
- Results display
- Pagination support
- Relevance scoring

### CollectionsPanel
- Collections grid
- Collection metadata
- Item counts
- Direct access to DSpace

## State Management (Zustand)

The app uses Zustand for state management with persistence:

```typescript
// Chat messages
messages: Message[]
addMessage: (message) => void
clearMessages: () => void

// Search
searchQuery: string
searchResults: SearchResult[]
isSearching: boolean

// Collections
collections: Collection[]
selectedCollection: Collection | null

// UI
sidebarOpen: boolean
activeTab: 'chat' | 'search' | 'collections'
theme: 'light' | 'dark'

// User
userId: string
userName: string
```

## API Integration

### Rasa Chat API
```typescript
POST /webhooks/rest/webhook
{ sender: "user_id", message: "text" }
→ [{ text: "response", buttons: [...] }]
```

### ROSERAG Search API
```typescript
POST /api/search
{ query: "text", top_k: 5, filters: {...} }
→ { results: [...], total: 50 }
```

### ROSERAG Chat/RAG API
```typescript
POST /api/chat
{ message: "question", history: [...], top_k: 5 }
→ { answer: "text", sources: [...], confidence: 0.87 }
```

### DSpace Collections API
```typescript
GET /server/api/discover/search/objects
→ { _embedded: { searchObjects: [...] }, page: {...} }
```

## Configuration

### Environment Variables

```bash
# API URLs
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_RASA_URL=http://localhost:5005
NEXT_PUBLIC_DSPACE_URL=http://repo.dare.co.zw

# Application
NEXT_PUBLIC_APP_NAME=DARE AI Assistant
NEXT_PUBLIC_APP_VERSION=1.0.0

# Features (defaults to true)
NEXT_PUBLIC_ENABLE_CHAT=true
NEXT_PUBLIC_ENABLE_SEARCH=true
NEXT_PUBLIC_ENABLE_COLLECTIONS=true

# Theming
NEXT_PUBLIC_THEME_MODE=light
NEXT_PUBLIC_PRIMARY_COLOR=#0ea5e9
NEXT_PUBLIC_ACCENT_COLOR=#a855f7

# Optional: Analytics
# NEXT_PUBLIC_GA_ID=UA-XXXXXXXXX-X
# NEXT_PUBLIC_SENTRY_DSN=...
```

### Tailwind Configuration

Colors are customized for DARE branding:

```javascript
colors: {
  dare: {
    50: '#f0f9ff',    // Lightest
    500: '#0ea5e9',   // Primary
    900: '#0c3d66',   // Darkest
  },
}
```

Modify `tailwind.config.js` to match your branding.

## Styling

### Global Styles (`styles/globals.css`)

- Tailwind base, components, utilities
- Custom component classes
- Animation definitions
- Dark mode support
- Print styles

### Component Styles

Components use Tailwind classes with custom CSS classes:

```jsx
// Predefined button styles
<button className="btn-primary">Primary</button>
<button className="btn-secondary">Secondary</button>
<button className="btn-ghost">Ghost</button>

// Custom utilities
<div className="card">Card content</div>
<input className="input-base" />
```

## TypeScript

Full TypeScript support with strict mode enabled:

```typescript
// Types in lib/store.ts
interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
  sources?: Source[];
  confidence?: number;
}

interface SearchResult {
  id: string;
  title: string;
  score: number;
  // ...
}
```

## Performance Optimization

- ✅ Code splitting
- ✅ Image optimization (Next.js Image)
- ✅ API route caching
- ✅ Debounced search
- ✅ Virtual scrolling (for large lists)
- ✅ Lazy component loading

## Dark Mode

Automatic dark mode detection + manual toggle:

```typescript
// Get system preference
const theme = getSystemTheme(); // 'light' | 'dark'

// Manual toggle
setTheme('dark');

// Persisted in localStorage via Zustand
```

## Accessibility

- Semantic HTML
- ARIA labels
- Keyboard navigation
- Color contrast compliance
- Focus indicators

## Development

### Development Server

```bash
npm run dev
# Server: http://localhost:3001
# Hot reload enabled
```

### Linting

```bash
npm run lint
```

### Building

```bash
npm run build
npm start  # Start production server
```

### Type Checking

```bash
npx tsc --noEmit
```

## Deployment

### Docker

```bash
docker build -t dare-ai:latest .
docker run -p 3001:3001 \
  -e NEXT_PUBLIC_API_URL=http://backend:8000/api \
  -e NEXT_PUBLIC_RASA_URL=http://rasa:5005 \
  dare-ai:latest
```

### Docker Compose

Add to main `docker-compose.yml`:

```yaml
dare-ui:
  build: ./ui/dare-ai
  ports:
    - "3001:3001"
  environment:
    NEXT_PUBLIC_API_URL: http://backend:8000/api
    NEXT_PUBLIC_RASA_URL: http://rasa:5005
  depends_on:
    - backend
    - rasa
```

### Nginx/Reverse Proxy

```nginx
location /ai {
  proxy_pass http://localhost:3001;
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection "upgrade";
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
}
```

Then access at `https://repo.dare.co.zw/ai`

### Vercel Deployment

```bash
vercel env add NEXT_PUBLIC_API_URL http://backend:8000/api
vercel env add NEXT_PUBLIC_RASA_URL http://rasa:5005
vercel deploy --prod
```

## Troubleshooting

### Issue: CORS errors

**Solution**: Check Next.js rewrites in `next.config.js` and backend CORS headers

```bash
# Check backend CORS
curl -H "Origin: http://localhost:3001" -I http://localhost:8000
```

### Issue: API timeouts

**Solution**: Increase timeout in `.env.local`:

```bash
API_TIMEOUT=60000  # 60 seconds
```

### Issue: Dark mode not persisting

**Solution**: Check localStorage permissions and Zustand persistence

```javascript
// Debug in browser console
localStorage.getItem('dare-ai-store')
```

### Issue: Messages not loading

**Solution**: Check browser dev tools for:
- Network tab: API response status
- Console: JavaScript errors
- Storage: Zustand state

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS 14+, Android 12+)

## Performance Metrics

Target metrics:

| Metric | Target |
|--------|--------|
| LCP | < 2.5s |
| FID | < 100ms |
| CLS | < 0.1 |
| TTI | < 3.5s |

Monitor with Lighthouse: `npm run build && npm start`

## Security

- ✅ Content Security Policy (CSP)
- ✅ X-Frame-Options
- ✅ X-Content-Type-Options
- ✅ XSS Protection headers
- ✅ Input sanitization
- ✅ HTTPS only (production)

## SEO

- ✅ Meta tags
- ✅ Open Graph
- ✅ Structured data ready
- ✅ Dynamic sitemap support

## Contributing

1. Follow TypeScript strict mode
2. Use component composition
3. Keep components focused
4. Add prop types
5. Test responsive design
6. Update documentation

## License

MIT

## Support

- **Documentation**: See this README
- **Issues**: GitHub issues tracker
- **Backend**: Check ROSERAG README
- **Chat**: Check DSpace Assistant README

---

**DARE AI Assistant UI** - Modern interface for institutional knowledge discovery
Built with Next.js, React, and Tailwind CSS
