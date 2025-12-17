import { AxiosResponse } from 'axios';
import apiClient from './client';
import { ApiResponse, User } from '@/lib/types';

// Leaderboard entry type
export interface LeaderboardEntry {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  level: number;
  xp: number;
  totalTasksCompleted: number;
  isCurrentUser: boolean;
  rank: number;
}

export interface LeaderboardResponse {
  success: boolean;
  count: number;
  data: LeaderboardEntry[];
}

// Friends API endpoints based on backend routes
export class FriendsAPI {
  // @route   POST /api/friends/request
  // @desc    Send friend request
  static async sendFriendRequest(recipientId: string): Promise<{ message: string }> {
    const response: AxiosResponse<{ success: boolean; message: string }> = await apiClient.client.post('/friends/request', {
      recipientId
    });
    if (response.data.success) {
      return { message: response.data.message };
    }
    throw new Error('Failed to send friend request');
  }

  // @route   PUT /api/friends/accept/:userId
  // @desc    Accept friend request
  static async acceptFriendRequest(userId: string): Promise<{ message: string }> {
    const response: AxiosResponse<{ success: boolean; message: string }> = await apiClient.client.put(`/friends/accept/${userId}`);
    if (response.data.success) {
      return { message: response.data.message };
    }
    throw new Error('Failed to accept friend request');
  }

  // @route   PUT /api/friends/decline/:userId
  // @desc    Decline friend request
  static async declineFriendRequest(userId: string): Promise<{ message: string }> {
    const response: AxiosResponse<{ success: boolean; message: string }> = await apiClient.client.put(`/friends/decline/${userId}`);
    if (response.data.success) {
      return { message: response.data.message };
    }
    throw new Error('Failed to decline friend request');
  }

  // @route   GET /api/friends
  // @desc    Get all friends
  static async getFriends(): Promise<User[]> {
    const response: AxiosResponse<{ success: boolean; count: number; data: User[] }> = await apiClient.client.get('/friends');
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error('Failed to fetch friends');
  }

  // @route   GET /api/friends/pending
  // @desc    Get pending friend requests
  static async getPendingRequests(): Promise<User[]> {
    const response: AxiosResponse<{ success: boolean; count: number; data: User[] }> = await apiClient.client.get('/friends/pending');
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error('Failed to fetch pending requests');
  }

  // @route   GET /api/friends/sent
  // @desc    Get sent friend requests
  static async getSentRequests(): Promise<User[]> {
    const response: AxiosResponse<{ success: boolean; count: number; data: User[] }> = await apiClient.client.get('/friends/sent');
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error('Failed to fetch sent requests');
  }

  // @route   DELETE /api/friends/:userId
  // @desc    Remove friend
  static async removeFriend(userId: string): Promise<{ message: string }> {
    const response: AxiosResponse<{ success: boolean; message: string }> = await apiClient.client.delete(`/friends/${userId}`);
    if (response.data.success) {
      return { message: response.data.message };
    }
    throw new Error('Failed to remove friend');
  }

  // @route   PUT /api/friends/block/:userId
  // @desc    Block user
  static async blockUser(userId: string): Promise<{ message: string }> {
    const response: AxiosResponse<{ success: boolean; message: string }> = await apiClient.client.put(`/friends/block/${userId}`);
    if (response.data.success) {
      return { message: response.data.message };
    }
    throw new Error('Failed to block user');
  }

  // @route   PUT /api/friends/unblock/:userId
  // @desc    Unblock user
  static async unblockUser(userId: string): Promise<{ message: string }> {
    const response: AxiosResponse<{ success: boolean; message: string }> = await apiClient.client.put(`/friends/unblock/${userId}`);
    if (response.data.success) {
      return { message: response.data.message };
    }
    throw new Error('Failed to unblock user');
  }

  // @route   GET /api/friends/leaderboard
  // @desc    Get friends leaderboard ranked by XP
  static async getLeaderboard(): Promise<LeaderboardEntry[]> {
    const response: AxiosResponse<LeaderboardResponse> = await apiClient.client.get('/friends/leaderboard');
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error('Failed to fetch leaderboard');
  }
}

export default FriendsAPI;
