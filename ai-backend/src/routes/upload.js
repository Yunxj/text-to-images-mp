const express = require('express');
const router = express.Router();

// 上传图片
router.post('/image', async (req, res) => {
  try {
    // TODO: 实现图片上传逻辑
    res.json({
      code: 200,
      message: '上传功能正在开发中',
      data: null
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '上传失败',
      error: error.message
    });
  }
});

// 删除图片
router.delete('/:id', async (req, res) => {
  try {
    // TODO: 实现删除图片逻辑
    res.json({
      code: 200,
      message: '删除功能正在开发中'
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '删除失败',
      error: error.message
    });
  }
});

module.exports = router; 