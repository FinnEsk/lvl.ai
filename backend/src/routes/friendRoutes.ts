import { Router, Request, Response, NextFunction } from 'express';
import { body, param } from 'express-validator';
import User from '@/models/User';
import { CustomError } from '@/middleware/errorHandler';
import authenticate from '../middleware/auth';

const router = Router();

// @route   POST /api/friends/request
// @desc    Send friend request
// @access  Private
router.post('/request', authenticate, [
  body('recipientId').isMongoId().withMessage('Please provide a valid user ID')
], async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { recipientId } = req.body;
    const requesterId = (req as any).user['id'];

    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      throw new CustomError('User not found', 404);
    }

    // Check if trying to friend yourself
    if (requesterId === recipientId) {
      throw new CustomError('Cannot send friend request to yourself', 400);
    }

    // Check if already friends
    const requester = await User.findById(requesterId);
    if (requester!.friends.includes(recipientId)) {
      throw new CustomError('Already friends with this user', 400);
    }

    // Check if already sent request
    if (requester!.friendRequests.sent.includes(recipientId)) {
      throw new CustomError('Friend request already sent', 400);
    }

    // Check if already received request
    if (recipient.friendRequests.received.includes(requesterId)) {
      throw new CustomError('This user has already sent you a friend request', 400);
    }

    // Check if blocked
    if (requester!.blockedUsers.includes(recipientId) || recipient.blockedUsers.includes(requesterId)) {
      throw new CustomError('Cannot send friend request to blocked user', 400);
    }

    // Add to sent requests
    await User.findByIdAndUpdate(requesterId, {
      $addToSet: { 'friendRequests.sent': recipientId }
    });

    // Add to recipient's received requests
    await User.findByIdAndUpdate(recipientId, {
      $addToSet: { 'friendRequests.received': requesterId }
    });

    res.status(201).json({
      success: true,
      message: 'Friend request sent successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/friends/accept/:userId
// @desc    Accept friend request
// @access  Private
router.put('/accept/:userId', authenticate, [
  param('userId').isMongoId().withMessage('Please provide a valid user ID')
], async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.params;
    const currentUserId = (req as any).user['id'];

    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      throw new CustomError('User not found', 404);
    }

    // Check if request exists
    if (!currentUser.friendRequests.received.includes(userId as any)) {
      throw new CustomError('No friend request found from this user', 404);
    }

    // Remove from received requests
    await User.findByIdAndUpdate(currentUserId, {
      $pull: { 'friendRequests.received': userId }
    });

    // Remove from sender's sent requests
    await User.findByIdAndUpdate(userId as any, {
      $pull: { 'friendRequests.sent': currentUserId }
    });

    // Add to friends list for both users
    await User.findByIdAndUpdate(currentUserId, {
      $addToSet: { friends: userId }
    });

    await User.findByIdAndUpdate(userId as any, {
      $addToSet: { friends: currentUserId }
    });

    res.status(200).json({
      success: true,
      message: 'Friend request accepted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/friends/decline/:userId
// @desc    Decline friend request
// @access  Private
router.put('/decline/:userId', authenticate, [
  param('userId').isMongoId().withMessage('Please provide a valid user ID')
], async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.params;
    const currentUserId = (req as any).user['id'];

    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      throw new CustomError('User not found', 404);
    }

    // Check if request exists
    if (!currentUser.friendRequests.received.includes(userId as any)) {
      throw new CustomError('No friend request found from this user', 404);
    }

    // Remove from received requests
    await User.findByIdAndUpdate(currentUserId, {
      $pull: { 'friendRequests.received': userId }
    });

    // Remove from sender's sent requests
    await User.findByIdAndUpdate(userId as any, {
      $pull: { 'friendRequests.sent': currentUserId }
    });

    res.status(200).json({
      success: true,
      message: 'Friend request declined successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/friends
// @desc    Get all friends
// @access  Private
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user['id'];

    const user = await User.findById(userId).populate('friends', 'name email avatar');

    res.status(200).json({
      success: true,
      count: user!.friends.length,
      data: user!.friends
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/friends/leaderboard
// @desc    Get friends leaderboard ranked by XP
// @access  Private
router.get('/leaderboard', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user._id;

    // Get current user with friends populated (including stats)
    const currentUser = await User.findById(userId)
      .select('name email avatar level xp totalTasksCompleted friends')
      .populate('friends', 'name email avatar level xp totalTasksCompleted');

    if (!currentUser) {
      throw new CustomError('User not found', 404);
    }

    // Build leaderboard array with current user
    const leaderboardEntries: Array<{
      _id: any;
      name: string;
      email: string;
      avatar: string | undefined;
      level: number;
      xp: number;
      totalTasksCompleted: number;
      isCurrentUser: boolean;
    }> = [
      {
        _id: currentUser._id,
        name: currentUser.name,
        email: currentUser.email,
        avatar: currentUser.avatar,
        level: currentUser.level,
        xp: currentUser.xp,
        totalTasksCompleted: currentUser.totalTasksCompleted,
        isCurrentUser: true,
      },
    ];

    // Add friends to leaderboard if they exist
    const friends = currentUser.friends || [];
    if (Array.isArray(friends) && friends.length > 0) {
      for (const friend of friends as any[]) {
        // Only add if friend was properly populated (has name property)
        if (friend && friend.name) {
          leaderboardEntries.push({
            _id: friend._id,
            name: friend.name,
            email: friend.email,
            avatar: friend.avatar,
            level: friend.level || 1,
            xp: friend.xp || 0,
            totalTasksCompleted: friend.totalTasksCompleted || 0,
            isCurrentUser: false,
          });
        }
      }
    }

    // Sort by XP descending (highest first)
    leaderboardEntries.sort((a, b) => b.xp - a.xp);

    // Add rank numbers
    const rankedLeaderboard = leaderboardEntries.map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));

    res.status(200).json({
      success: true,
      count: rankedLeaderboard.length,
      data: rankedLeaderboard,
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/friends/pending
// @desc    Get pending friend requests
// @access  Private
router.get('/pending', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user['id'];

    const user = await User.findById(userId).populate('friendRequests.received', 'name email avatar');

    res.status(200).json({
      success: true,
      count: user!.friendRequests.received.length,
      data: user!.friendRequests.received
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/friends/sent
// @desc    Get sent friend requests
// @access  Private
router.get('/sent', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user['id'];

    const user = await User.findById(userId).populate('friendRequests.sent', 'name email avatar');

    res.status(200).json({
      success: true,
      count: user!.friendRequests.sent.length,
      data: user!.friendRequests.sent
    });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/friends/:userId
// @desc    Remove friend
// @access  Private
router.delete('/:userId', authenticate, [
  param('userId').isMongoId().withMessage('Please provide a valid user ID')
], async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.params;
    const currentUserId = (req as any).user['id'];

    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      throw new CustomError('User not found', 404);
    }

    // Check if friends
    if (!currentUser.friends.includes(userId as any)) {
      throw new CustomError('Not friends with this user', 404);
    }

    // Remove from both users' friends lists
    await User.findByIdAndUpdate(currentUserId, {
      $pull: { friends: userId }
    });

    await User.findByIdAndUpdate(userId as any, {
      $pull: { friends: currentUserId }
    });

    res.status(200).json({
      success: true,
      message: 'Friend removed successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/friends/block/:userId
// @desc    Block user
// @access  Private
router.put('/block/:userId', authenticate, [
  param('userId').isMongoId().withMessage('Please provide a valid user ID')
], async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.params;
    const currentUserId = (req as any).user['id'];

    // Check if target user exists
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      throw new CustomError('User not found', 404);
    }

    // Check if trying to block yourself
    if (currentUserId === userId) {
      throw new CustomError('Cannot block yourself', 400);
    }

    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      throw new CustomError('User not found', 404);
    }

    // Remove from friends if they are friends
    if (currentUser.friends.includes(userId as any)) {
      await User.findByIdAndUpdate(currentUserId, {
        $pull: { friends: userId }
      });
      await User.findByIdAndUpdate(userId as any, {
        $pull: { friends: currentUserId }
      });
    }

    // Remove from friend requests if any exist
    await User.findByIdAndUpdate(currentUserId, {
      $pull: { 
        'friendRequests.sent': userId,
        'friendRequests.received': userId
      }
    });

    await User.findByIdAndUpdate(userId as any, {
      $pull: { 
        'friendRequests.sent': currentUserId,
        'friendRequests.received': currentUserId
      }
    });

    // Add to blocked users
    await User.findByIdAndUpdate(currentUserId, {
      $addToSet: { blockedUsers: userId }
    });

    res.status(200).json({
      success: true,
      message: 'User blocked successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/friends/unblock/:userId
// @desc    Unblock user
// @access  Private
router.put('/unblock/:userId', authenticate, [
  param('userId').isMongoId().withMessage('Please provide a valid user ID')
], async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.params;
    const currentUserId = (req as any).user['id'];

    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      throw new CustomError('User not found', 404);
    }

    // Check if user is blocked
    if (!currentUser.blockedUsers.includes(userId as any)) {
      throw new CustomError('User is not blocked', 404);
    }

    // Remove from blocked users
    await User.findByIdAndUpdate(currentUserId, {
      $pull: { blockedUsers: userId }
    });

    res.status(200).json({
      success: true,
      message: 'User unblocked successfully'
    });
  } catch (error) {
    next(error);
  }
});

export default router;