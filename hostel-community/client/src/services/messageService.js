import api from './api';

export const messageService = {
  /**
   * Add a reaction to a message
   * POST /api/messages/:messageId/reactions
   */
  addReaction: async (messageId, type) => {
    const response = await api.post(`/messages/${messageId}/reactions`, { type });
    return response.data;
  },

  /**
   * Remove a reaction from a message
   * DELETE /api/messages/:messageId/reactions/:type
   */
  removeReaction: async (messageId, type) => {
    const response = await api.delete(`/messages/${messageId}/reactions/${type}`);
    return response.data;
  },

  /**
   * Delete own message (soft delete)
   * DELETE /api/messages/:messageId
   */
  deleteMessage: async (messageId) => {
    const response = await api.delete(`/messages/${messageId}`);
    return response.data;
  },

  /**
   * Report an inappropriate message
   * POST /api/messages/:messageId/report
   */
  reportMessage: async (messageId, { reason, notes = '' }) => {
    const response = await api.post(`/messages/${messageId}/report`, { reason, notes });
    return response.data;
  },

  /**
   * Upload an attachment and create message in an authorized room
   * POST /api/messages/:roomId/attachments
   */
  uploadAttachment: async (roomId, formData, onUploadProgress) => {
    const response = await api.post(`/messages/${roomId}/attachments`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
    return response.data;
  },
};

export default messageService;
