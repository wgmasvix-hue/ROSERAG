import axios, { AxiosError, AxiosInstance } from 'axios';
import { Message, SearchResult, Collection } from './store';

const API_TIMEOUT = 30000;

// Create axios instances
const rasaClient: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_RASA_URL || 'http://localhost:5005',
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

const roseragClient: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

const dspaceClient: AxiosInstance = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_DSPACE_URL || 'http://repo.dare.co.zw'}/server/api`,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Error handler
const handleError = (error: AxiosError, context: string) => {
  console.error(`[${context}] API Error:`, error);

  if (error.response) {
    throw new Error(
      `API Error: ${error.response.status} - ${error.response.statusText}`
    );
  } else if (error.request) {
    throw new Error('No response from server. Please check your connection.');
  } else {
    throw new Error(error.message || 'An unknown error occurred');
  }
};

// Rasa Chat API
export const sendChatMessage = async (
  message: string,
  userId: string
): Promise<any[]> => {
  try {
    const response = await rasaClient.post('/webhooks/rest/webhook', {
      sender: userId,
      message: message,
    });
    return response.data || [];
  } catch (error) {
    handleError(error as AxiosError, 'sendChatMessage');
    throw error;
  }
};

// ROSERAG Search API
export const searchDocuments = async (
  query: string,
  topK: number = 5,
  filters?: Record<string, any>
): Promise<SearchResult[]> => {
  try {
    const response = await roseragClient.post('/search', {
      query,
      top_k: topK,
      filters: filters || {},
    });

    return (response.data.results || []).map((result: any, index: number) => ({
      id: `${index}_${Date.now()}`,
      title: result.title || 'Untitled',
      author: result.author,
      date: result.date,
      excerpt: result.summary || result.excerpt || '',
      score: result.score || 0.5,
      url: result.url || '#',
      document_type: result.document_type,
    }));
  } catch (error) {
    handleError(error as AxiosError, 'searchDocuments');
    throw error;
  }
};

// ROSERAG Chat/RAG API
export const askQuestion = async (
  question: string,
  topK: number = 5,
  history?: Array<{ role: string; content: string }>
): Promise<{
  answer: string;
  sources: Array<{
    document: string;
    page: number;
    excerpt: string;
    score: number;
  }>;
  confidence: number;
}> => {
  try {
    const response = await roseragClient.post('/chat', {
      message: question,
      history: history || [],
      top_k: topK,
    });

    return {
      answer: response.data.answer || 'No answer found',
      sources: response.data.sources || [],
      confidence: response.data.confidence || 0,
    };
  } catch (error) {
    handleError(error as AxiosError, 'askQuestion');
    throw error;
  }
};

// DSpace Collections API
export const fetchCollections = async (): Promise<Collection[]> => {
  try {
    const response = await dspaceClient.get('/discover/search/objects', {
      params: {
        scope: '',
        configuration: 'default',
        query: '*',
        page: 0,
        size: 20,
        sort: 'score,desc',
      },
    });

    const items = response.data._embedded?.searchObjects || [];

    return items.map((item: any) => {
      const indexable = item._embedded?.indexableObject;
      return {
        uuid: indexable?.uuid || `col_${Math.random()}`,
        name: indexable?.name || 'Unknown Collection',
        description: indexable?.metadata?.[0]?.value || '',
        itemCount: item.hitHighlights?.length || 0,
        url: indexable?.uuid ? `/handle/${indexable.uuid}` : undefined,
      };
    });
  } catch (error) {
    console.warn('Could not fetch collections:', error);
    return [];
  }
};

// DSpace Search
export const searchDSpace = async (
  query: string,
  page: number = 0,
  size: number = 10
): Promise<SearchResult[]> => {
  try {
    const response = await dspaceClient.get('/discover/search/objects', {
      params: {
        query: query || '*',
        page,
        size,
        sort: 'score,desc',
      },
    });

    const items = response.data._embedded?.searchObjects || [];

    return items.map((item: any, index: number) => {
      const indexable = item._embedded?.indexableObject;
      return {
        id: `${page}_${index}`,
        title: indexable?.name || 'Untitled',
        author: indexable?.metadata?.find((m: any) => m.key === 'dc.creator')
          ?.value,
        date: indexable?.metadata?.find((m: any) => m.key === 'dc.issued')
          ?.value,
        excerpt: indexable?.metadata?.find((m: any) => m.key === 'dc.description')
          ?.value,
        score: item.hitHighlights?.length ? 0.8 : 0.5,
        url: indexable?.uuid ? `/handle/${indexable.uuid}` : '#',
        document_type: indexable?.type,
      };
    });
  } catch (error) {
    console.warn('DSpace search error:', error);
    return [];
  }
};

// Document Upload
export const uploadDocument = async (
  file: File,
  collectionUuid: string
): Promise<any> => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await roseragClient.post(
      `/documents/upload?collection=${collectionUuid}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  } catch (error) {
    handleError(error as AxiosError, 'uploadDocument');
    throw error;
  }
};

// Health checks
export const checkHealth = async () => {
  const checks = {
    roserag: false,
    rasa: false,
    dspace: false,
  };

  try {
    await roseragClient.get('/health');
    checks.roserag = true;
  } catch {
    console.warn('ROSERAG health check failed');
  }

  try {
    await rasaClient.get('/health');
    checks.rasa = true;
  } catch {
    console.warn('Rasa health check failed');
  }

  try {
    await dspaceClient.get('/');
    checks.dspace = true;
  } catch {
    console.warn('DSpace health check failed');
  }

  return checks;
};

export default {
  sendChatMessage,
  searchDocuments,
  askQuestion,
  fetchCollections,
  searchDSpace,
  uploadDocument,
  checkHealth,
};
