<template>
	<view class="com-pic-draw">
		<scroll-view scroll-y="true" :style="'height:'+scrollHeight+'px'" :scroll-top="scrollViewTop">
			<!-- 提示词 -->
			<view class="input-item">
				<view class="section">
					<view class="title">提示词</view>
					<view class="title-en">(Prompt)</view>
				</view>
				<view class="text-area">
					<textarea v-model="cueword" placeholder="输入你想要的内容,支持中英文,用逗号分割." :maxlength="maxinput"></textarea>
				</view>
				<view class="text-num-box">
					<view class="text-num">{{cueword_num}}/{{maxinput}}</view>
				</view>
			</view>

			<!-- 提交 -->
			<view class="submit-box" >
				<view class="submit-btn" style="margin-right: 20px;" @click="clickSubmit" v-if="!generatesImages || generatesImages.length<=0">立即生成</view>
				<view class="submit-btn" style="margin-right: 20px;" @click="clickSubmit" v-else>再来一次</view>
				<view class="submit-btn" @click="clearInfo">清空当前</view>
			</view>
			<!--  -->
			<view class="desc-box" v-if="!showDealTool">
				<view class="desc">期待你的创作！</view>
				<view style="margin-top: 20rpx;" class="desc">快在「提示词」中写下你的绘图想法吧~</view>
			</view>
			<!-- 生成结果 -->
			<view id="result-rect" class="box-content result-box">
				<view class="result-content" v-if="generatesImages">
					<view class="item-section">生成结果(点击图片长按保存)</view>
					<view class="item-content" @click="clickImg(generatesImages)">
						<view class="res-img-box" :style="'width:'+imgSize*1.15+'px;height:'+imgSize*1.15+'px;'">
							<image :src="generatesImages" mode="aspectFit"></image>
						</view>
					</view>
				</view>
			</view>
			<!-- 图片处理 -->
			<view class="reult-iamge-deal-box" v-if="showDealTool">
				<view class="item-section">相似图重绘</view>
				<view class="same-redraw-box">
					<view class="same-redraw-list" v-for="(item,index) in redrawTypes" :key="index">
						<view class="same-redraw-list-item"
							:class="redrawForm.draw_val == item.draw_val?'same-redraw-list-item-sel':''"
							@click="clickRedrawItem(item)">{{item.title}}</view>
					</view>
				</view>
				<view class="item-section">希望高清放大的图片</view>
				<view class="same-redraw-box">
					<view class="same-redraw-list" v-for="(item,index) in redrawTypes" :key="index">
						<view class="same-redraw-list-item"
							:class="redrawForm.down_val == item.down_val?'same-redraw-list-item-sel':''"
							@click="clickDownItem(item)">{{item.title}}</view>
					</view>
				</view>
				<view class="result-content" v-if="generateDownImage">
					<view class="item-section">生成结果(点击图片长按保存)</view>
					<view class="item-content" @click="clickImg(generateDownImage)">
						<view class="res-img-box" :style="'width:'+imgSize*1.15+'px;height:'+imgSize*1.15+'px;'">
							<image :src="generateDownImage" mode="aspectFit"></image>
						</view>
					</view>
				</view>
			</view>
			<view class="yuanyue-safe20"></view>
		</scroll-view>
	</view>
</template>

