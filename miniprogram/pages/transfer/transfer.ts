import { listAccounts, accountBalances, saveTransfer } from '../../services/storage'
Page({
  data:{accounts:[] as any[],fromIndex:0,toIndex:1,amount:'',note:''},
  onLoad(){this.load()},
  load(){const balances=accountBalances();this.setData({accounts:listAccounts().filter(a=>!a.isArchived).map(a=>({...a,displayBalance:(balances[a.id]||0).toFixed(2)}))})},
  fromChange(e:any){this.setData({fromIndex:Number(e.detail.value)})},
  toChange(e:any){this.setData({toIndex:Number(e.detail.value)})},
  amountInput(e:any){this.setData({amount:e.detail.value})},
  noteInput(e:any){this.setData({note:e.detail.value})},
  swap(){this.setData({fromIndex:this.data.toIndex,toIndex:this.data.fromIndex})},
  submit(){const {accounts,fromIndex,toIndex,amount,note}=this.data;if(!amount||Number(amount)<=0){wx.showToast({title:'请输入转账金额',icon:'none'});return}if(fromIndex===toIndex){wx.showToast({title:'请选择不同账户',icon:'none'});return}try{saveTransfer({amount,fromAccountId:accounts[fromIndex].id,toAccountId:accounts[toIndex].id,note});wx.showToast({title:'转账成功'});setTimeout(()=>wx.navigateBack(),500)}catch(e:any){wx.showToast({title:e.message||'转账失败',icon:'none'})}}
})
