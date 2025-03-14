import { h, computed, getCurrentInstance } from 'vue'

import { createComponent } from '../../utils/private.create/create.js'
import useDark, { useDarkProps } from '../../composables/private.use-dark/use-dark.js'

import { hSlot } from '../../utils/private.render/render.js'

export default createComponent({
  name: 'QBanner',

  props: {
    ...useDarkProps,

    inlineActions: Boolean,
    dense: Boolean,
    rounded: Boolean
  },

  setup (props, { slots }) {
    const { proxy: { $q } } = getCurrentInstance()
    const isDark = useDark(props, $q)

    const classes = computed(() =>
      'q-banner row items-center'
      + (props.dense === true ? ' q-banner--dense' : '')
      + (isDark.value === true ? ' q-banner--dark q-dark' : '')
      + (props.rounded === true ? ' rounded-borders' : '')
    )

    const actionClass = computed(() =>
      'q-banner__actions row items-center justify-end'
      + ` col-${ props.inlineActions === true ? 'auto' : 'all' }`
    )

    return () => {
      const child = [
        h('div', {
          class: 'q-banner__avatar col-auto row items-center self-start'
        }, hSlot(slots.avatar)),

        h('div', {
          class: 'q-banner__content col text-body2'
        }, hSlot(slots.default))
      ]

      const actions = hSlot(slots.action)
      actions !== void 0 && child.push(
        h('div', { class: actionClass.value }, actions)
      )

      return h('div', {
        class: classes.value
          + (props.inlineActions === false && actions !== void 0 ? ' q-banner--top-padding' : ''),
        role: 'alert'
      }, child)
    }
  }
})
