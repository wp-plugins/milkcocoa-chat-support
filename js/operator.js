// imported_operator_value.app_id, imported_operator_value.token, imported_operator_value.current_user, imported_operator_value.deleteConfirm,

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

    // If an ID was actually given, find the item and update each property
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

  function MCSModel(store, uuid, milkcocoa, operator){
    this.store = store;
    this.uuid = uuid;
    this.milkcocoa = milkcocoa;
    this.operatorName = operator;
  }

  /*
  MCSModel.prototype.createChat = function(data, callback){

    callback = callback || function () {};

    var newChat = {
      global : {
        email: data[email],
        id: data[id]
      }
      user1 : {
        isclose: false,
        unread: []
      }
      user2 : {
        isclose: false,
        unread: []
      }
    };

    this.store.save({}, {}, this.uuid);
    // add prefix '_', to precede pushed id(i.e. i8vGaAgau...) generated by Milkcocoa.
    this.store.save('', newChat, callback, '_options-'+this.operatorName);
  };
  */


  MCSModel.prototype.createMessage = function(content, callback){

    callback = callback || function () {};

    var newMessage = {
      content: content.trim(),
      publisher: 'operator' // only operator side
    };

    this.store.save(newMessage, callback);
  };



  MCSModel.prototype.getData = function (callback) {
    callback = callback || function () {};
    this.store.findAll(callback);
  };

  MCSModel.prototype.getOption = function (callback) {
    callback = callback || function () {};
    this.store.find('_options-'+this.operatorName, callback);
  };

  MCSModel.prototype.getCustomerOption = function (callback) {
    callback = callback || function () {};
    this.store.find('_options', callback);
  };


  MCSModel.prototype.updateChat = function (optionName, data, callback) {

    var that = this;
    callback = callback || function () {};

    that.store.find('_options-'+that.operatorName, function (datum){
      datum.value[optionName] = data;
      that.store.save(datum.value, callback, '_options-'+that.operatorName);
    });
  };


  MCSModel.prototype.removeChat = function (callback) {
    this.store.drop(callback);
  };

  MCSModel.prototype.getUnreadCount = function (callback) {
    this.store.find('_options-'+this.operatorName, function (datum){
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

  function MCSTemplate() {
    this.defaultTemplate
    = '<div class="mcs-message mcs-message--{{publisher}}">'
    +   '<div class="mcs-message__inner">{{content}}</div>'
    + '</div>';
  }

  MCSTemplate.prototype.show = function (data) {
    var i, l;
    var view = '';

    for (i = 0, l = data.length; i < l; i++) {
      if(data[i].value.content){
        var template = this.defaultTemplate;

        // only operator side #2
        if (data[i].value.publisher === 'operator') var publisher = 'you';
        else if (data[i].value.publisher === 'customer') var publisher = 'opp';

        template = template.replace('{{publisher}}', publisher);
        template = template.replace('{{content}}', escape(data[i].value.content));

        view = view + template;
      }
    }

    return view;
  };


  MCSTemplate.prototype.showBody = function (customerValue, value) {

    var isclose = value.isclose ? 'is-close' : '';
    var iscloseIcon = value.isclose ? '□' : '_';

    var view
    = '<div class="mcs-chat is-open '+isclose+'">'
    +   '<div class="mcs-chat__inner">'
    +     '<div class="mcs-chat__header"><span class="mcs-chat__title" title="'+customerValue.id+'">'+customerValue.id+'</span><span class="mcs-chat__control"><span class="mcs-chat__count mcs-count">'+value.unread+'</span><span class="mcs-chat__controlItem mcs-hide-chat">'+iscloseIcon+'</span><span class="mcs-chat__controlItem mcs-delete">×</span></span></div>'
    +     '<div class="mcs-chat__body mcs-body">'
    +       '<div class="mcs-chat__messages mcs-messages"><div class="mcs-chat__messagesInner mcs-messages-inner"></div></div>'
    +       '<hr class="mcs-chat__hr">'
    +       '<input name="message" type="text" class="mcs-chat__input mcs-new-message"></input>'
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

  function MCSView(template, helper, uuid, operator){

    this.template = template;
    this.h = helper;
    this.uuid = uuid;
    this.operatorName = operator;

    this.DELETE_KEY = 8;
    this.ENTER_KEY = 13;
    this.CONTROL_KEY = 17;
    this.ESCAPE_KEY = 27;
    this.OPTION_KEY = 18;
    this.COMMAND_KEY = 224;

    this.writingIconisShown = false;

    this.$chat = document.getElementById(this.uuid);
  }

  MCSView.prototype._highlightUnread = function (count) {

    var chat = this.h.qs('.mcs-chat', this.$chat);

    if(count > 0) this.h.addClass(chat, 'is-highlighten');
    else this.h.removeClass(chat, 'is-highlighten');
  };

  MCSView.prototype._writingIcon = function (content) {

    // todo: state should be written in model
    if(!this.writingIconisShown && (content != '') ){
      var pastEl = document.getElementById('mcs-writing-icon-'+this.uuid);
      this.writingIconisShown = true;
      if(pastEl) return;

      var el = document.createElement('div');
      el.id = 'mcs-writing-icon-'+this.uuid;
      el.className = 'mcs-message mcs-message--opp';
      el.innerHTML = '<div class="mcs-message__inner"><i class="mcs-message__writingIcon"></i></div>';
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

    if(datumValue.isclose) this.h.addClass(chat, 'is-close');
    else this.h.removeClass(chat, 'is-close');
  };

  MCSView.prototype._scrollToBottom = function () {
    this.h.qs('.mcs-messages', this.$chat).scrollTop = this.h.getOffset(this.h.qs('.mcs-messages-inner', this.$chat)).height;
  };

  MCSView.prototype._otherEditing = function (create) {
    // todo: state should be written in model
    if(create){
      var el = document.createElement('div');
      el.id = 'mcs-screen-'+this.uuid;
      el.className = 'mcs-chat__screen';
      el.innerHTML = '<div class="mcs-chat__screenText">Other Editing</div>';
      this.h.qs('.mcs-chat', this.$chat).appendChild(el);
    } else {
      var el = document.getElementById('mcs-screen-'+this.uuid);
      if(el) this.h.qs('.mcs-chat', this.$chat).removeChild(el);
    }
  };


  MCSView.prototype.render = function (viewCmd, parameter) {
    var that = this;

    var viewCommands = {
      showMessages: function () {
        that.h.qs('.mcs-messages-inner', that.$chat).innerHTML = that.template.show(parameter);
      },
      showBody: function () {
        that.$chat.innerHTML = that.template.showBody(parameter.customerOption.value, parameter.option.value);
      },
      toggleChat: function () {
        that._toggleChat(parameter);
      },
      removeChat: function () {
        that.$chat.style.display = 'none';
      },
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
        that.h.qs('.mcs-hide-chat', that.$chat).innerHTML = parameter.isclose ? '□' : '_';
      },
      writingIcon: function () {
        that._writingIcon(parameter);
      },
      scrollToBottom: function(){
        that._scrollToBottom();
      },
      otherEditing: function(){
        that._otherEditing(parameter);
      }
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
      that.h.delegate(that.$chat, '.mcs-hide-chat', 'click', function () {
        handler();
      });

    } else if (event === 'chatRemove') {
      that.h.delegate(that.$chat, '.mcs-delete', 'click', function () {
        if( window.confirm(imported_operator_value.deleteConfirm) ) handler();
      });

    } else if (event === 'nowWriting') {
      that.h.delegate(that.$chat, '.mcs-new-message', 'keydown', function (event) {
        if(
          (event.keyCode !== that.DELETE_KEY) &&
          (event.keyCode !== that.ENTER_KEY) &&
          (event.keyCode !== that.CONTROL_KEY) &&
          (event.keyCode !== that.ESCAPE_KEY) &&
          (event.keyCode !== that.OPTION_KEY) &&
          (event.keyCode !== that.COMMAND_KEY)
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

    } else if (event === 'inputFocus') {
      that.h.delegate(that.$chat, '.mcs-new-message', 'focus', function () {
        handler();
      });

    } else if (event === 'inputBlur') {
      that.h.delegate(that.$chat, '.mcs-new-message', 'blur', function () {
        setTimeout(function(){
          handler();
        },300);
      });

    } else if (event === 'windowbeforeUnload') {
      that.h.on(window, 'beforeunload', function() {
        handler();
      });
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

  function MCSController(model, view, uuid, milkcocoa, operator){

    var that = this;

    that.model = model;
    that.view = view;
    that.uuid = uuid;
    that.milkcocoa = milkcocoa;
    that.ds = milkcocoa.dataStore('master').child(uuid);
    that.operatorName = operator;

    // todo: state should be written in model
    that.myself = false;
    that.writingIconisShown = false;
    that.currentChat = false;

    that.view.bind('newMessage', function (content) {
      that.myself = true;
      that.addMessage(content);
    });

    that.view.bind('unreadClear', function () {
      that.clearUnread();
    });

    that.view.bind('chatHide', function () {
      that.hideChat();
    });

    that.view.bind('chatRemove', function () {
      that.removeChat();
    });

    that.view.bind('inputFocus', function () {
      that.currentChat = true;
      that.ds.send({nowFocusing: true, publisher: that.uuid});
    });

    that.view.bind('inputBlur', function () {
      that.currentChat = false;
      that.ds.send({nowFocusing: false, publisher: that.uuid});
    });

    that.view.bind('nowWriting', function (content) {
      that.ds.send({nowWriting: true, publisher: 'operator', content: content});
    });

    that.view.bind('windowbeforeUnload', function () {
      that.ds.send({nowWriting: true, publisher: 'operator', content: ''});
      that.ds.send({nowFocusing: false});
    });


    that.ds.on('push', function(pushed){
      if(pushed.value.publisher === 'customer'){
        that._afterNewMessage();

      } else {
        if(that.myself){
          that.myself = !that.myself;
        } else {
          that.showAll();
        }
      }
    });

    that.ds.on('set', function(set){
      if(set.id == '_options-'+that.operatorName) that._updateUnreadView();
    })


    that.ds.on('send', function(sent){
      if(sent.value.nowWriting && (sent.value.publisher === 'customer') ) that._showWritingIcon(sent.value.content);
    });

    that.ds.on('send', function(sent){
      if(sent.value.hasOwnProperty('nowFocusing') && (sent.value.publisher !== that.uuid)) that.view.render('otherEditing',sent.value.nowFocusing);
    });

    that.milkcocoa.dataStore('index').on('remove', function(removed){
      if(that.myself){
        that.myself = !that.myself;
      } else {
        if(removed.id === that.uuid) that.removeChat();
      }
    });
  }

  MCSController.prototype.showAll = function () {
    var that = this;
    that.model.getData(function (data) {
      that.view.render('showMessages', data);
      that.view.render('scrollToBottom');
    });
  };

  MCSController.prototype.showBody = function () {
    var that = this;
    that.model.getOption(function (option) {
      that.model.getCustomerOption(function (customerOption){
        var datum = {};
        datum.option = option;
        datum.customerOption = customerOption;
        that.view.render('showBody', datum);
        that.showAll();
        that._updateUnreadView();
        that.ds.send({nowFocusing: false});
      });
    });
  };

  MCSController.prototype.addMessage = function (content) {

    var that = this;

    if (content.trim() === '') {
      return;
    }

    that.model.createMessage(content, function () {
      that._afterNewMessage();
    });
  };

  MCSController.prototype.clearUnread = function () {

    var that = this;

    that.model.updateChat('unread', [], function () {
      that._updateUnreadView();
    });
  };

  MCSController.prototype.hideChat = function () {

    var that = this;

    that.model.getOption(function(datum){
      that.model.updateChat('isclose', !datum.value.isclose, function (datum) {
        that.view.render('toggleChat', datum.value);
        that.view.render('switchChatHide', datum.value);
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

  MCSController.prototype._afterNewMessage = function () {
    this.view.render('clearNewMessage');
    this.showAll();
  };

  MCSController.prototype._updateUnreadView = function () {

    var that = this;

    that.model.getUnreadCount(function (count) {
      that.view.render('updateUnreadCount', count);
      that.view.render('highlightUnread', count);
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

  var milkcocoa = new MilkCocoa(imported_operator_value.app_id+'.mlkcca.com');

  var indexDataStore = milkcocoa.dataStore('index');
  var h = new MCSHelper();
  var username;
  var chats = {};
  var limitOver = false

  function MilkcocoaSupportChat(uuid, milkcocoa, operator) {
    this.helper = new MCSHelper();
    this.store = new MCSStore(milkcocoa, uuid);
    this.model = new MCSModel(this.store, uuid, milkcocoa, operator);
    this.template = new MCSTemplate();
    this.view = new MCSView(this.template, this.helper, uuid, operator);
    this.controller = new MCSController(this.model, this.view, uuid, milkcocoa, operator);
  }

  h.on(window, 'load', function(){

    milkcocoa.onError(function(){
      alert('Connection limit over! More than 21users simultaneously use your site. If you want to use more, upgrade plan of Milkcocoa.');
      document.getElementById('mcs-chats').style.display = 'none';
    })

    var $chats = document.getElementById('mcs-chats');
    var $isActive = document.getElementById('mcs-isActive');

    function getUser(callback) {
      milkcocoa.user(function(err, user) {
        if (err) {
          callback(err);
          return;
        }

        if(user && user.sub == imported_operator_value.current_user) {
          callback(null, user.sub);
        }
        else {
          milkcocoa.authWithToken(imported_operator_value.token, function(err,user) {
            if(err) {
              callback(err);
              return;
            }
            location.reload();
          });
        }
      });
    }

    getUser(function(err, usersub){
      username = usersub;
      milkcocoa.dataStore('operator').set(username, {active: $isActive.checked});
      indexDataStore.stream().size(999).next(function (err,data) {
        data.forEach(function (d,i) {
          setView(d);
        });

        // milkcocoa.onConnected(function(){

        //   data.forEach(function (d,i) {
        //     var chat = chats[d.id];

        //     milkcocoa.dataStore('master').child(d.id).on('push', function(pushed){
        //       if(pushed.value.publisher === 'customer'){
        //         chat.controller._afterNewMessage();

        //       } else {
        //         if(chat.controller.myself){
        //           chat.controller.myself = !chat.controller.myself;
        //         } else {
        //           chat.controller.showAll();
        //         }
        //       }
        //     });

        //     milkcocoa.dataStore('master').child(d.id).on('set', function(set){
        //       if(set.id == '_options-'+chat.controller.operatorName) chat.controller._updateUnreadView();
        //     });

        //     milkcocoa.dataStore('master').child(d.id).on('send', function(sent){
        //       if(sent.value.nowWriting && (sent.value.publisher === 'customer') ) chat.controller._showWritingIcon(sent.value.content);
        //     });

        //     milkcocoa.dataStore('master').child(d.id).on('send', function(sent){
        //       if(chat.controller.myself){
        //         chat.controller.myself = false;
        //       } else {
        //         if(sent.value.hasOwnProperty('nowFocusing')) chat.view.render('otherEditing',sent.value.nowFocusing);
        //       }
        //     });

        //     milkcocoa.dataStore('index').on('remove', function(removed){
        //       if(chat.controller.myself){
        //         chat.controller.myself = !chat.controller.myself;
        //       } else {
        //         if(removed.id === chat.controller.uuid) chat.controller.removeChat();
        //       }
        //     });
        //   });
        //   indexDataStore.on('set', function (set) {
        //     setView(set);
        //   });

        // });
      });
    });

    indexDataStore.on('set', function (set) {
      setView(set);
    });


    // milkcocoa.onClosed(function(){
    //   indexDataStore.stream().size(999).next(function (err,data) {
    //     data.forEach(function (d,i) {
    //       milkcocoa.dataStore('master').child(d.id).off('push');
    //       milkcocoa.dataStore('master').child(d.id).off('set');
    //       milkcocoa.dataStore('master').child(d.id).off('send');
    //       milkcocoa.dataStore('index').off('remove');
    //     });
    //   });
    //   indexDataStore.off('set');
    // });

    function setView(datum){

      var pastEl = document.getElementById(datum.id);

      if(pastEl) return;

      var el = document.createElement('div');
      el.id = datum.id;
      el.className = 'mcs-chatLayout mcs-chatLayout--operator';

      var theFirstChild = $chats.firstChild;
      $chats.insertBefore(el, theFirstChild);

      milkcocoa.dataStore('master').child(datum.id).get('_options-'+username, function(err, option){
        if(!option) {
          milkcocoa.dataStore('master').child(datum.id).set('_options-'+username, {
            isclose: false,
            unread: []
          });
        }
        setTimeout(function () {
          var chat = new MilkcocoaSupportChat(datum.id, milkcocoa, username);
          chat.controller.showBody();
          chats[datum.id] = chat;
        }, 200);
      });
    }

    h.on($isActive, 'change', function(){
      milkcocoa.dataStore('operator').set(username, {active: $isActive.checked});
    });

    h.on(window, 'beforeunload', function() {
      milkcocoa.dataStore('operator').set(username, {active: false});
    });

  }); // onload
})();
