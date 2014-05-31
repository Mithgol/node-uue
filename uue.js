var fs = require('fs');
var path = require('path');

var UUE = function(){
   if (!(this instanceof UUE)) return new UUE();
};

UUE.prototype.encode = function(encodeSource, encodeOptions){
   if( typeof encodeOptions === 'undefined' ) encodeOptions = {};

   if( typeof encodeSource === 'string' ){ // treat as filename
      // check encodeOptions.mode
      if( typeof encodeOptions.mode === 'undefined' ){
         encodeOptions.mode = (
            fs.statSync(encodeSource).mode & parseInt('777', 8)
         ).toString(8);
      } else if( typeof encodeOptions.mode !== 'string' ){
         encodeOptions.mode = encodeOptions.mode.toString(8);
      }

      // check encodeOptions.filename
      if( typeof encodeOptions.filename === 'undefined' ){
         encodeOptions.filename = path.basename(encodeSource);
      }

      // make encodeSource a buffer
      encodeSource = fs.readFileSync(encodeSource);
   } else if( Buffer.isBuffer(encodeSource) ){ // treat as buffer
      // check encodeOptions.mode
      if( typeof encodeOptions.mode === 'undefined' ){
         encodeOptions.mode = '644';
      } else if( typeof encodeOptions.mode !== 'string' ){
         encodeOptions.mode = encodeOptions.mode.toString(8);
      }

      // check encodeOptions.filename
      if( typeof encodeOptions.filename === 'undefined' ){
         encodeOptions.filename = 'buffer.bin';
      }
   } else throw new Error(this.errors.UNKNOWN_SOURCE_TYPE);

   if( typeof encodeOptions.eol === 'undefined' ) encodeOptions.eol = '\n';

   // now encodeSource is always a buffer
   var output = [];
   output.push('begin ');
   output.push(encodeOptions.mode);
   output.push(' ');
   output.push(encodeOptions.filename);
   output.push(encodeOptions.eol);

   var offset = 0;
   while( offset < encodeSource.length ){
      var triplet, byte1, byte2, byte3, total, charCode;
      if( encodeSource.length - offset >= 45 ){ // complete line, 15 triplets
         output.push(String.fromCharCode(45 + 32));
         for( triplet = 0; triplet < 15; triplet++ ){
            byte1 = encodeSource.readUInt8(offset);
            offset++;
            byte2 = encodeSource.readUInt8(offset);
            offset++;
            byte3 = encodeSource.readUInt8(offset);
            offset++;

            total = (byte1 << 16) + (byte2 << 8) + byte3;

            charCode = total >>> 18;
            if( charCode === 0 ) charCode = 64;
            output.push(String.fromCharCode(charCode + 32));

            charCode = (total >>> 12) & 0x3F;
            if( charCode === 0 ) charCode = 64;
            output.push(String.fromCharCode(charCode + 32));

            charCode = (total >>> 6) & 0x3F;
            if( charCode === 0 ) charCode = 64;
            output.push(String.fromCharCode(charCode + 32));

            charCode = total & 0x3F;
            if( charCode === 0 ) charCode = 64;
            output.push(String.fromCharCode(charCode + 32));
         }
      } else { // last line, less than 15 triplets
         output.push(String.fromCharCode(encodeSource.length - offset + 32));
         var tripletNum = ( (encodeSource.length - offset) /3 ) |0;
         for( triplet = 0; triplet < tripletNum; triplet++ ){
            byte1 = encodeSource.readUInt8(offset);
            offset++;
            byte2 = encodeSource.readUInt8(offset);
            offset++;
            byte3 = encodeSource.readUInt8(offset);
            offset++;

            total = (byte1 << 16) + (byte2 << 8) + byte3;

            charCode = total >>> 18;
            if( charCode === 0 ) charCode = 64;
            output.push(String.fromCharCode(charCode + 32));

            charCode = (total >>> 12) & 0x3F;
            if( charCode === 0 ) charCode = 64;
            output.push(String.fromCharCode(charCode + 32));

            charCode = (total >>> 6) & 0x3F;
            if( charCode === 0 ) charCode = 64;
            output.push(String.fromCharCode(charCode + 32));

            charCode = total & 0x3F;
            if( charCode === 0 ) charCode = 64;
            output.push(String.fromCharCode(charCode + 32));
         }
         if( offset < encodeSource.length ){ // some bytes remain
            byte1 = encodeSource.readUInt8(offset);
            offset++;
            if( offset < encodeSource.length ){
               byte2 = encodeSource.readUInt8(offset);
               offset++;
            } else byte2 = 0;
            if( offset < encodeSource.length ){
               byte3 = encodeSource.readUInt8(offset);
               offset++;
            } else byte3 = 0;

            total = (byte1 << 16) + (byte2 << 8) + byte3;

            charCode = total >>> 18;
            if( charCode === 0 ) charCode = 64;
            output.push(String.fromCharCode(charCode + 32));

            charCode = (total >>> 12) & 0x3F;
            if( charCode === 0 ) charCode = 64;
            output.push(String.fromCharCode(charCode + 32));

            charCode = (total >>> 6) & 0x3F;
            if( charCode === 0 ) charCode = 64;
            output.push(String.fromCharCode(charCode + 32));

            charCode = total & 0x3F;
            if( charCode === 0 ) charCode = 64;
            output.push(String.fromCharCode(charCode + 32));
         }
      }
      output.push(encodeOptions.eol);
   }

   output.push('`');
   output.push(encodeOptions.eol);
   output.push('end');
   return output.join('');
};

UUE.prototype.errors = {
   UNKNOWN_SOURCE_TYPE: "The source's type is unknown!"
};

module.exports = new UUE();