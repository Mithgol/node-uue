/* global describe, it */
var assert = require('assert');
var UUE = require('../');

describe('UUE encoder', function(){
   it('encodes empty buffer', function(){
      assert.strictEqual(
         UUE.encode(Buffer([ ])),
         'begin 644 buffer.bin\n`\nend'
      );
      assert.strictEqual(
         UUE.encode(Buffer([ ]), {
            mode: '444',
            filename: 'filename.ext'
         }),
         'begin 444 filename.ext\n`\nend'
      );
   });

   it("encodes 'Cat' buffer", function(){
      assert.strictEqual(
         UUE.encode(Buffer([ 67, 97, 116 ])),
         'begin 644 buffer.bin\n#0V%T\n`\nend'
      );
      assert.strictEqual(
         UUE.encode(Buffer([ 67, 97, 116 ]), {
            mode: '444',
            filename: 'filename.ext'
         }),
         'begin 444 filename.ext\n#0V%T\n`\nend'
      );
   });

   it("encodes 'Cats' buffer", function(){
      assert.strictEqual(
         UUE.encode(Buffer('Cats', 'ascii')),
         'begin 644 buffer.bin\n$0V%T<P``\n`\nend'
      );
      assert.strictEqual(
         UUE.encode(Buffer('Cats', 'ascii'), {
            mode: '444',
            filename: 'filename.ext'
         }),
         'begin 444 filename.ext\n$0V%T<P``\n`\nend'
      );
   });
});