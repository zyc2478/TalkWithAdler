// 测试大模型API是否正常
const config = require('./utils/config.js');

async function testLLMAPI() {
  console.log('测试大模型API...');
  
  try {
    const prompt = '你好，你是谁？';
    
    const response = await wx.request({
      url: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.llm.apiKey}`
      },
      data: {
        model: config.llm.model,
        input: {
          prompt: prompt
        },
        parameters: {
          max_new_tokens: 100,
          temperature: 0.7
        }
      }
    });
    
    console.log('API响应:', response);
    
    if (response.statusCode === 200 && response.data.output && response.data.output.text) {
      console.log('✅ API调用成功！');
      console.log('响应内容:', response.data.output.text);
    } else {
      console.log('❌ API调用失败:', response.data);
    }
  } catch (error) {
    console.log('❌ API调用错误:', error);
  }
}

// 测试配置
console.log('配置信息:');
console.log('API Key:', config.llm.apiKey);
console.log('模型:', config.llm.model);
console.log('端点:', 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation');

testLLMAPI();