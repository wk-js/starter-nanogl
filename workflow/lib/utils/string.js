'use strict'

function slug(str) {
  return str.toString().toLowerCase()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
}

function camelCase(str) {
  str = slug(str)

  const words = str.split('-').map(function(word) {
    return word.slice(0, 1).toUpperCase() + word.slice(1)
  })

  return words.join('')
}

function toUnderscore(str) {
  return slug(str).replace(/-+/, '_')
}

module.exports = {
  slug: slug,
  camelCase: camelCase,
  toUnderscore: toUnderscore
}