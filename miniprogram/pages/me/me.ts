import { api } from '../../services/api'
Page({
  data: { loggedIn: false, userId: '' },
  async onShow() {
    this.setData({ loggedIn: !!wx.getStorageSync('access_token') })
    try { const p: any = await api.profile(); this.setData({ userId: p.mode === 'guest' ? '游客模式' : `账号 ${p.user_id.slice(0, 8)}…` }) }
    catch (_e) { this.setData({ userId: '游客模式' }) }
  },
  login() {
    const start = () => wx.login({ success: res => { if (!res.code) return; api.login(res.code).then((d: any) => { wx.setStorageSync('access_token', d.access_token); this.setData({ loggedIn: true }); wx.showToast({ title: '登录成功' }) }).catch(() => wx.showToast({ title: '登录失败，请稍后重试', icon: 'none' })) } })
    if (wx.getStorageSync('privacy_consent') === true) return start()
    wx.showModal({ title: '隐私政策确认', content: '登录前请阅读并同意《隐私政策》，我们只使用你的账单数据提供记账服务。', confirmText: '同意并登录', cancelText: '查看政策', success: r => { if (r.confirm) { wx.setStorageSync('privacy_consent', true); start() } else if (r.cancel) wx.navigateTo({ url: '/pages/privacy/privacy' }) } })
  },
  async clear() { wx.showModal({ title: '删除云端全部账单？', content: '此操作不可恢复', success: async r => { if (r.confirm) { try { await api.deleteData(); wx.removeStorageSync('access_token'); this.setData({ loggedIn: false }); wx.showToast({ title: '数据已删除' }) } catch (_e) { wx.showToast({ title: '请先登录', icon: 'none' }) } } } }) },
  async export() { try { const data = await api.exportData(); wx.setClipboardData({ data: JSON.stringify(data), success: () => wx.showToast({ title: '已复制云端数据' }) }) } catch (_e) { wx.showToast({ title: '导出失败，请重试', icon: 'none' }) } },
  accounts() { wx.navigateTo({ url: '/pages/accounts/accounts' }) },
  privacy() { wx.navigateTo({ url: '/pages/privacy/privacy' }) },
  notify() { wx.showToast({ title: '暂无新的提醒', icon: 'none' }) },
  pro() { wx.showModal({ title: '小账 Pro', content: 'AI 智能记账、高级数据分析、多账本管理和数据导出等权益即将开放。', showCancel: false }) },
  settings() { wx.navigateTo({ url: '/pages/settings/settings' }) },
  books() { wx.showToast({ title: '账本管理即将开放', icon: 'none' }) },
  categories() { wx.showToast({ title: '分类管理即将开放', icon: 'none' }) },
  budget() { wx.navigateTo({ url: '/pages/budget/budget' }) },
  ai() { wx.switchTab({ url: '/pages/ai/ai' }) },
  reminder() { wx.navigateTo({ url: '/pages/settings/settings' }) },
  recurring() { wx.showToast({ title: '周期账单即将开放', icon: 'none' }) },
  importData() { wx.showToast({ title: '导入功能即将开放', icon: 'none' }) },
  sync() { wx.showToast({ title: '云端同步已开启', icon: 'none' }) },
  feedback() { wx.showToast({ title: '感谢你的反馈', icon: 'none' }) },
  about() { wx.showModal({ title: '小账同学 PocketLedger', content: '记好每一笔，遇见更好的自己。\nv1.0.0', showCancel: false }) }
})
