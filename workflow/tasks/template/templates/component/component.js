'use strict'

/**
 * Mixins
 */
import ComponentMixin from 'lib/vue/mixins/component-mixin'

/**
 * Templates
 */
import <%= templateName %> from './<%= name %>.html'


module.exports = {

  template: <%= templateName %>,

  mixins: [ ComponentMixin ],

  mounted() {

  },

  methods: {

    onShow() {},

    onHide() {},

    onShown() {},

    onHidden() {}

  }

}