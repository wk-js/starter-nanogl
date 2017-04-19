'use strict'

/**
 * Mixins
 */
import SectionMixin from 'lib/vue/mixins/section-mixin'

/**
 * Templates
 */
import <%= templateName %> from './<%= name %>.html'


module.exports = {

  template: <%= templateName %>,

  data() {
    return {
      id: "<%= name %>"
    }
  },

  mixins: [ SectionMixin ],

  mounted() {

  },

  methods: {

    onShow() {},

    onHide() {},

    onShown() {},

    onHidden() {}

  }

}