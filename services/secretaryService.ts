import { SecretaryConfig, SecretaryChannel, KnowledgeBaseFile } from '../types';

const BASE_URL = 'http://localhost:5000/api/secretary';

/**
 * Helper function to get auth token
 */
function getAuthToken(): string {
  const token = localStorage.getItem('auth_token');
  if (!token) {
    throw new Error('Authentication token not found');
  }
  return token;
}

/**
 * Fetches the current secretary configuration from the backend.
 */
export async function getConfig(): Promise<SecretaryConfig> {
  try {
    const token = getAuthToken();
    const response = await fetch(`${BASE_URL}/config`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) {
      throw new Error('Failed to fetch secretary config');
    }
    return response.json();
  } catch (error) {
    console.error('Error fetching secretary config:', error);
    throw error;
  }
}

/**
 * Saves the secretary configuration to the backend.
 * @param config The configuration object to save.
 */
export async function saveConfig(config: SecretaryConfig): Promise<SecretaryConfig> {
  try {
    const token = getAuthToken();
    const response = await fetch(`${BASE_URL}/config`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(config),
    });
    if (!response.ok) {
      throw new Error('Failed to save secretary config');
    }
    return response.json();
  } catch (error) {
    console.error('Error saving secretary config:', error);
    throw error;
  }
}

/**
 * Upload a file to the knowledge base
 * @param file The file to upload
 */
export async function uploadKnowledgeFile(file: File): Promise<KnowledgeBaseFile> {
  try {
    const token = getAuthToken();
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${BASE_URL}/knowledge/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    if (!response.ok) {
      throw new Error('Failed to upload knowledge file');
    }
    
    return response.json();
  } catch (error) {
    console.error('Error uploading knowledge file:', error);
    throw error;
  }
}

/**
 * Delete a knowledge base file
 * @param fileId The ID of the file to delete
 */
export async function deleteKnowledgeFile(fileId: string): Promise<{ success: boolean }> {
  try {
    const token = getAuthToken();
    const response = await fetch(`${BASE_URL}/knowledge/${fileId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete knowledge file');
    }
    
    return response.json();
  } catch (error) {
    console.error('Error deleting knowledge file:', error);
    throw error;
  }
}

/**
 * Test connection to a communication channel
 * @param channel The channel to test
 */
export async function testChannelConnection(channel: SecretaryChannel): Promise<{ connected: boolean; message: string }> {
  try {
    const token = getAuthToken();
    const response = await fetch(`${BASE_URL}/channels/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(channel)
    });
    
    if (!response.ok) {
      throw new Error('Failed to test channel connection');
    }
    
    return response.json();
  } catch (error) {
    console.error('Error testing channel connection:', error);
    throw error;
  }
}
