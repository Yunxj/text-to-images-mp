const express = require('express');
const router = express.Router();
const database = require('../config/sqlite');

// 获取用户作品列表
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const userId = req.user.id;

    const works = await database.collection('works')
      .find({ user_id: userId })
      .toArray();

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        works: works || [],
        total: works?.length || 0,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '获取作品列表失败',
      error: error.message
    });
  }
});

// 获取作品详情
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const work = await database.collection('works')
      .findOne({ id: id, user_id: userId });

    if (!work) {
      return res.status(404).json({
        code: 404,
        message: '作品不存在'
      });
    }

    res.json({
      code: 200,
      message: '获取成功',
      data: work
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '获取作品详情失败',
      error: error.message
    });
  }
});

// 删除作品
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await database.collection('works')
      .deleteOne({ id: id, user_id: userId });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        code: 404,
        message: '作品不存在或无权限删除'
      });
    }

    res.json({
      code: 200,
      message: '删除成功'
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '删除作品失败',
      error: error.message
    });
  }
});

module.exports = router; 