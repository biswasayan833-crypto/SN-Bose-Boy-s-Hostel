import api from './api';

export const adminService = {
  /**
   * Get paginated reports with optional status filtering
   * GET /api/admin/reports
   */
  getReports: async (params = {}) => {
    const response = await api.get('/admin/reports', { params });
    return response.data;
  },

  /**
   * Update report status and optionally remove message
   * PATCH /api/admin/reports/:reportId
   */
  updateReport: async (reportId, data) => {
    const response = await api.patch(`/admin/reports/${reportId}`, data);
    return response.data;
  },
};

export default adminService;
