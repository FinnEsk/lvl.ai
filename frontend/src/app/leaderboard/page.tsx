'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Card, CardContent } from '@/components/ui/Card';
import ClientGuard from '@/components/ClientGuard';
import { FriendsAPI, LeaderboardEntry } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import {
  TrophyIcon,
  UserGroupIcon,
  SparklesIcon,
  FireIcon,
} from '@heroicons/react/24/outline';
import {
  TrophyIcon as TrophySolid,
} from '@heroicons/react/24/solid';

// Medal component for top 3
function Medal({ rank }: { rank: number }) {
  const colors = {
    1: 'from-yellow-300 via-yellow-400 to-amber-500',
    2: 'from-gray-300 via-slate-400 to-gray-500',
    3: 'from-amber-600 via-orange-500 to-amber-700',
  };

  const shadowColors = {
    1: 'shadow-yellow-400/50',
    2: 'shadow-slate-400/50',
    3: 'shadow-orange-500/50',
  };

  if (rank > 3) return null;

  return (
    <div
      className={`w-10 h-10 rounded-full bg-gradient-to-br ${colors[rank as 1 | 2 | 3]} flex items-center justify-center shadow-lg ${shadowColors[rank as 1 | 2 | 3]} ring-2 ring-white/20`}
    >
      <span className="text-white font-black text-lg drop-shadow-sm">{rank}</span>
    </div>
  );
}

