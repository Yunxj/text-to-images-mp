const express = require('express');
const database = require('../config/sqlite');
const { BusinessError } = require('../middleware/errorHandler');

const router = express.Router();

// 获取用户信息
router.get('/profile', async (req, res, next) => {
  try {
    const user = req.user;
    
    res.json({
      code: 200,
      data: {
        id: user._id,
        nickname: user.nickname,
        avatar: user.avatar,
        isVip: user.isVip,
        vipExpireTime: user.vipExpireTime,
        totalWorks: user.totalWorks,
        totalCredits: user.totalCredits,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt
      }
    });
  } catch (error) {
    next(error);
  }
});

// 更新用户信息
router.put('/profile', async (req, res, next) => {
  try {
    const { nickname, avatar } = req.body;
    const updateData = { updatedAt: new Date() };
    
    if (nickname) {
      if (nickname.length > 20) {
        throw new BusinessError('昵称不能超过20个字符');
      }
      updateData.nickname = nickname.trim();
    }
    
    if (avatar) {
      updateData.avatar = avatar;
    }

    const usersCollection = database.getCollection('users');
    await usersCollection.updateOne(
      { _id: req.user._id },
      { $set: updateData }
    );

    // 获取更新后的用户信息
    const updatedUser = await usersCollection.findOne({ _id: req.user._id });

    res.json({
      code: 200,
      message: '用户信息更新成功',
      data: {
        id: updatedUser._id,
        nickname: updatedUser.nickname,
        avatar: updatedUser.avatar,
        isVip: updatedUser.isVip,
        vipExpireTime: updatedUser.vipExpireTime,
        totalWorks: updatedUser.totalWorks,
        totalCredits: updatedUser.totalCredits
      }
    });
  } catch (error) {
    next(error);
  }
});

// 获取用户统计信息
router.get('/stats', async (req, res, next) => {
  try {
    const userId = req.user._id;
    
    // 获取作品统计
    const worksCollection = database.getCollection('works');
    const totalWorks = await worksCollection.countDocuments({ userId });
    
    // 获取任务统计
    const tasksCollection = database.getCollection('generation_tasks');
    const [completedTasks, failedTasks, totalTasks] = await Promise.all([
      tasksCollection.countDocuments({ userId, status: 'completed' }),
      tasksCollection.countDocuments({ userId, status: 'failed' }),
      tasksCollection.countDocuments({ userId })
    ]);

    // 获取本周生成数量
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    const weeklyTasks = await tasksCollection.countDocuments({ 
      userId, 
      createdAt: { $gte: weekStart },
      status: 'completed'
    });

    res.json({
      code: 200,
      data: {
        totalWorks,
        totalTasks,
        completedTasks,
        failedTasks,
        weeklyTasks,
        successRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
      }
    });
  } catch (error) {
    next(error);
  }
});

// 用户积分操作
router.post('/credits', async (req, res, next) => {
  try {
    const { action, amount, description } = req.body;
    
    if (!['earn', 'spend'].includes(action)) {
      throw new BusinessError('无效的积分操作类型');
    }

    if (!amount || amount <= 0) {
      throw new BusinessError('积分数量必须大于0');
    }

    const usersCollection = database.getCollection('users');
    const creditsCollection = database.getCollection('credit_records');
    
    const user = req.user;
    
    // 检查积分是否足够（扣减时）
    if (action === 'spend' && user.totalCredits < amount) {
      throw new BusinessError('积分不足');
    }

    // 更新用户积分
    const creditChange = action === 'earn' ? amount : -amount;
    await usersCollection.updateOne(
      { _id: user._id },
      { 
        $inc: { totalCredits: creditChange },
        $set: { updatedAt: new Date() }
      }
    );

    // 记录积分变动
    await creditsCollection.insertOne({
      userId: user._id,
      action,
      amount,
      description: description || (action === 'earn' ? '获得积分' : '消费积分'),
      beforeBalance: user.totalCredits,
      afterBalance: user.totalCredits + creditChange,
      createdAt: new Date()
    });

    res.json({
      code: 200,
      message: action === 'earn' ? '积分获得成功' : '积分消费成功',
      data: {
        currentCredits: user.totalCredits + creditChange,
        changeAmount: creditChange
      }
    });
  } catch (error) {
    next(error);
  }
});

// 获取积分记录
router.get('/credits/history', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = Math.min(parseInt(req.query.pageSize) || 20, 50);
    const skip = (page - 1) * pageSize;

    const creditsCollection = database.getCollection('credit_records');
    const query = { userId: req.user._id };

    const [records, total] = await Promise.all([
      creditsCollection
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .toArray(),
      creditsCollection.countDocuments(query)
    ]);

    res.json({
      code: 200,
      data: {
        list: records,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// 签到功能
router.post('/checkin', async (req, res, next) => {
  try {
    const userId = req.user._id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const checkinCollection = database.getCollection('user_checkins');
    
    // 检查今天是否已签到
    const todayCheckin = await checkinCollection.findOne({
      userId,
      checkinDate: today
    });

    if (todayCheckin) {
      throw new BusinessError('今天已经签到过了');
    }

    // 计算连续签到天数
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const yesterdayCheckin = await checkinCollection.findOne({
      userId,
      checkinDate: yesterday
    });

    const consecutiveDays = yesterdayCheckin ? (yesterdayCheckin.consecutiveDays + 1) : 1;
    
    // 计算签到奖励积分
    let rewardCredits = 5; // 基础积分
    if (consecutiveDays >= 7) {
      rewardCredits = 20; // 连续7天奖励
    } else if (consecutiveDays >= 3) {
      rewardCredits = 10; // 连续3天奖励
    }

    // 记录签到
    await checkinCollection.insertOne({
      userId,
      checkinDate: today,
      consecutiveDays,
      rewardCredits,
      createdAt: new Date()
    });

    // 增加用户积分
    const usersCollection = database.getCollection('users');
    await usersCollection.updateOne(
      { _id: userId },
      { 
        $inc: { totalCredits: rewardCredits },
        $set: { updatedAt: new Date() }
      }
    );

    // 记录积分变动
    const creditsCollection = database.getCollection('credit_records');
    await creditsCollection.insertOne({
      userId,
      action: 'earn',
      amount: rewardCredits,
      description: `签到奖励（连续${consecutiveDays}天）`,
      createdAt: new Date()
    });

    res.json({
      code: 200,
      message: '签到成功',
      data: {
        consecutiveDays,
        rewardCredits,
        totalCredits: req.user.totalCredits + rewardCredits
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router; 