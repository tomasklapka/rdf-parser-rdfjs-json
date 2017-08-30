const rdf = require('rdf-data-model')
const Readable = require('readable-stream')
const split2 = require('split2')

class ParserStream extends Readable {
  constructor (input, options) {
    super({
      objectMode: true,
      read: () => {}
    })

    options = options || {}
    this.factory = options.factory || rdf

    input
    .pipe(split2())
    .on('data', (data) => {
      if (!data) {
        return // skip empty lines
      }
      let json
      try {
        json = JSON.parse(data)
      } catch (err) {
        this.emit('error', err)
        return
      }
      this.push(
        this.factory.quad(
          this.term(json.subject),
          this.term(json.predicate),
          this.term(json.object),
          this.term(json.graph)
        )
      )
    })
    .on('end', () => {
      this.push(null)
    })
    .on('error', (err) => {
      this.emit('error', err)
    })
  }

  term (t) {
    if (!t.termType) {
      this.emit('error', new Error('RDFJS JSON parse error: termType missing'))
    }

    if (t.termType === 'NamedNode') {
      return this.factory.namedNode(t.value)
    }
    if (t.termType === 'DefaultGraph') {
      return this.factory.defaultGraph()
    }
    if (t.termType === 'Literal') {
      if (!t.language && t.datatype) {
        t.datatype = this.factory.namedNode(t.datatype.value)
      }
      return this.factory.literal(t.value, t.language || t.datatype)
    }
    if (t.termType === 'BlankNode') {
      return this.factory.blankNode(t.value)
    }
    if (t.termType === 'Variable') {
      return this.factory.variable(t.value)
    }

    this.emit('error', new Error('RDFJS JSON parse error: unknown termType: ' + t.termType))
  }

  _read () {}
}

module.exports = ParserStream
