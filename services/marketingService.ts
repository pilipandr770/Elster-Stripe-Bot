import { MarketingChannel, ContentTopic, ScheduledPost } from "../types";

const API_BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:5000';

/**
 * Marketing Service for handling marketing-related API operations
 */
export const marketingService = {
  // Channels
  getChannels: async (): Promise<MarketingChannel[]> => {
    const response = await fetch(`${API_BASE_URL}/api/marketing/channels`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch channels');
    }

    const data = await response.json();
    if (!data || !Array.isArray(data.channels)) {
      console.warn('Unexpected API response format for channels:', data);
      return [];
    }
    return data.channels;
  },

  addChannel: async (channel: Partial<MarketingChannel>): Promise<MarketingChannel> => {
    const response = await fetch(`${API_BASE_URL}/api/marketing/channels`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(channel)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to add channel');
    }

    const data = await response.json();
    return data.channel;
  },

  deleteChannel: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/api/marketing/channels?id=${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete channel');
    }
  },

  // Topics
  getTopics: async (): Promise<ContentTopic[]> => {
    const response = await fetch(`${API_BASE_URL}/api/marketing/topics`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch topics');
    }

    const data = await response.json();
    if (!data || !Array.isArray(data.topics)) {
      console.warn('Unexpected API response format for topics:', data);
      return [];
    }
    return data.topics;
  },

  addTopic: async (topic: Partial<ContentTopic>): Promise<ContentTopic> => {
    const response = await fetch(`${API_BASE_URL}/api/marketing/topics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(topic)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to add topic');
    }

    const data = await response.json();
    return data.topic;
  },

  deleteTopic: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/api/marketing/topics?id=${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete topic');
    }
  },

  // Posts
  getPosts: async (): Promise<ScheduledPost[]> => {
    const response = await fetch(`${API_BASE_URL}/api/marketing/posts`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch posts');
    }

    const data = await response.json();
    if (!data || !Array.isArray(data.posts)) {
      console.warn('Unexpected API response format for posts:', data);
      return [];
    }
    return data.posts;
  },

  addPost: async (post: Partial<ScheduledPost>): Promise<ScheduledPost> => {
    const response = await fetch(`${API_BASE_URL}/api/marketing/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(post)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to add post');
    }

    const data = await response.json();
    return data.post;
  },

  deletePost: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/api/marketing/posts?id=${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete post');
    }
  },

  // Content Generation
  generateContent: async (channelId: string, topicId: string): Promise<{ title: string; text: string; mediaPrompt: string }> => {
    const response = await fetch(`${API_BASE_URL}/api/marketing/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ channelId, topicId })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to generate content');
    }

    const data = await response.json();
    return data.content;
  },

  // Publish post immediately
  publishPost: async (postId: string): Promise<ScheduledPost> => {
    const response = await fetch(`${API_BASE_URL}/api/marketing/publish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ postId })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to publish post');
    }

    const data = await response.json();
    return data.post;
  },

  // Get analytics
  getAnalytics: async (): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/api/marketing/analytics`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch analytics');
    }

    return await response.json();
  },

  // Chat with marketing assistant
  sendMessage: async (message: string): Promise<string> => {
    const response = await fetch(`${API_BASE_URL}/api/marketing/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ message })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to send message');
    }

    return await response.text();
  },

  // Check API connection
  checkApiConnection: async (): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/marketing/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        // Set a shorter timeout for connection test
        signal: AbortSignal.timeout ? AbortSignal.timeout(5000) : new AbortController().signal
      });
      
      return response.ok;
    } catch (error) {
      console.error('API connection check failed:', error);
      return false;
    }
  }
};

export default marketingService;
