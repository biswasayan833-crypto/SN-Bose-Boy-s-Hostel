import api from './api';

/**
 * Search community content (messages, rooms, announcements, polls)
 * @param {Object} params
 * @param {string} params.q - search keyword(s)
 * @param {string} params.type - 'all' | 'messages' | 'rooms' | 'announcements' | 'polls'
 * @param {string} [params.roomId] - optional room filter
 * @param {number} [params.page=1]
 * @param {number} [params.limit=20]
 */
export const searchContent = async ({ q = '', type = 'all', roomId = null, page = 1, limit = 20 } = {}) => {
  const params = {
    q,
    type,
    page,
    limit,
  };

  if (roomId) {
    params.roomId = roomId;
  }

  const response = await api.get('/search', { params });
  return response.data;
};

export default {
  searchContent,
};
