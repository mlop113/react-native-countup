/**
 * @author wkh237
 * @version 0.1.1
 */

// @flow

import React, { Component } from 'react'
import { Animated, Easing } from 'react-native'
import Timer from 'react-timer-mixin'
import Colors from '../../App/Themes/Colors'

const HALF_RAD = Math.PI / 2

export default class AnimateNumber extends Component {

  props: {
    countBy?: ?number,
    interval?: ?number,
    steps?: ?number,
    value: number,
    initial: ?number,
    timing: 'linear' | 'easeOut' | 'easeIn' | () => number,
    formatter: () => {},
    onStart: () => {},
    onProgress: () => {},
    onFinish: () => {}
  }

  static defaultProps = {
    interval: 14,
    timing: 'linear',
    steps: 45,
    value: 0,
    formatter: (val) => val,
    onStart: () => {},
    onFinish: () => {}
  }

  static TimingFunctions = {

    linear: (interval: number, progress: number): number => {
      return interval
    },

    easeOut: (interval: number, progress: number): number => {
      return interval * Math.sin(HALF_RAD * progress) * 5
    },

    easeIn: (interval: number, progress: number): number => {
      return interval * Math.sin((HALF_RAD - HALF_RAD * progress)) * 5
    }

  }

  state: {
    value?: ?number,
    displayValue?: ?number
  }

  /**
   * Animation direction, true means positive, false means negative.
   * @type {bool}
   */
  direction: bool
  /**
   * Start value of last animation.
   * @type {number}
   */
  startFrom: number
  /**
   * End value of last animation.
   * @type {number}
   */
  endWith: number

  constructor (props: any) {
    super(props)
    // default values of state and non-state variables
    this.state = {
      value: this.props.initial ? this.props.initial : 0,
      displayValue: 0
    }
    this.animatedValue = new Animated.Value(0)
    this.dirty = false
    this.startFrom = 0
    this.endWith = 0
  }

  animate () {
    this.animatedValue.setValue(0)
    this.props.onStart()
    Animated.timing(
      this.animatedValue,
      {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear
      }
    ).start(() => {})
  }

  componentDidMount () {
    this.startFrom = this.state.value
    this.endWith = this.props.value
    this.dirty = true
    this.animate()
    this.startAnimate()
  }

  componentWillUpdate (nextProps, nextState) {

    // check if start an animation
    if (this.props.value !== nextProps.value) {
      this.startFrom = this.props.value
      this.endWith = nextProps.value
      this.dirty = true
      this.startAnimate()
      return
    }
    // Check if iterate animation frame
    if (!this.dirty) {
      return
    }
    if (this.direction === true) {
      if (parseFloat(this.state.value) <= parseFloat(this.props.value)) {
        this.startAnimate()
      }
    }
    else if (this.direction === false) {
      if (parseFloat(this.state.value) >= parseFloat(this.props.value)) {
        this.startAnimate()
      }
    }

  }

  render () {
    const textSize = this.animatedValue.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [this.props.textMinAnimate, this.props.textMaxAnimate, this.props.textMinAnimate]
    })
    return (
      <Animated.Text style={[this.props.style, {fontSize: textSize}]}>
        {this.state.displayValue}
      </Animated.Text>)
  }

  startAnimate () {

    let progress = this.getAnimationProgress()
    Timer.setTimeout(() => {

      let value = (this.endWith - this.startFrom) / this.props.steps
      let sign = value >= 0 ? 1 : -1
      if (this.props.countBy)
        value = sign * Math.abs(this.props.countBy)
      let total = parseFloat(this.state.value) + parseFloat(value)

      this.direction = (value > 0)
      // animation terminate conditions
      if (((this.direction) ^ (total <= this.endWith)) === 1) {
        this.dirty = false
        total = this.endWith
        this.props.onFinish(total, this.props.formatter(total))
      }

      if (this.props.onProgress)
        this.props.onProgress(this.state.value, total)

      this.setState({
        value: total,
        displayValue: this.props.formatter(total)
      })

    }, this.getTimingFunction(this.props.interval, progress))

  }

  getAnimationProgress (): number {
    return (this.state.value - this.startFrom) / (this.endWith - this.startFrom)
  }

  getTimingFunction (interval: number, progress: number) {
    if (typeof this.props.timing === 'string') {
      let fn = AnimateNumber.TimingFunctions[this.props.timing]
      return fn(interval, progress)
    } else if (typeof this.props.timing === 'function')
      return this.props.timing(interval, progress)
    else
      return AnimateNumber.TimingFunctions['linear'](interval, progress)
  }

}
