import { listAccounts, accountBalances, saveAccount } from '../../services/storage'
import { api } from '../../services/api'
Page({
  data:{accounts:[] as any[],total:'0.00',showAdd:false,name:'',type:'custom',openingBalance:'0',types:[{key:'wechat',label:'微信零钱',icon:'💚'},{key:'alipay',label:'支付宝',icon:'🔵'},{key:'bank',label:'银行卡',icon:'💳'},{key:'cash',label:'现金',icon:'💵'},{key:'custom',label:'其他账户',icon:'🏦'}]},
  onShow(){this.load()},
  async load(){try{const res:any=await api.accounts();const accounts=(res.items||[]).map((a:any)=>({...a,displayBalance:Number(a.balance||0).toFixed(2),icon:(this.data.types.find((t:any)=>t.key===a.type)||this.data.types[4]).icon}));const total=accounts.reduce((sum:number,a:any)=>sum+Number(a.displayBalance),0).toFixed(2);this.setData({accounts,total});return}catch(e){} const balances=accountBalances(); const accounts=listAccounts().filter(a=>!a.isArchived).map(a=>({...a,displayBalance:(balances[a.id]||0).toFixed(2),icon:(this.data.types.find((t:any)=>t.key===a.type)||this.data.types[4]).icon})); const total=accounts.reduce((sum,a)=>sum+Number(a.displayBalance),0).toFixed(2); this.setData({accounts,total})},
  showAdd(){this.setData({showAdd:true,name:'',type:'custom',openingBalance:'0'})},
  closeAdd(){this.setData({showAdd:false})},
  noop(){},
  inputName(e:any){this.setData({name:e.detail.value})},
  inputBalance(e:any){this.setData({openingBalance:e.detail.value})},
  selectType(e:any){this.setData({type:e.currentTarget.dataset.type})},
  async create(){if(!this.data.name.trim()){wx.showToast({title:'请输入账户名称',icon:'none'});return} const opening=Number(this.data.openingBalance||0); if(!Number.isFinite(opening)||opening<0){wx.showToast({title:'余额格式不正确',icon:'none'});return} try{await api.createAccount({name:this.data.name.trim(),type:this.data.type,opening_balance:opening});wx.showToast({title:'账户已添加'});this.setData({showAdd:false});this.load()}catch(err:any){wx.showToast({title:err.message||'保存失败，请重试',icon:'none'})}},
  transfer(){wx.navigateTo({url:'/pages/transfer/transfer'})}
})
