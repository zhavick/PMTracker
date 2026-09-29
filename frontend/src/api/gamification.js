import axiosClient from './axiosClient';

export const gamificationApi = {
  // Profile & Roadmap
  getProfile: () => axiosClient.get('/api/gamification/profile'),
  getStatus: () => axiosClient.get('/api/gamification/status'),
  
  // Daily Check-In
  dailyCheckIn: (notes) => axiosClient.post('/api/gamification/check-in', { notes }),
  
  // Badges
  getBadges: () => axiosClient.get('/api/gamification/badges'),
  getMyBadges: () => axiosClient.get('/api/gamification/my-badges'),
  checkAndAwardBadges: () => axiosClient.post('/api/gamification/check-badges'),
  awardBadge: (userId, badgeId) => axiosClient.post('/api/gamification/award-badge', { userId, badgeId }),
  revokeBadge: (userBadgeId) => axiosClient.delete(`/api/gamification/revoke-badge/${userBadgeId}`),
  
  // Leaderboard
  getLeaderboard: (params) => axiosClient.get('/api/gamification/leaderboard', { params }),
  
  // Rewards Catalog
  getRewards: () => axiosClient.get('/api/gamification/rewards'),
  claimItem: (rewardItemId, accountOrContactInfo, userNotes) => 
    axiosClient.post('/api/gamification/claim-item', { rewardItemId, accountOrContactInfo, userNotes }),
  claimReward: (payload) => axiosClient.post('/api/gamification/claim-reward', payload),
  
  // Claims
  getClaims: (params) => axiosClient.get('/api/gamification/claims', { params }),
  processClaim: (id, payload) => axiosClient.put(`/api/gamification/claims/${id}/process`, payload),
  
  // Admin Rewards Management
  createReward: (data) => axiosClient.post('/api/gamification/rewards', data),
  updateReward: (id, data) => axiosClient.put(`/api/gamification/rewards/${id}`, data),
  deleteReward: (id) => axiosClient.delete(`/api/gamification/rewards/${id}`)
};

export default gamificationApi;
