import { stripHtmlTags } from './dist/index.js'

// Test the basic cases
const basicTests = [
  '<b>Bold</b>',                           // Expected: 'Bold'
  'Normal <b>bold</b> text',               // Expected: 'Normal bold text'
  '<font color="yellow">Warning:</font> <b>Danger ahead!</b>', // Expected word separation
  '<span class="subtitle">Text</span>',    // Expected: 'Text'
  'Text <!-- comment --> more text',       // Expected: 'Text more text'
  'Text with < and > characters',          // Expected: 'Text with  characters'
  '&nbsp;Text&nbsp;',                      // Expected: ' Text '
  'Line 1<br/>Line 2',                     // Expected: 'Line 1Line 2'
  '<br>Line1<br/><br>Line2<br>',           // Expected: 'Line1Line2'
  '<font color="yellow">Warning:</font> <b>Danger ahead!</b><br>Please be careful.', // Real-world test
]

console.log('Testing basic cases:')
basicTests.forEach(test => {
  const result = stripHtmlTags(test)
  console.log(`Input: '${test}' -> Output: '${result}'`)
})

console.log('\nTesting edge cases:')
const edgeTests = [
  '<>&<>',      // Expected: '><'
  '<<>>',       // Expected: '<>'
  'Text<<<>>>'  // Expected: 'Text<>'
]

edgeTests.forEach(test => {
  const result = stripHtmlTags(test)
  console.log(`Input: '${test}' -> Output: '${result}'`)
})