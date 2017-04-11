/*!
 * @author liyuelong1020@gmail.com
 * @date 2016/6/6 006
 * @description Observe.js
 */

var Observe = (function() {

    Array.prototype.forEach = Array.prototype.forEach || function(callback) {
            for(var i = 0, len = this.length; i< len; i++){
                callback(this[i], i);
            }
        };

    // 判断是否是对象
    var isObject = function (obj) {
        return ({}).toString.call(obj) === "[object Object]"
    };
    // 判断是否是数组
    var isArray = Array.isArray || function (obj) {
            return ({}).toString.call(obj) === '[object Array]';
        };
    // 判断是否是函数
    var isFunction = function (obj) {
        return ({}).toString.call(obj) === "[object Function]"
    };

    // 对象遍历
    var forEachIn = function(object, callback) {
        for(var key in object){
            if(object.hasOwnProperty(key)){
                callback(key, object[key]);
            }
        }
    };

    var defineProperty = Object.defineProperty;
    var defineProperties = Object.defineProperties;
    try {
        // IE8下不支持定义对象
        defineProperty({}, '_', {
            value: 'test'
        })
    } catch (e) {
        // 旧版本浏览器
        if ('__defineGetter__' in {}) {
            defineProperty = function(obj, prop, desc) {
                if ('get' in desc) {
                    obj.__defineGetter__(prop, desc.get)
                }
                if ('set' in desc) {
                    obj.__defineSetter__(prop, desc.set)
                }
            };
            defineProperties = function(obj, props) {
                for (var prop in props) {
                    defineProperty(obj, prop, props[prop])
                }
                return obj
            };
        }
        else if (!defineProperties && window.VBArray) {
            // IE8以下使用vbscript
            window.execScript([
                'Function vb_global_eval(code)',
                'ExecuteGlobal(code)',
                'End Function'
            ].join('\n'), 'VBScript');

            defineProperties = function(obj, props) {
                var t = setTimeout(function(){});
                var className = 'VBClass' + t;
                var owner = {};
                var buffer = [];
                buffer.push(
                    'Class ' + className,
                    '\tPrivate [__data__], [__proxy__]',
                    '\tPublic Default Function [__const__](d, p)',
                    '\t\tSet [__data__] = d: set [__proxy__] = p',
                    '\t\tSet [__const__] = Me',
                    '\tEnd Function');
                for (var name in props) {
                    owner[name] = true;
                    buffer.push(
                        '\tPublic Property Let [' + name + '](val)',
                        '\t\tCall [__proxy__]([__data__], "' + name + '", val)',
                        '\tEnd Property',
                        '\tPublic Property Set [' + name + '](val)',
                        '\t\tCall [__proxy__]([__data__], "' + name + '", val)',
                        '\tEnd Property',
                        '\tPublic Property Get [' + name + ']',
                        '\tOn Error Resume Next',
                        '\t\tSet[' + name + '] = [__proxy__]([__data__],"' + name + '")',
                        '\tIf Err.Number <> 0 Then',
                        '\t\t[' + name + '] = [__proxy__]([__data__],"' + name + '")',
                        '\tEnd If',
                        '\tOn Error Goto 0',
                        '\tEnd Property')
                }
                buffer.push('End Class');
                buffer.push(
                    'Function ' + className + 'Factory(a, b)',
                    '\tDim o',
                    '\tSet o = (New ' + className + ')(a, b)',
                    '\tSet ' + className + 'Factory = o',
                    'End Function');
                window.vb_global_eval(buffer.join('\r\n'));

                return window[className + 'Factory'](props, function(props,name,value){
                    var fn = props[name];
                    if (arguments.length === 3) {
                        fn.set(value)
                    } else {
                        return fn.get()
                    }
                })
            }
        }
    }
    var Observe = function(target, callback) {
        this.callback = callback;        // 监听回调

        // 遍历属性
        var propArr = [];
        forEachIn(target, function(key) {
            propArr.push(key);
        });

        // 返回被包装的对象
        return this.watch(target, propArr);
    };
    Observe.prototype.rewrite = function(array) {
        // 如果是数组则监听数组修改方法
        var that = this;
        ["concat", "every", "filter", "forEach", "indexOf", "join",
            "lastIndexOf", "map", "pop", "push",
            "reduce", "reduceRight", "reverse",
            "shift", "slice", "some", "sort", "splice", "unshift",
            "toLocaleString","toString","size"].forEach(function(item, i) {
                if(isFunction(array[item])){
                    // 重写数组方法
                    array[item] = function () {
                        var arr = this;
                        var result = Array.prototype[item].apply(arr, Array.prototype.slice.call(arguments));
                        if(/^concat|pop|push|reverse|shift|sort|splice|unshift|size$/ig.test(item)) {
                            // 数组改动则重新监听
                            var propArr = [];
                            forEachIn(arr, function(key) {
                                !isFunction(arr[key]) && propArr.push(key);
                            });
                            that.callback(arr.length);
                            that.watch(arr, propArr);
                        }
                        return result;
                    };
                }
            });
    };
    Observe.prototype.watch = function(data, propArr) {

        var that = this;
        var props = {};

        // 缓存对象，用于存取值（不至于陷入死循环）
        var observeProps = {};

        if(isArray(data)){
            // 如果是数组则修改数组方法
            that.rewrite(data);
        }

        propArr.forEach(function(key) {
            observeProps[key] = data[key];
            props[key] = {
                get: function() {
                    return observeProps[key];
                },
                set: function(newValue) {
                    observeProps[key] = newValue;
                    that.callback(newValue);
                }
            };

            // 遍历对象
            if(isObject(data[key]) || isArray(data[key])){
                var subPropArr = [];

                forEachIn(data[key], function(key) {
                    subPropArr.push(key);
                });

                var observer = that.watch(data[key], subPropArr);
                if(isObject(data[key])){
                    // 在IE下定义后返回的是object，会覆盖数组方法，故只修改 object
                    observeProps[key] = data[key] = observer;
                }
            }
        });

        return defineProperties(data, props);
    };

    return  Observe;

})();
