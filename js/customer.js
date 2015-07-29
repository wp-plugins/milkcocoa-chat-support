// imported_customer_value.uuid, imported_customer_value.app_id, imported_customer_value.token, imported_customer_value.leaveMessage, imported_customer_value.activeAction, imported_customer_value.notActiveAction, imported_customer_value.inputPlaceholder


/* ==========================================================================
   Helpers
   ========================================================================== */

(function (global) {

  // Helper Functions, IE8+

  'use strict';

  function MCSHelper(){

  }

  // Get element(s) by CSS selector:
  MCSHelper.prototype.qs = function (selector, scope) {
    return (scope || document).querySelector(selector);
  };
  MCSHelper.prototype.qsa = function (selector, scope) {
    return (scope || document).querySelectorAll(selector);
  };

  // addEventListener wrapper
  MCSHelper.prototype.on = function (target, type, callback, useCapture) {
    if (target.addEventListener) {
      target.addEventListener(type, callback, !!useCapture);
    } else {
      target.attachEvent('on' + type, function(){
        callback.call(target);
      });
    }
  };

  // Attach a handler to event for all elements that match the selector,
  // now or in the future, based on a root element
  MCSHelper.prototype.delegate = function (target, selector, type, handler) {

    var that = this;

    function dispatchEvent(event) {
      var targetElement = event.target;
      var potentialElements = that.qsa(selector, target);
      var hasMatch = Array.prototype.indexOf.call(potentialElements, targetElement) >= 0;

      if (hasMatch) {
        handler.call(targetElement, event);
      }
    }

    // https://developer.mozilla.org/en-US/docs/Web/Events/blur
    var useCapture = type === 'blur' || type === 'focus';

    that.on(target, type, dispatchEvent, useCapture);
  };

  // Find the element's parent with the given tag name:
  // $parent(qs('a'), 'div');
  MCSHelper.prototype.parent = function (element, tagName) {
    if (!element.parentNode) {
      return;
    }
    if (element.parentNode.tagName.toLowerCase() === tagName.toLowerCase()) {
      return element.parentNode;
    }
    return this.parent(element.parentNode, tagName);
  };

  // Toggle Class
  MCSHelper.prototype.toggleClass = function (el, CN) {
    if (el.classList) {
      el.classList.toggle(CN);
    } else {
        var classes = el.className.split(' ');
        var existingIndex = -1;
        for (var i = classes.length; i--;) {
          if (classes[i] === CN)
            existingIndex = i;
        }

        if (existingIndex >= 0)
          classes.splice(existingIndex, 1);
        else
          classes.push(CN);

      el.className = classes.join(' ');
    }
  };

  // Remove Class
  MCSHelper.prototype.removeClass = function(el, CN) {
    if (el.classList){
      el.classList.remove(CN);
    }
    else{
      el.className = el.className.replace(new RegExp('(^|\\b)' + CN.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
    }
  };

  // Add Class
  MCSHelper.prototype.addClass = function(el, CN) {
    if (el.classList) el.classList.add(CN);
    else el.className += ' ' + CN;
  };

  MCSHelper.prototype.replace = function(str, before, after){
    var reg = new RegExp(before, "g");
    return str.replace(reg, after);
  };


  MCSHelper.prototype.getOffset = function( el ) {

    var offsetTop = 0, offsetLeft = 0;
    var offsetWidth = 0, offsetHeight = 0;

    offsetWidth = el.offsetWidth;
    offsetHeight = el.offsetHeight;

    do {
      if ( !isNaN( el.offsetTop ) ) {
        offsetTop += el.offsetTop;
      }
      if ( !isNaN( el.offsetLeft ) ) {
        offsetLeft += el.offsetLeft;
      }
    } while( el = el.offsetParent )

    return {
      top : offsetTop,
      left : offsetLeft,
      width : offsetWidth,
      height : offsetHeight
    };
  };


  MCSHelper.prototype.getDevice = function () {

    var ua = {};
    ua.name = window.navigator.userAgent.toLowerCase();

    ua.isIE = (ua.name.indexOf('msie') >= 0 || ua.name.indexOf('trident') >= 0);
    ua.isiPhone = ua.name.indexOf('iphone') >= 0;
    ua.isiPod = ua.name.indexOf('ipod') >= 0;
    ua.isiPad = ua.name.indexOf('ipad') >= 0;
    ua.isAndroid = ua.name.indexOf('android') >= 0;

    return {
      isIE: ua.isIE,
      isiPhone: ua.isiPhone,
      isiPod: ua.isiPod,
      isiPad: ua.isiPad,
      isiOS: (ua.isiPhone || ua.isiPod || ua.isiPad),
      isAndroid: ua.isAndroid,
      isTablet: (ua.isiPad || (ua.isAndroid && ua.name.indexOf('mobile') < 0)),
      isPC: !(ua.isiPad || ua.isiPhone || ua.isAndroid),
      isMobile: (ua.isiPad || ua.isiPhone || ua.isAndroid)
    };

  };

  // Allow for looping on nodes by chaining:
  // qsa('.foo').forEach(function () {})
  NodeList.prototype.forEach = Array.prototype.forEach;

  // Export to window
  global.MCSHelper = MCSHelper;

})(window);


/* ==========================================================================
   Store
   ========================================================================== */

(function (global) {
  'use strict';

  function MCSStore(milkcocoa, uuid){
    this.ds = milkcocoa.dataStore('master').child(uuid);
  }

  MCSStore.prototype.find = function (id, callback) {

    var that = this;
    callback = callback || function () {};

    this.ds.get(id, function(err,datum){
      callback.call(that, datum);
    });

  };

  MCSStore.prototype.findAll = function (callback) {

    var that = this;
    callback = callback || function () {};

    // NOTE: message limit -> 999
    this.ds.stream().size(999).sort('asc').next(function(err,data){
      callback.call(that, data);
    });

  };

  MCSStore.prototype.save = function (updateData, callback, id) {

    var that = this;
    callback = callback || function () {};

    // If an ID was actually given, update each property
    if (id) {
      this.ds.set(id, updateData);

      this.ds.get(id, function(err,datum){
        callback.call(that, datum);
      });

    } else {
      this.ds.push(updateData, function(err, pushed){
        callback.call(that, pushed);
      });
    }
  };

  MCSStore.prototype.remove = function (id, callback) {

    var that = this;
    callback = callback || function () {};

    this.ds.remove(id);

    this.ds.stream().size(999).next(function(err,data){
      callback.call(that, data);
    });
  };


  MCSStore.prototype.drop = function (callback) {

    var that = this;
    callback = callback || function () {};

    this.ds.stream().size(999).next(function(err,data){
      data.forEach(function(d,i){
        that.ds.remove(d.id);
      })
      callback.call(that, []);
    });
  };

  // Export to window
  global.MCSStore = MCSStore;

})(window);


/* ==========================================================================
   Model
   ========================================================================== */

(function (global) {
  'use strict';

  function MCSModel(store, uuid, milkcocoa){
    this.store = store;
    this.uuid = uuid;
    this.milkcocoa = milkcocoa;
  }

  MCSModel.prototype.createChat = function(callback){

    var that = this;
    callback = callback || function () {};

    var newChat = {
      id: that.uuid,
      isclose: false,
      unread: []
    };

    that.milkcocoa.dataStore('operator').stream().next(function(err, data){

      // create operators option
      data.forEach(function (d,i) {
        that.store.save({
          isclose: false,
          unread: []
        }, function () {}, '_options-'+d.id);
      });
      // create customer option
      that.store.save(newChat, callback, '_options');
    });

  };

  MCSModel.prototype.createMessage = function(content, callback){


    var that = this;
    callback = callback || function () {};

    var newMessage = {
      content: content.trim(),
      publisher: 'customer'
    };

    this.store.save(newMessage, callback);
  };

  MCSModel.prototype.pushUnread = function(content, data, callback){

    var that = this;
    callback = callback || function () {};

    data.forEach(function (d,i) {
      that.store.find('_options-'+d.id, function (datum){
        datum.value.unread.push(content.id);
        that.store.save(datum.value, function(){}, '_options-'+d.id);
      });
    });
  };

  MCSModel.prototype.getData = function (callback) {
    callback = callback || function () {};
    this.store.findAll(callback);
  };

  MCSModel.prototype.getCustomerOption = function (callback) {
    callback = callback || function () {};
    this.store.find('_options', callback);
  };


  MCSModel.prototype.updateChat = function (optionName, data, callback) {

    var that = this;
    callback = callback || function () {};

    that.store.find('_options', function (datum){
      datum.value[optionName] = data;
      that.store.save(datum.value, callback, '_options');
    });
  };


  // MCSModel.prototype.removeChat = function (callback) {
  //   this.store.drop(callback);
  // };

  MCSModel.prototype.getUnreadCount = function (callback) {
    this.store.find('_options', function (datum){
      callback(datum.value.unread.length);
    });
  };


  // Export to window
  global.MCSModel = MCSModel;

})(window);

/* ==========================================================================
   Template
   ========================================================================== */

(function (global) {
  'use strict';

  var htmlEscapes = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    '\'': '&#x27;',
    '`': '&#x60;'
  };

  var escapeHtmlChar = function (chr) {
    return htmlEscapes[chr];
  };

  var reUnescapedHtml = /[&<>"'`]/g,
      reHasUnescapedHtml = new RegExp(reUnescapedHtml.source);

  var escape = function (string) {
    return (string && reHasUnescapedHtml.test(string))
      ? string.replace(reUnescapedHtml, escapeHtmlChar)
      : string;
  };

  function MCSTemplate(helper) {
    this.h = helper;
    this.defaultTemplate
    = '<div class="mcs-message mcs-message--{{publisher}}">'
    +   '<div class="mcs-message__inner mcs-theme-{{publisher}}">{{content}}</div>'
    + '</div>';
  }

  MCSTemplate.prototype.show = function (data) {
    var i, l;
    var view = '';

    for (i = 0, l = data.length; i < l; i++) {

      if(data[i].value.content){

        var template = this.defaultTemplate;

        // only customer side
        if (data[i].value.publisher === 'operator') var publisher = 'opp';
        else if (data[i].value.publisher === 'customer') var publisher = 'you';

        template = this.h.replace(template, '{{publisher}}', publisher);
        template = template.replace('{{content}}', escape(data[i].value.content));

        view = view + template;
      }
    }

    return view;
  };

  MCSTemplate.prototype.showBody = function (value) {

    var isclose = value.isclose ? 'is-close' : '';
    var iscloseIcon = value.isclose ? '□' : '_';

    var view
    = '<div class="mcs-chat is-open '+isclose+'">'
    +   '<div class="mcs-chat__inner mcs-theme-back">'
    +     '<div class="mcs-chat__header"><span class="mcs-chat__title mcs-theme-title">'+value.id+'</span><span class="mcs-chat__control"><span class="mcs-chat__count mcs-count mcs-theme-count">'+value.unread+'</span><span class="mcs-chat__controlItem mcs-hide-chat mcs-theme-hide">'+iscloseIcon+'</span><span class="mcs-chat__controlItem mcs-delete">×</span></span></div>'
    +     '<div class="mcs-chat__body mcs-body">'
    +       '<div class="mcs-chat__messages mcs-messages" data-message="'+imported_customer_value.leaveMessage+'"><div class="mcs-chat__messagesInner mcs-messages-inner"></div></div>'
    +       '<hr class="mcs-chat__hr mcs-theme-hr">'
    +       '<input name="message" type="text" class="mcs-chat__input mcs-new-message mcs-theme-input" placeholder="'+imported_customer_value.inputPlaceholder+'"></input>'
    +     '</div>'
    +   '</div>'
    + '</div>';


    return view;
  };

  // Export to window
  global.MCSTemplate = MCSTemplate;

})(window);


/* ==========================================================================
   View
   ========================================================================== */

(function (global) {
  'use strict';

  function MCSView(template, helper, uuid){

    this.template = template;
    this.h = helper;
    this.uuid = uuid;

    this.DELETE_KEY = 8;
    this.ENTER_KEY = 13;
    this.CONTROL_KEY = 17;
    this.ESCAPE_KEY = 27;
    this.OPTION_KEY = 18;
    this.COMMAND_KEY = 224;

    this.writingIconisShown = false;

    this.$chat = this.h.qs('#mcs-chat-container');
  }

  MCSView.prototype._highlightUnread = function (count) {

    var chat = this.h.qs('.mcs-chat', this.$chat);

    if(count > 0) this.h.addClass(chat, 'is-highlighten');
    else this.h.removeClass(chat, 'is-highlighten');
  };

  MCSView.prototype._writingIcon = function (content) {

    if(!this.writingIconisShown && (content != '') ){
      var pastEl = document.getElementById('mcs-writing-icon-'+this.uuid);
      this.writingIconisShown = true;
      if(pastEl) return;

      var el = document.createElement('div');
      el.id = 'mcs-writing-icon-'+this.uuid;
      el.className = 'mcs-message mcs-message--opp';
      el.innerHTML = '<div class="mcs-message__inner mcs-theme-opp"><i class="mcs-message__writingIcon"></i></div>';
      this.h.qs('.mcs-messages-inner', this.$chat).appendChild(el);
    }
    if (content == ''){
      var el = document.getElementById('mcs-writing-icon-'+this.uuid);
      if(el) this.h.qs('.mcs-messages-inner', this.$chat).removeChild(el);
      this.writingIconisShown = false;
    }
  };

  MCSView.prototype._toggleChat = function (datumValue) {

    var chat = this.h.qs('.mcs-chat', this.$chat);

    if(datumValue.isclose) var isclose = 'none';
    else var isclose = 'block';
    this.h.qs('.mcs-body', chat).style.display = isclose;

    if(datumValue.isclose) this.h.addClass(chat, 'is-close');
    else this.h.removeClass(chat, 'is-close');
  };

  MCSView.prototype._scrollToBottom = function () {
    this.h.qs('.mcs-messages', this.$chat).scrollTop = this.h.getOffset(this.h.qs('.mcs-messages-inner', this.$chat)).height;
  };

  // MCSView.prototype._otherEditing = function (create) {
  //   if(create){
  //     var el = document.createElement('div');
  //     el.id = 'mcs-screen-'+this.uuid;
  //     el.className = 'mcs-chat__screen';
  //     el.innerHTML = '<div class="mcs-chat__screenText">他のオペレーターが入力中</div>';
  //     this.h.qs('.mcs-chat', this.$chat).appendChild(el);
  //   } else {
  //     var el = this.h.qs('#mcs-screen-'+this.uuid, this.$chat);
  //     if(el) this.h.qs('.mcs-chat', this.$chat).removeChild(el);
  //   }
  // };


  MCSView.prototype.render = function (viewCmd, parameter) {
    var that = this;

    var viewCommands = {
      showMessages: function () {
        that.h.qs('.mcs-messages-inner', that.$chat).innerHTML = that.template.show(parameter);
      },
      // showBody: function () {
      //   that.$chat.innerHTML = that.template.showBody(parameter.customerOption.value, parameter.option.value);
      // },
      toggleChat: function () {
        that._toggleChat(parameter);
      },
      // removeChat: function () {
      //   that.$chat.style.display = 'none';
      // },
      updateUnreadCount: function () {
        that.h.qs('.mcs-count', that.$chat).innerHTML = parameter;
      },
      highlightUnread: function () {
        that._highlightUnread(parameter);
      },
      clearNewMessage: function () {
        that.h.qs('.mcs-new-message', that.$chat).value = '';
      },
      switchChatHide: function () {
        that.h.qs('.mcs-hide-chat', that.$chat).innerHTML = parameter.isclose ? '' : '_';
      },
      writingIcon: function () {
        that._writingIcon(parameter);
      },
      scrollToBottom: function(){
        that._scrollToBottom();
      }
      // otherEditing: function(){
      //   that._otherEditing(parameter);
      // }
    };

    viewCommands[viewCmd]();
  };


  MCSView.prototype.bind = function (event, handler) {
    var that = this;

    if (event === 'newMessage') {
      that.h.delegate(that.$chat, '.mcs-new-message', 'keypress', function (event) {
        if (event.keyCode === that.ENTER_KEY){
          handler(that.h.qs('.mcs-new-message', that.$chat).value);
        }
      });

    } else if (event === 'unreadClear') {
      that.h.on(that.$chat, 'click', function () {
        handler();
      });

    } else if (event === 'chatHide') {
      that.h.delegate(that.$chat, '.mcs-hide-chat', 'click', function (e) {
        handler();
        e.stopPropagation();
      });

    // } else if (event === 'chatRemove') {
    //   that.h.delegate(that.$chat, '.mcs-delete', 'click', function () {
    //     if( window.confirm('削除したチャットは復元できませんが、よろしいでしょうか？') ) handler();
    //   });

    } else if (event === 'chatShow') {
      that.h.on(that.h.qs('.mcs-header'), 'click', function () {
        handler();
      });

    } else if (event === 'nowWriting') {
      that.h.delegate(that.$chat, '.mcs-new-message', 'keydown', function (event) {
        if(
          (event.keyCode !== that.DELETE_KEY) &&
          (event.keyCode !== that.ENTER_KEY) &&
          (event.keyCode !== that.CONTROL_KEY) &&
          (event.keyCode !== that.ESCAPE_KEY) &&
          (event.keyCode !== that.OPTION_KEY)
        ) {

          if( String.fromCharCode(event.keyCode).match(/[A-Z0-9]/) &&
              !that.commandKeyFlag && !that.optionKeyFlag && !that.controlKeyFlag
               ){
            handler('force');
          }

        } else if(event.keyCode === that.COMMAND_KEY){
          that.commandKeyFlag = true;
        } else if(event.keyCode === that.OPTION_KEY){
          that.optionKeyFlag = true;
        } else if(event.keyCode === that.CONTROL_KEY){
          that.controlKeyFlag = true;
        }
      });

      that.h.delegate(that.$chat, '.mcs-new-message', 'keyup', function (event) {
        if(
          (event.keyCode !== that.CONTROL_KEY) &&
          (event.keyCode !== that.ESCAPE_KEY) &&
          (event.keyCode !== that.OPTION_KEY) &&
          (event.keyCode !== that.COMMAND_KEY)
        ) {
          handler(that.h.qs('.mcs-new-message', that.$chat).value);
        } else if(event.keyCode === that.COMMAND_KEY){
          that.commandKeyFlag = false;
        } else if(event.keyCode === that.OPTION_KEY){
          that.optionKeyFlag = false;
        } else if(event.keyCode === that.CONTROL_KEY){
          that.controlKeyFlag = false;
        }
      });

    // } else if (event === 'inputFocus') {
    //   that.h.delegate(that.$chat, '.mcs-new-message', 'focus', function () {
    //     handler();
    //   });

    // } else if (event === 'inputBlur') {
    //   that.h.delegate(that.$chat, '.mcs-new-message', 'blur', function () {
    //     setTimeout(function(){
    //       handler();
    //     },300);
    //   });

    } else if (event === 'windowbeforeUnload') {
      if(that.h.getDevice().isiOS){
        that.h.on(window, 'pagehide', function() {
          handler();
        });
      } else {
        that.h.on(window, 'beforeunload', function() {
          handler();
        });
      }
    }
  };

  // Export to window
  global.MCSView = MCSView;

})(window);

/* ==========================================================================
   Controller
   ========================================================================== */

(function (global) {
  'use strict';

  function MCSController(model, view, helper, uuid, milkcocoa){

    var that = this;

    that.model = model;
    that.view = view;
    that.h = helper;
    that.uuid = uuid;
    that.milkcocoa = milkcocoa;
    that.ds = milkcocoa.dataStore('master').child(uuid);

    that.myself = false;
    that.currentChat = false;

    that.view.bind('newMessage', function (content) {
      that.myself = true;
      that.addMessage(content);
    });

    that.view.bind('unreadClear', function () {
      that.clearUnread();
    });

    that.view.bind('chatHide', function () {
      that.toggleChat();
    });

    that.view.bind('chatShow', function () {
      that.toggleChat();
    });

    // that.view.bind('chatRemove', function () {
    //   that.removeChat();
    // });

    that.view.bind('inputFocus', function () {
      that.myself = true;
      that.currentChat = true;
    });

    that.view.bind('inputBlur', function () {
      that.myself = true;
      that.currentChat = false;
    });

    that.view.bind('nowWriting', function (content) {
      that.ds.send({nowWriting: true, publisher: 'customer', content: content});
    });

    that.view.bind('windowbeforeUnload', function () {
      that.ds.send({nowWriting: true, publisher: 'customer', content: ''});
    });

    that.ds.on('push', function(pushed){
      that.subscribeMessage(pushed);
    });

    that.ds.on('send', function(sent){
      if(sent.value.nowWriting && (sent.value.publisher === 'operator') ) that._showWritingIcon(sent.value.content);
    });

    // that.ds.on('send', function(sent){
    //   if(that.myself){
    //     that.myself = !that.myself;
    //   } else {
    //     if(sent.value.hasOwnProperty('nowFocusing')) that.view.render('otherEditing',sent.value.nowFocusing);
    //   }
    // });

    // that.milkcocoa.dataStore('index').on('remove', function(removed){
    //   if(that.myself){
    //     that.myself = !that.myself;
    //   } else {
    //     if(removed.id === that.uuid) that.removeChat();
    //   }
    // });
  }

  MCSController.prototype.androidCallback = function(cb) {
    if(this.h.getDevice().isAndroid) setTimeout(cb, 200);
    else cb();
  }

  MCSController.prototype.showAll = function () {
    var that = this;
    that.androidCallback(function () {
      that.model.getData(function (data) {
        that.view.render('showMessages', data);
        that.view.render('scrollToBottom');
      });
    });
  };

  // MCSController.prototype.showBody = function () {
  //   var that = this;
  //   that.model.geCustomertOption(function (option) {
  //       that.view.render('showBody', option);
  //       that.showAll();
  //       that.updateUnreadView();
  //   });
  // };

  MCSController.prototype.createChat = function () {

    var that = this;

    that.model.createChat(function(){
      that.showAll();
      that.setUnread();
      that.updateUnreadView();
      that.updateIsCloseView();
      that.milkcocoa.dataStore('index').set(that.uuid,{});
    })
  };

  MCSController.prototype.addMessage = function (content) {

    var that = this;

    if (content.trim() === '') {
      return;
    }

    that.model.createMessage(content, function (pushed) {

      that._afterNewMessage();

      that.milkcocoa.dataStore('operator').stream().next(function(err, data){
        that.model.pushUnread(pushed, data, '');
      });
    });
  };

  MCSController.prototype.subscribeMessage = function (pushed) {

    var that = this;

    if(pushed.value.publisher === 'operator'){
      that._afterNewMessage();
      if(!that.currentChat) that.unread.push(pushed.id);
      that.model.updateChat('unread', that.unread, function () {
        that.updateUnreadView();
      });

    } else {
      if(that.myself){
        that.myself = !that.myself;
      } else {
        that.showAll();
      }
    }
  }

  MCSController.prototype.clearUnread = function () {

    var that = this;

    that.unread = [];

    that.model.updateChat('unread', that.unread, function () {
      that.updateUnreadView();
    });
  };

  MCSController.prototype.toggleChat = function () {

    var that = this;
    that.model.getCustomerOption(function(datum){
      that.model.updateChat('isclose', !datum.value.isclose, function (getDatum) {
        if(getDatum.value.isclose === datum.value.isclose) getDatum.value.isclose = !getDatum.value.isclose;
        that.view.render('toggleChat', getDatum.value);
        that.view.render('switchChatHide', getDatum.value);
        that.view.render('scrollToBottom');
      });
    });

  };

  MCSController.prototype.removeChat = function () {

    var that = this;

    that.model.removeChat(function(){
      that.milkcocoa.dataStore('index').remove(that.uuid);
      that.view.render('removeChat');
    })
  };

  MCSController.prototype.setUnread = function () {
    var that = this;
    that.model.getCustomerOption(function(datum){
      that.unread = datum.value.unread;
    });
  };

  MCSController.prototype._afterNewMessage = function () {
    this.view.render('clearNewMessage');
    this.showAll();
  };

  MCSController.prototype.updateUnreadView = function () {

    var that = this;

    that.model.getUnreadCount(function (count) {
      that.view.render('updateUnreadCount', count);
      that.view.render('highlightUnread', count);
    });
  };

  MCSController.prototype.updateIsCloseView = function () {

    var that = this;
    that.androidCallback(function () {
      that.model.getCustomerOption(function(datum){
        that.view.render('toggleChat', datum.value);
        that.view.render('switchChatHide', datum.value);
        that.view.render('scrollToBottom');
      });
    });
  };

  MCSController.prototype._showWritingIcon = function (content) {

    var that = this;

    that.view.render('writingIcon', content);
    that.view.render('scrollToBottom');

  };


  // Export to window
  global.MCSController = MCSController;

})(window);

/* ==========================================================================
   Main
   ========================================================================== */

(function () {
  'use strict';

  var milkcocoa = new MilkCocoa(imported_customer_value.app_id+'.mlkcca.com');
  var h = new MCSHelper();
  var uuid = imported_customer_value.uuid;
  var operator = {};
  var isShown = false;
  var limitOver = false;

  function MilkcocoaSupportChat(uuid, milkcocoa) {
    this.helper = new MCSHelper();
    this.store = new MCSStore(milkcocoa, uuid);
    this.model = new MCSModel(this.store, uuid, milkcocoa);
    this.template = new MCSTemplate(this.helper);
    this.view = new MCSView(this.template, this.helper, uuid);
    this.controller = new MCSController(this.model, this.view, this.helper, uuid, milkcocoa);
  }

  h.on(window, 'load', function(){

    milkcocoa.onError(function(){
      document.getElementById('mcs-chat-container').style.display = 'none';
    })

    var $chatInner = h.qs('.mcs-chat__inner');
    var $header = h.qs('.mcs-header');

    function getUser(callback) {
      milkcocoa.user(function(err, user) {
        if (err) {
          callback(err);
          return;
        }
        if(user && user.sub.indexOf('mlkuser-') >= 0) {
          callback(null, user.sub);
        }
        else {
          milkcocoa.authWithToken(imported_customer_value.token, function(err,user) {
            if(err) {
              callback(err);
              return;
            }
            callback(null, user.sub);
          });
        }
      });
    }

    getUser(function (err, usersub) {

      milkcocoa.dataStore('operator').stream().next(function (err,data) {

        data.forEach(function (d,i) {
          operator[d.id] = {active: d.value.active};
        });

        $header.innerHTML = innerHeader(operator);

        milkcocoa.dataStore('master').child(uuid).get('_options', function(err, datum){
          if(!datum){
            h.on($chatInner, 'click', function(){
              if(isShown) return;
              setView(uuid, milkcocoa);
              isShown = true;
            });
          } else {
            setView(uuid, milkcocoa);
          }
        });
      });
    });


    function setView(uuid, milkcocoa){
      var bodyEl = document.createElement('div');
      bodyEl.className = 'mcs-chat__body mcs-body';
      bodyEl.innerHTML = innerBody();

      $chatInner.appendChild(bodyEl);

      if(!getActiveCount(operator)) h.addClass( h.qs('.mcs-chat'), 'is-notActive');
      else h.removeClass( h.qs('.mcs-chat'), 'is-notActive');

      setTimeout(function () {
        h.addClass( h.qs('.mcs-chat'), 'is-open');

        var chat = new MilkcocoaSupportChat(uuid, milkcocoa);

        milkcocoa.dataStore('master').child(uuid).get('_options', function(err, datum){
          if(!datum){
            chat.controller.createChat();
          } else {
            chat.controller.showAll();
            chat.controller.updateUnreadView();
            chat.controller.updateIsCloseView();
            chat.controller.setUnread();
          }
        });

        subscribeOperator($header, chat);

        // milkcocoa.onConnected(function(){
        //   subscribeOperator($header, chat);

        //   milkcocoa.dataStore('master').child(uuid).on('push', function(pushed){
        //     chat.controller.subscribeMessage(pushed);
        //   });

        //   milkcocoa.dataStore('master').child(uuid).on('send', function(sent){
        //     if(sent.value.nowWriting && (sent.value.publisher === 'operator') ) chat.controller._showWritingIcon(sent.value.content); ;
        //   });
        // });

        // milkcocoa.onClosed(function(){
        //   milkcocoa.dataStore('master').child(uuid).off('push');
        //   milkcocoa.dataStore('master').child(uuid).off('send');
        //   milkcocoa.dataStore('operator').off('set');

        // });

      }, 200);
    }
  });


  function innerBody () {

    var view
    = '<div class="mcs-chat__messages mcs-messages" data-message="'+imported_customer_value.leaveMessage+'"><div class="mcs-chat__messagesInner mcs-messages-inner"></div></div>'
    + '<hr class="mcs-chat__hr mcs-theme-hr">'
    + '<input name="message" type="text" class="mcs-chat__input mcs-new-message mcs-theme-input" placeholder="'+imported_customer_value.inputPlaceholder+'"></input>';

    return view;
  }

  function innerHeader (operators) {

    var activeCount = getActiveCount(operators);
    var title = !!activeCount ? '' : imported_customer_value.leaveMessage;
    var message = !!activeCount ? imported_customer_value.activeAction : imported_customer_value.notActiveAction;

    var view
    = '<span class="mcs-chat__title mcs-theme-title" title="'+title+'">'+message+'</span><span class="mcs-chat__control"><span class="mcs-chat__count mcs-count mcs-theme-count">0</span><span class="mcs-chat__controlItem mcs-hide-chat mcs-theme-hide">_</span></span>';

    return view;
  }

  function getActiveCount (operators) {

    var activeCount = 0;

    for (var key in operators) {
      if (operators.hasOwnProperty(key)) {
        if(operators[key].active) activeCount++;
      }
    }

    return activeCount;

  }

  function subscribeOperator (header, chat) {
    milkcocoa.dataStore('operator').on('set', function (set) {
      operator[set.id] = {active: set.value.active};
      header.innerHTML = innerHeader(operator);

      if(!getActiveCount(operator)) h.addClass( h.qs('.mcs-chat'), 'is-notActive');
      else h.removeClass( h.qs('.mcs-chat'), 'is-notActive');

      chat.controller.updateUnreadView();
    });
  }

  // window.onerror = function (message, file, line, col, error) {
  //   console.log(message, file, line, col, error);
  // };

})();