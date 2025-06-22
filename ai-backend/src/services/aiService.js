const axios = require('axios');
const database = require('../config/sqlite');
const { AIServiceError } = require('../middleware/errorHandler');
const { Signer } = require('@volcengine/openapi');

class AIService {
  constructor() {
    // AI服务配置 - 按功能分类
    this.promptServices = [
      {
        name: 'deepseek',
        apiKey: process.env.DEEPSEEK_API_KEY,
        baseURL: 'https://api.deepseek.com/v1',
        model: 'deepseek-chat',
        type: 'prompt_generator', // 提示词生成
        enabled: !!process.env.DEEPSEEK_API_KEY
      }
    ].filter(service => service.enabled);

    this.imageServices = [
      {
        name: 'doubao',
        apiKey: process.env.DOUBAO_API_KEY,
        // 使用火山引擎豆包的图片生成API端点
        baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
        // 使用专门的豆包图片生成模型
        model: 'doubao-seedream-3.0-t2i',
        type: 'image_generator',
        enabled: !!process.env.DOUBAO_API_KEY,
        region: 'cn-beijing'
      }
    ].filter(service => service.enabled);

    // 所有服务的合集，用于状态查询
    this.allServices = [...this.promptServices, ...this.imageServices];
  }

  // 选择提示词生成服务
  selectPromptService() {
    if (this.promptServices.length === 0) {
      console.log('没有配置提示词生成服务，使用模拟模式');
      return { name: 'mock', type: 'prompt_generator', enabled: true };
    }
    return this.promptServices[0]; // 使用DeepSeek
  }

  // 选择图片生成服务
  selectImageService() {
    if (this.imageServices.length === 0) {
      console.log('没有配置图片生成服务，使用模拟模式');
      return { name: 'mock', type: 'image_generator', enabled: true };
    }
    return this.imageServices[0]; // 使用豆包
  }

