const config = require('../../utils/config.js');
const adlerPhilosophy = require('../../utils/adler.js');

Page({
  data: {
    messages: [],
    inputValue: '',
    scrollToView: '',
    isTyping: false,
    showHistory: false,
    showFavorites: false,
    historyMessages: [],
    favoriteMessages: []
  },

  onLoad() {
    this.initConversation();
    this.loadHistory();
    this.loadFavorites();
  },

  initConversation() {
    const greeting = '你好，我是阿尔弗雷德·阿德勒。很高兴能与你对话。正如我所说："决定我们自身的不是过去的经历，而是我们赋予经历的意义。"';
    this.addMessage('adler', greeting);
  },

  loadHistory() {
    const history = wx.getStorageSync('chatHistory') || [];
    this.setData({
      historyMessages: history
    });
  },

  loadFavorites() {
    const favorites = wx.getStorageSync('chatFavorites') || [];
    this.setData({
      favoriteMessages: favorites
    });
  },

  saveHistory() {
    wx.setStorageSync('chatHistory', this.data.messages);
  },

  addMessage(role, content) {
    const message = {
      id: Date.now(),
      role: role,
      content: content,
      time: this.formatTime(new Date())
    };
    
    this.setData({
      messages: [...this.data.messages, message],
      scrollToView: `msg-${message.id}`
    });
    
    // 保存历史记录
    this.saveHistory();
  },

  formatTime(date) {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  },

  handleInput(e) {
    this.setData({
      inputValue: e.detail.value
    });
  },

  async handleSend() {
    const content = this.data.inputValue.trim();
    if (!content) return;

    this.addMessage('user', content);
    this.setData({
      inputValue: '',
      isTyping: true
    });

    try {
      // 创建一个新的消息对象用于流式输出
      const messageId = Date.now();
      const streamingMessage = {
        id: messageId,
        role: 'adler',
        content: '',
        time: this.formatTime(new Date()),
        isStreaming: true
      };

      this.setData({
        messages: [...this.data.messages, streamingMessage],
        scrollToView: `msg-${messageId}`
      });

      // 调用流式API
      await this.callLLMStream(content, messageId);
    } catch (error) {
      console.error('LLM API error:', error);
      this.addMessage('adler', '抱歉，我暂时无法回答你的问题。请稍后再试。');
    } finally {
      this.setData({
        isTyping: false
      });
    }
  },

  async callLLMStream(userInput, messageId) {
    const prompt = config.adlerPrompt + userInput;

    try {
      console.log('开始调用API...');
      console.log('Prompt长度:', prompt.length);
      console.log('请求URL:', 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation');
      
      // 调用DashScope API
      const response = await new Promise((resolve, reject) => {
        wx.request({
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
              max_new_tokens: 512,
              temperature: 0.7
            }
          },
          timeout: 30000,
          success: function(res) {
            console.log('请求成功:', res);
            resolve(res);
          },
          fail: function(err) {
            console.log('请求失败:', err);
            reject(err);
          },
          complete: function(res) {
            console.log('请求完成:', res);
          }
        });
      });

      console.log('API响应状态:', response.statusCode);
      console.log('API响应数据:', response.data);

      if (response.statusCode === 200 && response.data.output && response.data.output.text) {
        console.log('API调用成功，响应内容:', response.data.output.text);
        // 更新消息内容
        this.updateStreamingMessage(messageId, response.data.output.text);
      } else {
        console.error('API调用失败:', response.data);
        throw new Error('API request failed: ' + (response.data?.error?.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('API请求错误:', error);
      // 使用本地规则匹配作为备用方案
      console.log('使用本地规则匹配作为备用方案...');
      const localResponse = adlerPhilosophy.getResponse(userInput);
      this.updateStreamingMessage(messageId, localResponse);
    }
  },

  updateStreamingMessage(messageId, content) {
    const updatedMessages = this.data.messages.map(msg => {
      if (msg.id === messageId) {
        return {
          ...msg,
          content: content,
          isStreaming: false
        };
      }
      return msg;
    });

    this.setData({
      messages: updatedMessages,
      scrollToView: `msg-${messageId}`
    });
    
    // 保存历史记录
    this.saveHistory();
  },

  handleQuote() {
    const quotes = [
      "幸运的人一生都被童年治愈，不幸的人一生都在治愈童年。",
      "重要的不是发生了什么，而是我们如何看待它。",
      "生活的不确定性正是我们希望的来源。",
      "人的一切烦恼都来自于人际关系。",
      "决定我们自身的不是过去的经历，而是我们赋予经历的意义。",
      "没有一个人是生活在客观世界里的，我们都生活在由我们自己赋予意义的主观世界里。",
      "所谓的优越感，不过是自卑感的代偿。"
    ];
    const quote = quotes[Math.floor(Math.random() * quotes.length)];
    this.addMessage('adler', `💭 ${quote}`);
  },

  handleClear() {
    wx.showModal({
      title: '清空对话',
      content: '确定要清空所有对话记录吗？',
      success: (res) => {
        if (res.confirm) {
          this.setData({
            messages: []
          });
          this.saveHistory();
          this.initConversation();
        }
      }
    });
  },

  toggleHistory() {
    this.setData({
      showHistory: !this.data.showHistory,
      showFavorites: false
    });
  },

  toggleFavorites() {
    this.setData({
      showFavorites: !this.data.showFavorites,
      showHistory: false
    });
  },

  addToFavorites(messageId) {
    const message = this.data.messages.find(msg => msg.id === messageId);
    if (message) {
      const favorites = this.data.favoriteMessages;
      if (!favorites.some(fav => fav.id === messageId)) {
        favorites.push(message);
        this.setData({
          favoriteMessages: favorites
        });
        wx.setStorageSync('chatFavorites', favorites);
        wx.showToast({
          title: '收藏成功',
          icon: 'success'
        });
      }
    }
  },

  removeFromFavorites(messageId) {
    const favorites = this.data.favoriteMessages.filter(fav => fav.id !== messageId);
    this.setData({
      favoriteMessages: favorites
    });
    wx.setStorageSync('chatFavorites', favorites);
    wx.showToast({
      title: '取消收藏',
      icon: 'success'
    });
  },

  onShareAppMessage() {
    return {
      title: '与阿德勒对话',
      path: '/pages/chat/chat'
    };
  }
});