/**
 *
 * Copyright 2014-present Basho Technologies, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

var rpb = require('../../../lib/protobuf/riakprotobuf');
var ListKeys = require('../../../lib/commands/kv/listkeys');

var RpbListKeysResp = rpb.getProtoFor('RpbListKeysResp');
var RpbErrorResp = rpb.getProtoFor('RpbErrorResp');

var assert = require('assert');

describe('ListKeys', function() {
    describe('Build', function() {
        it('throws if withAllowListing is not used', function(done) {
            assert.throws(function () {
                var listKeys = new ListKeys.Builder()
                        .withBucketType('bucket_type')
                        .withBucket('bucket_name')
                        .withCallback(function(){})
                        .build();
            });
            done();
        });

        it('should build a RpbListKeysReq correctly', function(done) {
            var listKeys = new ListKeys.Builder()
                    .withAllowListing()
                    .withBucketType('bucket_type')
                    .withBucket('bucket_name')
                    .withCallback(function(){})
                    .build();
            var protobuf = listKeys.constructPbRequest();
            assert.equal(protobuf.getType().toString('utf8'), 'bucket_type');
            assert.equal(protobuf.getBucket().toString('utf8'), 'bucket_name');
            done();
        });
        
        it('should take multiple RpbListKeysResp and call the users callback with the response', function(done) {
            var callback = function(err, resp){
                assert.equal(resp.keys.length, 100);
                assert.equal(resp.done, true);
                done();
            };
            
            var listKeys = new ListKeys.Builder()
                    .withAllowListing()
                    .withBucketType('bucket_type')
                    .withBucket('bucket_name')
                    .withStreaming(false)
                    .withCallback(callback)
                    .build();
            
            for (var i = 0; i < 20; i++) {
                var listKeysResp = new RpbListKeysResp();    
                for (var j = 0; j < 5; j++) {
                    listKeysResp.keys.push(new Buffer('key'));
                }
                if (i === 19) {
                    listKeysResp.done = true;
                }
                listKeys.onSuccess(listKeysResp);
            }
        });
        
        it('should take multiple RpbListKeysResp and stream the response', function(done) {
            var count = 0;
            var timesCalled = 0;
            var callback = function(err, resp){
                timesCalled++;
                count += resp.keys.length;
                if (resp.done) {
                    assert.equal(timesCalled, 20);
                    assert.equal(count, 100);
                    done();
                }
            };
            
            var listKeys = new ListKeys.Builder()
                    .withAllowListing()
                    .withBucketType('bucket_type')
                    .withBucket('bucket_name')
                    .withCallback(callback)
                    .build();
            
            for (var i = 0; i < 20; i++) {
                var listKeysResp = new RpbListKeysResp();    
                for (var j = 0; j < 5; j++) {
                    listKeysResp.keys.push(new Buffer('key'));
                }
                if (i === 19) {
                    listKeysResp.done = true;
                }
                listKeys.onSuccess(listKeysResp);
            }
        });
        
        it ('should take a RpbErrorResp and call the users callback with the error message', function(done) {
           var rpbErrorResp = new RpbErrorResp();
           rpbErrorResp.setErrmsg(new Buffer('this is an error'));
           
           var callback = function(err, response) {
               if (err) {
                   assert.equal(err,'this is an error');
                   done();
               }
           };
           
           var listKeys = new ListKeys.Builder()
                    .withAllowListing()
                    .withBucketType('bucket_type')
                    .withBucket('bucket_name')
                    .withStreaming(false)
                    .withCallback(callback)
                    .build();
            listKeys.onRiakError(rpbErrorResp);
       });
    });
});