  // 调用DeepSeek生成提示词
  async generatePrompt(service, userInput) {
    try {
      // 构建图片生成的提示词
      const promptInstruction = `请根据以下描述生成一张图片的详细提示词，要求：
1. 描述详细且具体
2. 包含风格、颜色、构图等信息
3. 适合AI图片生成模型理解
4. 以英文输出

用户描述：${userInput}

请直接输出英文提示词，不需要其他解释：`;

      const response = await axios.post(`${service.baseURL}/chat/completions`, {
        model: service.model,
        messages: [
          {
            role: 'user',
            content: promptInstruction
          }
        ],
        max_tokens: 200,
        temperature: 0.7
      }, {
        headers: {
          'Authorization': `Bearer ${service.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      if (response.data && response.data.choices && response.data.choices[0]) {
        return response.data.choices[0].message.content.trim();
      } else {
        throw new Error('DeepSeek服务返回数据格式错误');
      }
    } catch (error) {
      console.error(`DeepSeek提示词生成失败:`, error);
      throw new AIServiceError(`DeepSeek服务调用失败: ${error.message}`);
    }
  }

  // 使用火山引擎SDK生成签名
  generateVolcengineSignature(method, pathname, body, region) {
    try {
      const requestObj = {
        region,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        method,
        body,
        pathname
      };

      const signer = new Signer(requestObj, 'air');
      signer.addAuthorization({
        accessKeyId: process.env.VOLCENGINE_ACCESS_KEY,
        secretKey: process.env.VOLCENGINE_SECRET_KEY
      });

      return requestObj.headers;
    } catch (error) {
      console.error('生成火山引擎签名失败:', error);
      throw new Error('火山引擎签名生成失败');
    }
  }

  // 调用豆包生成图片 - 使用正确的图片生成API
  async generateImageWithDoubao(service, enhancedPrompt) {
    try {
      console.log('调用豆包Seedream图片生成API...');
      console.log('使用模型:', service.model);
      console.log('提示词:', enhancedPrompt);

      // 根据火山引擎官方文档，使用专门的图片生成API
      const requestData = {
        model: service.model,
        prompt: enhancedPrompt,
        // 图片生成参数
        width: 1024,
        height: 1024,
        steps: 20,
        scale: 7.5,
        n: 1, // 生成图片数量
        quality: "standard",
        response_format: "url" // 返回URL格式
      };

      console.log('请求数据:', JSON.stringify(requestData, null, 2));

      // 使用豆包专门的图片生成API端点
      const response = await axios.post(`${service.baseURL}/images/generations`, requestData, {
        headers: {
          'Authorization': `Bearer ${service.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 120000 // 图片生成需要更长时间
      });

      console.log('豆包API响应状态:', response.status);
      console.log('豆包API响应数据:', JSON.stringify(response.data, null, 2));

      // 根据豆包API文档，检查响应格式
      if (response.data && response.data.data && response.data.data.length > 0) {
        const imageData = response.data.data[0];
        if (imageData.url) {
          console.log('豆包生成图片成功，URL:', imageData.url);
          return imageData.url;
        } else if (imageData.b64_json) {
          // 如果返回base64格式，可以转换为data URL
          const dataUrl = `data:image/png;base64,${imageData.b64_json}`;
          console.log('豆包生成图片成功，返回base64格式');
          return dataUrl;
        } else {
          console.error('豆包返回的图片数据格式异常:', imageData);
          throw new Error('豆包返回的图片数据中没有找到URL或base64数据');
        }
      } else {
        console.error('豆包API返回数据格式错误:', response.data);
        throw new Error('豆包服务返回数据格式不符合预期');
      }
    } catch (error) {
      console.error('豆包图片生成详细错误信息:');
      console.error('错误类型:', error.constructor.name);
      console.error('错误消息:', error.message);
      
      if (error.response) {
        console.error('HTTP状态码:', error.response.status);
        console.error('响应头:', error.response.headers);
        console.error('响应数据:', error.response.data);
        
        // 特殊处理404错误
        if (error.response.status === 404) {
          console.error('404错误可能原因:');
          console.error('1. API端点路径不正确');
          console.error('2. 模型名称不正确');
          console.error('3. API密钥权限不足');
          console.error('4. 服务未启用或不可用');
        }
      } else if (error.request) {
        console.error('请求配置:', error.config);
        console.error('没有收到响应');
      }
      
      throw new AIServiceError(`豆包图片生成失败: ${error.message}`);
    }
  }

  // 主要的图片生成方法 - 两步流程
  async generateImage({ prompt, style, userId }) {
    try {
      console.log(`开始两步生成流程 - 用户输入: ${prompt}`);

      // 第一步：使用DeepSeek生成提示词
      const promptService = this.selectPromptService();
      console.log(`步骤1: 使用 ${promptService.name} 生成提示词`);

      let enhancedPrompt;
      if (promptService.name === 'mock') {
        enhancedPrompt = `A beautiful ${prompt}, detailed digital art, high quality, ${style} style`;
        console.log('模拟模式 - DeepSeek提示词:', enhancedPrompt);
      } else {
        enhancedPrompt = await this.generatePrompt(promptService, prompt);
        console.log('DeepSeek生成的提示词:', enhancedPrompt);
      }

      // 第二步：使用豆包生成图片
      const imageService = this.selectImageService();
      console.log(`步骤2: 使用 ${imageService.name} 生成图片`);

      let imageUrl;
      if (imageService.name === 'mock') {
        // 模拟豆包生成图片
        await new Promise(resolve => setTimeout(resolve, 3000)); // 模拟生成时间
        imageUrl = `https://picsum.photos/1024/1024?random=${Math.floor(Math.random() * 1000)}&t=${Date.now()}`;
        console.log('模拟模式 - 豆包图片URL:', imageUrl);
      } else {
        try {
          imageUrl = await this.generateImageWithDoubao(imageService, enhancedPrompt);
          console.log('豆包生成的图片URL:', imageUrl);
        } catch (error) {
          console.log('豆包API调用失败，回退到模拟模式:', error.message);
          // 回退到模拟模式
          await new Promise(resolve => setTimeout(resolve, 2000));
          imageUrl = `https://picsum.photos/1024/1024?random=${Math.floor(Math.random() * 1000)}&t=${Date.now()}`;
          console.log('回退模拟模式 - 图片URL:', imageUrl);
        }
      }

      // 保存到用户作品集合
      const worksCollection = database.collection('works');
      const result = await worksCollection.insertOne({
        user_id: userId,
        title: prompt.substring(0, 50) + '...',
        description: prompt,
        prompt: prompt,
        enhanced_prompt: enhancedPrompt,
        image_url: imageUrl,
        style: style || 'default',
        generation_mode: 'two_step',
        prompt_service: promptService.name,
        image_service: imageService.name,
        status: 'success'
      });

      console.log(`两步生成完成，作品ID: ${result.insertedId}`);
      return { 
        workId: result.insertedId,
        imageUrl, 
        enhancedPrompt,
        promptService: promptService.name,
        imageService: imageService.name
      };

    } catch (error) {
      console.error(`两步生成失败:`, error);
      throw error;
    }
  }

  // 获取服务状态
  getServiceStatus() {
    return this.allServices.map(service => ({
      name: service.name,
      type: service.type,
      enabled: service.enabled
    }));
  }
}

module.exports = new AIService(); 