/* global describe, it */
var assert = require('assert');
var path = require('path');
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
      assert.strictEqual(
         UUE.encode(path.join(__dirname, 'cat.txt'), {
            mode: '444'
         }),
         'begin 444 cat.txt\n#0V%T\n`\nend'
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
      assert.strictEqual(
         UUE.encode(path.join(__dirname, 'cats.txt'), {
            mode: '444'
         }),
         'begin 444 cats.txt\n$0V%T<P``\n`\nend'
      );
   });
});

describe('UUE file finder and decoder', function(){
   it("decodes empty buffer", function(){
      assert.strictEqual(
         UUE.decodeFile(
            'begin 644 buffer.bin\n`\nend',
            'buffer.bin'
         ).toString('binary'),
         Buffer(0).toString('binary')
      );
      assert.strictEqual(
         UUE.decodeFile(
            'begin 444 filename.ext\n`\n`\n`\nend',
            'filename.ext'
         ).toString('binary'),
         Buffer(0).toString('binary')
      );
   });

   it("decodes 'Cat' buffer (or `null` for filename mismatch)", function(){
      assert.strictEqual(
         UUE.decodeFile(
            'begin 644 buffer.bin\n#0V%T\n`\nend',
            'buffer.bin'
         ).toString('binary'),
         Buffer([ 67, 97, 116 ]).toString('binary')
      );
      assert.strictEqual(
         UUE.decodeFile(
            'begin 444 cat.txt\n#0V%T\n`\nend',
            'cat.txt'
         ).toString('binary'),
         Buffer([ 67, 97, 116 ]).toString('binary')
      );
      assert.strictEqual(
         UUE.decodeFile(
            'begin 444 cat.txt\n#0V%T\n`\nend' +
            '\n foo bar',
            'filename.ext'
         ),
         null
      );
   });

   it("decodes 'Cats' buffer (even if two UUE are encountered)", function(){
      assert.strictEqual(
         UUE.decodeFile(
            'foo bar \n' +
            'begin 644 buffer.bin\n$0V%T<P``\n`\nend',
            'buffer.bin'
         ).toString('binary'),
         Buffer('Cats', 'ascii').toString('binary')
      );
      assert.strictEqual(
         UUE.decodeFile(
            'begin 444 cat.txt\n#0V%T\n`\nend\n' +
            'foo bar \n' +
            'begin 444 cats.txt\n$0V%T<P``\n`\nend',
            'cats.txt'
         ).toString('binary'),
         Buffer('Cats', 'ascii').toString('binary')
      );
      assert.strictEqual(
         UUE.decodeFile(
            'begin 444 cats.txt\n$0V%T<P``\n`\nend',
            'filename.ext'
         ),
         null
      );
   });
});