/* exported CotLoginButtonView */
const CotLoginButtonView = Backbone.View.extend({

  // MARK: PROPERTY DEFINITION

  className: 'cotLoginView',

  tagName: 'form',

  template: _.template(`
    <span class="visible-print-inline">Logged in as</span>
    <%- [model.lastName, model.firstName].filter((value) => value).join(', ') || '' %>
    <% if (model.sid == null) { %>
    <button type="button" class="btn btn-primary btn-login hidden-print">Login</button>
    <% } else { %>
    <button type="button" class="btn btn-default btn-logout hidden-print">Logout</button>
    <% } %>
  `),

  // MARK: EVENT HANDLER DEFINITION

  events: {
    'click .btn-login': function(event) {
      event.preventDefault();
      this.trigger('login', event.currentTarget);
    },
    'click .btn-logout': function(event) {
      event.preventDefault();
      this.trigger('logout');
    }
  },

  // MARK: METHOD DEFINITION

  render: function() {
    this.$el.html(this.template({ model: this.model.toJSON() }));
    return Promise.resolve();
  },

  // MARK: INITIALIZER DEFINITION

  initialize: function() {
    this.listenTo(this.model, 'change', this.render);
  },
});
