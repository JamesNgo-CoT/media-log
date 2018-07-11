/* global cot_app */

/* exported ExtendedCotApp */
class ExtendedCotApp extends cot_app {

  /**
   * Add DOM modification to the (original) render method.
   * @return {cot_app}
   */
  render() {
    super.render();

    // Remove bootstrap grid.
    $('#app-header .row > div').removeClass('col-xs-12 col-sm-10 col-md-11 col-sm-2 col-md-1');

    // Store h1 element for later use.
    if (!this.$h1) {
      this.$h1 = $('#app-header').find('h1');
      this.$h1.attr('tabindex', -1);
    }

    return this;
  }

  /**
   * Add functionality to update document title everytime the title is set. Also sets focus.
   * @param {string} title
   */
  setTitle(title) {
    super.setTitle(title);

    // Set document title.
    if (title && title !== this.name) {
      document.title = `${title} - ${this.name}`;
    } else {
      document.title = this.name;
    }

    // Set focus to the h1 element.
    if (this.$h1) {
      if (this.skipFocus) {
        this.$h1.focus();
      } else {
        this.skipFocus = true;
      }
    }
  }
}
