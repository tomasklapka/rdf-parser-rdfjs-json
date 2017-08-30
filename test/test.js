/* global describe, it */

const assert = require('assert')
const rdf = require('rdf-data-model')
const rdfExt = require('rdf-ext')
const Readable = require('readable-stream')
const RDFJSJSONParser = require('..')

describe('rdf-parser-rdfjs-json', () => {
  it('should parse rdfjs+json stream', () => {
    const quad1 = JSON.stringify({
      'subject': {
        'value': 'http://example.org/subject', 'termType': 'NamedNode'
      },
      'predicate': {
        'value': 'http://example.org/predicate', 'termType': 'NamedNode'
      },
      'object': {
        'value': 'object1',
        'termType': 'Literal',
        'language': '',
        'datatype': {
          'value': 'http://www.w3.org/2001/XMLSchema#string',
          'termType': 'NamedNode'
        }
      },
      'graph': {
        'value': '', 'termType': 'DefaultGraph'
      }
    })
    const quad2 = JSON.stringify({
      'subject': {
        'value': 'http://example.org/subject', 'termType': 'NamedNode'
      },
      'predicate': {
        'value': 'http://example.org/predicate', 'termType': 'NamedNode'
      },
      'object': {
        'value': 'http://example.org/object', 'termType': 'NamedNode'
      },
      'graph': {
        'value': 'http://example.org/graph', 'termType': 'NamedNode'
      }
    })
    const expected = [
      rdf.quad(
        rdf.namedNode('http://example.org/subject'),
        rdf.namedNode('http://example.org/predicate'),
        rdf.literal('object1', 'http://www.w3.org/2001/XMLSchema#string')
      ),
      rdf.quad(
        rdf.namedNode('http://example.org/subject'),
        rdf.namedNode('http://example.org/predicate'),
        rdf.namedNode('http://example.org/object'),
        rdf.namedNode('http://example.org/graph')
      )
    ]

    const input = new Readable()
    input._readableState.objectMode = true
    input._read = () => {
      input.push('\n')
      input.push('\n')
      input.push(quad1)
      input.push('\n')
      input.push('\n')
      input.push('\n')
      input.push(quad2)
      input.push('\n')
      input.push('\n')
      input.push(null)
    }

    const parser = new RDFJSJSONParser()
    const stream = parser.import(input)

    let actual = []
    stream.on('data', (quad) => {
      actual.push(quad)
    })

    return rdfExt.waitFor(stream).then(() => {
      assert.deepEqual(actual, expected)
    })
  })

  it('should throw an error if JSON is invalid', () => {
    let parser = new RDFJSJSONParser()
    const input = new Readable()
    input._readableState.objectMode = true

    input._read = () => {
      input.push('}')
      input.push(null)
    }

    let stream = parser.import(input)

    return new Promise((resolve, reject) => {
      rdfExt.waitFor(stream).then(reject).catch(resolve)
    })
  })
})
