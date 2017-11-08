"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

var _sTouch = require("s-touch");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var RAF = function () {
	return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function (callback) {
		window.setTimeout(callback, 1000 / 60);
	};
}();

// 检测安卓
// diy-scroll

var testAndroid = function testAndroid() {
	return (/Android/i.test(window.navigator.userAgent)
	);
};

// 上拉超出/下滑超出 回滚的速度
var step = 12;
// 滑动 超出上下限时, 允许超出的上下范围
var iTopAndBottomDiff = 80;
// 滑动 超出上下限时, 回滚的速度
var iTopAndBottomStep = 10;
// input匹配, 现在改为, querySelectorAll, (input=[type='text'],...)
// const reg = /^(text|password|number|email)$/i;
// 本模块对象
var local = {
	isAndroid: null,
	iWindowHeight: null,
	setWindowHeight: null
};

// initial - android variable
var initial = function initial() {
	local.isAndroid = testAndroid();
	if (local.isAndroid) {
		local.iWindowHeight = 0;
		local.setWindowHeight = function (iH) {
			if (iH > local.iWindowHeight) {
				local.iWindowHeight = iH;
			}
		};
	}
};

var inputBlur = void 0;

initial();

var TouchScroll = function () {
	function TouchScroll(dom) {
		(0, _classCallCheck3.default)(this, TouchScroll);

		this._main(dom);
		this._original = dom;
		return this;
	}

	(0, _createClass3.default)(TouchScroll, [{
		key: "refresh",
		value: function refresh() {
			var c = this.dom.style.transform;
			var i = c.indexOf("(");
			var y = Number(c.slice(i + 1, -3));
			this._main(this._original, y);
		}
	}, {
		key: "destroy",
		value: function destroy() {
			this.bStart = true;
			this.dom.ontouchstart = null;
			this.dom.ontouchmove = null;
			this.dom.ontouchend = null;
			local.iWindowHeight = 0;
			if (local.isAndroid) {
				window.removeEventListener("resize", inputBlur);
			}
		}
	}, {
		key: "_main",
		value: function _main(dom) {
			var _this = this;

			var currentY = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

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
			if (this.height > this.bodyHeight) {
				this.diff = -(this.height - this.bodyHeight);
			}
			if (!this.diff) {
				return;
			}
			(0, _sTouch.singleFollowTouch)(this.dom, {
				touchstart: function touchstart() {
					if (_this.oInput) return;
					_this.bStart = true;
					_this.iMove = 0;
				},
				touchmove: function touchmove(_ref) {
					var y = _ref.y;

					if (_this.oInput) return;
					_this.endY = y;
					_this._goto(y);
					_this.iMove++;
				},
				touchend: function touchend() {
					_this.bStart = false;
					_this._end(step) && _this.iMove > 3 && _this._autoRun(_this.endY);
					_this.iMove = 0;
				}
			});

			if (local.isAndroid) {
				window.removeEventListener("resize", inputBlur);
				inputBlur = function () {
					if (!this.oInput) {
						return;
					}
					var iBody = document.getElementsByTagName("body")[0].offsetHeight;
					var iWindow = window.screen.availHeight;
					var i = iBody / iWindow * 100;
					if (i > 80) {
						this.oInput.blur();
					}
				}.bind(this);
				window.addEventListener("resize", inputBlur, false);
			}

			this._inputHandler();
		}
	}, {
		key: "_inputHandler",
		value: function _inputHandler() {
			var aInput = document.querySelectorAll("input[type='text']", "input[type='email']", "input[type='password']", "input[type='number']");
			for (var i = 0, l = aInput.length; i < l; i++) {
				if (aInput[i].onfocus) {
					continue;
				}
				if (local.isAndroid) {
					aInput[i].onfocus = this._androidFocus.bind(this, aInput[i]);
					aInput[i].onblur = this._androidBlur.bind(this);
				} else {
					aInput[i].onfocus = this._iphoneFocus.bind(this, aInput[i]);
					aInput[i].onblur = this._iphoneBlur.bind(this);
				}
			}
		}
	}, {
		key: "_androidFocus",
		value: function _androidFocus(item) {
			if (this.blurTimer) {
				clearTimeout(this.blurTimer);
				this.blurTimer = null;
			}
			if (this.oInput) {
				return;
			}
			this.oInput = item;
			this.dom.className = this.dom.className + " input_focus";
			this.parentDom.style.height = local.iWindowHeight + "px";
		}
	}, {
		key: "_androidBlur",
		value: function _androidBlur() {
			var _this2 = this;

			this.blurTimer = setTimeout(function () {
				_this2.oInput = null;
				_this2.parentDom.style.height = "100%";
				_this2.dom.scrollTop = 0;
				_this2.dom.style.top = "0px";
				var arr = _this2.dom.className.split(" ");
				arr.splice(arr.indexOf("input_focus"), 1);
				_this2.dom.className = arr.join(" ");
			}, 200);
		}
	}, {
		key: "_iphoneFocus",
		value: function _iphoneFocus(item) {
			this.oInput = item;
			var c = this.dom.style.transform;
			var i = c.indexOf("(");
			var y = Number(c.slice(i + 1, -3));
			this.dom.className = this.dom.className + " input_focus";
			this.dom.style.top = Math.abs(y) + "px";
			this.dom.scrollTop = Math.abs(y);
		}
	}, {
		key: "_iphoneBlur",
		value: function _iphoneBlur() {
			this.oInput = null;
			var arr = this.dom.className.split(" ");
			arr.splice(arr.indexOf("input_focus"), 1);
			this.dom.className = arr.join(" ");
			this.dom.style.top = "0px";
			this.dom.scrollTop = 0;
		}
	}, {
		key: "_end",
		value: function _end() {
			var step = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 10;
			var diff = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

			if (this.cY > 0 + diff) {
				this._to(0, -(this.cY / step));
				return false;
			}
			if (this.diff) {
				if (this.cY < this.diff - diff) {
					this._to(this.diff, -(this.cY - this.diff) / step);
					return false;
				}
			}
			return true;
		}
	}, {
		key: "_transY",
		value: function _transY(y) {
			var s = "translateY(" + y + "px)";
			this.dom.style.webkitTransform = s;
			this.dom.style.mozTransform = s;
			this.dom.style.msTransform = s;
			this.dom.style.oTransform = s;
			this.dom.style.webkitTransform = s;
		}
	}, {
		key: "_goto",
		value: function _goto(y) {
			this.cY -= y / 2;
			this._transY(this.cY);
		}
	}, {
		key: "_autoRun",
		value: function _autoRun(y) {
			RAF(this._run.bind(this, y));
		}
	}, {
		key: "_run",
		value: function _run(y) {
			if (this.bStart) {
				this.endY = 0;return;
			}
			var b = this._end(iTopAndBottomStep, iTopAndBottomDiff);
			if (!b) return;
			y = y - y * .1;
			if (Math.abs(y) <= 1) {
				this._end(iTopAndBottomStep);
				return;
			}
			this.cY -= y;
			this._transY(this.cY);
			RAF(this._run.bind(this, y));
		}
	}, {
		key: "_to",
		value: function _to(y, step) {
			RAF(this._step.bind(this, y, step));
		}
	}, {
		key: "_step",
		value: function _step(y, step) {
			if (this.bStart) {
				return;
			}
			if (Math.abs(this.cY - y) < Math.abs(step)) {
				this._transY(y);
				return;
			}
			this.cY += step;
			this._transY(this.cY);
			if (this.cY === y) {
				return;
			}
			RAF(this._step.bind(this, y, step));
		}
	}]);
	return TouchScroll;
}();

exports.default = TouchScroll;
