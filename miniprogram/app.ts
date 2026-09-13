import { api } from './services/api'
App<IAppOption>({
  globalData: { accessToken: '' },
  onLaunch() {
    const token = wx.getStorageSync('access_token') || ''
    this.globalData.accessToken = token
    wx.login({ success: res => { if (!res.code) return; api.login(res.code).then((data:any) => { if (data.access_token) { wx.setStorageSync('access_token', data.access_token); this.globalData.accessToken = data.access_token } }).catch(() => { /* 未配置 AppID 时保持游客模式 */ }) } })
  },
})
