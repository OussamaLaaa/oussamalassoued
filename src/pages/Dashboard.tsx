import React, { useEffect, useState, useMemo } from 'react';
import { useSiteConfig } from '../context/SiteConfigContext';
import { getButtonClass, getCardClass } from '../components/designSystem';
import { AdvancedNavbar } from '../components/AdvancedNavbar';

interface Message {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  timestamp: number;
  ip: string;
  userAgent: string;
  read: boolean;
  security: {
    score: number;
    level: string;
    botDetected: boolean;
    botConfidence: number;
    emailValid: boolean;
    similarCount: number;
  };
  geolocation?: {
    country: string;
    city: string;
    timezone: string;
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
}

const Dashboard: React.FC = () => {
  const { siteConfig } = useSiteConfig();
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch messages
  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/messages');
      const data = await response.json();
      
      if (data.success) {
        setMessages(data.messages || []);
      } else {
        setError(data.error || 'Failed to fetch messages');
      }
    } catch (err) {
      setError('Failed to connect to server');
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter messages
  const filteredMessages = useMemo(() => {
    let filtered = messages;

    // Apply status filter
    if (filter === 'unread') {
      filtered = filtered.filter(m => !m.read);
    } else if (filter === 'read') {
      filtered = filtered.filter(m => m.read);
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(m =>
        m.name.toLowerCase().includes(term) ||
        m.email.toLowerCase().includes(term) ||
        m.subject.toLowerCase().includes(term) ||
        m.message.toLowerCase().includes(term)
      );
    }

    // Sort by timestamp (newest first)
    return filtered.sort((a, b) => b.timestamp - a.timestamp);
  }, [messages, filter, searchTerm]);

  // Format timestamp
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString('ar-SA', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      time: date.toLocaleTimeString('ar-SA', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      full: date.toLocaleString('ar-SA', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
    };
  };

  // Format time on site
  const formatTimeOnSite = (seconds: number) => {
    if (seconds < 60) return `${seconds} ثانية`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} دقيقة`;
    return `${Math.floor(seconds / 3600)} ساعة`;
  };

  // Get security level color
  const getSecurityLevelColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-green-600 bg-green-50 border-green-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // Get security level text
  const getSecurityLevelText = (level: string) => {
    switch (level) {
      case 'high': return 'عالي';
      case 'medium': return 'متوسط';
      case 'low': return 'منخفض';
      default: return 'غير معروف';
    }
  };

  // Mark message as read
  const markAsRead = async (messageId: string) => {
    try {
      const response = await fetch(`/api/messages/${messageId}/read`, {
        method: 'PATCH',
      });
      
      if (response.ok) {
        setMessages(prev =>
          prev.map(m =>
            m.id === messageId ? { ...m, read: true } : m
          )
        );
      }
    } catch (err) {
      console.error('Error marking message as read:', err);
    }
  };

  // Delete message
  const deleteMessage = async (messageId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الرسالة؟')) return;

    try {
      const response = await fetch(`/api/messages/${messageId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setMessages(prev => prev.filter(m => m.id !== messageId));
        if (selectedMessage?.id === messageId) {
          setSelectedMessage(null);
        }
      }
    } catch (err) {
      console.error('Error deleting message:', err);
      alert('فشل حذف الرسالة');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <AdvancedNavbar isLightMode={true} />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4" />
            <p className="text-gray-600">جاري تحميل الرسائل...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <AdvancedNavbar isLightMode={true} />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="text-red-600 text-4xl mb-4">⚠️</div>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={fetchMessages}
              className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
            >
              إعادة المحاولة
            </button>
          </div>
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
              لوحة الرسائل
            </h1>
            <p className="text-gray-600">
              إجمالي {messages.length} رسالة • {messages.filter(m => !m.read).length} غير مقروءة
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-black text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                الكل ({messages.length})
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'unread'
                    ? 'bg-black text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                غير مقروءة ({messages.filter(m => !m.read).length})
              </button>
              <button
                onClick={() => setFilter('read')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'read'
                    ? 'bg-black text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                مقروءة ({messages.filter(m => m.read).length})
              </button>
            </div>
            <div className="flex-1">
              <input
                type="text"
                placeholder="بحث في الرسائل..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/20"
              />
            </div>
          </div>

          {/* Messages Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Messages List */}
            <div className="lg:col-span-1 space-y-4">
              {filteredMessages.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-4xl mb-4">📭</div>
                  <p>لا توجد رسائل</p>
                </div>
              ) : (
                filteredMessages.map((message) => (
                  <div
                    key={message.id}
                    onClick={() => {
                      setSelectedMessage(message);
                      if (!message.read) {
                        markAsRead(message.id);
                      }
                    }}
                    className={`p-4 rounded-xl border cursor-pointer transition-all hover:shadow-lg ${
                      selectedMessage?.id === message.id
                        ? 'border-black bg-gray-50'
                        : 'border-gray-200 hover:border-gray-300'
                    } ${!message.read ? 'border-l-4 border-l-black' : ''}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {message.name}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {message.email}
                        </p>
                      </div>
                      {!message.read && (
                        <div className="w-2 h-2 bg-black rounded-full flex-shrink-0 mt-2" />
                      )}
                    </div>
                    <p className="text-sm font-medium text-gray-900 mb-2 line-clamp-2">
                      {message.subject}
                    </p>
                    <p className="text-xs text-gray-500 mb-3 line-clamp-2">
                      {message.message}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{formatTimestamp(message.timestamp).time}</span>
                      <span className={`px-2 py-1 rounded-full ${getSecurityLevelColor(message.security.level)}`}>
                        {getSecurityLevelText(message.security.level)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Message Details */}
            <div className="lg:col-span-2">
              {selectedMessage ? (
                <div className="space-y-6">
                  {/* Message Content */}
                  <div className={`p-6 rounded-xl border ${getCardClass('card-2', 'light')}`}>
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <h2 className="text-2xl font-bold mb-2" style={{ color: '#000000' }}>
                          {selectedMessage.subject}
                        </h2>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>{selectedMessage.name}</span>
                          <span>•</span>
                          <span>{selectedMessage.email}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => deleteMessage(selectedMessage.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="حذف"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div className="prose prose-sm max-w-none mb-6">
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {selectedMessage.message}
                      </p>
                    </div>

                    <div className="pt-6 border-t border-gray-200">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500 mb-1">التاريخ</p>
                          <p className="font-medium">{formatTimestamp(selectedMessage.timestamp).date}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 mb-1">الوقت</p>
                          <p className="font-medium">{formatTimestamp(selectedMessage.timestamp).time}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 mb-1">IP</p>
                          <p className="font-medium">{selectedMessage.ip}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Security Info */}
                  <div className={`p-6 rounded-xl border ${getCardClass('card-2', 'light')}`}>
                    <h3 className="text-lg font-semibold mb-4" style={{ color: '#000000' }}>
                      معلومات الأمان
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-gray-500 mb-1">مستوى الأمان</p>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSecurityLevelColor(selectedMessage.security.level)}`}>
                          {getSecurityLevelText(selectedMessage.security.level)}
                        </span>
                      </div>
                      <div>
                        <p className="text-gray-500 mb-1">نقاط الأمان</p>
                        <p className="font-medium">{selectedMessage.security.score}/100</p>
                      </div>
                      <div>
                        <p className="text-gray-500 mb-1">بوت</p>
                        <p className={`font-medium ${selectedMessage.security.botDetected ? 'text-red-600' : 'text-green-600'}`}>
                          {selectedMessage.security.botDetected ? 'نعم' : 'لا'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 mb-1">ثقة البوت</p>
                        <p className="font-medium">{(selectedMessage.security.botConfidence * 100).toFixed(0)}%</p>
                      </div>
                      <div>
                        <p className="text-gray-500 mb-1">البريد صالح</p>
                        <p className={`font-medium ${selectedMessage.security.emailValid ? 'text-green-600' : 'text-red-600'}`}>
                          {selectedMessage.security.emailValid ? 'نعم' : 'لا'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 mb-1">رسائل مشابهة</p>
                        <p className="font-medium">{selectedMessage.security.similarCount}</p>
                      </div>
                    </div>
                  </div>

                  {/* Device Info */}
                  {selectedMessage.device && (
                    <div className={`p-6 rounded-xl border ${getCardClass('card-2', 'light')}`}>
                      <h3 className="text-lg font-semibold mb-4" style={{ color: '#000000' }}>
                        معلومات الجهاز
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-gray-500 mb-1">نوع الجهاز</p>
                          <p className="font-medium">{selectedMessage.device.type}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 mb-1">المتصفح</p>
                          <p className="font-medium">{selectedMessage.device.browser}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 mb-1">نظام التشغيل</p>
                          <p className="font-medium">{selectedMessage.device.os}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 mb-1">دقة الشاشة</p>
                          <p className="font-medium">{selectedMessage.device.screenResolution}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 mb-1">اللغة</p>
                          <p className="font-medium">{selectedMessage.device.language}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Session Info */}
                  {selectedMessage.session && (
                    <div className={`p-6 rounded-xl border ${getCardClass('card-2', 'light')}`}>
                      <h3 className="text-lg font-semibold mb-4" style={{ color: '#000000' }}>
                        معلومات الجلسة
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-gray-500 mb-1">معرف الجلسة</p>
                          <p className="font-medium text-xs">{selectedMessage.session.sessionId}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 mb-1">الوقت على الموقع</p>
                          <p className="font-medium">{formatTimeOnSite(selectedMessage.session.timeOnSite)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 mb-1">الصفحات المزارة</p>
                          <p className="font-medium">{selectedMessage.session.pagesVisited}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 mb-1">المصدر</p>
                          <p className="font-medium text-xs">{selectedMessage.session.referrer || 'مباشر'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 mb-1">أول زيارة</p>
                          <p className={`font-medium ${selectedMessage.session.firstVisit ? 'text-green-600' : 'text-blue-600'}`}>
                            {selectedMessage.session.firstVisit ? 'نعم' : 'لا'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Geolocation Info */}
                  {selectedMessage.geolocation && (
                    <div className={`p-6 rounded-xl border ${getCardClass('card-2', 'light')}`}>
                      <h3 className="text-lg font-semibold mb-4" style={{ color: '#000000' }}>
                        معلومات الموقع
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-gray-500 mb-1">الدولة</p>
                          <p className="font-medium">{selectedMessage.geolocation.country}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 mb-1">المدينة</p>
                          <p className="font-medium">{selectedMessage.geolocation.city}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 mb-1">المنطقة الزمنية</p>
                          <p className="font-medium">{selectedMessage.geolocation.timezone}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-96 text-gray-500">
                  <div className="text-center">
                    <div className="text-4xl mb-4">📨</div>
                    <p>اختر رسالة لعرض التفاصيل</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;