// Avatar component
function Avatar({ name, avatar, size = 'md' }: { name: string; avatar?: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-12 h-12 text-lg',
    lg: 'w-16 h-16 text-2xl',
  };

  if (avatar) {
    return (
      <img
        src={avatar}
        alt={name}
        className={`${sizeClasses[size]} rounded-full object-cover ring-2 ring-white/20`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center ring-2 ring-white/20`}
    >
      <span className="text-white font-bold">{name.charAt(0).toUpperCase()}</span>
    </div>
  );
}

// Podium card for top 3
function PodiumCard({ entry, position }: { entry: LeaderboardEntry; position: 1 | 2 | 3 }) {
  const heights = { 1: 'h-36', 2: 'h-28', 3: 'h-24' };
  const order = { 1: 'order-2', 2: 'order-1', 3: 'order-3' };
  const gradients = {
    1: 'from-yellow-500/20 via-amber-500/10 to-transparent',
    2: 'from-slate-400/20 via-gray-400/10 to-transparent',
    3: 'from-orange-500/20 via-amber-600/10 to-transparent',
  };

  return (
    <div className={`flex flex-col items-center ${order[position]} flex-1 max-w-[140px]`}>
      <div className="relative mb-2">
        <Avatar name={entry.name} avatar={entry.avatar} size={position === 1 ? 'lg' : 'md'} />
        <div className="absolute -bottom-1 -right-1">
          <Medal rank={position} />
        </div>
      </div>
      <p className={`font-semibold text-foreground text-center truncate w-full ${position === 1 ? 'text-base' : 'text-sm'}`}>
        {entry.name}
      </p>
      <p className="text-xs text-muted-foreground">Level {entry.level}</p>
      <p className={`font-bold ${position === 1 ? 'text-yellow-500' : position === 2 ? 'text-slate-400' : 'text-orange-500'}`}>
        {entry.xp.toLocaleString()} XP
      </p>
      <div
        className={`w-full ${heights[position]} mt-2 rounded-t-xl bg-gradient-to-t ${gradients[position]} border-t border-x border-white/10`}
      />
    </div>
  );
}

// Leaderboard row for ranks 4+
function LeaderboardRow({ entry, animationDelay }: { entry: LeaderboardEntry; animationDelay: number }) {
  return (
    <div
      className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-200 hover:bg-accent/50 ${
        entry.isCurrentUser
          ? 'bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 ring-1 ring-indigo-500/30'
          : 'bg-card/50'
      }`}
      style={{
        animation: `slideInFromRight 0.4s ease-out ${animationDelay}ms both`,
      }}
    >
      {/* Rank */}
      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
        <span className="font-bold text-muted-foreground">{entry.rank}</span>
      </div>

      {/* Avatar & Info */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Avatar name={entry.name} avatar={entry.avatar} size="sm" />
        <div className="min-w-0">
          <p className="font-medium text-foreground truncate">
            {entry.name}
            {entry.isCurrentUser && (
              <span className="ml-2 text-xs bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full">
                You
              </span>
            )}
          </p>
          <p className="text-xs text-muted-foreground">Level {entry.level}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-6 flex-shrink-0">
        <div className="text-right hidden sm:block">
          <p className="text-xs text-muted-foreground">Tasks</p>
          <p className="font-semibold text-foreground">{entry.totalTasksCompleted}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">XP</p>
          <p className="font-bold text-amber-500">{entry.xp.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await FriendsAPI.getLeaderboard();
        setLeaderboard(data);
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
        setError('Failed to load leaderboard. Please try again.');
        // Fallback data for demo
        setLeaderboard([
          {
            _id: user?._id || '1',
            name: user?.name || 'You',
            email: user?.email || '',
            level: user?.level || 1,
            xp: user?.xp || 0,
            totalTasksCompleted: user?.totalTasksCompleted || 0,
            isCurrentUser: true,
            rank: 1,
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [user]);

  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);
  const currentUserEntry = leaderboard.find((e) => e.isCurrentUser);

  return (
    <ClientGuard>
      <Sidebar>
        <style jsx global>{`
          @keyframes slideInFromRight {
            from {
              opacity: 0;
              transform: translateX(20px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          @keyframes pulse-glow {
            0%, 100% {
              box-shadow: 0 0 20px rgba(251, 191, 36, 0.3);
            }
            50% {
              box-shadow: 0 0 40px rgba(251, 191, 36, 0.5);
            }
          }
        `}</style>

        <div className="space-y-6">
          {/* Header */}
          <div
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-8"
            style={{ animation: 'fadeInUp 0.5s ease-out' }}
          >
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl" />
              <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
            </div>

            <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center"
                  style={{ animation: 'pulse-glow 2s ease-in-out infinite' }}
                >
                  <TrophySolid className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Leaderboard</h1>
                  <p className="text-slate-400">Compete with your friends</p>
                </div>
              </div>

              {currentUserEntry && (
                <div className="flex items-center gap-3 bg-white/5 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10">
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Your Rank</p>
                    <p className="text-2xl font-bold text-white">#{currentUserEntry.rank}</p>
                  </div>
                  <div className="w-px h-10 bg-white/10" />
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Your XP</p>
                    <p className="text-2xl font-bold text-amber-400">{currentUserEntry.xp.toLocaleString()}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-700">{error}</p>
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <Card>
              <CardContent className="p-8">
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-muted-foreground">Loading leaderboard...</p>
                </div>
              </CardContent>
            </Card>
          ) : leaderboard.length === 0 ? (
            <Card>
              <CardContent className="p-12">
                <div className="flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                    <UserGroupIcon className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">No friends yet</h3>
                    <p className="text-muted-foreground max-w-sm mt-1">
                      Add friends to see how you stack up against them on the leaderboard!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Top 3 Podium */}
              {top3.length > 0 && (
                <Card
                  className="overflow-hidden"
                  style={{ animation: 'fadeInUp 0.5s ease-out 0.1s both' }}
                >
                  <CardContent className="p-6 pt-8">
                    <div className="flex items-center justify-center gap-2 mb-6">
                      <SparklesIcon className="w-5 h-5 text-amber-500" />
                      <h2 className="text-lg font-semibold text-foreground">Top Performers</h2>
                      <SparklesIcon className="w-5 h-5 text-amber-500" />
                    </div>
                    <div className="flex items-end justify-center gap-4 px-4">
                      {top3[1] && <PodiumCard entry={top3[1]} position={2} />}
                      {top3[0] && <PodiumCard entry={top3[0]} position={1} />}
                      {top3[2] && <PodiumCard entry={top3[2]} position={3} />}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Remaining Rankings */}
              {rest.length > 0 && (
                <Card style={{ animation: 'fadeInUp 0.5s ease-out 0.2s both' }}>
                  <CardContent className="p-4 space-y-2">
                    {rest.map((entry, index) => (
                      <LeaderboardRow
                        key={entry._id}
                        entry={entry}
                        animationDelay={300 + index * 50}
                      />
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Stats Summary */}
              <div
                className="grid grid-cols-1 sm:grid-cols-3 gap-4"
                style={{ animation: 'fadeInUp 0.5s ease-out 0.3s both' }}
              >
                <Card className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/20">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                      <UserGroupIcon className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{leaderboard.length}</p>
                      <p className="text-sm text-muted-foreground">Total Competitors</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                      <FireIcon className="w-6 h-6 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">
                        {leaderboard.reduce((sum, e) => sum + e.xp, 0).toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground">Combined XP</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                      <TrophyIcon className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">
                        {leaderboard.reduce((sum, e) => sum + e.totalTasksCompleted, 0).toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground">Tasks Completed</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      </Sidebar>
    </ClientGuard>
  );
}

