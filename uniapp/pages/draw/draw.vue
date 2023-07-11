<template>
	<view class="content">
<!-- 	
		<skeleton :show="showSkeleton" :isNodes="isNodes" ref="skeleton" loading="chiaroscuro" selector="skeleton"
			bgcolor="#323232"></skeleton>
		<!-- 通知 -->
		<view class="notice skeleton">
			<rk-notice :show-icon="false" :show-more="false" :list="showNotice" @clickItem="clickItem"></rk-notice>
		</view>
		<!-- tabs -->
		<view id="tabs-rect" class="tabs-box">
			<rk-tabs ref="tabs" :tabData="tabList" :defaultIndex="tabIdx" :config="tabsConfig" @tabClick='changeTab'  />
		</view>
		<!-- tab-item -->
		<mj-draw ref="draw" :scrollHeight="subsHeight" v-show="tabIdx == 0"></mj-draw>
		<mj-to-pic ref="pic" :scrollHeight="subsHeight" v-show="tabIdx == 1"></mj-to-pic>
		<history ref="history" @toDetail="toDetail" v-show="tabIdx == 2"></history>
	</view>
</template>

<script>
	import {mapGetters} from 'vuex';
	import mjDraw from "./components/mj-draw.vue"
	import history from "./components/history.vue"
	import mjAnalysis from "./components/mj-analysis.vue"
	import mjToPic from "./components/mj-to-pic.vue"
	import {setStorage,getStorage} from "@/common/utils.js"
	let nowClickTabIndex = ''
	export default {
		components:{
			mjDraw,
			mjAnalysis,
			mjToPic,
			history,
		},
		computed: {
			...mapGetters(['token','userInfo']),
			showNotice:{
				get() {
					return [{id:1,title: this.userInfo&&this.userInfo.token&&this.userInfo.user_name?this.userInfo.user_name:"点击此处登录"}]
				}
			}
		},
		data() {
			return {
				showSkeleton: true,
				isNodes: 0,
				isLoggedIn:true,
				isCurrentPage: false,
				tabsConfig: {
					alignLeft: false,
					underLineColor: '#F8D849',
					activeColor: '#F8D849'
				},
				tabIdx: 0,
				tabList: [{
						name: "文本绘图",
						value: 0,
					},
					{
						name: "以图绘图",
						value: 1,
					},
					{
						name: "绘图历史",
						value: 2,
					}
				],
				subsHeight:300,
				showDialog:true
			}
		},
		onReady() {
			this.isNodes++;
			let that = this;
			this.$utils.getRect('#tabs-rect').then(res => {
				let w_h = uni.getSystemInfoSync().windowHeight;
				that.subsHeight = w_h - res.top - res.height;
			});
		},
		onShow() {
			this.isCurrentPage = true;
			if(!nowClickTabIndex) {
				nowClickTabIndex = this.tabIdx
			} else {
				this.tabIdx = nowClickTabIndex 
				this.$refs.tabs.tabClick(this.tabIdx,null)
			}
		},
		onHide() {
			this.isCurrentPage = false;
		},
		onUnload() {
			this.isCurrentPage = false;
		},
		onLoad() {
			setTimeout(() => {
				this.showSkeleton = false;
			}, 300)
		},
		methods: {
			changeTab(idx, item) {
				this.tabIdx = nowClickTabIndex = idx;
				if(idx == 2) {
					// 查看历史
					setTimeout(()=>{
						this.$refs.history.initData()
					},50)
				}
			},
			toDetail(item) {
				if(item.action == 'IMAGINE'||item.base_action == 'IMAGINE') {
					this.tabIdx = 0
					this.$refs.tabs.tabClick(0,null)
					setTimeout(()=>{
						this.$refs.draw.setDefaultData(item)
					},50)
				} else if(item.action == 'BLEND'||item.base_action == 'BLEND') {
					this.tabIdx = 1
					this.$refs.tabs.tabClick(1,null)
					setTimeout(()=>{
						this.$refs.pic.setDefaultData(item)
					},50)
				}

			},
			changeCancel(){
				this.showDialog = false
			},
			changeconfirm() {
				this.showDialog = false
			},
			clickItem() {
				if(this.token) {
						uni.showModal({
							title: '提示',
							content: '是否注销此用户？',
							success: (res) => {
								if (res.confirm) { 
									this.$store.dispatch('LOGOUT')
								}
							}
						})
				} else {
					uni.navigateTo({
						url:'/pages/login/login'
					})
				}
			}
			
		}
	}
</script>

<style lang="scss">
	.user-info {
		position: fixed;
		right: 20px;  // 根据需要调整
		top: 20px;
	}
	.notice {
		margin-bottom: 20rpx;
	}
</style>