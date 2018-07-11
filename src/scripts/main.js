/* global CotLoginButtonView CotLoginModel ExtendedCotApp ExtendedCotLogin */

$(function () {
  const app = new ExtendedCotApp('Media Contact Log', {
    hasContentTop: false,
    hasContentBottom: false,
    hasContentRight: false,
    hasContentLeft: false,
    searchcontext: 'INTRA'
  });
  app.render();

  let login, loginButtonView, loginModel;
  loginModel = new CotLoginModel();

  login = new ExtendedCotLogin({
    appName: 'media_contact_log',
    ccEndpoint: 'auth',
    ccPath: '/c3api_auth/',
    ccRoot: 'https://was-intra-sit.toronto.ca',
    onLogin: (cot_login_instance) => {
      loginModel.set(cot_login_instance);
    }
  });

  loginButtonView = new CotLoginButtonView({
    model: loginModel
  });
  loginButtonView.on('login', (originatingElement) => {
    login.showLogin({
      originatingElement: originatingElement,
      onHidden: () => {
        login.checkLogin().then(() => {
          Backbone.history.stop();
          Backbone.history.start();
        }, () => {
          if (loginModel.has('sid')) {
            login.logout();
          }
        });
      }
    });
  });
  loginButtonView.on('logout', () => {
    login.logout();
  });
  loginButtonView.$el.prependTo('#app-header .row > div.securesite');
  loginButtonView.render();


  Backbone.sync = ((sync) => {
    return (method, model, options = {}) => {
      const deferred = $.Deferred();

      Promise.resolve().then(() => {
        if (login && (_.result(model.model, 'syncRequiresLogin') || _.result(model, 'syncRequiresLogin'))) {
          return login.requireLogin({
            originatingElement: loginButtonView.$el.find('button').get(0)
          });
        }
      }).then(() => {
        if (login && (_.result(model.model, 'syncRequiresLogin') || _.result(model, 'syncRequiresLogin'))) {
          options.beforeSend = (jqXHR, settings) => {
            jqXHR.setRequestHeader('Authorization', `AuthSession ${loginModel.get('sid')}`);
          };
        }

        options.contentType = options.contentType || 'application/json';

        options.error = function(jqXHR, status, errorThrown) {
          const errorMessageTemplate = _.template(`An error ocurred. Error code <%- status %>. <%- message %>`);
          if (jqXHR.status >= 500 && jqXHR.status <= 599) {
            alert(errorMessageTemplate({
              status: jqXHR.status,
              message: 'Server side error. Please contact your administrator.'
            }));
          } else if (jqXHR.status === 400 && !jqXHR.responseJSON && jqXHR.responseText && jqXHR.responseText.indexOf('Session id') !== -1 && jqXHR.responseText.indexOf('is invalid') !== -1) {
            if (login && (_.result(model.model, 'syncRequiresLogin') || _.result(model, 'syncRequiresLogin'))) {
              login.showLogin({
                onHidden: () => {
                  login.checkLogin(options).then(() => {
                    model.trigger('reloadNeeded');
                  }, () => {
                    if (loginModel.has('sid')) {
                      login.logout();
                    }
                  });
                },
                originatingElement: loginButtonView.$el.find('button').get(0)
              });
            } else {
              alert(errorMessageTemplate({
                status: jqXHR.status,
                message: jqXHR.responseText
              }));
            }
          } else if (jqXHR.responseJSON && jqXHR.responseJSON.error && jqXHR.responseJSON.error.message) {
            alert(errorMessageTemplate({
              status: jqXHR.status,
              message: jqXHR.responseJSON.error.message
            }));
          } else if (jqXHR.responseText) {
            alert(errorMessageTemplate({
              status: jqXHR.status,
              message: jqXHR.responseTextrThrown
            }));
          } else {
            alert(errorMessageTemplate({
              status: jqXHR.status,
              message: errorThrown
            }));
          }
        };

        sync.call(this, method, model, options).then((...args) => {
          deferred.resolve(...args);
        }, (...args) => {
          deferred.reject(...args);
        });
      });

      return deferred;
    }
  })(Backbone.sync);

  new (Backbone.router.extend({
    $contaner: $('#media_log_container'),

    hideDuration: 0,

    hideScrollTopDuration: 500,

    thisRoute: null,

    // -----

    routeDefault: function() {
      if (this.thisRoute) {
        this.navigate(this.thisRoute);
      }
    },

    routes: {
      '*default': 'routeDefault'
    },

    // -----

    hideViews: function() {
      const $visibleViews = this.$container.children(':visible');
      if ($visibleViews.length > 0) {
        return new Promise((resolve, reject) => {
          this.$container.css('min-height', this.$container.height() + 'px');

          let counter = 0;
          $visibleViews.fadeOut(this.hideDuration, () => {
            counter = counter + 1;
            if (counter === $visibleViews.length) {
              resolve();
            }
          });
        }).then(() => {
          $('html, body').animate({ scrollTop: 0 }, this.hideScrollTopDuration);

          this.$container.css('min-height', 'auto');
        });
      }

      return Promise.resolve();
    },

    route: function(route, name, callback) {
      const oldCallback = callback || (typeof name === 'function') ? name : this[name];
      if (oldCallback !== this.routeDefault) {
        const newCallback = (...args) => {
          this.thisRoute = Backbone.history.fragment;
          oldCallback.call(this, ...args);
        }

        if (typeof name === 'function') {
          name = newCallback;
        } else {
          callback = newCallback;
        }
      }

      return Backbone.Router.prototype.route.call(this, route, name, callback);
    }
  }))();

  Backbone.history.start();
});

