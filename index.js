// diy-scroll

import { singleFollowTouch } from "s-touch";

const RAF = (() => (window.requestAnimationFrame ||
	window.webkitRequestAnimationFrame ||
	window.mozRequestAnimationFrame ||
	window.oRequestAnimationFrame ||
	window.msRequestAnimationFrame ||
	function(callback) {
		window.setTimeout(callback, 1000 / 60);
	}))();

// 检测安卓
const testAndroid = () => /Android/i.test(window.navigator.userAgent);

// 上拉超出/下滑超出 回滚的速度
const step = 12;
// 滑动 超出上下限时, 允许超出的上下范围
const iTopAndBottomDiff = 80;
// 滑动 超出上下限时, 回滚的速度
const iTopAndBottomStep = 10;
// input匹配, 现在改为, querySelectorAll, (input=[type='text'],...)
// const reg = /^(text|password|number|email)$/i;
// 本模块对象
let local = {
	isAndroid: null,
	iWindowHeight: null,
	setWindowHeight: null
};

// initial - android variable
const initial = function (){
	local.isAndroid = testAndroid();
	if(local.isAndroid){
		local.iWindowHeight = 0;
		local.setWindowHeight = (iH) => {
			if(iH > local.iWindowHeight){
				local.iWindowHeight = iH;
			}
		};
	}
};

let inputBlur;

initial();

class TouchScroll {

    constructor (dom){
		this._main(dom);
		this._original = dom;
		return this;
	}

	refresh (){
		let c = this.dom.style.transform;
		let i = c.indexOf("(");
		let y = Number(c.slice(i + 1, -3));
		this._main(this._original, y);
	}

	destroy (){
		this.bStart = true;
		this.dom.ontouchstart = null;
		this.dom.ontouchmove = null;
		this.dom.ontouchend = null;
		local.iWindowHeight = 0;
		if(local.isAndroid){
			window.removeEventListener("resize", inputBlur);
		}
	}

	_main (dom, currentY = 0){
		// 默认取符合条件节点的优先节点作为盒子
		this.parentDom = document.querySelector(dom);
		// 默认取传进来的节点下面第一个dom为容器
		this.dom = this.parentDom.children[0];
		// 初始化页面translateY位置
		this._transY(currentY);
		// 当前容器元素的高度
		this.height = this.dom.offsetHeight;
		// 盒子的高,用于计算是否需要开启容器滑动
		this.bodyHeight = this.parentDom.offsetHeight;
		// 是否启动diy-滑动条
		this.diff = 0;
		// 当前的translateY值
		this.cY = currentY;
		// 是否处于用户控制状态
		this.bStart = false;
		// 手指移开屏幕时最后一次y的增值
		this.endY = 0;
		// 开启自动滑动的手指触屏移动次数条件
		this.iMove = 0;
		// 焦点对象
		this.oInput = null;
		// input焦点定时器
		this.blurTimer = null;
		// 安卓兼容,防止输入时页面被顶起来,默认获取页面高度
		local.setWindowHeight && local.setWindowHeight(this.height);
		if(this.height > this.bodyHeight){
			this.diff = -(this.height - this.bodyHeight);
		}
		if(!this.diff){
			return ;
		}
		singleFollowTouch(this.dom, {
			touchstart: () => {
				if(this.oInput) return ;
				this.bStart = true;
				this.iMove = 0;
			},
			touchmove: ({y}) => {
				if(this.oInput) return ;
				this.endY = y;
				this._goto(y);
				this.iMove++;
			},
			touchend: () => {
				this.bStart = false;
				this._end(step) && this.iMove > 3 && this._autoRun(this.endY);
				this.iMove = 0;
			}
		});

		if(local.isAndroid){
			window.removeEventListener("resize", inputBlur);
			inputBlur = function(){
				if(!this.oInput){return ;}
				let iBody = document.getElementsByTagName("body")[0].offsetHeight;
				let iWindow = window.screen.availHeight;
				let i = (iBody / iWindow) * 100;
				if(i > 80){
					this.oInput.blur();
				}
			}.bind(this);
			window.addEventListener("resize", inputBlur, false);
		}
		
		this._inputHandler();

	}

