import { h } from 'vue'

import useSpinner, { useSpinnerProps } from './use-spinner.js'
import { createComponent } from '../../utils/private.create/create.js'

const innerHTML = '<g transform="translate(1 1)" stroke-width="2" fill="none" fill-rule="evenodd"><circle cx="5" cy="50" r="5"><animate attributeName="cy" begin="0s" dur="2.2s" values="50;5;50;50" calcMode="linear" repeatCount="indefinite"></animate><animate attributeName="cx" begin="0s" dur="2.2s" values="5;27;49;5" calcMode="linear" repeatCount="indefinite"></animate></circle><circle cx="27" cy="5" r="5"><animate attributeName="cy" begin="0s" dur="2.2s" from="5" to="5" values="5;50;50;5" calcMode="linear" repeatCount="indefinite"></animate><animate attributeName="cx" begin="0s" dur="2.2s" from="27" to="27" values="27;49;5;27" calcMode="linear" repeatCount="indefinite"></animate></circle><circle cx="49" cy="50" r="5"><animate attributeName="cy" begin="0s" dur="2.2s" values="50;50;5;50" calcMode="linear" repeatCount="indefinite"></animate><animate attributeName="cx" from="49" to="49" begin="0s" dur="2.2s" values="49;5;27;49" calcMode="linear" repeatCount="indefinite"></animate></circle></g>'

export default createComponent({
  name: 'QSpinnerBall',

  props: useSpinnerProps,

  setup (props) {
    const { cSize, classes } = useSpinner(props)
    return () => h('svg', {
      class: classes.value,
      stroke: 'currentColor',
      width: cSize.value,
      height: cSize.value,
      viewBox: '0 0 57 57',
      xmlns: 'http://www.w3.org/2000/svg',
      innerHTML
    })
  }
})
