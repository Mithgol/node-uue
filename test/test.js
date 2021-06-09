/* global describe, it */
var assert = require('assert');
var path = require('path');
var fs = require('fs');
var UUE = require('../');

describe('UUE encoder', function(){
   it('encodes empty buffer, can use whitespaces in its filename', function(){
      assert.strictEqual(
         UUE.encode(Buffer.from([ ])),
         'begin 644 buffer.bin\n`\nend'
      );
      assert.strictEqual(
         UUE.encode(Buffer.from([ ]), {
            mode: '444',
            filename: "empty file's name.ext"
         }),
         "begin 444 empty file's name.ext\n`\nend"
      );
   });

   it("encodes 'Cat' buffer, can use whitespaces in its filename", function(){
      assert.strictEqual(
         UUE.encode(Buffer.from([ 67, 97, 116 ])),
         'begin 644 buffer.bin\n#0V%T\n`\nend'
      );
      assert.strictEqual(
         UUE.encode(Buffer.from([ 67, 97, 116 ]), {
            mode: '444',
            filename: "cat's file name.ext"
         }),
         "begin 444 cat's file name.ext\n#0V%T\n`\nend"
      );
      assert.strictEqual(
         UUE.encode(path.join(__dirname, 'cat.txt'), {
            mode: '444'
         }),
         'begin 444 cat.txt\n#0V%T\n`\nend'
      );
   });

   it("encodes 'Cats' buffer, also can use whitespaces in its filename",
   function(){
      assert.strictEqual(
         UUE.encode(Buffer.from('Cats', 'ascii')),
         'begin 644 buffer.bin\n$0V%T<P``\n`\nend'
      );
      assert.strictEqual(
         UUE.encode(Buffer.from('Cats', 'ascii'), {
            mode: '444',
            filename: "cats' file name.ext"
         }),
         "begin 444 cats' file name.ext\n$0V%T<P``\n`\nend"
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
   it("when UUE codes are absent, `null` is returned", function(){
      assert.strictEqual(
         UUE.decodeFile(
            'some text' +
            '\n foo bar',
            'filename.ext'
         ),
         null
      );
   });

   it("decodes empty buffer", function(){
      assert.strictEqual(
         UUE.decodeFile(
            'begin 644 buffer.bin\n`\nend',
            'buffer.bin'
         ).toString('binary'),
         Buffer.alloc(0).toString('binary')
      );
      assert.strictEqual(
         UUE.decodeFile(
            'begin 444 filename.ext\n`\n`\n`\nend',
            'filename.ext'
         ).toString('binary'),
         Buffer.alloc(0).toString('binary')
      );
   });

   it("decodes 'Cat' buffer (or `null` for filename mismatch)", function(){
      assert.strictEqual(
         UUE.decodeFile(
            'begin 644 buffer.bin\n#0V%T\n`\nend',
            'buffer.bin'
         ).toString('binary'),
         Buffer.from([ 67, 97, 116 ]).toString('binary')
      );
      assert.strictEqual(
         UUE.decodeFile(
            'begin 444 cat.txt\n#0V%T\n`\nend',
            'cat.txt'
         ).toString('binary'),
         Buffer.from([ 67, 97, 116 ]).toString('binary')
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
         Buffer.from('Cats', 'ascii').toString('binary')
      );
      assert.strictEqual(
         UUE.decodeFile(
            'begin 444 cat.txt\n#0V%T\n`\nend\n' +
            'foo bar \n' +
            'begin 444 cats.txt\n$0V%T<P``\n`\nend',
            'cats.txt'
         ).toString('binary'),
         Buffer.from('Cats', 'ascii').toString('binary')
      );
      assert.strictEqual(
         UUE.decodeFile(
            'begin 444 cats.txt\n$0V%T<P``\n`\nend',
            'filename.ext'
         ),
         null
      );
   });

   it('decodes it if a space (instead of a backtick) is used before `end`',
   function(){
      assert.strictEqual(
         UUE.decodeFile(
            'foo bar \n' +
            'begin 644 buffer.bin\n$0V%T<P``\n \nend',
            'buffer.bin'
         ).toString('binary'),
         Buffer.from('Cats', 'ascii').toString('binary')
      );
      assert.strictEqual(
         UUE.decodeFile(
            'begin 444 cat.txt\n#0V%T\n \nend\n' +
            'foo bar \n' +
            'begin 444 cats.txt\n$0V%T<P``\n \nend',
            'cats.txt'
         ).toString('binary'),
         Buffer.from('Cats', 'ascii').toString('binary')
      );
      assert.strictEqual(
         UUE.decodeFile(
            'begin 444 cats.txt\n$0V%T<P``\n \nend',
            'filename.ext'
         ),
         null
      );
   });

   it("decodes if a whitespace appears in the filename", function(){
      assert.strictEqual(
         UUE.decodeFile(
            'foo bar \n' +
            'begin 644 some buffer.bin\n$0V%T<P``\n`\nend',
            'some buffer.bin'
         ).toString('binary'),
         Buffer.from('Cats', 'ascii').toString('binary')
      );
      assert.strictEqual(
         UUE.decodeFile(
            'begin 444 cat.txt\n#0V%T\n`\nend\n' +
            'foo bar \n' +
            'begin 444 several cats.txt\n$0V%T<P``\n`\nend',
            'several cats.txt'
         ).toString('binary'),
         Buffer.from('Cats', 'ascii').toString('binary')
      );
   });

   it('decodes it if filename contains special RegEx characters',
   function(){
      assert.strictEqual(
         UUE.decodeFile(
            'foo bar \n' +
            'begin 644 FURRYCAT(S.xml\n#0V%T\n \nend\n',
            'FURRYCAT(S.xml'
         ).toString('binary'),
         Buffer.from('Cat', 'ascii').toString('binary')
      );
   });
});

describe('multiple UUE file finder and decoder', function(){
   it("when UUE codes are absent, an empty array is returned", function(){
      assert.deepEqual(
         UUE.decodeAllFiles(
            'some text' +
            '\n foo bar'
         ),
         []
      );
   });

   it("decodes empty buffer", function(){
      assert.deepEqual(
         UUE.decodeAllFiles(
            'begin 644 buffer.bin\n`\nend'
         ),
         [{ name: 'buffer.bin', data: Buffer.alloc(0) }]
      );
      assert.deepEqual(
         UUE.decodeAllFiles(
            'begin 444 filename.ext\n`\n`\n`\nend'
         ),
         [{ name: 'filename.ext', data: Buffer.alloc(0) }]
      );
   });

   it("decodes 'Cat' buffer", function(){
      assert.deepEqual(
         UUE.decodeAllFiles(
            'begin 644 buffer.bin\n#0V%T\n`\nend'
         ),
         [{ name: 'buffer.bin', data: Buffer.from([ 67, 97, 116 ]) }]
      );
      assert.deepEqual(
         UUE.decodeAllFiles(
            'begin 444 cat.txt\n#0V%T\n`\nend'
         ),
         [{ name: 'cat.txt', data: Buffer.from([ 67, 97, 116 ]) }]
      );
   });

   it("decodes 'Cats' buffer (and 'Cat' if it's also encountered)",function(){
      assert.deepEqual(
         UUE.decodeAllFiles(
            'foo bar \n' +
            'begin 644 buffer.bin\n$0V%T<P``\n`\nend'
         ),
         [{ name: 'buffer.bin', data: Buffer.from('Cats', 'ascii') }]
      );
      assert.deepEqual(
         UUE.decodeAllFiles(
            'begin 444 cat.txt\n#0V%T\n`\nend\n' +
            'foo bar \n' +
            'begin 444 cats.txt\n$0V%T<P``\n`\nend' +
            '\ncats.txt'
         ),
         [
            { name: 'cat.txt', data: Buffer.from([ 67, 97, 116 ]) },
            { name: 'cats.txt', data: Buffer.from('Cats', 'ascii') }
         ]
      );
      assert.deepEqual(
         UUE.decodeAllFiles(
            'begin 444 cats.txt\n$0V%T<P``\n`\nend'
         ),
         [{ name: 'cats.txt', data: Buffer.from('Cats', 'ascii') }]
      );
   });

   it("does the same if a space (instead of a backtick) is used before `end`",
   function(){
      assert.deepEqual(
         UUE.decodeAllFiles(
            'foo bar \n' +
            'begin 644 buffer.bin\n$0V%T<P``\n \nend'
         ),
         [{ name: 'buffer.bin', data: Buffer.from('Cats', 'ascii') }]
      );
      assert.deepEqual(
         UUE.decodeAllFiles(
            'begin 444 cat.txt\n#0V%T\n`\nend\n' +
            'foo bar \n' +
            'begin 444 cats.txt\n$0V%T<P``\n \nend' +
            '\ncats.txt'
         ),
         [
            { name: 'cat.txt', data: Buffer.from([ 67, 97, 116 ]) },
            { name: 'cats.txt', data: Buffer.from('Cats', 'ascii') }
         ]
      );
      assert.deepEqual(
         UUE.decodeAllFiles(
            'begin 444 cats.txt\n$0V%T<P``\n \nend'
         ),
         [{ name: 'cats.txt', data: Buffer.from('Cats', 'ascii') }]
      );
   });

   it("does the same if a whitespace appears in the filename", function(){
      assert.deepEqual(
         UUE.decodeAllFiles(
            'foo bar \n' +
            'begin 644 some buffer.bin\n$0V%T<P``\n`\nend'
         ),
         [{ name: 'some buffer.bin', data: Buffer.from('Cats', 'ascii') }]
      );
      assert.deepEqual(
         UUE.decodeAllFiles(
            'begin 444 cat.txt\n#0V%T\n`\nend\n' +
            'foo bar \n' +
            'begin 444 several cats.txt\n$0V%T<P``\n`\nend' +
            '\ncats.txt'
         ),
         [
            { name: 'cat.txt', data: Buffer.from([ 67, 97, 116 ]) },
            { name: 'several cats.txt', data: Buffer.from('Cats', 'ascii') }
         ]
      );
      assert.deepEqual(
         UUE.decodeAllFiles(
            'begin 444 more cats.txt\n$0V%T<P``\n`\nend'
         ),
         [{ name: 'more cats.txt', data: Buffer.from('Cats', 'ascii') }]
      );
   });
});

describe('UUE / text splitter', function(){
   it("when the text is empty, an empty array is returned", function(){
      assert.deepEqual(
         UUE.split(''),
         []
      );
   });

   it("when UUE codes are absent, the text is returned as a whole",function(){
      assert.deepEqual(
         UUE.split(
            'some text' +
            '\n foo bar'
         ),
         [
            'some text' +
            '\n foo bar'
         ]
      );
   });

   it("decodes empty buffer", function(){
      assert.deepEqual(
         UUE.split(
            'begin 644 buffer.bin\n`\nend'
         ),
         [{
            name: 'buffer.bin',
            data: Buffer.alloc(0),
            source: 'begin 644 buffer.bin\n`\nend',
            type: 'UUE'
         }]
      );
      assert.deepEqual(
         UUE.split(
            'begin 444 filename.ext\n`\n`\n`\nend'
         ),
         [{
            name: 'filename.ext',
            data: Buffer.alloc(0),
            source: 'begin 444 filename.ext\n`\n`\n`\nend',
            type: 'UUE'
         }]
      );
   });

   it("decodes 'Cat' buffer", function(){
      assert.deepEqual(
         UUE.split(
            'begin 644 buffer.bin\n#0V%T\n`\nend'
         ),
         [{
            name: 'buffer.bin',
            data: Buffer.from([ 67, 97, 116 ]),
            source: 'begin 644 buffer.bin\n#0V%T\n`\nend',
            type: 'UUE'
         }]
      );
      assert.deepEqual(
         UUE.split(
            'begin 444 cat.txt\n#0V%T\n`\nend'
         ),
         [{
            name: 'cat.txt',
            data: Buffer.from([ 67, 97, 116 ]),
            source: 'begin 444 cat.txt\n#0V%T\n`\nend',
            type: 'UUE'
         }]
      );
   });

   it("decodes 'Cats' buffer (and 'Cat' if it's also encountered)",function(){
      assert.deepEqual(
         UUE.split(
            'foo bar \n' +
            'begin 644 buffer.bin\n$0V%T<P``\n`\nend'
         ),
         [
            'foo bar \n',
            {
               name: 'buffer.bin',
               data: Buffer.from('Cats', 'ascii'),
               source: 'begin 644 buffer.bin\n$0V%T<P``\n`\nend',
               type: 'UUE'
            }
         ]
      );
      assert.deepEqual(
         UUE.split(
            'begin 444 cat.txt\n#0V%T\n`\nend\n' +
            'foo bar \n' +
            'begin 444 cats.txt\n$0V%T<P``\n`\nend' +
            '\ncats.txt'
         ),
         [
            {
               name: 'cat.txt',
               data: Buffer.from([ 67, 97, 116 ]),
               source: 'begin 444 cat.txt\n#0V%T\n`\nend',
               type: 'UUE'
            },
            '\nfoo bar \n',
            {
               name: 'cats.txt',
               data: Buffer.from('Cats', 'ascii'),
               source: 'begin 444 cats.txt\n$0V%T<P``\n`\nend',
               type: 'UUE'
            },
            '\ncats.txt'
         ]
      );
      assert.deepEqual(
         UUE.split(
            'begin 444 cats.txt\n$0V%T<P``\n`\nend'
         ),
         [{
            name: 'cats.txt',
            data: Buffer.from('Cats', 'ascii'),
            source: 'begin 444 cats.txt\n$0V%T<P``\n`\nend',
            type: 'UUE'
         }]
      );
   });

   it("does the same if a space (instead of a backtick) is used before `end`",
   function(){
      assert.deepEqual(
         UUE.split(
            'foo bar \n' +
            'begin 644 buffer.bin\n$0V%T<P``\n \nend'
         ),
         [
            'foo bar \n',
            {
               name: 'buffer.bin',
               data: Buffer.from('Cats', 'ascii'),
               source: 'begin 644 buffer.bin\n$0V%T<P``\n \nend',
               type: 'UUE'
            }
         ]
      );
      assert.deepEqual(
         UUE.split(
            'begin 444 cat.txt\n#0V%T\n \nend\n' +
            'foo bar \n' +
            'begin 444 cats.txt\n$0V%T<P``\n \nend' +
            '\ncats.txt'
         ),
         [
            {
               name: 'cat.txt',
               data: Buffer.from([ 67, 97, 116 ]),
               source: 'begin 444 cat.txt\n#0V%T\n \nend',
               type: 'UUE'
            },
            '\nfoo bar \n',
            {
               name: 'cats.txt',
               data: Buffer.from('Cats', 'ascii'),
               source: 'begin 444 cats.txt\n$0V%T<P``\n \nend',
               type: 'UUE'
            },
            '\ncats.txt'
         ]
      );
      assert.deepEqual(
         UUE.split(
            'begin 444 cats.txt\n$0V%T<P``\n \nend'
         ),
         [{
            name: 'cats.txt',
            data: Buffer.from('Cats', 'ascii'),
            source: 'begin 444 cats.txt\n$0V%T<P``\n \nend',
            type: 'UUE'
         }]
      );
   });

   it("does the same if a whitespace appears in the filename", function(){
      assert.deepEqual(
         UUE.split(
            'foo bar \n' +
            'begin 644 some buffer.bin\n$0V%T<P``\n`\nend'
         ),
         [
            'foo bar \n',
            {
               name: 'some buffer.bin',
               data: Buffer.from('Cats', 'ascii'),
               source: 'begin 644 some buffer.bin\n$0V%T<P``\n`\nend',
               type: 'UUE'
            }
         ]
      );
      assert.deepEqual(
         UUE.split(
            'begin 444 some cat.txt\n#0V%T\n`\nend\n' +
            'foo bar \n' +
            'begin 444 more cats.txt\n$0V%T<P``\n`\nend' +
            '\ncats.txt'
         ),
         [
            {
               name: 'some cat.txt',
               data: Buffer.from([ 67, 97, 116 ]),
               source: 'begin 444 some cat.txt\n#0V%T\n`\nend',
               type: 'UUE'
            },
            '\nfoo bar \n',
            {
               name: 'more cats.txt',
               data: Buffer.from('Cats', 'ascii'),
               source: 'begin 444 more cats.txt\n$0V%T<P``\n`\nend',
               type: 'UUE'
            },
            '\ncats.txt'
         ]
      );
      assert.deepEqual(
         UUE.split(
            'begin 444 several cats.txt\n$0V%T<P``\n`\nend'
         ),
         [{
            name: 'several cats.txt',
            data: Buffer.from('Cats', 'ascii'),
            source: 'begin 444 several cats.txt\n$0V%T<P``\n`\nend',
            type: 'UUE'
         }]
      );
   });
});

describe('Real world example: XBRL', function(){
   describe('UUE file finder and decoder', function(){
      it("decodes a file with missing trailing spaces", function(){
         var basename = 'aapl-20200926_g1.jpg';
         var file = path.join(__dirname, `xbrl/${basename}.malformed_uue`);
         var encoded = fs.readFileSync(file).toString();
         var actualDecoded = UUE.decodeFile(encoded, basename);

         var expectedDecodedFile = path.join(__dirname, `xbrl/${basename}`);
         var expectedDecoded = fs.readFileSync(expectedDecodedFile);

         assert.strictEqual(
            actualDecoded.toString('binary'),
            expectedDecoded.toString('binary')
         );
      });

      it("decodes multiline text (jpg file)", function(){
         var basename = 'aapl-20200926_g2.jpg';
         var file = path.join(__dirname, `xbrl/${basename}.uue`);
         var encoded = fs.readFileSync(file).toString();
         var actualDecoded = UUE.decodeFile(encoded, basename);

         var expectedDecodedFile = path.join(__dirname, `xbrl/${basename}`);
         var expectedDecoded = fs.readFileSync(expectedDecodedFile);

         assert.strictEqual(
            actualDecoded.toString('binary'),
            expectedDecoded.toString('binary')
         );
      });

      it("decodes multiline text (zip file)", function(){
         var basename = '0000320193-20-000096-xbrl.zip';
         var file = path.join(__dirname, `xbrl/${basename}.uue`);
         var encoded = fs.readFileSync(file).toString();
         var actualDecoded = UUE.decodeFile(encoded, basename);

         var expectedDecodedFile = path.join(__dirname, `xbrl/${basename}`);
         var expectedDecoded = fs.readFileSync(expectedDecodedFile);

         assert.strictEqual(
            actualDecoded.toString('binary'),
            expectedDecoded.toString('binary')
         );
      });
   });

   describe('multiple UUE file finder and decoder', function(){
      it("decodes a file containing multiple encoded text blocks", function(){
         var basename = '0000320193-20-000096.txt';
         var file = path.join(__dirname, `xbrl/${basename}`);
         var encoded = fs.readFileSync(file).toString();
         var actualDecoded = UUE.decodeAllFiles(encoded, basename);

         var actualDecodedNames = actualDecoded.map(obj => obj.name);

         assert.deepEqual(actualDecodedNames, [
            'aapl-20200926_g1.jpg',
            'aapl-20200926_g2.jpg',
            'Financial_Report.xlsx',
            '0000320193-20-000096-xbrl.zip'
         ]);

         basename = actualDecodedNames[0];
         var expectedDecodedFile = path.join(__dirname, `xbrl/${basename}`);
         var expectedDecoded = fs.readFileSync(expectedDecodedFile);

         assert.strictEqual(
            actualDecoded[0].data.toString('binary'),
            expectedDecoded.toString('binary')
         );
      });
   });
});