<script>
	import {setStorage,getStorage} from "@/common/utils.js"
	import {
		TIMER_FETCH_INTERVAL,
		FETCH_REPEAT_COUNT
	} from "@/config/app.js"
	import {
		postMjAddAll,
		getMjFetch,
		postMjChange,
		addTaskRecord,
		getRecordInfo
	} from "@/api/api.js"
	import {
		HTTP_URL_SD
	} from "@/config/app.js"

	export default {
		name: 'pic-draw',
		props: {
			scrollHeight: {
				typeof: Number,
				default: 0
			}
		},
		computed: {
			imgSize() {
				let s_w = uni.getSystemInfoSync().screenWidth;
				let img_w = s_w * 0.4;
				return img_w;
			}
		},
		data() {
			return {
				scrollViewTop: 0,
				resultRectTop: 0,
				isGenerating: false,
				cueword: '',
				formData: {
					prompt: '',
					model: '--v 5',
					relevance: 250, // 提示词相关度
					have_img: false,
					image_path: '',
					influence: 1, // 图片影响度
					size_ratio: '1:1',
				},
				maxinput: 500,
				cueword_num: 0,
				redrawTypes: [{
						title: '左上',
						down_val: 'U1',
						draw_val: 'V1',
					},
					{
						title: '右上',
						down_val: 'U2',
						draw_val: 'V2',
					},
					{
						title: '左下',
						down_val: 'U3',
						draw_val: 'V3',
					},
					{
						title: '右下',
						down_val: 'U4',
						draw_val: 'V4',
					}
				],
				redrawForm: {
					down_val: '',
					draw_val: '',
				},
				showDealTool: false,
				task_type: 0, //0-生成任务，1-重绘任务，2下载任务
				generateTimer: null,
				timerClear: false,
				gener_task_id: '',
				down_task_id: '',
				draw_task_id: '',
				fetchErrCount: 0,
				fetchRepeat: false,
				generatesImages: '',
				generateDownImage:'',
				loadingTxt:'请稍后...',
				fromHistory:false, // 从历史列表返回
				nowTaskInfo:{},
				historyVList:[],
				historyUList:[],
				baseRecordId:''
			}
		},
		watch: {
			cueword(n, o) {
				this.cueword_num = n.length;
			},
		},

		mounted() {
			// this.getMjFetch('9597543304885748')
			// this.gener_task_id = '2912531201146109'
			// this.sizeDeal();
			// this.resetModel();
			let that = this;
			this.$utils.getRect('#result-rect').then(res => {
				this.resultRectTop = res.top;
			})
		},
		methods: {
			clearInfo() {
				uni.showModal({
					title: '提示',
					content: '确定清空当前?',
					success: (res) => {
						if (res.confirm) {
							this.type = 0
							this.isGenerating = false
							this.redrawForm.down_val = ''
							this.redrawForm.draw_val = ''
							this.gener_task_id = ''
							this.down_task_id= ''
							this.draw_task_id = ''
							this.generatesImages = ''
							this.generateDownImage = ''
							this.showDealTool = false
							this.cueword = ''
						}
					}
				})
			},
			// 从历史记录跳转过来的
			setDefaultData(item) {
				this.fromHistory = true
				this.generateDownImage = ''
				this.gener_task_id = item.task_id
				this.baseRecordId = item.base_record_id
				// this.nowTaskInfo = item
				if(item.task_status == 'SUCCESS'||item.task_status == 'IN_PROGRESS') {
					// 获取单个数据
					let taskInfo = JSON.parse(item.task_json)
					this.cueword = taskInfo.prompt
					this.generatesImages = taskInfo.image_url;
					getRecordInfo(this.gener_task_id).then(data=>{
						data.variation_list.map(item=>{
							if(item.task_json) {
								item.vOpt = JSON.parse(item.task_json).description.slice(-2)
							}
						})
						data.upscale_list.map(item=>{
							if(item.task_json) {
								let objU = JSON.parse(item.task_json)
								item.uOpt = objU.description.slice(-2)
								item.uImageUrl = objU.image_url
							}
						})
						this.historyUList = data.upscale_list
						this.historyVList = data.variation_list
						this.showDealTool = true;
						this.toolBtnReset();
					})
				} else {
					this.getMjFetch(this.gener_task_id)
				}
			},

			/**
			 * 开始生成
			 */
			 clickSubmit() {
				if (!this.cueword) {
					return this.$utils.showToast("请输入提示词")
				}
				if (this.isGenerating) {
					return this.$utils.showToast("请稍后...")
				}
				this.task_type = 0;
				this.generatesImages = '';
				this.generateDownImage = '';
				this.historyUList = []
				this.historyVList = []
				uni.showLoading({
					title: '请稍后...',
					mask: true
				});
				let postDic = {
					prompt: this.cueword
				}
				this.isGenerating = true;
				postMjAddAll(postDic).then(res => {
					// this.setTaskListStorage({id:res.result})
					if (res.code == 1) {
						addTaskRecord({'task_id':res.result,'action':'IMAGINE'}).then(addRes=>{
							this.gener_task_id = res.result;
							this.timerClear = false;
							this.createTimer(this.gener_task_id);
							this.baseRecordId = addRes
						}).catch(err=>{
							this.isGenerating = false;
							uni.hideLoading()
							this.$utils.showToast(err);
						})
					} else {
						this.isGenerating = false;
						uni.hideLoading()
						this.$utils.showToast(res.description);
					}
				}).catch(err => {
					uni.hideLoading();
					this.isGenerating = false;
				});
			},
			/**
			 * 创建计时器
			 */
			createTimer(taskId) {
				let that = this;
				that.generateTimer = setInterval(function() {
					if (that.timerClear) {
						clearInterval(that.generateTimer);
						that.generateTimer = null;
						return;
					}
					that.getMjFetch(taskId);
				}, TIMER_FETCH_INTERVAL);
			},
			destroyTimer() {
				if (this.generateTimer) {
					clearInterval(this.generateTimer);
					this.generateTimer = null;
				}
				this.timerClear = true;
				this.isGenerating = false;
			},
			/**
			 * 获取图片进度
			 */
			getMjFetch(taksId) {
				uni.showLoading({
					title: this.loadingTxt,
					mask: true
				})
				let that = this;
				getMjFetch(taksId).then(res => {
					// 只有生成的任务才存入缓存
					// if(this.task_type == 0 || this.task_type == 1) {
					// 	this.setTaskListStorage(res)
					// } 
					if (res.status == 'NOT_START' || res.status == 'IN_PROGRESS' || res.status == 'SUBMITTED') {
						if(res.status == 'IN_PROGRESS'&&res.progress!='paused') {
							this.loadingTxt = `正在生成(${res.progress})...`
						}
						if (that.fetchRepeat) {
							that.fetchRepeat = false;
							that.destroyTimer();
							that.createTimer(taksId);
						}
					} else if (res.status == 'SUCCESS') {
						uni.hideLoading()
						this.loadingTxt = '请稍后...'
						this.fetchErrCount = 0;
						if (this.task_type == 2) {
							// 下载任务成功
							this.generateDownImage = res.imageUrl;
							this.historyUList.push({uOpt:this.redrawForm.down_val,uImageUrl:res.imageUrl})
							// this.nowTaskInfo.u_info = res
							// this.setTaskListStorage(this.nowTaskInfo)
						} else if (this.task_type == 1) {
							// 重绘
							this.generatesImages = res.imageUrl;
							this.showDealTool = true;
							// 重绘成功将重绘id给生成id,以便下一次重绘或下载
							this.gener_task_id = this.draw_task_id;
							this.toolBtnReset();
						} else {
							//生成
							this.generatesImages = res.imageUrl;
							this.showDealTool = true;
							this.toolBtnReset();
						}
						this.$utils.showToast('恭喜！您的图片已经生成完成');
						// 销毁
						this.destroyTimer();
						// 滚动
						that.scrollToRes();
					} else {
						let err_msg = '获取失败';
						if(res.failReason){
							err_msg = res.failReason;
						}
						uni.hideLoading()
						this.$utils.showToast(err_msg);
						// 销毁
						this.destroyTimer();
					}
				}).catch(err => {
					// 销毁
					that.destroyTimer();
					if (that.fetchErrCount >= FETCH_REPEAT_COUNT) {
						uni.hideLoading()
						this.fetchErrCount = 0;
						that.$utils.showToast('获取失败');
						// console.log("rk===>[重试-放弃]", that.fetchErrCount);
					} else {
						setTimeout(() => {
							that.fetchErrCount += 1;
							that.fetchRepeat = true;
							// console.log("rk===>[重试]", that.fetchErrCount);
							that.getMjFetch(taksId);
						}, 2000);
					}
				});
			},
			/**
			 * 单张下载
			 */
			clickDownItem(item) {
				if (item.down_val == this.redrawForm.down_val) {
					return
				}
				// 判断是否已经生成过
				if(this.historyUList.length>0) {
					let findObj = this.historyUList.find(data=>{
						return data.uOpt == item.down_val
					})
					if(findObj&&findObj.uOpt&& findObj.uImageUrl){
						this.redrawForm.down_val = findObj.uOpt
						this.generateDownImage = findObj.uImageUrl
						return
					}
				}
				if(!this.gener_task_id) {
					this.$utils.showToast('生成放大图片有误'); return;
				}
				this.redrawForm.down_val = item.down_val;
				this.task_type = 2;
				this.generateDownImage = '';
				uni.showLoading({
					title: "请稍后...",
					mask: true
				})
				this.isGenerating = true;
				let postDic = {
					content: this.gener_task_id + " " + item.down_val
				}
				postMjChange(postDic).then(res => {
					if (res.code == 1) {
						addTaskRecord({'task_id':res.result,'action':'UPSCALE',parent_task_id:this.gener_task_id}).then(addRes=>{
							this.down_task_id = res.result;
							this.timerClear = false;
							this.createTimer(this.down_task_id);
						}).catch(err=>{
							this.isGenerating = false;
							uni.hideLoading()
							this.$utils.showToast(err);
						})
					} else {
						uni.hideLoading()
						this.redrawForm.down_val = ''
						this.$utils.showToast(res.description);
					}
				}).catch(err => {
					uni.hideLoading()
					this.redrawForm.down_val = ''
					this.isGenerating = false;
				});
			},
			// 重绘某张图
			clickRedrawItem(item) {
				if (item.draw_val == this.redrawForm.draw_val) {
					return
				}
				if(this.historyVList.length>0) {
					let findObj = this.historyVList.find(data=>{
						return data.vOpt == item.draw_val
					})
					if(findObj) {
						this.redrawForm.draw_val = item.draw_val;
						this.setDefaultData(findObj)
						return
					}
				}
				uni.showLoading({
					title: "请稍后...",
					mask: true
				})
				this.isGenerating = true;
				let postDic = {
					content: this.gener_task_id + " " + item.draw_val
				}
				postMjChange(postDic).then(res => {
					this.redrawForm.draw_val = item.draw_val;
					if (res.code == 1) {
						// 添加任务
						addTaskRecord({'task_id':res.result,'action':'VARIATION',parent_task_id:this.gener_task_id,
							'base_action':'IMAGINE',base_record_id:this.baseRecordId})
							.then(addResult=>{
								this.task_type = 1;
								this.generateDownImage = '';
								this.generatesImages = '';
								this.draw_task_id = res.result;
								this.historyVList = []
								this.historyUList = []
								this.toolBtnReset()
								this.timerClear = false;
								this.createTimer(this.draw_task_id);
							}).catch(error=>{
								uni.hideLoading()
								this.isGenerating = false;
								this.toolBtnReset()
								this.$utils.showToast(error);
							})
					} else {
						uni.hideLoading()
						this.isGenerating = false;
						this.toolBtnReset()
						this.$utils.showToast(res.description);
					}
				}).catch(err => {
					uni.hideLoading()
					this.redrawForm.draw_val = '';
					this.isGenerating = false;
				});
			},
			toolBtnReset(){
				this.redrawForm.draw_val = '';
				// 判断U操作数组是否里面有数据
				if(this.historyUList.length >0) {
					let uInfo = this.historyUList[0]
					this.redrawForm.down_val = uInfo.uOpt||''
					this.generateDownImage = uInfo.uImageUrl||''
				} else {
					this.redrawForm.down_val = '';
				}
			},
			onScroll(e) {
				if (e.detail.scrollTop <= 10) {
					this.scrollViewTop = 0;
				}
			},
			scrollToRes() {
				if (this.scrollViewTop <= 0) {
					this.scrollViewTop = this.resultRectTop;
				}
			},
			/**
			 * 预览
			 */
			clickImg(url) {
				let urls = [url];
				wx.previewImage({
					urls: urls,
					current: 0,
					success: function(res) {},
					fail: function(res) {},
					complate: function(res) {}
				})
			},

		}
	}
