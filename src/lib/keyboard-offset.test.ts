import { test } from "node:test"
import assert from "node:assert/strict"
import {
  ANDROID_KEYBOARD_EXTRA_COMPENSATION_DP,
  IOS_KEYBOARD_VERTICAL_OFFSET,
  keyboardVerticalOffset,
} from "./keyboard-offset.ts"

test("iOS keeps its existing empirical offset regardless of inset", () => {
  assert.equal(keyboardVerticalOffset("ios", 0), IOS_KEYBOARD_VERTICAL_OFFSET)
  assert.equal(keyboardVerticalOffset("ios", 48.857), IOS_KEYBOARD_VERTICAL_OFFSET)
})

test("Android offsets by the status-bar inset to reconcile window vs screen coords", () => {
  // Measured on an Android 12 emulator: the status-bar inset closes the
  // 48.857dp shortfall; the extra constant covers skins (MIUI) that report
  // insets a few pixels short of reality.
  assert.equal(
    keyboardVerticalOffset("android", 48.857),
    48.857 + ANDROID_KEYBOARD_EXTRA_COMPENSATION_DP,
  )
})

test("Android with no status-bar inset still gets the extra compensation", () => {
  assert.equal(keyboardVerticalOffset("android", 0), ANDROID_KEYBOARD_EXTRA_COMPENSATION_DP)
})

test("a negative/bogus inset never pushes content down", () => {
  assert.equal(keyboardVerticalOffset("android", -20), ANDROID_KEYBOARD_EXTRA_COMPENSATION_DP)
})

// Regression guard for the arithmetic the offset exists to fix.
test("offset makes computed padding never fall short of the real keyboard height", () => {
  const windowBottom = 748.857 // frame.y + frame.height, window coords
  const keyboardScreenY = 511.714 // screen coords
  const keyboardHeight = 286
  const insetTop = 48.857

  const withoutFix = windowBottom - keyboardScreenY
  assert.ok(withoutFix < keyboardHeight, "precondition: unfixed padding is short")

  const offset = keyboardVerticalOffset("android", insetTop)
  const withFix = windowBottom - (keyboardScreenY - offset)
  assert.ok(
    withFix >= keyboardHeight,
    `expected padding >= ${keyboardHeight} (no shortfall), got ${withFix}`,
  )
})

// Regression guard for the bottom home-indicator inset on gesture nav (#156).
test("Android includes the bottom inset when present", () => {
  assert.equal(
    keyboardVerticalOffset("android", 48.857, 24),
    72.857 + ANDROID_KEYBOARD_EXTRA_COMPENSATION_DP,
  )
})

test("Android with zero bottom inset is unchanged", () => {
  assert.equal(
    keyboardVerticalOffset("android", 48.857, 0),
    48.857 + ANDROID_KEYBOARD_EXTRA_COMPENSATION_DP,
  )
})

test("Android with two bogus insets still gets only the extra compensation", () => {
  assert.equal(keyboardVerticalOffset("android", -10, -5), ANDROID_KEYBOARD_EXTRA_COMPENSATION_DP)
})

test("iOS ignores the bottom inset argument", () => {
  assert.equal(keyboardVerticalOffset("ios", 0, 24), IOS_KEYBOARD_VERTICAL_OFFSET)
})
