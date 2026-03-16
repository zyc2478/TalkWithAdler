const adlerPhilosophy = require('../../utils/adler.js');

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
    const greeting = adlerPhilosophy.getResponse('你好');
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

  handleSend() {
    const content = this.data.inputValue.trim();
    if (!content) return;

    this.addMessage('user', content);
    this.setData({
      inputValue: '',
      isTyping: true
    });

    setTimeout(() => {
      const response = adlerPhilosophy.getResponse(content);
      this.addMessage('adler', response);
      this.setData({
        isTyping: false
      });
    }, 1000 + Math.random() * 1000);
  },

  handleQuote() {
    const quote = adlerPhilosophy.getPhilosophyQuote();
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