</script>

<style lang="scss">
	.com-pic-draw {
		padding: 0rpx 30rpx;

	}

	.input-item {
		margin: 50rpx auto;
		background-color: #323232;
		padding: 20rpx;
		width: 80%;
		border-radius: 10rpx;

		.section {
			display: flex;
			align-items: baseline;
			font-size: 15px;
			color: $yuanyue-color-main;
		
			.title {
				font-weight: bold;
				margin-right: 8rpx;
			}

			.title-en {
				font-size: 14px;
			}
		}

		.text-area {
			textarea {
				width: 100%;
				height: 120px;
				font-size: 15px;
				padding: 10rpx 0;
			}
		}

		.text-num-box {
			display: flex;
			justify-content: flex-end;
			color: #969696;
		}
	}

	.translate-box {
		padding: 26rpx 0 10rpx 10rpx;
		display: flex;

		.translate {
			display: flex;
			align-items: center;
			font-size: 13px;
			border: 1rpx solid $yuanyue-color-main;
			padding: 6rpx 12rpx;
			border-radius: 10rpx;
			color: $yuanyue-color-main;

			text {
				margin-right: 5rpx;
			}
		}
	}

	.item-section {
		padding: 40rpx 80rpx 40rpx;
		text-align: center;

		.item-section-subs {
			font-size: 13px;
			margin-left: 10rpx;
		}
	}

	.box-content {
		padding: 0 20rpx;
	}

	.model-box {
		.model-content {
			padding: 10rpx 10rpx 0;
			display: flex;
			flex-wrap: wrap;

			.model-item-list {
				width: calc(33% - 14rpx);
				height: 80rpx;
				margin: 0 20rpx 0rpx 0;

				&:nth-child(3n) {
					margin: 0;
				}

				.model-item {
					padding: 10rpx 15rpx;
					font-size: 14px;
					border-radius: 10rpx;
					background-color: #323232;
					box-sizing: border-box;
					width: 100%;
					border: 1px solid transparent;

					.model-item-txt {
						text-align: center;
					}
				}

				.model-sel {
					background-color: transparent;
					border: 1px solid $yuanyue-color-main;
					color: $yuanyue-color-main;
					box-sizing: border-box;
				}
			}
		}
	}

	.cueword-box {
		.section-box {
			display: flex;
			align-items: baseline;
			justify-content: space-between;

			.item-right {
				font-size: 13px;

				.iconfont {
					font-size: 13px;
					margin-right: 6rpx;
				}
			}
		}
	}

	.reference-box {
		.refer-content {
			margin-top: 10rpx;
			display: flex;

			.refer-item {
				background-color: #323232;
				width: 80px;
				height: 80px;
				border-radius: 10rpx;
				display: flex;
				justify-content: center;
				align-items: center;
			}

			.refer-normal {
				.iconfont {
					color: #969696;
					font-size: 20px;
				}
			}

			.refer-sel {
				image {
					border-radius: 10rpx;
				}

				position: relative;

				.clear-image {
					position: absolute;
					top: -15rpx;
					right: -15rpx;

					.iconfont {
						font-size: 16px;
						color: $yuanyue-color-main;
					}
				}
			}
		}

	}

	.ratio-box {
		.ratio-content {
			display: flex;
			flex-wrap: wrap;

			.ratio-list {
				width: calc(20% - 25rpx);
				margin: 20rpx 30rpx 0rpx 0;

				&:nth-child(5n) {
					margin-right: 0;
				}

				.ratio-item {
					padding: 5rpx 10rpx;
					box-sizing: border-box;
					display: flex;
					flex-direction: column;
					align-items: center;
					border-radius: 10rpx;
					border: 1px solid #969696;

					.item-shape-box {
						width: 60rpx;
						height: 60rpx;
						display: flex;
						justify-content: center;
						align-items: center;

						.item-shape {
							background-color: #969696;
							border-radius: 5rpx;
						}
					}

					.item-txt {
						font-size: 13px;
					}
				}

				.ratio-sel {
					border: 1px solid $yuanyue-color-main;
				}
			}
		}
	}

	.submit-box {
		display: flex;
		justify-content: center;
		margin: 40rpx 0 20rpx;
		.submit-btn {
			width: 80%;
			padding: 20rpx 0;
			background-color: $yuanyue-color-main;
			color: #323232;
			border-radius: 10rpx;
			display: flex;
			justify-content: center;
		}
	}
	.desc-box {
		// display: flex;
		// justify-content: center;
		.desc {
			text-align: center;
			font-size: 14px;
		}
	}

	.result-box {
		
	}
	.result-content {
		.item-content {
			display: flex;
			justify-content: center;
	
			.res-img-box {
				background-color: #323232;
				border-radius: 10rpx;
			}
		}
	}
	.reult-iamge-deal-box {
		.same-redraw-box {
			display: flex;
			flex-wrap: wrap;
			width: 80%;
			margin: 0 auto 50rpx;
			.same-redraw-list {
				width: calc(25% - 17rpx);
				margin-right: 20rpx;
	
				&:nth-child(4n) {
					margin-right: 0;
				}
	
				.same-redraw-list-item {
					display: flex;
					justify-content: center;
					padding: 10rpx 0;
					background-color: #323232;
					border-radius: 10rpx;
					font-size: 14px;
				}
	
				.same-redraw-list-item-sel {
					background-color: $yuanyue-color-main;
					color: #323232;
				}
			}
		}
	}

	::v-deep uni-slider {
		margin: 10px 2px !important;
	}

	::v-deep uni-slider .uni-slider-value {
		width: auto !important;
		margin-left: 20rpx !important;
		// text-align: right;
		min-width: 20px;
	}
</style>