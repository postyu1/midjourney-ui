
<template>
	<view>
		<!-- 注册界面 -->
		<view class="form userform">
			<view class="username">
				<view class="get-code" :style="{'color':getCodeBtnColor}" @click.stop="getCode()">{{getCodeText}}</view>
				<input placeholder="请输入手机号" maxlength="11" v-model="phoneNumber" placeholder-style="color: rgba(255,255,255,0.8);" />
			</view>
			<view class="code">
				<input placeholder="请输入验证码" maxlength="6" v-model="code" placeholder-style="color: rgba(255,255,255,0.8);" />
			</view>
			<view class="desc-box" >
				<view class="desc">未注册手机号登录后将自动生成账号</view>
			</view>
			<view class="btn" @tap="doReg">登录</view>
		</view>
 
	</view>
</template>
 
<script>
	import {
		phoneCodeSend,phoneCodeLogin
	} from "@/api/api.js"
	import store from "@/store/index.js"
	export default {
		data() {
			return {
				phoneNumber: "",
				code: "",
				getCodeText: '获取验证码',
				getCodeBtnColor: "#ffffff",
				getCodeisWaiting: false
			}
		},
		onLoad() {
 
		},
		methods: {
			Timer() {},
			getCode() {
				uni.hideKeyboard() //隐藏已经显示的软键盘，如果软键盘没有显示则不做任何操作。
				if (this.getCodeisWaiting) {
					return;
				}
				if (!(/^1(3|4|5|6|7|8|9)\d{9}$/.test(this.phoneNumber))) { //校验手机号码是否有误
					uni.showToast({
						title: '请填写正确手机号码',
						icon: "none"
					});
					return false;
				}
				this.getCodeText = "发送中..." //发送验证码
				this.getCodeisWaiting = true;
				this.getCodeBtnColor = "rgba(255,255,255,0.5)" //追加样式，修改颜色
				//示例用定时器模拟请求效果
				//setTimeout(()用于在指定的毫秒数后调用函数或计算表达式
				let data = {phone:this.phoneNumber,business:'mj_user'}		
				phoneCodeSend(data).then(()=>{
					uni.showToast({
						title: '验证码已发送',
						icon: "none"
					}); //弹出提示框
					this.setTimer(); //调用定时器方法
				})
			},
			//setTimer： 需要每隔一段时间执行一件事的的时候就需要使用SetTimer函数
			setTimer() {
				let holdTime = 60; //定义变量并赋值
				this.getCodeText = "重新获取(60)"
				//setInterval（）是一个实现定时调用的函数，可按照指定的周期（以毫秒计）来调用函数或计算表达式。
				//setInterval方法会不停地调用函数，直到 clearInterval被调用或窗口被关闭。
				this.Timer = setInterval(() => {
					if (holdTime <= 0) {
						this.getCodeisWaiting = false;
						this.getCodeBtnColor = "#ffffff";
						this.getCodeText = "获取验证码"
						clearInterval(this.Timer); //清除该函数
						return; //返回前面
					}
					this.getCodeText = "重新获取(" + holdTime + ")"
					holdTime--;
				}, 1000)
			},
			doReg() {
				uni.hideKeyboard() //隐藏已经显示的软键盘，如果软键盘没有显示则不做任何操作。
				//模板示例部分验证规则
				if (!(/^1(3|4|5|6|7|8|9)\d{9}$/.test(this.phoneNumber))) { //校验手机号码
					uni.showToast({
						title: '请填写正确手机号码',
						icon: "none"
					});
					return false;
				}
				if (!(/^\d{6}$/.test(this.code))) { // 校验6位纯数字
				    uni.showToast({
							title: '请填写正确的6位数字验证码',
							icon: "none"
				    });
				    return false;
				}
				uni.showLoading({
					title: '提交中...'
				})
				let data = {phone:this.phoneNumber,validate_code:this.code}
				phoneCodeLogin(data).then((res)=>{
					uni.hideLoading()
					uni.showToast({
						title: '登录成功',
						icon: "none"
					});
					store.dispatch('SETINFO',{token:res.access_token,user_name:'用户'+this.phoneNumber})
					setTimeout(()=>{
						uni.navigateTo({
							url:"/"
						})
					},1000)
					// uni.setStorageSync("access_token",res.access_token)
					// uni.setStorageSync("user_name",'用户'+ this.phoneNumber)
				}).catch(err=>{
					console.log(err)
				})
			},

		}
	}
</script>
 
<style lang="scss">
	
	page {
		background: #000; //整一个页面的背景颜色
		// linear-gradient(to bottom, #f06c7a 0%, #f06c7a 100%);
		height: 100%;
	}
	 .desc-box {
		// display: flex;
		// justify-content: center;
		.desc {
			text-align: center;
			font-size: 14px;
			margin-bottom: 20px;
		}
	 }
	.icon {
		color: #ffffff;
	}
 
	.logo {
		width: 100%;
		height: 45vw;
		display: flex;
		justify-content: center;
		align-items: center;
 
		.img {
			width: 25%;
			height: 25vw;
 
			image {
				width: 100%;
				border-radius: 100%;
			}
		}
	}
 
	.form {
		width: 86%;
		padding: 20% 7%;
		font-size: 30upx;
 
		.username,
		.password,
		.code {
			width: calc(100% - 90upx);
			height: 90upx;
			display: flex;
			align-items: center;
			border-radius: 45upx;
			background-color: rgba($color: #ffffff, $alpha: 0.1);
			padding: 0 45upx;
			margin-bottom: 26upx;
 
			input {
				width: 100%;
				height: 50upx;
				color: rgba($color: #ffffff, $alpha: 0.8);
				font-weight: 200;
			}
		}
 
		.btn {
			color: #323232;
			width: 100%;
			height: 90upx;
			display: flex;
			justify-content: center;
			align-items: center;
			border-radius: 45upx;
			background-color: #F8D849;
			font-size: 40upx;
		}
	}
 
	.userform {
		.username {
			position: relative;
 
			.get-code {
				position: absolute;
				height: 90upx;
				display: flex;
				align-items: center;
				justify-content: center;
				right: 0;
				padding: 0 40upx;
				z-index: 3;
 
				&:after { //点击以后，左边出现白色的线
					content: " ";
					width: 1upx; //宽度为1upx
					height: 50upx; //高度为50upx
					background-color: #fff;  //背景颜色为白色
					position: absolute;
					z-index: 3;
					margin-right: 100%;
					left: 0;
					top: 20upx;
				}
			}
		}
 
		.res {
			display: flex;
			justify-content: center;
			align-items: center;
			height: 100upx;
			color: rgba($color: #ffffff, $alpha: 0.8);
		}
	}
</style>