	_inputHandler (){
		let aInput = document.querySelectorAll("input[type='text']","input[type='email']","input[type='password']","input[type='number']");
		for(let i=0, l=aInput.length; i<l; i++){
			if(aInput[i].onfocus){
				continue ;
			}
			if(local.isAndroid){
				aInput[i].onfocus = this._androidFocus.bind(this, aInput[i]);
				aInput[i].onblur = this._androidBlur.bind(this);
			}else{
				aInput[i].onfocus = this._iphoneFocus.bind(this, aInput[i]);
				aInput[i].onblur = this._iphoneBlur.bind(this);
			}
		}
	}

	_androidFocus (item){
		if(this.blurTimer){
			clearTimeout(this.blurTimer);
			this.blurTimer = null;
		}
		if(this.oInput){return ;}
		this.oInput = item;
		this.dom.className = this.dom.className+" input_focus";
		this.parentDom.style.height = local.iWindowHeight + "px";
	}
	_androidBlur (){
		this.blurTimer = setTimeout(() => {
			this.oInput = null;
			this.parentDom.style.height = "100%";
			this.dom.scrollTop = 0;
			this.dom.style.top = "0px";
			let arr = this.dom.className.split(" ");
			arr.splice(arr.indexOf("input_focus"), 1);
			this.dom.className = arr.join(" ");
		}, 200);
	}
	_iphoneFocus (item){
		this.oInput = item;
		let c = this.dom.style.transform;
		let i = c.indexOf("(");
		let y = Number(c.slice(i + 1, -3));
		this.dom.className = this.dom.className+" input_focus";
		this.dom.style.top = Math.abs(y) + "px";
		this.dom.scrollTop = Math.abs(y);
	}
	_iphoneBlur (){
		this.oInput = null;
		let arr = this.dom.className.split(" ");
		arr.splice(arr.indexOf("input_focus"), 1);
		this.dom.className = arr.join(" ");
		this.dom.style.top = "0px";
		this.dom.scrollTop = 0;
	}

	_end (step = 10, diff = 0){
		if(this.cY > (0 + diff)){
			this._to(0, -(this.cY/step));
			return false;
		}
		if(this.diff){
			if(this.cY < (this.diff - diff)){
				this._to(this.diff, -(this.cY - this.diff)/step);
				return false;
			}
		}
		return true;
	}

	_transY (y){
		let s = `translateY(${y}px)`;
		this.dom.style.webkitTransform = s;
		this.dom.style.mozTransform = s;
		this.dom.style.msTransform = s;
		this.dom.style.oTransform = s;
		this.dom.style.webkitTransform = s;
	}

	_goto (y){
		this.cY -= (y/2);
		this._transY(this.cY);
	}

	_autoRun (y){
		RAF(this._run.bind(this, y));
	}

	_run (y){
		if(this.bStart){this.endY = 0; return ;}
		let b = this._end(iTopAndBottomStep, iTopAndBottomDiff);
		if(!b) return ;
		y = y - y * .1;
		if(Math.abs(y) <= 1){
			this._end(iTopAndBottomStep);
			return ;
		}
		this.cY -= y;
		this._transY(this.cY);
		RAF(this._run.bind(this, y));
	}

	_to (y, step){
		RAF(this._step.bind(this, y, step));
	}

	_step (y, step){
		if(this.bStart){return ;}
		if(Math.abs(this.cY - y) < Math.abs(step)){
			this._transY(y);
			return ;
		}
		this.cY += step;
		this._transY(this.cY);
		if(this.cY === y){
			return ;
		}
		RAF(this._step.bind(this, y, step));
	}
}

export default TouchScroll;


