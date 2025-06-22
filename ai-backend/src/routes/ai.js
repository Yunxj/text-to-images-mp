const express = require('express');
const { v4: uuidv4 } = require('uuid');
const database = require('../config/sqlite');
const { BusinessError, AIServiceError } = require('../middleware/errorHandler');
const aiService = require('../services/aiService');

const router = express.Router();

// 生成图片接口
router.post('/generate', async (req, res, next) => {
  try {
    const { prompt, character, style = 'cartoon' } = req.body;
    
    if (!prompt || prompt.trim().length === 0) {
      throw new BusinessError('请提供图片描述');
    }

    if (prompt.length > 500) {
      throw new BusinessError('图片描述不能超过500个字符');
    }

    // 构建完整的提示词
    let fullPrompt = prompt.trim();
    if (character) {
      fullPrompt = `${character}, ${fullPrompt}`;
    }

    // 直接调用AI服务生成图片
    const result = await aiService.generateImage({
      prompt: fullPrompt,
      style,
      userId: req.user.id
    });

    res.json({
      code: 200,
      message: '图片生成成功',
      data: {
        workId: result.workId,
        imageUrl: result.imageUrl,
        prompt: fullPrompt,
        enhancedPrompt: result.enhancedPrompt
      }
    });
  } catch (error) {
    next(error);
  }
});

// 查询作品详情
router.get('/work/:workId', async (req, res, next) => {
  try {
    const { workId } = req.params;
    
    const worksCollection = database.collection('works');
    const work = await worksCollection.findOne({ 
      id: workId,
      user_id: req.user.id 
    });

    if (!work) {
      throw new BusinessError('作品不存在', 404);
    }

    res.json({
      code: 200,
      data: {
        workId: work.id,
        title: work.title,
        imageUrl: work.image_url,
        prompt: work.prompt,
        style: work.style,
        createdAt: work.created_at
      }
    });
  } catch (error) {
    next(error);
  }
});

// 获取用户作品列表
router.get('/works', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = Math.min(parseInt(req.query.pageSize) || 20, 50);

    const worksCollection = database.collection('works');
    
    // 获取用户作品
    const worksResult = await worksCollection.find({ user_id: req.user.id });
    const works = await worksResult.toArray();

    const total = works.length;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginatedWorks = works.slice(start, end);

    const list = paginatedWorks.map(work => ({
      workId: work.id,
      title: work.title,
      imageUrl: work.image_url,
      prompt: work.prompt,
      style: work.style,
      status: work.status,
      createdAt: work.created_at
    }));

    res.json({
      code: 200,
      data: {
        list,
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

// 获取AI服务状态
router.get('/status', async (req, res, next) => {
  try {
    const serviceStatus = aiService.getServiceStatus();
    
    res.json({
      code: 200,
      data: {
        services: serviceStatus,
        available: serviceStatus.filter(s => s.enabled).length > 0
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router; 