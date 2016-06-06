/*!
 * @author liyuelong1020@gmail.com
 * @date 2016/6/6 006
 * @description Observe.js
 */

var Observe = (function() {

    Object.prototype.forEachIn = function(callback) {
        for(var key in this){
            if(this.hasOwnProperty(key)){
                callback(key, this[key]);
            }
        }
    };

    Array.prototype.forEach = Array.prototype.forEach || function(callback) {
        for(var i = 0, len = this.length; i< len; i++){
            callback(this[i], i);
        }
    };

    // �ж��Ƿ��Ƕ���
    var isObject = function (obj) {
        return ({}).toString.call(obj) === "[object Object]"
    };
    // �ж��Ƿ�������
    var isArray = Array.isArray || function (obj) {
            return ({}).toString.call(obj) === '[object Array]';
        };
    // �ж��Ƿ��Ǻ���
    var isFunction = function (obj) {
        return ({}).toString.call(obj) === "[object Function]"
    };

    var defineProperty = Object.defineProperty;
    var defineProperties = Object.defineProperties;
    try {
        // IE8�²�֧�ֶ������
        defineProperty({}, '_', {
            value: 'test'
        })
    } catch (e) {
        // �ɰ汾�����
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
            // IE8����ʹ��vbscript
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
        this.callback = callback;        // �����ص�

        // ��������
        var propArr = [];
        target.forEachIn(function(key) {
            propArr.push(key);
        });

        // ���ر���װ�Ķ���
        return this.watch(target, propArr);
    };
    Observe.prototype.rewrite = function(array) {
        // �������������������޸ķ���
        var that = this;
        ["concat", "every", "filter", "forEach", "indexOf", "join",
            "lastIndexOf", "map", "pop", "push",
            "reduce", "reduceRight", "reverse",
            "shift", "slice", "some", "sort", "splice", "unshift",
            "toLocaleString","toString","size"].forEach(function(item, i) {
                if(isFunction(array[item])){
                    // ��д���鷽��
                    array[item] = function () {
                        var result = Array.prototype[item].apply(this, Array.prototype.slice.call(arguments));
                        if(/^concat|pop|push|reverse|shift|sort|splice|unshift|size$/ig.test(item)) {
                            // ����Ķ������¼���
                            var propArr = [];
                            this.forEachIn(function(key) {
                                !isFunction(this[key]) && propArr.push(key);
                            });
                            that.callback(this.length);
                            that.watch(this, propArr);
                        }
                        return result;
                    };
                }
            });
    };
    Observe.prototype.watch = function(data, propArr) {

        var that = this;
        var props = {};

        // ����������ڴ�ȡֵ��������������ѭ����
        var observeProps = {};

        if(isArray(data)){
            // ������������޸����鷽��
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

            // ��������
            if(isObject(data[key]) || isArray(data[key])){
                var subPropArr = [];

                data[key].forEachIn(function(key) {
                    subPropArr.push(key);
                });

                var observer = that.watch(data[key], subPropArr);
                if(isObject(data[key])){
                    // ��IE�¶���󷵻ص���object���Ḳ�����鷽������ֻ�޸� object
                    observeProps[key] = data[key] = observer;
                }
            }
        });

        return defineProperties(data, props);
    };

    return  Observe;

})();
