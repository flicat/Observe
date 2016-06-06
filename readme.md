observe.js
===========
用于观察任意对象的任意变化的类库，兼容IE。

> 观察任意复杂对象：
> ```
>     var data = new Observe({
>         arr: [0,1,2,3,4,5,6],
>         test: {
>             a: 12,
>             b: 23
>         },
>         value: 456,
>         method: function() {
>             return 789
>         }
>     }, function(newVal) {
>         console.log(newVal);
>     });
>
>    data.test.a = 'test';
>    data.value = 'value';
>    data.arr[0] = 99;
>    data.arr.push(10);
>
>    setTimeout(function() {
>        data.value = 789;
>    }, 1000);
>
> ```
                      