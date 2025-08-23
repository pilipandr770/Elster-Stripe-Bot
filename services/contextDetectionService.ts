import { Module } from '../types';

/**
 * Обнаруживает текущий контекст приложения на основе URL или других признаков
 * Используется для автоматического переключения режима работы чата
 */
export function detectModuleContext(): Module | null {
  if (typeof window === 'undefined') {
    return null; // SSR environment
  }
  
  // Анализируем URL для определения контекста
  const url = window.location.pathname;
  
  if (url.includes('/accounting') || url.includes('/tax') || url.includes('/finance')) {
    return 'accounting';
  }
  
  if (url.includes('/partner-check') || url.includes('/compliance')) {
    return 'partnerCheck';
  }
  
  if (url.includes('/secretary') || url.includes('/messages') || url.includes('/emails')) {
    return 'secretary';
  }
  
  if (url.includes('/marketing') || url.includes('/content')) {
    return 'marketing';
  }
  
  // Пытаемся определить контекст по содержимому страницы
  const bodyContent = document.body.textContent?.toLowerCase() || '';
  
  if (
    bodyContent.includes('buchhalter') || 
    bodyContent.includes('steuer') || 
    bodyContent.includes('rechnung') ||
    bodyContent.includes('accounting') || 
    bodyContent.includes('invoice')
  ) {
    return 'accounting';
  }
  
  if (
    bodyContent.includes('partner') || 
    bodyContent.includes('sanktion') || 
    bodyContent.includes('compliance') ||
    bodyContent.includes('check') || 
    bodyContent.includes('verify')
  ) {
    return 'partnerCheck';
  }
  
  if (
    bodyContent.includes('email') || 
    bodyContent.includes('nachricht') || 
    bodyContent.includes('termin') ||
    bodyContent.includes('kalender') || 
    bodyContent.includes('sekretar')
  ) {
    return 'secretary';
  }
  
  if (
    bodyContent.includes('marketing') || 
    bodyContent.includes('content') || 
    bodyContent.includes('kampagne') ||
    bodyContent.includes('social media') || 
    bodyContent.includes('post')
  ) {
    return 'marketing';
  }
  
  // Проверяем атрибуты data- на странице
  const moduleAttribute = document.body.getAttribute('data-module');
  if (moduleAttribute) {
    switch (moduleAttribute) {
      case 'accounting': 
      case 'tax': 
      case 'finance': 
        return 'accounting';
      
      case 'partnerCheck': 
      case 'partner-check': 
      case 'compliance': 
        return 'partnerCheck';
      
      case 'secretary': 
      case 'messages': 
      case 'emails': 
        return 'secretary';
      
      case 'marketing': 
      case 'content': 
      case 'posts': 
        return 'marketing';
    }
  }
  
  // Если не смогли определить контекст, возвращаем null
  return null;
}
