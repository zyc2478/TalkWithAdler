// Node.js版本的大模型API测试
const axios = require('axios');

const config = {
  apiKey: 'sk-972f5d16c815424a8b8aae816448ef43',
  model: 'qwen-plus',
  endpoint: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation'
};

async function testLLMAPI() {
  console.log('测试大模型API...');
  
  try {
    const prompt = '你好，你是谁？';
    
    const response = await axios.post(config.endpoint, {
      model: config.model,
      input: {
        prompt: prompt
      },
      parameters: {
        max_new_tokens: 100,
        temperature: 0.7
      }
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      }
    });
    
    console.log('API响应状态:', response.status);
    console.log('响应数据:', response.data);
    
    if (response.status === 200 && response.data.output && response.data.output.text) {
      console.log('✅ API调用成功！');
      console.log('响应内容:', response.data.output.text);
    } else {
      console.log('❌ API调用失败:', response.data);
    }
  } catch (error) {
    console.log('❌ API调用错误:', error.message);
    if (error.response) {
      console.log('错误响应:', error.response.data);
    }
  }
}

// 测试配置
console.log('配置信息:');
console.log('API Key:', config.apiKey);
console.log('模型:', config.model);
console.log('端点:', config.endpoint);

testLLMAPI();