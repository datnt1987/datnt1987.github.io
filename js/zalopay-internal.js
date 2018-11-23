/*! zalopay 09-06-2017 */
(function(root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else if (typeof define === 'function' && (define.amd || define.cmd)) {
    define(factory);
  } else {
    root.ZaloPayInternal = root.ZaloPayInternal || {};
    factory.call(root, root.ZaloPayInternal);
  }
})(this, function(ZaloPayInternal) {
  
  ZaloPayInternal = ZaloPayInternal || {};
  ZaloPayInternal.ua = navigator.userAgent;
  ZaloPayInternal.jsVersion = '1.0.0';
  ZaloPayInternal.isDebug = true;
  ZaloPayInternal.isZaloPay = (function() {
    return ZaloPayInternal.ua.indexOf('ZaloPayClient') > -1;
  })();
  if (!ZaloPayInternal.isZaloPay) {
    writeLog('warn', 'Run in ZaloPayClient please!');
  }
  ZaloPayInternal.appVersion = (function() {
    if (ZaloPayInternal.isZaloPay) {
      var version = ZaloPayInternal.ua.match(/ZaloPayClient\/(.*)/);
      return version && version.length ? version[1] : '';
    }
  })();
  ZaloPayInternal.appInfo = {
    name: 'ZaloPayInternal',
    isZaloPay: ZaloPayInternal.isZaloPay,
    jsVersion: ZaloPayInternal.jsVersion,
    appVersion: ZaloPayInternal.appVersion
  };
  ZaloPayInternal.on = function(event, fn) {
    event.split(/\s+/g).forEach(function(eventName) {
      document.addEventListener(eventName, fn, false);
    });
  };
  ZaloPayInternal.call = function() {
    var args = [].slice.call(arguments);
    if (window.ZaloPayInternalJSBridge && window.ZaloPayInternalJSBridge.call) {
      var name = args[0],
        opt = args[1] || {},
        cb = args[2];
      if (!isStr(name)) {
        writeLog('error', 'ZaloPayInternal.call', 'Request undefined function!');
        return;
      }
      if (cb === undefined && isFn(opt)) {
        cb = opt;
        opt = {};
      }
      if (!isObj(opt)) {
        writeLog('error', 'ZaloPayInternal.call', 'Request undefined options!');
        return;
      }
      var _callback = cb;
      cb = function(result) {
        result = checkError(result, name);
        _callback && _callback(result);
      };
      'writeLog' !== name &&
        writeLog('info', 'ZaloPayInternalJSBridge.call', 'thucmjs ' + name, opt, _callback);
        // writeLog('info', 'ZaloPayInternalJSBridge.call', 'thucmjs test' + name);
      window.ZaloPayInternalJSBridge.call(name, opt, cb);
    } else {
      ZaloPayInternal._apiQueue = ZaloPayInternal._apiQueue || [];
      ZaloPayInternal._apiQueue.push(args);
    }
  };
  ZaloPayInternal._ready = function(fn) {
    if (window.ZaloPayInternalJSBridge && window.ZaloPayInternalJSBridge.call) {
      fn && fn();
    } else {
      ZaloPayInternal.on('ZaloPayInternalJSBridgeReady', fn);
    }
  };
  ZaloPayInternal.ready = ZaloPayInternal.ready || ZaloPayInternal._ready;

  /**
   * ZaloPay.scanInfo(appid, cb);
   */
  ZaloPayInternal.getUserInfo = function(appid, cb) {
    if (!isFn(cb) || !isNumber(appid)) {
      writeLog(
        'error',
        'ZaloPay.getUserInfo',
        'Received invalid function callback'
      );
      return;
    }
    writeLog(
      'info',
      'ZaloPay.getUserInfo',
      'Received UserInfo in function callback'
    );
    ZaloPayInternal.call('getUserInfo', { appid: appid }, cb);
  };

  ZaloPayInternal.requestAnimationFrame = function(cb) {
    var raf =
      window.requestAnimationFrame ||
      window.webkitRequestAnimationFrame ||
      window.mozRequestAnimationFrame;
    if (raf) {
      return raf(cb);
    } else {
      writeLog('error', 'ZaloPayInternal.requestAnimationFrame', 'Not supported!');
    }
  };

  ZaloPayInternal._ready(function() {
    writeLog('info', 'ZaloPayJS Ready!');
    var apiQueue = ZaloPayInternal._apiQueue || [];

    function next() {
      ZaloPayInternal.requestAnimationFrame(function() {
        var args = apiQueue.shift();
        ZaloPayInternal.call.apply(null, args);
        if (apiQueue.length) next();
      });
    }
    !!apiQueue.length && next();
  });

  [
    'appinfo',
    'showLoading',
    'hideLoading',
    'closeWindow',
    'showDialog',
    'pushView'
  ].forEach(function(methodName) {
    ZaloPay[methodName] = function() {
      var args = [].slice.call(arguments);
      ZaloPay.call.apply(null, [methodName].concat(args));
    };
  });

  function isAndroid() {
    return /android/i.test(ZaloPayInternal.ua);
  }

  function isIOS() {
    return /iphone|ipad|ipod/i.test(ZaloPayInternal.ua);
  }

  function isArr(fn) {
    return 'array' === type(fn);
  }

  function isFn(fn) {
    return 'function' === type(fn);
  }

  function isStr(str) {
    return 'string' === type(str);
  }

  function isObj(o) {
    return 'object' === type(o);
  }

  function isNumber(num) {
    return 'number' === type(num);
  }

  function type(obj) {
    return Object.prototype.toString
      .call(obj)
      .replace(/\[object (\w+)\]/, '$1')
      .toLowerCase();
  }

  function writeLog() {
    var time = +new Date();
    var arg = [].slice.call(arguments);
    var type = arg[0].toLowerCase().trim();
    switch (type) {
      case 'error':
        arg.splice(0, 1);
        arg.length === 1
          ? console.error(time, arg[0])
          : console.error(time, arg);
        break;
      case 'warn':
        arg.splice(0, 1);
        arg.length === 1 ? console.warn(time, arg[0]) : console.warn(time, arg);
        break;
      case 'info':
        arg.splice(0, 1);
        arg.length === 1 ? console.log(time, arg[0]) : console.log(time, arg);
        break;
      default:
        type = 'info';
        arg.length === 1 ? console.log(time, arg[0]) : console.log(time, arg);
        break;
    }
    if (
      ZaloPayInternal.isDebug &&
      ZaloPayInternal.call &&
      window.ZaloPayInternalJSBridge &&
      window.ZaloPayInternalJSBridge.call
    ) {
      var opt = {
        type: type,
        time: time,
        data: JSON.stringify(arg)
      };
      ZaloPayInternal.call('writeLog', opt);
    }
  }

  function checkError(result, name) {
    result = result || {};
    result.errorCode = result.error || 0;
    if (result.error !== 1) {
      writeLog(
        'error',
        name +
          ': errorCode[' +
          result.errorCode +
          '], message[' +
          result.errorMessage +
          ']'
      );
    } else {
      // writeLog(
      //   'info',
      //   name +
      //     ': errorCode[' +
      //     result.errorCode +
      //     '], message[' +
      //     result.errorMessage +
      //     ']'
      // );
    }
    return result;
  }

  function compareVersion(targetVersion) {
    var appVersion = ZaloPayInternal.appVersion.split('.');
    targetVersion = targetVersion.split('.');
    for (var i = 0, n1, n2; i < appVersion.length; i++) {
      n1 = parseInt(targetVersion[i], 10) || 0;
      n2 = parseInt(appVersion[i], 10) || 0;
      if (n1 > n2) return -1;
      if (n1 < n2) return 1;
    }
    return 0;
  }
  return ZaloPayInternal;
});

