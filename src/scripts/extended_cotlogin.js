/* global cot_app cot_login CotSession */

class ExtendedCotSession extends CotSession {

  // MARK: METHOD DEFINITION

  isLoggedIn(serverCheckCallback) {
    if (!serverCheckCallback) {
      return super.isLoggedIn(serverCheckCallback);
    }

    const sid = this.sid || this._cookie('sid');
    if (!sid) {
      serverCheckCallback(CotSession.LOGIN_CHECK_RESULT_FALSE);
    } else {
      let url = `${this.options.ccApiOrigin}${this.options.ccApiPath}${this.options.ccApiEndpoint}`;
      if (url.indexOf('/c3api_auth/v2/AuthService.svc/AuthSet') !== -1) {
        url = `${url}('${sid}')`;
      } else {
        url = `${url}/${sid}`;
      }

      $.get(url).done((data) => {
        const app = data['app'] || '', rsid = data['sid'] || '', error = data['error'] || '';
        if (app === this.options.appName && rsid === sid) {
          this._storeLogin(data);
          serverCheckCallback(CotSession.LOGIN_CHECK_RESULT_TRUE);
        } else if (error === 'no_such_session') {
          this.logout();
          serverCheckCallback(CotSession.LOGIN_CHECK_RESULT_FALSE);
        } else {
          serverCheckCallback(CotSession.LOGIN_CHECK_RESULT_INDETERMINATE);
        }
      }).fail(() => {
        serverCheckCallback(CotSession.LOGIN_CHECK_RESULT_INDETERMINATE);
      });
    }
  }

  login(options) {
    options = $.extend({
      username: '',
      password: '',
      success: () => {},
      error: (jqXHR, textStatus, error) => {},
      always: () => {}
    }, options);

    const payload = {
      app: this.options.appName,
      user: options.username,
      pwd: options.password
    };

    const ajaxSettings = {
      method: 'POST',
      url: `${this.options.ccApiOrigin}${this.options.ccApiPath}${this.options.ccApiEndpoint}`
    };

    if (ajaxSettings.url.indexOf('/c3api_auth/v2/AuthService.svc/AuthSet') !== -1) {
      ajaxSettings.contentType = 'application/json';
      ajaxSettings.data = JSON.stringify(payload);
    } else {
      ajaxSettings.data = payload;
    }

    $.ajax(ajaxSettings).done((data) => {
      if (data['error']) {
        options.error(null, data.error === 'invalid_user_or_pwd' ? 'Invalid username or password' : 'Login failed', data.error);
      } else if (data['passwordIsExpired']) {
        options.error(null, 'Expired password', 'passwordIsExpired');
      } else {
        this._storeLogin(data);
        options.success();
      }
    }).fail((jqXHR, textStatus, error) => {
      options.error(jqXHR, textStatus, error);
    }).always(() => {
      options.always();
    });
  }
}

/* exported ExtendedCotLogin */
class ExtendedCotLogin extends cot_login {

  // MARK: CONSTRUCTOR DEFINITION

  constructor(options) {
    super(options);

    this.session = new ExtendedCotSession({
      appName: this.options['appName'],
      ccApiOrigin: this.options['ccRoot'] || undefined,
      ccApiPath: this.options['ccPath'] || undefined,
      ccApiEndpoint: this.options['ccEndpoint'] || undefined
    });

    this._setUserName();
  }

  // MARK: METHOD DEFINITION

  checkLogin(options = {}) {
    if (!options['serverSide']) {
      if (this.isLoggedIn()) {
        return Promise.resolve();
      } else {
        return Promise.reject();
      }
    }

    return new Promise((resolve, reject) => {
      this.isLoggedIn((result) => {
        if (result === CotSession.LOGIN_CHECK_RESULT_TRUE) {
          resolve();
        } else {
          reject();
        }
      });
    });
  }

  isLoggedIn(serverCheckCallback) {
    return this.session.isLoggedIn(serverCheckCallback);
  }

  requireLogin(options) {
    return Promise.resolve().then(() => {
      return this.checkLogin(options);
    }).catch(() => {
      return new Promise((resolve, reject) => {
        this.showLogin($.extend({
          onHidden: () => {
            this.checkLogin(options).then(() => {
              resolve();
            }, () => {
              reject();
            });
          }
        }, options));
      });
    }).catch(() => {
      this.logout();
      return Promise.reject();
    });
  }

  showLogin(options) {
    var that = this;
    this.modal = cot_app.showModal($.extend({
      title: 'User Login',
      body:
        this.options.loginMessage +
        '<form>' +
        '<div class="form-group">' +
        '<label for="cot_login_username">Username</label>:' +
        '<input class="form-control" id="cot_login_username">' +
        '</div>' +
        '<div class="form-group">' +
        '<label for="cot_login_password">Password</label>:' +
        '<input class="form-control" type="password" id="cot_login_password">' +
        '</div>' +
        '</form>',
      footerButtonsHtml:
        '<button class="btn btn-success" type="button" data-dismiss="modal">Cancel</button>' +
        '<button class="btn btn-success btn-cot-login" type="button">Login</button>',
      originatingElement: $(this.options['welcomeSelector']).find('a.login'),
      className: 'cot-login-modal',
      onShown: function() {
        that.modal.find('.btn-cot-login').click(function() {
          that._login();
        });

        that.modal.find('.modal-body input').keydown(function(e) {
          if ((e.charCode || e.keyCode || 0) === 13) {
            that._login();
          }
        });
      }
    }, options));
  }
}
