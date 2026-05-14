import React, { useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { useSiteConfig } from '../context/SiteConfigContext';
import { getCardClass } from '../components/designSystem';
import { AdvancedNavbar } from '../components/AdvancedNavbar';
import { apiClient } from '../utils/apiClient';

interface Message {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  receivedAt: string; // Changed from timestamp to receivedAt to match SiteInboxMessage
  ip?: string;
  userAgent?: string;
  security?: {
    score: number;
    level: 'low' | 'medium' | 'high';
    isBot: boolean;
    botConfidence: number;
    emailValid: boolean;
    similarMessages: number;
  };
  device?: {
    type: string;
    browser: string;
    os: string;
    screenResolution: string;
    language: string;
  };
  session?: {
    sessionId: string;
    timeOnSite: number;
    pagesVisited: number;
    referrer: string;
    firstVisit: boolean;
  };
  location?: {
    country: string;
    city: string;
    timezone: string;
  };
  read: boolean;
}

const Dashboard: React.FC = () => {
  const { siteConfig } = useSiteConfig();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/messages');
      if (response.success) {
        setMessages(response.data || []);
      } else {
        setError(response.error || 'فشل تحميل الرسائل');
      }
    } catch (err) {
      setError('حدث خطأ أثناء تحميل الرسائل');
      console.error('Error loading messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (messageId: string) => {
    try {
      const response = await apiClient.patch(`/api/messages/${messageId}/read`);
      if (response.success) {
        setMessages(messages.map(msg => 
          msg.id === messageId ? { ...msg, read: true } : msg
        ));
        if (selectedMessage?.id === messageId) {
          setSelectedMessage({ ...selectedMessage, read: true });
        }
      }
    } catch (err) {
      console.error('Error marking message as read:', err);
    }
  };

  const handleDelete = async (messageId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الرسالة؟')) return;

    try {
      const response = await apiClient.delete(`/api/messages/${messageId}`);
      if (response.success) {
        setMessages(messages.filter(msg => msg.id !== messageId));
        if (selectedMessage?.id === messageId) {
          setSelectedMessage(null);
        }
      }
    } catch (err) {
      console.error('Error deleting message:', err);
    }
  };

  const filteredMessages = messages.filter(msg => {
    const matchesFilter = 
      filter === 'all' || 
      (filter === 'unread' && !msg.read) || 
      (filter === 'read' && msg.read);
    
    const matchesSearch = 
      msg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'Africa/Cairo'
    }).format(date);
  };

  const formatTimeOnSite = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours} ساعة ${minutes} دقيقة ${secs} ثانية`;
    } else if (minutes > 0) {
      return `${minutes} دقيقة ${secs} ثانية`;
    } else {
      return `${secs} ثانية`;
    }
  };

  const getSecurityLevelColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getSecurityLevelText = (level: string) => {
    switch (level) {
      case 'high': return 'عالي';
      case 'medium': return 'متوسط';
      case 'low': return 'منخفض';
      default: return 'غير معروف';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل الرسائل...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
          </div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadMessages}
            className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <AdvancedNavbar isLightMode={true} />
      
      <main className="pt-24 pb-16 px-4 md:px-8 lg:px-12">
        <div className="max-w-[1400px] mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2" style={{ color: '#000000' }}>
              لوحة التحكم
            </h1>
            <p className="text-gray-600">
              إدارة وعرض جميع الرسائل المستلمة
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className={`p-4 rounded-xl ${getCardClass('card-2', 'light')}`}>
              <p className="text-sm text-gray-500 mb-1">إجمالي الرسائل</p>
              <p className="text-2xl font-bold">{messages.length}</p>
            </div>
            <div className={`p-4 rounded-xl ${getCardClass('card-2', 'light')}`}>
              <p className="text-sm text-gray-500 mb-1">غير مقروءة</p>
              <p className="text-2xl font-bold">{messages.filter(m => !m.read).length}</p>
            </div>
            <div className={`p-4 rounded-xl ${getCardClass('card-2', 'light')}`}>
              <p className="text-sm text-gray-500 mb-1">مقروءة</p>
              <p className="text-2xl font-bold">{messages.filter(m => m.read).length}</p>
            </div>
            <div className={`p-4 rounded-xl ${getCardClass('card-2', 'light')}`}>
              <p className="text-sm text-gray-500 mb-1">مشبوهة</p>
              <p className="text-2xl font-bold">
                {messages.filter(m => m.security?.level === 'low').length}
              </p>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'all' ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                الكل
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'unread' ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                غير مقروءة
              </button>
              <button
                onClick={() => setFilter('read')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'read' ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                مقروءة
              </button>
            </div>
            <input
              type="text"
              placeholder="بحث في الرسائل..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/20"
            />
          </div>

          {/* Messages List */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Messages List */}
            <div className="space-y-4">
              {filteredMessages.length === 0 ? (
                <div className={`p-8 rounded-xl ${getCardClass('card-2', 'light')} text-center`}>
                  <p className="text-gray-500">لا توجد رسائل</p>
                </div>
              ) : (
                filteredMessages.map((message) => (
                  <div
                    key={message.id}
                    onClick={() => setSelectedMessage(message)}
                    className={`p-4 rounded-xl cursor-pointer transition-all ${
                      selectedMessage?.id === message.id
                        ? 'bg-black text-white'
                        : `${getCardClass('card-2', 'light')} hover:shadow-lg`
                    } ${!message.read ? 'border-l-4 border-l-black' : ''}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className={`font-semibold mb-1 ${selectedMessage?.id === message.id ? 'text-white' : 'text-gray-900'}`}>
                          {message.name}
                        </h3>
                        <p className={`text-sm ${selectedMessage?.id === message.id ? 'text-white/70' : 'text-gray-500'}`}>
                          {message.email}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {message.security && (
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            selectedMessage?.id === message.id
                              ? 'bg-white/20 text-white'
                              : getSecurityLevelColor(message.security.level)
                          }`}>
                            {getSecurityLevelText(message.security.level)}
                          </span>
                        )}
                        {!message.read && (
                          <div className="w-2 h-2 rounded-full bg-black" />
                        )}
                      </div>
                    </div>
                    <p className={`text-sm mb-2 ${selectedMessage?.id === message.id ? 'text-white/80' : 'text-gray-700'}`}>
                      {message.subject}
                    </p>
                    <p className={`text-xs ${selectedMessage?.id === message.id ? 'text-white/60' : 'text-gray-400'}`}>
                      {formatDate(message.receivedAt)}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Message Details */}
            {selectedMessage && (
              <div className={`p-6 rounded-xl ${getCardClass('card-2', 'light')} sticky top-24`}>
                <div className="flex items-start justify-between mb-6">
                  <h2 className="text-xl font-bold">تفاصيل الرسالة</h2>
                  <div className="flex gap-2">
                    {!selectedMessage.read && (
                      <button
                        onClick={() => handleMarkAsRead(selectedMessage.id)}
                        className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors"
                      >
                        تعليم كمقروءة
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(selectedMessage.id)}
                      className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
                    >
                      حذف
                    </button>
                  </div>
                </div>

                {/* Basic Info */}
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wider text-gray-500 mb-1">
                      الاسم
                    </label>
                    <p className="text-sm font-medium">{selectedMessage.name}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wider text-gray-500 mb-1">
                      البريد الإلكتروني
                    </label>
                    <p className="text-sm font-medium">{selectedMessage.email}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wider text-gray-500 mb-1">
                      الموضوع
                    </label>
                    <p className="text-sm font-medium">{selectedMessage.subject}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wider text-gray-500 mb-1">
                      الرسالة
                    </label>
                    <p className="text-sm leading-relaxed">{selectedMessage.message}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wider text-gray-500 mb-1">
                      الوقت
                    </label>
                    <p className="text-sm font-medium">{formatDate(selectedMessage.receivedAt)}</p>
                  </div>
                  {selectedMessage.ip && (
                    <div>
                      <label className="block text-xs font-medium uppercase tracking-wider text-gray-500 mb-1">
                        IP
                      </label>
                      <p className="text-sm font-medium">{selectedMessage.ip}</p>
                    </div>
                  )}
                </div>

                {/* Security Info */}
                {selectedMessage.security && (
                  <div className="border-t border-gray-200 pt-4 mb-6">
                    <h3 className="text-sm font-semibold mb-3">معلومات الأمان</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium uppercase tracking-wider text-gray-500 mb-1">
                          مستوى الأمان
                        </label>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getSecurityLevelColor(selectedMessage.security.level)}`}>
                          {getSecurityLevelText(selectedMessage.security.level)}
                        </span>
                      </div>
                      <div>
                        <label className="block text-xs font-medium uppercase tracking-wider text-gray-500 mb-1">
                          نقاط الأمان
                        </label>
                        <p className="text-sm font-medium">{selectedMessage.security.score}/100</p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium uppercase tracking-wider text-gray-500 mb-1">
                          بوت
                        </label>
                        <p className="text-sm font-medium">
                          {selectedMessage.security.isBot ? 'نعم' : 'لا'}
                          {selectedMessage.security.isBot && (
                            <span className="text-xs text-gray-500 ml-2">
                              ({Math.round(selectedMessage.security.botConfidence * 100)}%)
                            </span>
                          )}
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium uppercase tracking-wider text-gray-500 mb-1">
                          البريد صحيح
                        </label>
                        <p className="text-sm font-medium">
                          {selectedMessage.security.emailValid ? 'نعم' : 'لا'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium uppercase tracking-wider text-gray-500 mb-1">
                          رسائل مشابهة
                        </label>
                        <p className="text-sm font-medium">{selectedMessage.security.similarMessages}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Device Info */}
                {selectedMessage.device && (
                  <div className="border-t border-gray-200 pt-4 mb-6">
                    <h3 className="text-sm font-semibold mb-3">معلومات الجهاز</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium uppercase tracking-wider text-gray-500 mb-1">
                          نوع الجهاز
                        </label>
                        <p className="text-sm font-medium">{selectedMessage.device.type}</p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium uppercase tracking-wider text-gray-500 mb-1">
                          المتصفح
                        </label>
                        <p className="text-sm font-medium">{selectedMessage.device.browser}</p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium uppercase tracking-wider text-gray-500 mb-1">
                          نظام التشغيل
                        </label>
                        <p className="text-sm font-medium">{selectedMessage.device.os}</p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium uppercase tracking-wider text-gray-500 mb-1">
                          دقة الشاشة
                        </label>
                        <p className="text-sm font-medium">{selectedMessage.device.screenResolution}</p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium uppercase tracking-wider text-gray-500 mb-1">
                          اللغة
                        </label>
                        <p className="text-sm font-medium">{selectedMessage.device.language}</p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium uppercase tracking-wider text-gray-500 mb-1">
                          المنطقة الزمنية
                        </label>
                        <p className="text-sm font-medium">{selectedMessage.device.timezone}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Session Info */}
                {selectedMessage.session && (
                  <div className="border-t border-gray-200 pt-4 mb-6">
                    <h3 className="text-sm font-semibold mb-3">معلومات الجلسة</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium uppercase tracking-wider text-gray-500 mb-1">
                          معرف الجلسة
                        </label>
                        <p className="text-sm font-medium">{selectedMessage.session.sessionId}</p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium uppercase tracking-wider text-gray-500 mb-1">
                          الوقت على الموقع
                        </label>
                        <p className="text-sm font-medium">{formatTimeOnSite(selectedMessage.session.timeOnSite)}</p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium uppercase tracking-wider text-gray-500 mb-1">
                          الصفحات المزارة
                        </label>
                        <p className="text-sm font-medium">{selectedMessage.session.pagesVisited}</p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium uppercase tracking-wider text-gray-500 mb-1">
                          المصدر
                        </label>
                        <p className="text-sm font-medium">{selectedMessage.session.referrer}</p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium uppercase tracking-wider text-gray-500 mb-1">
                          أول زيارة
                        </label>
                        <p className="text-sm font-medium">{selectedMessage.session.firstVisit ? 'نعم' : 'لا'}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Location Info */}
                {selectedMessage.location && (
                  <div className="border-t border-gray-200 pt-4">
                    <h3 className="text-sm font-semibold mb-3">معلومات الموقع</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium uppercase tracking-wider text-gray-500 mb-1">
                          الدولة
                        </label>
                        <p className="text-sm font-medium">{selectedMessage.location.country}</p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium uppercase tracking-wider text-gray-500 mb-1">
                          المدينة
                        </label>
                        <p className="text-sm font-medium">{selectedMessage.location.city}</p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium uppercase tracking-wider text-gray-500 mb-1">
                          المنطقة الزمنية
                        </label>
                        <p className="text-sm font-medium">{selectedMessage.location.timezone}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;