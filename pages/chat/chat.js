const config = require('../../utils/config.js');

Page({
  data: {
    messages: [],
    inputValue: '',
    scrollToView: '',
    isTyping: false
  },

  onLoad() {
    this.initConversation();
  },

  initConversation() {
    const greeting = '你好，我是阿尔弗雷德·阿德勒。很高兴能与你对话。正如我所说："决定我们自身的不是过去的经历，而是我们赋予经历的意义。"';
    this.addMessage('adler', greeting);
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
      const response = await this.callLLM(content);
      this.addMessage('adler', response);
    } catch (error) {
      console.error('LLM API error:', error);
      this.addMessage('adler', '抱歉，我暂时无法回答你的问题。请稍后再试。');
    } finally {
      this.setData({
        isTyping: false
      });
    }
  },

  async callLLM(userInput) {
    const messages = [
      {
        role: 'system',
        content: config.adlerPrompt
      },
      {
        role: 'user',
        content: userInput
      }
    ];

    // 调用DashScope API
    const response = await wx.request({
      url: config.llm.endpoint,
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.llm.apiKey}`
      },
      data: {
        model: config.llm.model,
        messages: messages,
        result_format: 'message'
      }
    });

    if (response.statusCode === 200 && response.data.output) {
      return response.data.output.text;
    } else {
      throw new Error('API request failed');
    }
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
          this.initConversation();
        }
      }
    });
  },

  onShareAppMessage() {
    return {
      title: '与阿德勒对话',
      path: '/pages/chat/chat'
    };
  }
});